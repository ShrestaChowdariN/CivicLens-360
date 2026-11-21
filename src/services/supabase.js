
import { createClient } from '@supabase/supabase-js';

// =====================================================
// CIVICLENS 360 - SUPABASE CONFIGURATION
// =====================================================



const PROJECT_URL =
  'https://mcvvdsjwsdvxhftefbrl.supabase.co';



const STORAGE_KEYS = {
  URL: 'civiclens_supabase_url',
  ANON_KEY: 'civiclens_supabase_anon_key'
};

let activeClient = null;
let activeConfig = '';

// =====================================================
// CONFIGURATION HELPERS
// =====================================================

function isValidUrl(url) {
  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === 'https:' &&
      parsed.hostname ===
        'mcvvdsjwsdvxhftefbrl.supabase.co' &&
      (parsed.pathname === '/' || parsed.pathname === '') &&
      !parsed.search &&
      !parsed.hash &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

function getStoredUrl() {
  // Use the verified project URL, not a malformed
  // environment variable or old browser setting.
  return PROJECT_URL;
}

function getStoredAnonKey() {
  try {
    const storedKey = localStorage.getItem(
      STORAGE_KEYS.ANON_KEY
    );

    if (storedKey && storedKey.trim()) {
      return storedKey.trim();
    }
  } catch {
    // Browser storage unavailable
  }

  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  ).trim();
}

export function isSupabaseConfigured() {
  const url = getStoredUrl();
  const key = getStoredAnonKey();

  return isValidUrl(url) && key.length > 20;
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    console.error(
      'Supabase configuration missing or invalid.'
    );
    return null;
  }

  const url = getStoredUrl();
  const key = getStoredAnonKey();

  const configId = `${url}|${key}`;

  if (!activeClient || activeConfig !== configId) {
    activeClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    activeConfig = configId;
  }

  return activeClient;
}

export function saveSupabaseConfig(url, anonKey) {
  try {
    const cleanedUrl = (url || '').trim();
    const cleanedKey = (anonKey || '').trim();

    if (!isValidUrl(cleanedUrl)) {
      return {
        success: false,
        error:
          'Invalid Supabase URL. Use the CivicLens360 project URL.'
      };
    }

    if (cleanedKey.length <= 20) {
      return {
        success: false,
        error:
          'Please enter a valid Supabase public API key.'
      };
    }

    localStorage.setItem(
      STORAGE_KEYS.URL,
      PROJECT_URL
    );

    localStorage.setItem(
      STORAGE_KEYS.ANON_KEY,
      cleanedKey
    );

    activeClient = null;
    activeConfig = '';

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEYS.URL);
    localStorage.removeItem(STORAGE_KEYS.ANON_KEY);

    activeClient = null;
    activeConfig = '';

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// =====================================================
// DATABASE CRUD FUNCTIONS
// =====================================================

// Fetch complaints
export async function fetchComplaintsFromBackend(
  userId = null,
  role = null
) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: [],
      error: 'Supabase is not configured.'
    };
  }

  try {
    let query = client
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (role === 'citizen' && userId) {
      query = query.eq('citizen_user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(
        'Backend fetch complaints error:',
        error.message
      );

      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    const mapped = (data || []).map(row => ({
      id: row.id,
      complaintText: row.complaint_text,
      language: row.language,
      category: row.category,
      department: row.department,
      severity: row.severity,
      severityReason: row.severity_reason,
      location: row.location,
      coordinates: row.coordinates,
      photo: row.photo_url,
      status: row.status,
      masterIssueId: row.master_issue_id,
      citizenUserId: row.citizen_user_id,
      matchedKeyword: row.matched_keyword,
      createdAt: row.created_at,
      isDemo: row.is_demo || false
    }));

    return {
      success: true,
      data: mapped
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: []
    };
  }
}

// =====================================================
// FETCH MASTER ISSUES
// =====================================================

export async function fetchMasterIssuesFromBackend(
  userId = null,
  role = null
) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: [],
      error: 'Supabase is not configured.'
    };
  }

  try {
    let query = client
      .from('master_issues')
      .select('*')
      .order('priority_score', {
        ascending: false
      });

    if (role === 'field_worker' && userId) {
      query = query.eq(
        'assigned_worker_id',
        userId
      );
    }

    const { data, error } = await query;

    if (error) {
      console.warn(
        'Backend fetch master issues error:',
        error.message
      );

      return {
        success: false,
        error: error.message,
        data: []
      };
    }

    const mapped = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      category: row.category,
      department: row.department,
      location: row.location,
      coordinates: row.coordinates,
      severity: row.severity,
      severityReason: row.severity_reason,
      reportCount: row.report_count,
      communityBonus: row.community_bonus,
      priorityScore: row.priority_score,
      priorityExplanation: row.priority_explanation,
      status: row.status,
      linkedTicketIds:
        row.linked_ticket_ids || [],
      assignedWorkerId:
        row.assigned_worker_id,
      assignedWorkerName:
        row.assigned_worker_name,
      assignedWorkerPhone:
        row.assigned_worker_phone,
      assignedWorkerDepartment:
        row.assigned_worker_department,
      workerNotes: row.worker_notes,
      completionPhoto:
        row.completion_photo,
      adminVerificationNotes:
        row.admin_verification_notes,
      isDemo: row.is_demo || false,
      firstReportedAt:
        row.first_reported_at,
      lastReportAt:
        row.last_report_at,
      completedAt: row.completed_at,
      resolvedAt: row.resolved_at,
      updatedAt: row.updated_at
    }));

    return {
      success: true,
      data: mapped
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: []
    };
  }
}

// =====================================================
// INSERT NEW COMPLAINT
// =====================================================

export async function insertComplaintToBackend(
  complaint
) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      error: 'Supabase is not configured.'
    };
  }

  try {
    const row = {
      id: complaint.id,
      citizen_user_id:
        complaint.citizenUserId || null,
      complaint_text:
        complaint.complaintText,
      language:
        complaint.language || 'en-IN',
      category: complaint.category,
      department: complaint.department,
      severity: complaint.severity,
      severity_reason:
        complaint.severityReason,
      location: complaint.location,
      coordinates:
        complaint.coordinates || null,
      photo_url:
        complaint.photo || null,
      status:
        complaint.status || 'Submitted',
      is_demo: false,
      origin: 'citizen',
      master_issue_id:
        complaint.masterIssueId || null,
      matched_keyword:
        complaint.matchedKeyword || null
    };

    const { error } = await client
      .from('complaints')
      .insert([row]);

    if (error) {
      console.warn(
        'Backend complaint insert error:',
        error.message
      );

      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// =====================================================
// INSERT OR UPDATE MASTER ISSUE
// =====================================================

export async function upsertMasterIssueToBackend(
  masterIssue
) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      error: 'Supabase is not configured.'
    };
  }

  try {
    const row = {
      id: masterIssue.id,
      title: masterIssue.title,
      summary: masterIssue.summary,
      category: masterIssue.category,
      department: masterIssue.department,
      location: masterIssue.location,
      coordinates:
        masterIssue.coordinates || null,
      severity: masterIssue.severity,
      severity_reason:
        masterIssue.severityReason,
      report_count:
        masterIssue.reportCount || 1,
      community_bonus:
        masterIssue.communityBonus || 0,
      priority_score:
        masterIssue.priorityScore || 20,
      priority_explanation:
        masterIssue.priorityExplanation,
      status:
        masterIssue.status || 'Submitted',
      linked_ticket_ids:
        masterIssue.linkedTicketIds || [],
      assigned_worker_id:
        masterIssue.assignedWorkerId || null,
      assigned_worker_name:
        masterIssue.assignedWorkerName || null,
      assigned_worker_phone:
        masterIssue.assignedWorkerPhone || null,
      assigned_worker_department:
        masterIssue.assignedWorkerDepartment || null,
      worker_notes:
        masterIssue.workerNotes || null,
      completion_photo:
        masterIssue.completionPhoto || null,
      admin_verification_notes:
        masterIssue.adminVerificationNotes || null,
      is_demo: false,
      updated_at:
        new Date().toISOString()
    };

    const { error } = await client
      .from('master_issues')
      .upsert([row], {
        onConflict: 'id'
      });

    if (error) {
      console.warn(
        'Backend master issue upsert error:',
        error.message
      );

      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}
