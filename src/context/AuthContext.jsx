
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import {
  getSupabaseClient,
  isSupabaseConfigured,
  saveSupabaseConfig,
  clearSupabaseConfig
} from '../services/supabase';

const AuthContext = createContext(null);

const VALID_ROLES = [
  'citizen',
  'municipal_admin',
  'field_worker'
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(
    () => isSupabaseConfigured()
  );
  const [authError, setAuthError] = useState(null);

  // Always retrieve the actual role from Supabase.
  // Never assign citizen as a fallback.
  const fetchUserProfile = useCallback(async (authUser, client) => {
    if (!authUser?.id) {
      setProfile(null);
      throw new Error('No authenticated user found.');
    }

    const { data, error } = await client
      .from('profiles')
      .select('id, email, role, name')
      .eq('id', authUser.id)
      .single();

    if (error) {
      setProfile(null);
      throw new Error(
        'Unable to load your account role: ' + error.message
      );
    }

    if (!data) {
      setProfile(null);
      throw new Error(
        'Your account profile was not found in Supabase.'
      );
    }

    const verifiedRole = String(data.role || '')
      .trim()
      .toLowerCase();

    if (!VALID_ROLES.includes(verifiedRole)) {
      setProfile(null);
      throw new Error(
        'Invalid account role. Contact the administrator.'
      );
    }

    const verifiedProfile = {
      ...data,
      role: verifiedRole
    };

    setProfile(verifiedProfile);

    console.log(
      'Verified Supabase account:',
      verifiedProfile.email,
      verifiedProfile.role
    );

    return verifiedProfile;
  }, []);

  // Restore authenticated session on page load.
  useEffect(() => {
    let active = true;

    const client = getSupabaseClient();

    if (!isConfigured || !client) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const restoreSession = async () => {
      setLoading(true);

      try {
        const { data, error } = await client.auth.getUser();

        if (error) throw error;

        if (!active) return;

        if (data?.user) {
          setUser(data.user);
          await fetchUserProfile(data.user, client);
        } else {
          setUser(null);
          setProfile(null);
        }

        if (active) setAuthError(null);
      } catch (error) {
        if (active) {
          console.error('Session restore error:', error);
          setUser(null);
          setProfile(null);
          setAuthError(error.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthError(null);
        setLoading(false);
      }

      // Refresh the profile when a new user signs in.
      // Run the database query outside the auth callback.
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        setUser(session.user);

        setTimeout(async () => {
          if (!active) return;

          try {
            await fetchUserProfile(session.user, client);
            if (active) setAuthError(null);
          } catch (error) {
            if (active) {
              setProfile(null);
              setAuthError(error.message);
            }
          } finally {
            if (active) setLoading(false);
          }
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [isConfigured, fetchUserProfile]);

  // Secure login using Supabase Auth.
  const login = async (email, password) => {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error('Supabase is not configured.');
    }

    setLoading(true);
    setAuthError(null);
    setProfile(null);
    setUser(null);

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error('Login failed: no user returned.');
      }

      setUser(data.user);

      // Retrieve role directly from database.
      await fetchUserProfile(data.user, client);

      return data;
    } catch (error) {
      setProfile(null);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerCitizen = async () => {
    throw new Error(
      'Public registration is disabled. Contact municipal administration.'
    );
  };

  const logout = async () => {
    const client = getSupabaseClient();

    if (client) {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }

    setUser(null);
    setProfile(null);
    setAuthError(null);
  };

  const updateBackendConfig = (url, anonKey) => {
    const result = saveSupabaseConfig(url, anonKey);

    if (result.success) {
      setUser(null);
      setProfile(null);
      setAuthError(null);
      setLoading(true);
      setIsConfigured(isSupabaseConfigured());
    }

    return result;
  };

  const disconnectBackend = () => {
    clearSupabaseConfig();
    setIsConfigured(false);
    setUser(null);
    setProfile(null);
    setAuthError(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}
