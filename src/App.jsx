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
  clearAllStorage,
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
import { Building2, Shield, Heart, HelpCircle, Layers, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, role, loading: authLoading, isConfigured } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [masterIssues, setMasterIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [activeWorkerId, setActiveWorkerId] = useState(null);
  const [demoNotification, setDemoNotification] = useState('');
  const [hasDemo, setHasDemo] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Sync state from active data source (Supabase if connected, else clean zero-state local storage)
  const syncData = useCallback(async () => {
    setDataLoading(true);

    if (isSupabaseConfigured() && user) {
      // 1. Live Supabase Backend Mode
      const [complaintsRes, mastersRes] = await Promise.all([
        fetchComplaintsFromBackend(user.id, profile?.role),
        fetchMasterIssuesFromBackend(user.id, profile?.role)
      ]);

      if (complaintsRes.success && mastersRes.success) {
        setTickets(complaintsRes.data);
        setMasterIssues(mastersRes.data);
      } else {
        // Fallback to local clean storage if fetch encountered an issue
        const storedTickets = getTickets();
        const storedMasters = getMasterIssues();
        setTickets(storedTickets);
        setMasterIssues(storedMasters);
      }
    } else {
      // 2. Offline / Local Storage Mode (Guaranteed zero sample complaints on startup)
      purgeLegacySeededData();
      const storedTickets = getTickets();
      const storedMasters = getMasterIssues();
      setTickets(storedTickets);
      setMasterIssues(storedMasters);
    }

    const storedWorkers = getWorkers();
    setWorkers(storedWorkers);
    setHasDemo(hasDemoDataLoaded());
    setDataLoading(false);
  }, [user, profile]);

  // Initial load
  useEffect(() => {
    syncData();
  }, [syncData]);

  // Bind active worker ID for field workers
  useEffect(() => {
    if (user && profile && profile.role === 'field_worker') {
      const match = workers.find(w => w.name?.toLowerCase() === profile.name?.toLowerCase());
      if (match) {
        setActiveWorkerId(match.id);
      } else if (workers.length > 0) {
        setActiveWorkerId(workers[0].id);
      }
    }
  }, [user, profile, workers]);

  // Handle Explicit Development Demo Seed (Only triggered when evaluator clicks button)
  const handleLoadDemoData = () => {
    loadDemoData();
    syncData();
    setDemoNotification('Sample evaluation records loaded.');
    setTimeout(() => setDemoNotification(''), 4000);
  };

  // Handle Purge Demo Data (Preserves genuine citizen complaints!)
  const handleResetDemoData = () => {
    const confirmed = window.confirm(
      'Purge sample evaluation complaints? This will remove sample demonstration records while preserving any genuine citizen complaints you submitted.'
    );
    if (confirmed) {
      const res = resetDemoData();
      syncData();
      setDemoNotification(`Sample records purged. Preserved ${res.tickets.length} genuine citizen records.`);
      setTimeout(() => setDemoNotification(''), 4000);
    }
  };

  // Global loading state while verifying Supabase session
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span>Verifying Secure Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-teal-500 selection:text-white">
      {/* Header */}
      <Header
        onLoadDemoData={handleLoadDemoData}
        onResetDemoData={handleResetDemoData}
        hasDemoData={hasDemo}
        demoLoadedNotification={demoNotification}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* If NOT logged in: Show the Login View (Protected Routes!) */}
        {!user ? (
          <LoginView />
        ) : (
          /* Protected Role Dashboards */
          <>
            {profile?.role === 'citizen' && (
              <CitizenPortal onComplaintSubmitted={syncData} />
            )}

            {profile?.role === 'municipal_admin' && (
              <AdminDashboard
                masterIssues={masterIssues}
                tickets={tickets}
                workers={workers}
                onIssueUpdated={syncData}
              />
            )}

            {profile?.role === 'field_worker' && (
              <FieldWorkerDashboard
                workers={workers}
                activeWorkerId={activeWorkerId}
                onWorkerChange={setActiveWorkerId}
                masterIssues={masterIssues}
                onIssueUpdated={syncData}
              />
            )}

            {/* Fallback if user role is not recognized */}
            {!['citizen', 'municipal_admin', 'field_worker'].includes(profile?.role) && (
              <CitizenPortal onComplaintSubmitted={syncData} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-400 border-t border-navy-900 mt-12 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-white tracking-wide">CivicLens 360</span>
            <span className="text-slate-500">|</span>
            <span>Every Voice Counts. Every Issue Matters.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>GovTech Architecture</span>
            <span>•</span>
            <span>Zero Unverified Startup Records</span>
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
