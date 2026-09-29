'use client';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function VerificationPage() {
  const [imei, setImei] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (imei.length !== 15) {
      alert("IMEI harus berisi 15 digit angka.");
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/imei-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Sistem verifikasi sedang sibuk. Silakan coba lagi.");
    } finally {
      setVerifying(false);
    }
  };

  const isVerified = result?.status === 'VERIFIED';
  const isInvalid = result?.status === 'INVALID';
  const isUnknown = result?.status === 'UNKNOWN';

  return (
    <div className="min-h-screen pb-24 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-36">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 glow-text tracking-tight">
            Trust<span className="text-blue-500">X</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Scanner</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-lg leading-relaxed">
            Verifikasi keaslian perangkat, status blacklist, dan garansi regional sebelum Anda membeli. Didukung database TAC global dengan 80+ model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="glass-panel p-1 md:p-1 overflow-hidden group">
               <div className="p-4 sm:p-8 md:p-12 bg-slate-950/60 rounded-[calc(1.5rem-4px)]">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 0012-10V5l-8-3-8 3v4.757"></path></svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">IMEI Validator</h2>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">80+ Model · TAC Database · Luhn Check</p>
                    </div>
                  </div>

                  <form onSubmit={handleVerify} className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Masukkan IMEI 15 digit"
                        className="input-field !pl-6 !py-5 !text-xl font-mono tracking-[0.2em] uppercase"
                        value={imei}
                        onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        disabled={verifying}
                        maxLength={15}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-mono">
                        {imei.length}/15
                      </div>
                      {verifying && (
                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-[scan_2s_infinite]"></div>
                      )}
                    </div>

                    <button type="submit" disabled={verifying || imei.length < 15} className="btn-primary w-full !py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                      {verifying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Memindai Database Global...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          <span>Verifikasi Keamanan Perangkat</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-500 font-medium">Tekan *#06# di ponsel untuk melihat IMEI.</p>
                  </form>
               </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Status Blacklist</h4>
                  <p className="text-slate-500 text-sm">Memeriksa apakah perangkat dilaporkan hilang atau dicuri secara global.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Identifikasi TAC</h4>
                  <p className="text-slate-500 text-sm">80+ model terdaftar — identifikasi brand, model, chipset, dan pabrik asal.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Garansi & Kemenperin</h4>
                  <p className="text-slate-500 text-sm">Cek status pendaftaran SDPPI/Kemenperin RI dan estimasi masa garansi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ RESULT SECTION ═══════ */}
        {result && (
          <div className="mt-16 animate-fade-in space-y-6">

            {/* ── STATUS BANNER ── */}
            <div className={`glass-panel p-8 border-t-4 ${isVerified ? 'border-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.15)]' : isInvalid ? 'border-red-500 shadow-[0_20px_50px_rgba(239,68,68,0.15)]' : 'border-amber-500 shadow-[0_20px_50px_rgba(245,158,11,0.15)]'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${isVerified ? 'bg-emerald-500/10 text-emerald-400' : isInvalid ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {isVerified ? (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  ) : isInvalid ? (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                  ) : (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-2xl font-black tracking-tight ${isVerified ? 'text-emerald-400' : isInvalid ? 'text-red-400' : 'text-amber-400'}`}>
                      {isVerified ? 'Perangkat Terverifikasi ✓' : isInvalid ? 'IMEI Tidak Valid ✕' : 'Perangkat Tidak Dikenali ⚠'}
                    </h3>
                    {result.matchType === 'exact' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">TAC Match Exact</span>
                    )}
                    {result.matchType === 'estimated' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase tracking-widest border border-amber-500/30">Estimasi Prefix</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    {result.message || (isVerified ? 'Data perangkat ditemukan dalam database TAC global' : 'Silakan periksa ulang nomor IMEI')}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="font-mono text-blue-400 text-lg tracking-[0.15em]">{imei}</span>
                    {result.tac && <span className="text-[10px] text-slate-600 font-mono">TAC: {result.tac}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── DEVICE INFO (only for VERIFIED) ── */}
            {isVerified && result.device && (
              <div className="glass-panel p-8">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Identifikasi Perangkat
                </h4>

                <div className="flex flex-col sm:flex-row gap-6 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">
                      {result.device.brand?.includes('Apple') ? '🍎' :
                       result.device.brand?.includes('Samsung') ? '📱' :
                       result.device.brand?.includes('Xiaomi') ? '🟠' :
                       result.device.brand?.includes('Google') ? '🔵' :
                       result.device.brand?.includes('OPPO') ? '🟢' :
                       result.device.brand?.includes('vivo') ? '🔷' : '📱'}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{result.device.model}</p>
                    <p className="text-sm text-slate-400 font-bold">{result.device.brand}</p>
                    <p className="text-xs text-slate-500 mt-1">{result.device.specs}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Tahun Produksi</p>
                    <p className="text-lg font-bold text-white">{result.device.manufactureYear || '—'}</p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Pabrik Asal</p>
                    <p className="text-sm font-bold text-white leading-tight">{result.device.factoryOrigin || '—'}</p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">SIM Support</p>
                    <p className="text-sm font-bold text-white">{result.registration?.simSupport || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── VALIDATION & SECURITY (for VERIFIED) ── */}
            {isVerified && result.registration && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Panel */}
                <div className="glass-panel p-8">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Status Keamanan
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400 text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">Luhn Checksum</p>
                        <p className="text-[11px] text-slate-400">{result.validation?.luhnCheck}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400 text-sm mt-0.5">✓</span>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">Status Blacklist</p>
                        <p className="text-[11px] text-slate-400">{result.registration.blacklistStatus}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className={`text-sm mt-0.5 ${result.registration.kemenperin?.includes('Terdaftar') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {result.registration.kemenperin?.includes('Terdaftar') ? '✓' : '✕'}
                      </span>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">Kemenperin / SDPPI</p>
                        <p className="text-[11px] text-slate-400">{result.registration.kemenperin}</p>
                        {result.registration.kemperinId && (
                          <p className="text-[10px] text-blue-400 font-mono mt-0.5">{result.registration.kemperinId}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-blue-400 text-sm mt-0.5">ℹ</span>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">TAC Match</p>
                        <p className="text-[11px] text-slate-400">{result.validation?.tacMatch}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network & Warranty Panel */}
                <div className="glass-panel p-8">
                  <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    Jaringan & Garansi
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Status Garansi</p>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${result.registration.warrantyStatus === 'Aktif' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                        {result.registration.warrantyStatus}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">{result.registration.warrantyExpiry}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Network Bands</p>
                      <p className="text-[11px] text-slate-400">{result.registration.networkBands}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Operator Kompatibel</p>
                      <p className="text-[11px] text-slate-400">{result.registration.operators}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DETAILS FOR INVALID/UNKNOWN ── */}
            {(isInvalid || isUnknown) && result.details && (
              <div className="glass-panel p-8">
                <div className="space-y-4">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className={`text-sm mt-0.5 ${isInvalid ? 'text-red-400' : 'text-amber-400'}`}>{isInvalid ? '✕' : '⚠'}</span>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-[11px] text-slate-400">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {result.validation?.timestamp && (
              <p className="text-center text-[10px] text-slate-600 font-mono">
                Scan timestamp: {new Date(result.validation.timestamp).toLocaleString('id-ID')}
              </p>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
