import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BackendConfigModal from './Auth/BackendConfigModal';
import { 
  Building2, 
  Shield, 
  Users, 
  HardHat, 
  LogOut, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Trash2,
  Lock
} from 'lucide-react';

export default function Header({
  onLoadDemoData,
  onResetDemoData,
  hasDemoData,
  demoLoadedNotification
}) {
  const { user, profile, role, logout, isConfigured } = useAuth();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'municipal_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-navy-950 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-navy-950" />
            <span>Municipal Admin</span>
          </span>
        );
      case 'field_worker':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-400 text-navy-950 shadow-sm">
            <HardHat className="w-3.5 h-3.5 text-navy-950" />
            <span>Field Worker</span>
          </span>
        );
      case 'citizen':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-400 text-navy-950 shadow-sm">
            <Users className="w-3.5 h-3.5 text-navy-950" />
            <span>Verified Citizen</span>
          </span>
        );
    }
  };

  return (
    <header className="bg-navy-900 text-white shadow-md sticky top-0 z-40">
      {/* Top System Ribbon */}
      <div className="bg-navy-950 border-b border-navy-800 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Supabase RLS & PostgreSQL Connected</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Backend Authentication Pending Setup</span>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="underline hover:text-white font-semibold ml-1 inline-flex items-center gap-0.5"
              >
                <Key className="w-3 h-3" /> Connect Supabase
              </button>
            </div>
          )}
        </div>

        {/* Development Seed Controls (Explicit manual trigger only for evaluators) */}
        <div className="flex items-center gap-2">
          {demoLoadedNotification && (
            <span className="inline-flex items-center gap-1 text-teal-300 font-medium text-[11px] animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> {demoLoadedNotification}
            </span>
          )}

          {hasDemoData ? (
            <button
              onClick={onResetDemoData}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-semibold text-[11px] transition border border-amber-600/50"
              title="Clears sample evaluation complaints while preserving genuine citizen grievances"
            >
              <Trash2 className="w-3 h-3 text-amber-300" />
              <span>Purge Sample Complaints</span>
            </button>
          ) : (
            <button
              onClick={onLoadDemoData}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white font-medium text-[11px] transition border border-navy-700"
              title="Explicit development seed: load sample complaints for judging (never loads automatically)"
            >
              <Database className="w-3 h-3 text-teal-400" />
              <span>Seed Evaluation Complaints</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Brand & Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-lg ring-2 ring-teal-300/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                CivicLens <span className="text-teal-400 font-extrabold">360</span>
              </h1>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                GovTech
              </span>
            </div>
            <p className="text-xs text-teal-100/80 font-medium">
              Every Voice Counts. Every Issue Matters.
            </p>
          </div>
        </div>

        {/* Authenticated User Identity & Controls (NO ROLE SWITCHER!) */}
        {user ? (
          <div className="flex items-center gap-3 bg-navy-950 p-2 px-3.5 rounded-xl border border-navy-800 shadow-inner">
            <div className="text-right text-xs">
              <div className="flex items-center justify-end gap-2">
                <span className="font-bold text-white text-xs">{profile?.name || user.email}</span>
                {getRoleBadge(profile?.role || role)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">{user.email}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-red-900/80 text-slate-300 hover:text-white text-xs font-bold transition border border-navy-700 hover:border-red-600"
              title="Sign out of your session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-navy-700"
            >
              <Key className="w-3 h-3 text-teal-400" />
              <span>Backend Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* Backend Config Modal */}
      <BackendConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </header>
  );
}
