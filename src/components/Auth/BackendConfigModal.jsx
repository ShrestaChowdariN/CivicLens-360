import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Database, Key, CheckCircle2, AlertCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';

export default function BackendConfigModal({ isOpen, onClose }) {
  const { isConfigured, updateBackendConfig, disconnectBackend } = useAuth();

  const [url, setUrl] = useState(() => localStorage.getItem('civiclens_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [anonKey, setAnonKey] = useState(() => localStorage.getItem('civiclens_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Please enter both Supabase Project URL and Anon/Public Key.');
      return;
    }

    const res = updateBackendConfig(url.trim(), anonKey.trim());
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } else {
      alert('Failed to save configuration: ' + res.error);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect Supabase backend? The app will return to offline demonstration mode.')) {
      disconnectBackend();
      setUrl('');
      setAnonKey('');
      onClose();
    }
  };

  const copySqlFilename = () => {
    navigator.clipboard.writeText('supabase_schema.sql');
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supabase Backend & Authentication Setup" maxWidth="max-w-2xl">
      <div className="space-y-5 text-xs">
        {/* Backend Status Card */}
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          isConfigured 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center gap-2.5">
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <strong className="block font-bold text-sm">
                {isConfigured ? 'Supabase Backend Connected' : 'Supabase Backend Pending'}
              </strong>
              <span className="text-[11px] opacity-80">
                {isConfigured 
                  ? 'Real authentication and Row Level Security are active.'
                  : 'Enter your project credentials below to enable live database authentication.'}
              </span>
            </div>
          </div>

          {isConfigured && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">
              Supabase Project URL (e.g. https://your-ref.supabase.co):
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              required
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-950 mb-1">
              Supabase Anon / Public Key (Project Settings → API):
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              * Keys are kept client-side only and never transmitted outside your Supabase instance.
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved & Verified!' : 'Save & Connect'}</span>
            </button>
          </div>
        </form>

        {/* Step-by-Step Backend Setup Instructions */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <h4 className="font-bold text-navy-950 text-sm">
            Quick 3-Minute Setup Instructions for Evaluators:
          </h4>

          <ol className="list-decimal list-inside space-y-2 text-slate-700 leading-relaxed">
            <li>
              Log in to <strong>Supabase</strong> (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-teal-700 underline font-semibold inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a>) and create a free project.
            </li>
            <li>
              In your Supabase project dashboard, navigate to <strong>SQL Editor</strong>.
            </li>
            <li>
              Open and execute the provided migration script{' '}
              <button
                type="button"
                onClick={copySqlFilename}
                className="font-mono bg-slate-200 hover:bg-slate-300 text-slate-900 px-1.5 py-0.5 rounded text-[11px]"
                title="Click to copy filename"
              >
                supabase_schema.sql
              </button>{' '}
              {copiedSchema && <span className="text-teal-600 font-bold">✓ Copied!</span>}
              <p className="text-[11px] text-slate-500 ml-5 mt-0.5">
                (Located in your project root at <code>C:\Users\Shresta\OneDrive\Documents\civiclens-360\supabase_schema.sql</code>)
              </p>
            </li>
            <li>
              The SQL script creates the <code>profiles</code>, <code>complaints</code>, and <code>master_issues</code> tables with production Row Level Security (RLS) policies.
            </li>
            <li>
              Copy your <strong>Project URL</strong> and <strong>Anon Key</strong> from <em>Project Settings &gt; API</em> and paste them above.
            </li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}
