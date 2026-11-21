import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Lock, Mail, LogIn, AlertCircle, CheckCircle2, Shield, Key, ExternalLink, Loader2 } from 'lucide-react';
import BackendConfigModal from './BackendConfigModal';

export default function LoginView() {
  const { login, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your registered email address and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(email.trim(), password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials or check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 items-center justify-center text-white shadow-xl ring-4 ring-teal-500/20 mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            CivicLens <span className="text-teal-600 font-black">360</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs mx-auto">
            Every Voice Counts. Every Issue Matters.
          </p>
        </div>

        {/* Backend Status Card */}
        {!isConfigured ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Supabase Backend Connection Pending</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              Live server-side authentication and Row Level Security require connecting your Supabase project credentials.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Connect Supabase Project</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCredentialsGuide(prev => !prev)}
                className="text-[11px] text-teal-800 underline font-semibold"
              >
                {showCredentialsGuide ? 'Hide Setup Guide' : 'View SQL Setup Guide'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Connected to Supabase PostgreSQL & Auth</span>
            </div>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="text-[11px] text-teal-800 underline font-bold"
            >
              Configure
            </button>
          </div>
        )}

        {/* Evaluator SQL Setup & Credentials Helper */}
        {showCredentialsGuide && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs space-y-2 text-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold text-navy-950">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Evaluator Account Provisioning Guide</span>
            </div>
            <p className="text-[11px] text-slate-600">
              In accordance with security requirements, accounts are provisioned via Supabase Auth. To test each role:
            </p>
            <div className="p-2.5 rounded-lg bg-white border font-mono text-[11px] space-y-1">
              <div><strong className="text-slate-900">1. Admin:</strong> <code>admin@civiclens.gov.in</code></div>
              <div><strong className="text-slate-900">2. Worker:</strong> <code>worker.suresh@civiclens.gov.in</code></div>
              <div><strong className="text-slate-900">3. Citizen:</strong> <code>citizen.anita@civiclens.gov.in</code></div>
            </div>
            <p className="text-[10px] text-slate-500">
              * See <code>supabase_schema.sql</code> in project root for full table schema, RLS policies, and role assignment commands.
            </p>
          </div>
        )}

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-navy-950">Secure Portal Login</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Role permissions are determined strictly from your verified server profile.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Notice:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1.5">
                Official Email Address:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@civiclens.gov.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1.5">
                Password:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-teal-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Account Creation Security Policy Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <strong className="text-navy-950 font-bold block">Notice: Public Registration Disabled</strong>
            <p>
              In compliance with civic grievance standards, individual accounts are created and managed by authorized municipal administration. Users cannot self-register or elevate their own roles.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Config Modal */}
      <BackendConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
