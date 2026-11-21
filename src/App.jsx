
import React, { useState, useEffect, useCallback } from 'react';

import Header from './components/Header';
import LoginView from './components/Auth/LoginView';
import CitizenPortal from './components/CitizenPortal/CitizenPortal';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import FieldWorkerDashboard from './components/FieldWorkerDashboard/FieldWorkerDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';

import {
  getTickets,
  getMasterIssues,
  getWorkers,
  loadDemoData,
  resetDemoData,
  hasDemoDataLoaded,
  purgeLegacySeededData
} from './services/storage';

import {
  isSupabaseConfigured,
  fetchComplaintsFromBackend,
  fetchMasterIssuesFromBackend
} from './services/supabase';

import { Building2, Loader2 } from 'lucide-react';

const VALID_ROLES = [
  'citizen',
  'municipal_admin',
  'field_worker'
];

function AppContent() {
  const {
    user,
    profile,
    role,
    loading: authLoading,
    authError
  } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [masterIssues, setMasterIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [activeWorkerId, setActiveWorkerId] = useState(null);

  const [demoNotification, setDemoNotification] = useState('');
  const [hasDemo, setHasDemo] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Normalize the role received from AuthContext.
  const currentRole = String(
    profile?.role ?? role ?? ''
  ).trim().toLowerCase();

  const roleVerified = VALID_ROLES.includes(currentRole);

  // Debug the exact role received by the website.
  useEffect(() => {
    if (!user) return;

    console.log('========== CIVICLENS AUTH DEBUG ==========');
    console.log('Logged-in email:', user.email);
    console.log('Authenticated user ID:', user.id);
    console.log('Profile ID:', profile?.id);
    console.log('Profile email:', profile?.email);
    console.log('Profile role:', profile?.role);
    console.log('Context role:', role);
    console.log('Final role:', currentRole);
    console.log('Role verified:', roleVerified);
    console.log('==========================================');
  }, [user, profile, role, currentRole, roleVerified]);

  // Fetch application data.
  const syncData = useCallback(async () => {
    setDataLoading(true);

    try {
      if (
        isSupabaseConfigured() &&
        user &&
        roleVerified
      ) {
        const [complaintsRes, mastersRes] = await Promise.all([
          fetchComplaintsFromBackend(user.id, currentRole),
          fetchMasterIssuesFromBackend(user.id, currentRole)
        ]);

        if (complaintsRes.success && mastersRes.success) {
          setTickets(complaintsRes.data || []);
          setMasterIssues(mastersRes.data || []);
        } else {
          console.error(
            'Unable to fetch live Supabase complaint data.',
            complaintsRes,
            mastersRes
          );

          // Do not show local data as if it were live Supabase data.
          setTickets([]);
          setMasterIssues([]);
        }
      } else if (!isSupabaseConfigured()) {
        purgeLegacySeededData();
        setTickets(getTickets());
        setMasterIssues(getMasterIssues());
      } else {
        setTickets([]);
        setMasterIssues([]);
      }

      setWorkers(getWorkers());
      setHasDemo(hasDemoDataLoaded());
    } catch (error) {
      console.error('CivicLens data sync failed:', error);
      setTickets([]);
      setMasterIssues([]);
    } finally {
      setDataLoading(false);
    }
  }, [user, currentRole, roleVerified]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  // Identify the active field worker.
  useEffect(() => {
    if (
      user &&
      roleVerified &&
      currentRole === 'field_worker'
    ) {
      const matchedWorker = workers.find(
        worker =>
          worker.name?.trim().toLowerCase() ===
          profile?.name?.trim().toLowerCase()
      );

      if (matchedWorker) {
        setActiveWorkerId(matchedWorker.id);
      } else {
        setActiveWorkerId(null);

        console.warn(
          'No matching worker record found for:',
          profile?.email
        );
      }
    } else {
      setActiveWorkerId(null);
    }
  }, [user, profile, workers, currentRole, roleVerified]);

  // Demo data controls.
  const handleLoadDemoData = () => {
    loadDemoData();
    syncData();

    setDemoNotification(
      'Sample evaluation records loaded.'
    );

    setTimeout(() => setDemoNotification(''), 4000);
  };

  const handleResetDemoData = () => {
    const confirmed = window.confirm(
      'Purge sample evaluation complaints? Genuine complaints will be preserved.'
    );

    if (!confirmed) return;

    const result = resetDemoData();

    syncData();

    setDemoNotification(
      `Sample records purged. Preserved ${result.tickets.length} genuine citizen records.`
    );

    setTimeout(() => setDemoNotification(''), 4000);
  };

  // Wait until authentication is completed.
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Building2 className="w-7 h-7" />
        </div>

        <div className="flex items-center gap-2 text-sm font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span>Verifying Secure Session...</span>
        </div>
      </div>
    );
  }

  // Display only the dashboard matching the verified role.
  const renderDashboard = () => {
    if (!user) {
      return <LoginView />;
    }

    if (!roleVerified) {
      return (
        <div className="max-w-xl mx-auto mt-12 p-6 bg-white border border-red-200 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-red-700 mb-3">
            Account Role Verification Failed
          </h2>

          <p className="text-slate-600 mb-4">
            Your account is logged in, but its role could not
            be verified. Access to the dashboards is blocked.
          </p>

          <div className="bg-slate-100 rounded-lg p-4 text-left text-sm space-y-2">
            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Role received:</strong>{' '}
              {currentRole || 'Not loaded'}
            </p>

            {authError && (
              <p className="text-red-700">
                <strong>Error:</strong> {authError}
              </p>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Open the browser Console to inspect the
            Supabase role verification logs.
          </p>
        </div>
      );
    }

    switch (currentRole) {
      case 'citizen':
        return (
          <CitizenPortal
            onComplaintSubmitted={syncData}
          />
        );

      case 'municipal_admin':
        return (
          <AdminDashboard
            masterIssues={masterIssues}
            tickets={tickets}
            workers={workers}
            onIssueUpdated={syncData}
          />
        );

      case 'field_worker':
        return (
          <FieldWorkerDashboard
            workers={workers}
            activeWorkerId={activeWorkerId}
            onWorkerChange={setActiveWorkerId}
            masterIssues={masterIssues}
            onIssueUpdated={syncData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-teal-500 selection:text-white">

      <Header
        onLoadDemoData={handleLoadDemoData}
        onResetDemoData={handleResetDemoData}
        hasDemoData={hasDemo}
        demoLoadedNotification={demoNotification}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {renderDashboard()}

      </main>

      <footer className="bg-navy-950 text-slate-400 border-t border-navy-900 mt-12 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />

            <span className="font-bold text-white tracking-wide">
              CivicLens 360
            </span>

            <span className="text-slate-500">|</span>

            <span>
              Every Voice Counts. Every Issue Matters.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>GovTech Architecture</span>
            <span>•</span>
            <span>Supabase RLS Enforced</span>
            <span>•</span>
            <span>OpenStreetMap Leaflet Engine</span>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
