'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabasePassword } from '@/lib/authPassword';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext();

function mapProfile(profile, authUser) {
  if (!profile || !authUser) return null;

  return {
    id: profile.id,
    email: profile.email || authUser.email || '',
    name: profile.name || authUser.email?.split('@')[0] || 'User',
    role: profile.role || 'buyer',
    phone: profile.phone || '',
    address: profile.address || '',
    bio: profile.bio || '',
    storeName: profile.store_name || '',
    avatar: profile.avatar || '',
    isVerified: profile.is_verified || false,
    createdAt: profile.created_at,
  };
}

export function AuthProvider({ children }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!supabase || !authUser) {
      setUser(null);
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const mapped = mapProfile(profile, authUser);
    setUser(mapped);
    return mapped;
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setIsLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      await loadProfile(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        if (!mounted) return;
        await loadProfile(session?.user ?? null);
        if (mounted) setIsLoading(false);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const withTimeout = async (promise, timeoutMs, message) => Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error(message)), timeoutMs)),
  ]);

  const login = async (_role, email, password) => {
    if (!supabase) {
      return { success: false, message: 'Supabase belum dikonfigurasi.' };
    }

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password: getSupabasePassword(password) }),
        15000,
        'Login terlalu lama. Coba lagi.'
      );
      if (error) return { success: false, message: error.message };

      const profile = await withTimeout(
        loadProfile(data.user),
        15000,
        'Profile gagal dimuat. Coba login lagi.'
      );
      if (!profile) return { success: false, message: 'Profile not found.' };
      return { success: true, user: profile };
    } catch (error) {
      return { success: false, message: error.message || 'Login gagal.' };
    }
  };

  const register = async (role, email, password, name) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        email,
        password,
        name,
      }),
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      return { success: false, message: result.error || 'Unable to create account.' };
    }

    return login(role, email, password);
  };

  const logout = async () => {
    if (!supabase) {
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updatedData) => {
    if (!supabase) return { success: false, message: 'Supabase belum dikonfigurasi.' };
    if (!user) return { success: false, message: 'Not authenticated.' };
    let {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      const {
        data: { session: refreshedSession },
      } = await supabase.auth.refreshSession();
      session = refreshedSession;
    }

    if (!session?.access_token) {
      return { success: false, message: 'Session expired.' };
    }

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updatedData),
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) return { success: false, message: result.error || 'Failed to update profile.' };

    setUser(mapProfile(result.profile, { id: result.profile?.id || user.id, email: user.email }));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
