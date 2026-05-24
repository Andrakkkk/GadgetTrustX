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
      alert("IMEI must be 15 digits.");
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
      
      if (data.status === 'VERIFIED') {
        setResult({
          status: 'verified',
          message: 'Device Authenticated',
          details: {
            brand: data.device.brand,
            model: data.device.model,
            kemperin: data.registration.kemperin,
            status: data.registration.status,
            origin: data.registration.network,
            warranty: data.registration.warranty
          }
        });
      } else {
        setResult({
          status: 'flagged',
          message: data.message || 'Security Risk Detected',
          details: {
            blacklistStatus: 'Flagged / Invalid',
            warranty: 'Unauthorized',
            origin: 'Unknown / Black Market'
          }
        });
      }
    } catch (err) {
      console.error(err);
      alert("Verification system busy. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-36">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 glow-text tracking-tight">
            Trust<span className="text-blue-500">X</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Scanner</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Verify device authenticity, blacklist status, and original regional warranty before you commit to a purchase. Powered by global IMEI databases.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="glass-panel p-1 md:p-1 overflow-hidden group">
               <div className="p-8 md:p-12 bg-slate-950/60 rounded-[calc(1.5rem-4px)]">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 0012-10V5l-8-3-8 3v4.757"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">IMEI Validator</h2>
                  </div>

                  <form onSubmit={handleVerify} className="space-y-6">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Enter 15-digit IMEI or Serial Number" 
                        className="input-field !pl-6 !py-5 !text-xl font-mono tracking-[0.2em] uppercase"
                        value={imei}
                        onChange={e => setImei(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        disabled={verifying}
                      />
                      {verifying && (
                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-[scan_2s_infinite]"></div>
                      )}
                    </div>

                    <button type="submit" disabled={verifying || imei.length < 8} className="btn-primary w-full !py-5 text-lg flex items-center justify-center gap-3">
                      {verifying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Accessing Global Database...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          <span>Verify Device Security</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-500 font-medium">Dial *#06# on your phone to find your IMEI.</p>
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
                  <h4 className="text-white font-bold mb-1">Blacklist Status</h4>
                  <p className="text-slate-500 text-sm">Checks if device is reported stolen or lost globally.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Authenticity Tag</h4>
                  <p className="text-slate-500 text-sm">Verifies model match and regional factory origin.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Warranty Trace</h4>
                  <p className="text-slate-500 text-sm">Validates manufacturing date and warranty expiration.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-16 animate-fade-in">
             <div className={`glass-panel p-10 border-t-4 transition-all duration-700 ${result.status === 'verified' ? 'border-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.2)]' : 'border-red-500 shadow-[0_20px_50px_rgba(239,68,68,0.2)]'}`}>
                <div className="flex flex-col md:flex-row gap-10 items-center">
                   <div className={`w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 ${result.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {result.status === 'verified' ? (
                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      ) : (
                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      )}
                   </div>

                   <div className="flex-grow text-center md:text-left">
                      <h3 className={`text-3xl font-black mb-2 tracking-tight ${result.status === 'verified' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {result.message}
                      </h3>
                      <p className="text-slate-400 font-medium mb-8 uppercase tracking-widest text-xs">Security Clearance: {result.status === 'verified' ? 'Approved' : 'Denied'}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {Object.entries(result.details).map(([key, value]) => (
                           <div key={key} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                             <p className="font-bold text-white text-lg">{value}</p>
                           </div>
                         ))}
                         <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 sm:col-span-2">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Scanned Serial/IMEI</p>
                            <p className="font-mono text-xl text-blue-400 tracking-[0.2em]">{imei}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
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
