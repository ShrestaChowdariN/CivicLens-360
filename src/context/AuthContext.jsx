import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check config and active session on mount
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    // Fetch initial session
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session retrieval error:', error.message);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id, client);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id, client);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isConfigured]);

  // Fetch role and details from public.profiles
  const fetchUserProfile = async (userId, client) => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Could not fetch user profile from public.profiles:', error.message);
        // Fallback profile from user metadata if table not yet populated
        setProfile({
          id: userId,
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          role: 'citizen' // default to citizen
        });
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign In with email & password
  const login = async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase backend is not configured yet. Please configure your project URL and key.');
    }

    setAuthError(null);
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    if (data?.user) {
      setUser(data.user);
      await fetchUserProfile(data.user.id, client);
    }

    return data;
  };

  // Public registration is disabled by security policy.
  // Individual accounts are created manually by an authorized administrator using Supabase's secure interface.
  const registerCitizen = async () => {
    throw new Error('Public registration is disabled. Please contact municipal administration to provision your account.');
  };

  // Sign Out
  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  // Update backend connection
  const updateBackendConfig = (url, anonKey) => {
    const res = saveSupabaseConfig(url, anonKey);
    if (res.success) {
      setIsConfigured(isSupabaseConfigured());
    }
    return res;
  };

  // Reset backend connection
  const disconnectBackend = () => {
    clearSupabaseConfig();
    setIsConfigured(false);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || 'citizen',
        loading,
        isConfigured,
        authError,
        login,
        registerCitizen,
        logout,
        updateBackendConfig,
        disconnectBackend
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
