'use client';
import { useState, useEffect } from 'react';
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
    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setDevices(data.devices || []))
      .catch((error) => console.error('Failed to load matching devices', error));
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
    }, 3000);
  };

  return (
    <div className="min-h-screen pb-24 relative">
       {/* Ambient Glows */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px] animate-pulse"></div>
       </div>

      <div className="max-w-5xl mx-auto px-4 pt-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 glow-text tracking-tight">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Match AI</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Stop scrolling. Start matching. Our neural engine finds the perfect device based on your specific lifestyle and budget constraints.
          </p>
        </div>

        {step < 4 ? (
          <div className="max-w-3xl mx-auto relative">
            <div className="glass-panel p-1 md:p-1 overflow-hidden">
               <div className="p-8 md:p-12 bg-slate-950/60 rounded-[calc(1.5rem-4px)]">
                  {/* Premium Stepper */}
                  <div className="flex mb-12 items-center justify-center gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= i ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}>
                          {i === 1 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                          {i === 2 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                          {i === 3 && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"></path></svg>}
                        </div>
                        {i < 3 && (
                          <div className={`h-[2px] w-12 rounded transition-all duration-700 mx-2 ${step > i ? 'bg-purple-600' : 'bg-slate-800'}`}></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {step === 1 && (
                    <div className="animate-fade-in text-center">
                      <h2 className="text-3xl font-black text-white mb-8 tracking-tight">How will you use it?</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Creative Pro', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                          { label: 'Hardcore Gaming', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
                          { label: 'Productivity', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                          { label: 'Daily Lifestyle', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
                        ].map(use => (
                          <button
                            key={use.label}
                            onClick={() => { setPreferences({...preferences, primaryUse: use.label}); setStep(2); }}
                            className="p-8 glass-panel border-white/5 hover:border-purple-500/50 hover:bg-purple-600/5 transition-all text-left group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:bg-purple-600/20 group-hover:border-purple-500/30 transition-all">
                               <svg className="w-6 h-6 text-slate-500 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={use.icon}></path></svg>
                            </div>
                            <div className="text-white font-bold text-lg">{use.label}</div>
                            <p className="text-slate-500 text-xs mt-1">Optimized for performance</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="animate-fade-in text-center">
                      <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Set your budget</h2>
                      <p className="text-slate-500 mb-10">We'll find the best performance-to-price ratio within this cap.</p>
                      <div className="mb-12">
                        <div className="text-6xl font-black text-white mb-10 glow-text">{formatPrice(preferences.budget)}</div>
                        <div className="px-6">
                           <input 
                            type="range" 
                            min="2000000" 
                            max="30000000" 
                            step="500000"
                            value={preferences.budget}
                            onChange={(e) => setPreferences({...preferences, budget: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <div className="flex justify-between mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                             <span>2M IDR</span>
                             <span>30M IDR</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-900 transition-all">Back</button>
                        <button onClick={() => setStep(3)} className="btn-primary !bg-purple-600 !from-purple-600 !to-indigo-600">Continue</button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="animate-fade-in text-center">
                      <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Preferred Eco-system?</h2>
                      <p className="text-slate-500 mb-10">Select a specific brand or let our AI choose the best available.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
                        {['Any', 'Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Other'].map(brand => (
                          <button
                            key={brand}
                            onClick={() => setPreferences({...preferences, brandPreference: brand})}
                            className={`p-6 rounded-2xl border transition-all font-bold ${preferences.brandPreference === brand ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-slate-800 text-slate-500 hover:border-slate-700 bg-slate-900/50'}`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between mt-8">
                        <button onClick={() => setStep(2)} className="px-8 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-900 transition-all">Back</button>
                        <button onClick={handleMatch} className="btn-primary !bg-purple-600 !from-purple-600 !to-indigo-600 flex items-center gap-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          Find My Perfect Match
                        </button>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {matching ? (
              <div className="glass-panel p-20 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
                <div className="relative mb-10">
                   <div className="w-32 h-32 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-purple-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                   </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Finding Matches...</h3>
                <p className="text-slate-400">Comparing your profile against 2,400+ active verified listings.</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-end mb-12 px-4">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-1">AI Recommendations</h2>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Ranked by performance score</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest border-b border-purple-400/30 pb-1">Reset Profile</button>
                </div>
                
                {matches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {matches.map((device, idx) => (
                      <div key={device.id} className="relative animate-fade-in" style={{animationDelay: `${idx * 150}ms`}}>
                        {idx === 0 && (
                          <div className="absolute -top-4 -right-4 z-30 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl border border-white/20">
                            The Alpha Match
                          </div>
                        )}
                        <DeviceCard device={device} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel p-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-8 border border-slate-800">
                       <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4">No exact matches found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mb-10">We couldn't find a device within your budget and preferences. Try adjusting your constraints.</p>
                    <button onClick={() => setStep(2)} className="btn-primary !px-10">Increase Budget</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
