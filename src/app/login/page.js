'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CloudflareTurnstile from '@/components/CloudflareTurnstile';
import { validateEmail, validatePassword, validateName, getPasswordStrength } from '@/utils/validation';

function LoginContent() {
  const searchParams = useSearchParams();
  const statusMessage = searchParams.get('verified') === 'true'
    ? 'Email Anda telah terverifikasi! Silakan masuk ke akun Anda.'
    : searchParams.get('reset') === 'success'
      ? 'Password berhasil diperbarui. Silakan masuk dengan password baru Anda.'
      : '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(statusMessage);
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cloudflare Turnstile token
  const [captchaToken, setCaptchaToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const { user, isLoading, logout, login, register, resetPassword } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isLoading && user) {
      const timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading && user && countdown === 0) {
      const target = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller-profile' : '/buyer-profile';
      router.replace(target);
    }
  }, [countdown, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="w-full max-w-md glass-panel p-8 text-center text-slate-400 text-sm py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium">Memuat status akun...</p>
      </div>
    );
  }

  if (user) {
    const targetPath = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller-profile' : '/buyer-profile';
    const targetLabel = user.role === 'admin' ? 'Dashboard Admin' : user.role === 'seller' ? 'Profil Penjual' : 'Profil Pembeli';

    return (
      <div className="w-full max-w-md glass-panel p-8 text-center space-y-6 relative z-10 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 text-3xl shadow-lg shadow-amber-500/10">
          ⚠️
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Anda Sudah Masuk!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Akun aktif: <strong className="text-white">{user.name}</strong> ({user.email})
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-left text-xs text-blue-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-400">
            <span>ℹ️</span> Pemberitahuan Akses
          </p>
          <p className="text-[11px] text-slate-300 leading-snug">
            Anda tidak perlu mendaftar atau masuk lagi karena sesi Anda masih aktif.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={() => router.push(targetPath)}
            className="btn-primary w-full !py-3.5 !text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
          >
            Buka {targetLabel} ({countdown}s) →
          </button>
          
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold transition-all"
          >
            🚪 Keluar Akun Ini / Ganti Akun
          </button>
        </div>
      </div>
    );
  }

  const triggerCaptchaReset = () => {
    setCaptchaToken('');
    setTurnstileReset((prev) => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegister) {
      const nameVal = validateName(name);
      if (!nameVal.isValid) {
        setError(nameVal.error);
        return;
      }
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) {
        setError(emailVal.error);
        return;
      }
      const passVal = validatePassword(password, { isNew: true, confirmPassword });
      if (!passVal.isValid) {
        setError(passVal.error);
        return;
      }
    } else {
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) {
        setError(emailVal.error);
        return;
      }
      const passVal = validatePassword(password, { isNew: false });
      if (!passVal.isValid) {
        setError(passVal.error);
        return;
      }
    }

    if (!captchaToken) {
      setError('Silakan selesaikan verifikasi Cloudflare terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (isRegister) {
        result = await register(role, email.trim().toLowerCase(), password, name.trim(), captchaToken);
      } else {
        result = await login(role, email.trim().toLowerCase(), password, captchaToken);
      }

      if (!result.success) {
        setError(result.message);
        triggerCaptchaReset();
        return;
      }

      if (result.requireVerification) {
        setSuccessMsg(result.message);
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
        triggerCaptchaReset();
        return;
      }

      if (result.user?.role === 'admin') router.push('/admin');
      else if (result.user?.role === 'seller') router.push('/seller-profile');
      else router.push('/buyer-profile');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      triggerCaptchaReset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailVal = validateEmail(resetEmail);
    if (!emailVal.isValid) {
      setError(emailVal.error);
      return;
    }
    if (!captchaToken) {
      setError('Silakan selesaikan verifikasi Cloudflare CAPTCHA terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(resetEmail, captchaToken);
      if (!res.success) {
        setError(res.message);
        triggerCaptchaReset();
      } else {
        setResetSuccess(true);
        setSuccessMsg(res.message);
      }
    } catch (err) {
      setError(err.message || 'Gagal mereset password.');
      triggerCaptchaReset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    setIsForgotPassword(true);
    setError('');
    setSuccessMsg('');
    setResetEmail(email || '');
    setResetSuccess(false);
    triggerCaptchaReset();
  };

  const closeForgotPassword = () => {
    setIsForgotPassword(false);
    setError('');
    setSuccessMsg('');
    triggerCaptchaReset();
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Logo */}
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

        <h1 className="text-2xl font-black text-white mt-4">
          {isForgotPassword
            ? 'Lupa Password'
            : isRegister
            ? 'Pendaftaran Akun Baru'
            : 'Selamat Datang Kembali'
          }
        </h1>
        <p className="text-slate-500 text-sm mt-1.5">
          {isForgotPassword
            ? 'Kirim link reset resmi ke email akun Anda'
            : isRegister
            ? 'Mulai jual beli gadget dengan akun terverifikasi email'
            : 'Masuk untuk melanjutkan ke dashboard Anda'
          }
        </p>
      </div>

      {/* Global Success Notification */}
      {successMsg && !resetSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-emerald-300 leading-snug">{successMsg}</p>
        </div>
      )}

      {/* Card */}
      <div className="glass-panel p-8">
        {/* FORGOT PASSWORD FORM */}
        {isForgotPassword ? (
          <div>
            {resetSuccess ? (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Permintaan Berhasil!</h3>
                  <p className="text-slate-400 text-sm">{successMsg}</p>
                </div>
                <button
                  onClick={() => {
                    closeForgotPassword();
                    if (resetEmail) setEmail(resetEmail);
                  }}
                  className="btn-primary w-full !py-3.5 !text-sm"
                >
                  Masuk ke Akun Anda →
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="nama@email.com"
                    maxLength={100}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Cloudflare Turnstile CAPTCHA */}
                <CloudflareTurnstile
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken('')}
                  onExpire={() => setCaptchaToken('')}
                  resetSignal={turnstileReset}
                />

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !captchaToken}
                  className="btn-primary w-full !py-4 !text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Memproses...
                    </span>
                  ) : 'Kirim Link Reset Password'}
                </button>

                <div className="pt-4 border-t border-white/[0.05] text-center">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="text-sm text-slate-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    ← Kembali ke Halaman Masuk
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* REGULAR LOGIN / REGISTER FORM */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                Saya adalah
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'buyer', label: 'Pembeli', icon: '🛒', desc: 'Cari & beli gadget' },
                  { value: 'seller', label: 'Penjual', icon: '🏪', desc: 'Jual perangkat saya' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      role === r.value
                        ? 'bg-blue-500/15 border-blue-500/50 shadow-lg shadow-blue-500/10'
                        : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="text-lg mb-1">{r.icon}</div>
                    <p className={`text-xs font-black ${role === r.value ? 'text-blue-300' : 'text-white'}`}>{r.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name field (register only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Budi Santoso"
                  maxLength={70}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="nama@email.com"
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-[10px] text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder={isRegister ? 'Min. 8 karakter (huruf & angka)' : '••••••••'}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength meter for registration */}
              {isRegister && password && (
                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Kekuatan Sandi:</span>
                    <span className={`font-bold ${getPasswordStrength(password).color}`}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrength(password).barColor}`}
                      style={{ width: `${(getPasswordStrength(password).score / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Wajib min. 8 karakter dan kombinasi huruf serta angka.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password (register only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="Ketik ulang password"
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1 font-medium">⚠️ Konfirmasi password belum cocok.</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">✓ Password cocok.</p>
                )}
              </div>
            )}

            {/* Cloudflare Turnstile CAPTCHA */}
            <CloudflareTurnstile
              onVerify={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken('')}
              onExpire={() => setCaptchaToken('')}
              resetSignal={turnstileReset}
            />

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="btn-primary w-full !py-4 !text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {isRegister ? 'Membuat akun & Mengirim Verifikasi Email...' : 'Masuk...'}
                </span>
              ) : (
                isRegister ? 'Daftar & Verifikasi Email' : `Masuk sebagai ${role === 'buyer' ? 'Pembeli' : 'Penjual'}`
              )}
            </button>
          </form>
        )}

        {/* Toggle Register / Login */}
        {!isForgotPassword && (
          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            <p className="text-sm text-slate-500">
              {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                  setSuccessMsg('');
                  setConfirmPassword('');
                  triggerCaptchaReset();
                }}
                className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
              >
                {isRegister ? 'Masuk sekarang' : 'Daftar gratis'}
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 mt-6">
        {['🔒 SSL Terenkripsi', '🛡️ Cloudflare Turnstile', '📧 Verifikasi Email'].map((badge) => (
          <span key={badge} className="text-[10px] font-bold text-slate-600">{badge}</span>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/8 blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />

      <Suspense fallback={
        <div className="text-center text-slate-400 text-sm py-20 animate-pulse">
          Memuat halaman autentikasi...
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
