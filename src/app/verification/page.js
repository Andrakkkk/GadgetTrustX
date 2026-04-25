'use client';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function VerificationPage() {
  const [imei, setImei] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (imei.length < 8) return;
    
    setVerifying(true);
    setResult(null);
    
    // Simulate DB validation
    setTimeout(() => {
      const isAuthentic = imei.endsWith('8') || imei.endsWith('9') || imei.endsWith('0');
      
      if (isAuthentic) {
        setResult({
          status: 'verified',
          message: 'Device is Authentic',
          details: {
            brand: 'Apple',
            model: 'iPhone 13 Pro',
            blacklistStatus: 'Clean',
            warranty: 'Expired'
          }
        });
      } else {
        setResult({
          status: 'flagged',
          message: 'Warning: Unverified or Flagged Device',
          details: {
            blacklistStatus: 'Flagged (Reported Stolen)',
            warranty: 'Unknown'
          }
        });
      }
      setVerifying(false);
    }, 2500);
  };

  return (
    <AuthGuard>
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Verified Device Check</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Ensure the electronics you're buying are authentic and not blacklisted. Enter the IMEI or Serial Number below.
        </p>
      </div>

      <div className="glass-panel p-8 md:p-12 mb-8 relative overflow-hidden">
        {/* Background scanner line effect */}
        {verifying && (
          <div className="absolute left-0 right-0 h-1 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-0 animate-scan"></div>
        )}

        <form onSubmit={handleVerify} className="relative z-10 flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Enter IMEI or Serial Number (e.g. ends with 8 for success)" 
            className="input-field flex-grow text-lg tracking-wider font-mono"
            value={imei}
            onChange={e => setImei(e.target.value)}
            disabled={verifying}
          />
          <button type="submit" disabled={verifying || imei.length < 8} className="btn-primary whitespace-nowrap">
            {verifying ? 'Scanning DB...' : 'Verify Now'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button className="text-xs text-blue-400 hover:underline">Where do I find my IMEI?</button>
        </div>
      </div>

      {result && (
        <div className={`glass-panel p-8 border-t-4 transition-all duration-500 animate-fade-in ${result.status === 'verified' ? 'border-emerald-500' : 'border-red-500'}`}>
          <div className="flex items-start">
            <div className={`p-4 rounded-full mr-6 ${result.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {result.status === 'verified' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              )}
            </div>
            
            <div className="flex-grow">
              <h3 className={`text-2xl font-bold mb-2 ${result.status === 'verified' ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.message}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {result.details.brand && (
                  <div className="bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Device Model</p>
                    <p className="font-semibold text-white">{result.details.brand} {result.details.model}</p>
                  </div>
                )}
                <div className="bg-slate-800/50 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Blacklist Check</p>
                  <p className={`font-semibold ${result.details.blacklistStatus === 'Clean' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.details.blacklistStatus}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl sm:col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">IMEI Match</p>
                  <p className="font-mono text-white tracking-widest">{imei}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
