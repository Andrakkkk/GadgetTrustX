'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CloudflareTurnstile from '@/components/CloudflareTurnstile';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [error, setError] = useState(() => (supabase ? '' : 'Supabase belum dikonfigurasi.'));

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;

    const prepareRecoverySession = async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (existingSession?.access_token) {
        if (mounted) setIsReady(true);
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (mounted) setError('Link reset password tidak valid atau sudah kedaluwarsa.');
          return;
        }

        if (mounted) setIsReady(true);
        return;
      }

      if (mounted) setError('Buka halaman ini melalui link reset password dari email.');
    };

    prepareRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session?.access_token && mounted) {
        setIsReady(true);
        setError('');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const resetTurnstile = () => {
    setCaptchaToken('');
    setTurnstileReset((value) => value + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (!captchaToken) {
      setError('Silakan selesaikan verifikasi Cloudflare terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Session reset password sudah kedaluwarsa. Minta link baru dari halaman login.');
        resetTurnstile();
        return;
      }

      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          password,
          captchaToken,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Gagal memperbarui password.');
        resetTurnstile();
        return;
      }

      await supabase.auth.signOut();
      router.replace('/login?reset=success');
    } catch (err) {
      setError(err.message || 'Gagal memperbarui password.');
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/8 blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <span className="text-white font-black text-base">G</span>
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-white">Gadget</span>
              <span className="text-blue-400">TrustX</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white mt-4">Atur Password Baru</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Masukkan password baru dari link recovery yang dikirim ke email Anda.
          </p>
        </div>

        <div className="glass-panel p-8">
          {!isReady ? (
            <div className="space-y-6 text-center">
              <div className="text-sm text-slate-400">
                {error || 'Memvalidasi link reset password...'}
              </div>
              {error && (
                <Link href="/login" className="btn-primary w-full !py-3.5 !text-sm inline-flex justify-center">
                  Kembali ke Login
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <CloudflareTurnstile
                onVerify={(token) => setCaptchaToken(token)}
                onError={() => setCaptchaToken('')}
                onExpire={() => setCaptchaToken('')}
                resetSignal={turnstileReset}
              />

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !captchaToken}
                className="btn-primary w-full !py-4 !text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {isSubmitting ? 'Menyimpan password...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
