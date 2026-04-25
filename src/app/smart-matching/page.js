'use client';
import { useState, useEffect } from 'react';
import { dummyDevices } from '@/data/dummyDevices';
import DeviceCard from '@/components/DeviceCard';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';

export default function SmartMatchingPage() {
  const [step, setStep] = useState(1);
  const [devices, setDevices] = useState([]);
  const [preferences, setPreferences] = useState({
    budget: 15000000,
    primaryUse: '',
    brandPreference: 'Any'
  });
  
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('gadgetTrustX_devices');
    if (saved) setDevices(JSON.parse(saved));
    else setDevices(dummyDevices);
  }, []);

  const handleMatch = () => {
    setMatching(true);
    setStep(4); 
    
    setTimeout(() => {
      let results = devices.filter(d => d.price <= preferences.budget);
      
      if (preferences.brandPreference !== 'Any') {
        results = results.filter(d => d.brand === preferences.brandPreference);
      }
      
      setMatches(results);
      setMatching(false);
    }, 2000);
  };

  return (
    <AuthGuard>
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
          Smart Buyer-Seller Matching
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Tell our AI what you're looking for, and we'll instantly scan thousands of verified listings to find your perfect device.
        </p>
      </div>

      {step < 4 ? (
        <div className="glass-panel p-8 max-w-2xl mx-auto relative overflow-hidden">
          {/* Progress Bar */}
          <div className="flex mb-8 items-center justify-center">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`h-1 w-16 mx-2 rounded ${step > i ? 'bg-blue-600' : 'bg-slate-800'}`}></div>
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">What's your primary use case?</h2>
              <div className="grid grid-cols-2 gap-4">
                {['Gaming', 'Photography', 'Business / Work', 'Everyday Use'].map(use => (
                  <button
                    key={use}
                    onClick={() => { setPreferences({...preferences, primaryUse: use}); setStep(2); }}
                    className="p-6 glass-panel hover:border-blue-500 hover:bg-blue-500/10 transition-all text-slate-300 font-medium group"
                  >
                    {use}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">What is your maximum budget?</h2>
              <div className="mb-8">
                <div className="text-4xl font-bold text-blue-400 mb-6">{formatPrice(preferences.budget)}</div>
                <input 
                  type="range" 
                  min="2000000" 
                  max="30000000" 
                  step="500000"
                  value={preferences.budget}
                  onChange={(e) => setPreferences({...preferences, budget: parseInt(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">Next Step</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">Brand Preference?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {['Any', 'Apple', 'Samsung', 'Google'].map(brand => (
                  <button
                    key={brand}
                    onClick={() => setPreferences({...preferences, brandPreference: brand})}
                    className={`p-4 rounded-xl border transition-all font-medium ${preferences.brandPreference === brand ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-slate-700 text-slate-400 hover:border-slate-500 bg-slate-800/50'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white">← Back</button>
                <button onClick={handleMatch} className="btn-primary flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Find My Match
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          {matching ? (
            <div className="glass-panel p-16 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-6 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
              <h3 className="text-2xl font-medium text-purple-400 mb-2">Analyzing AI Listings...</h3>
              <p className="text-slate-400">Matching your profile against available inventory and seller reputation scores.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">Top AI Recommendations</h2>
                <button onClick={() => setStep(1)} className="text-sm text-blue-400 hover:underline">Start Over</button>
              </div>
              
              {matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map(device => (
                    <div key={device.id} className="relative">
                      {/* Highlight first match as best */}
                      {device === matches[0] && (
                        <div className="absolute -top-3 -right-3 z-30 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-purple-400 animate-pulse">
                          99% Match
                        </div>
                      )}
                      <DeviceCard device={device} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center">
                  <p className="text-xl text-white mb-2">No exact matches found in your budget.</p>
                  <button onClick={() => setStep(2)} className="btn-primary mt-4">Increase Budget</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
