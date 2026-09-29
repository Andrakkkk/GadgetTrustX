'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase));

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
      return undefined;
    }

    let mounted = true;

    supabase.auth.getUser()
      .then(async ({ data, error }) => {
        if (!mounted) return;
        if (error) {
          if (error.message?.includes('Refresh Token') || error.status === 400) {
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {
              // ignore
            }
          }
          setUser(null);
          setIsLoading(false);
          return;
        }
        await loadProfile(data.user);
        setIsLoading(false);
      })
      .catch(async (err) => {
        if (!mounted) return;
        console.warn('Supabase auth initialization:', err?.message || err);
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // ignore
        }
        setUser(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        if (!mounted) return;
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
        }
        if (mounted) setIsLoading(false);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const login = async (expectedRole, email, password, captchaToken) => {
    if (!supabase) {
      return { success: false, message: 'Supabase belum dikonfigurasi.' };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: expectedRole,
          email,
          password,
          captchaToken,
        }),
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        return { success: false, message: result.error || 'Login gagal.' };
      }

      if (!result.session?.access_token || !result.session?.refresh_token) {
        return { success: false, message: 'Session login tidak diterima.' };
      }

      const { error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      if (error) return { success: false, message: error.message };

      const profile = mapProfile(result.profile, result.user);
      setUser(profile);

      return { success: true, user: profile };
    } catch (error) {
      return { success: false, message: error.message || 'Login gagal.' };
    }
  };

  const register = async (role, email, password, name, captchaToken) => {
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
        captchaToken,
      }),
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { error: await response.text() };

    if (!response.ok) {
      return { success: false, message: result.error || 'Unable to create account.' };
    }

    if (result.requireVerification) {
      return {
        success: true,
        requireVerification: true,
        message: result.message,
      };
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
    
    let session = null;
    try {
      const { data } = await supabase.auth.getSession();
      session = data?.session || null;
    } catch {
      session = null;
    }

    if (!session?.access_token) {
      return { success: false, message: 'Sesi telah berakhir. Silakan masuk kembali.' };
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

  const resetPassword = async (email, captchaToken) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gagal mereset password.' };
      }
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message || 'Terjadi kesalahan jaringan.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
