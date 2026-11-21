-- ==============================================================================
-- CIVICLENS 360: PRODUCTION SUPABASE SQL MIGRATION & SECURITY POLICIES
-- Platform: CivicLens 360 (Every Voice Counts. Every Issue Matters.)
-- ==============================================================================

-- 1. Create User Roles ENUM
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('citizen', 'municipal_admin', 'field_worker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create User Profiles Table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'citizen',
  department TEXT,
  phone TEXT,
  zone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Automatic Profile Creation Trigger on Supabase Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'citizen', -- Always defaults strictly to citizen; admin/worker roles must be elevated manually
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY,
  citizen_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  complaint_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en-IN',
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  severity TEXT NOT NULL,
  severity_reason TEXT,
  location TEXT NOT NULL,
  coordinates JSONB, -- { lat: float, lng: float }
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  origin TEXT NOT NULL DEFAULT 'citizen',
  master_issue_id TEXT,
  matched_keyword TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Master Issues Table (Clustered Community Incidents)
CREATE TABLE IF NOT EXISTS public.master_issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates JSONB, -- { lat: float, lng: float }
  severity TEXT NOT NULL,
  severity_reason TEXT,
  report_count INTEGER NOT NULL DEFAULT 1,
  community_bonus INTEGER NOT NULL DEFAULT 0,
  priority_score INTEGER NOT NULL DEFAULT 20,
  priority_explanation TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted',
  linked_ticket_ids TEXT[] NOT NULL DEFAULT '{}',
  assigned_worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_worker_name TEXT,
  assigned_worker_phone TEXT,
  assigned_worker_department TEXT,
  worker_notes TEXT,
  completion_photo TEXT,
  admin_verification_notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  first_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_issues ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Citizens can insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Citizens can select own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins and Workers can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Citizens can view linked master issues" ON public.master_issues;
DROP POLICY IF EXISTS "Admins have full master issue access" ON public.master_issues;
DROP POLICY IF EXISTS "Workers can update assigned master issues" ON public.master_issues;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'municipal_admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- COMPLAINTS POLICIES
-- 1. Citizens can INSERT their own complaints
CREATE POLICY "Citizens can insert complaints"
  ON public.complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = citizen_user_id);

-- 2. Citizens can SELECT only their own complaints; Admins and Workers see appropriate records
CREATE POLICY "Citizens can select own complaints"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (
    auth.uid() = citizen_user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'municipal_admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'field_worker'
    )
  );

-- 3. Only Admins and Workers can update complaint status
CREATE POLICY "Admins and Workers can update complaints"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('municipal_admin', 'field_worker')
    )
  );

-- MASTER ISSUES POLICIES
-- 1. Citizens can view master issues linked to their own complaints
CREATE POLICY "Citizens can view linked master issues"
  ON public.master_issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE complaints.citizen_user_id = auth.uid()
        AND complaints.master_issue_id = master_issues.id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'municipal_admin'
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'field_worker'
      )
      AND assigned_worker_id = auth.uid()
    )
  );

-- 2. Municipal Admins have full access to manage master issues
CREATE POLICY "Admins have full master issue access"
  ON public.master_issues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'municipal_admin'
    )
  );

-- 3. Field Workers can only update master issues assigned to them
CREATE POLICY "Workers can update assigned master issues"
  ON public.master_issues FOR UPDATE
  TO authenticated
  USING (
    assigned_worker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'field_worker'
    )
  )
  WITH CHECK (
    assigned_worker_id = auth.uid()
  );

-- ==============================================================================
-- 7. SUPABASE STORAGE BUCKET & POLICIES FOR PHOTOS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-photos', 'complaint-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload complaint photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view complaint photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload complaint photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'complaint-photos');

CREATE POLICY "Public can view complaint photos"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'complaint-photos');

-- ==============================================================================
-- 8. ACCOUNT PROVISIONING INSTRUCTIONS (ADMIN-MANAGED)
-- ==============================================================================
-- STEP 1: In Supabase Dashboard -> Authentication -> Users, create three accounts:
--   1. Citizen:      citizen.anita@civiclens.gov.in     (set a private password)
--   2. Admin:        admin@civiclens.gov.in             (set a private password)
--   3. Field Worker: worker.suresh@civiclens.gov.in     (set a private password)
--
-- STEP 2: In Supabase SQL Editor, run this script to elevate Admin and Worker:
--
--   UPDATE public.profiles
--   SET role = 'municipal_admin', name = 'Commissioner M. V. Sharma', department = 'Municipal Administration'
--   WHERE email = 'admin@civiclens.gov.in';
--
--   UPDATE public.profiles
--   SET role = 'field_worker', name = 'Suresh Kumar', department = 'Roads & Infrastructure (PWD)', zone = 'East Zone', phone = '+91 98450 11223'
--   WHERE email = 'worker.suresh@civiclens.gov.in';
--
--   UPDATE public.profiles
--   SET role = 'citizen', name = 'Anita Ramesh', phone = '+91 98450 99887'
--   WHERE email = 'citizen.anita@civiclens.gov.in';
--
-- STEP 3: Verify Zero Initial Complaints in Database:
--   SELECT count(*) FROM public.complaints;   -- Returns 0
--   SELECT count(*) FROM public.master_issues; -- Returns 0
-- ==============================================================================
