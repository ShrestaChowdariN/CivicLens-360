import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, Shield, HardHat, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, registerCitizen, isConfigured } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(email, password);
      setSuccessMsg('Successfully authenticated!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await registerCitizen(name, email, password);
      setSuccessMsg('Registration successful! You can now log in or check confirmation email.');
      setTab('login');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tab === 'login' ? 'Secure Account Login' : 'Citizen Registration'} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Supabase backend status */}
        {!isConfigured && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Backend Connection Required:</strong>
              <span>
                To execute live authentication requests, connect your Supabase project URL and anon key using the "Connect Supabase" button in the top bar.
              </span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition ${
              tab === 'login'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In (All Roles)
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition ${
              tab === 'register'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register as Citizen
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Email Address:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com or admin@civiclens.gov.in"
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p>• <strong>Citizens</strong>: Log in to report and track complaints.</p>
              <p>• <strong>Municipal Admins & Field Workers</strong>: Use your individually provisioned government credentials.</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Full Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Rao"
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Email Address:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-950 mb-1">Password (min 6 chars):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
              <strong className="text-navy-950 block">Security Policy:</strong>
              Public user registrations strictly assign the <strong>Citizen</strong> role. Municipal Admin and Field Worker roles cannot be chosen during public registration and are provisioned directly by the municipal authority.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Registering...' : 'Register Citizen Account'}</span>
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
