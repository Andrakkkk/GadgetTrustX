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
  const [sortBy, setSortBy] = useState('score'); // 'score', 'price_asc', 'price_desc'
  const [isRestored, setIsRestored] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('smart_match_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.step) setStep(parsed.step);
          if (parsed.preferences) setPreferences(parsed.preferences);
          if (Array.isArray(parsed.matches)) setMatches(parsed.matches);
          if (parsed.sortBy) setSortBy(parsed.sortBy);
        }
      } catch (e) {
        console.error('Failed to restore smart_match_state:', e);
      } finally {
        setIsRestored(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save state to localStorage on update
  useEffect(() => {
    if (!isRestored) return;
    try {
      localStorage.setItem('smart_match_state', JSON.stringify({
        step,
        preferences,
        matches,
        sortBy
      }));
    } catch (e) {
      console.error('Failed to save smart_match_state:', e);
    }
  }, [step, preferences, matches, sortBy, isRestored]);

  useEffect(() => {
    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setDevices(data.devices || []))
      .catch((error) => console.error('Failed to load matching devices', error));
  }, []);

  const handleMatch = async () => {
    setMatching(true);
    setStep(4); 
    
    try {
      const res = await fetch('/api/smart-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          devices
        })
      });

      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
      } else {
        // Fallback filter
        let results = devices.map(d => ({
          ...d,
          matchScore: d.price <= preferences.budget ? 90 : 60,
          aiTag: 'Rekomendasi AI',
          aiReasoning: `Perangkat ${d.name} cocok untuk ${preferences.primaryUse || 'kebutuhan harian'} dengan spesifikasi ${d.ram || ''} ${d.storage || ''}.`
        }));
        setMatches(results);
      }
    } catch (err) {
      console.error('Smart match fetch failed:', err);
    } finally {
      setMatching(false);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem('smart_match_state');
    } catch (e) {}
    setPreferences({
      budget: 15000000,
      primaryUse: '',
      brandPreference: 'Any'
    });
    setMatches([]);
    setStep(1);
  };

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return (b.matchScore || 0) - (a.matchScore || 0);
  });

  return (
    <div className="min-h-screen pb-24 relative">
       {/* Ambient Glows */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px] animate-pulse"></div>
       </div>

      <div className="max-w-6xl mx-auto px-4 pt-24 sm:pt-32">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 glow-text tracking-tight">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Match AI Engine</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-lg leading-relaxed">
            AI kami menganalisis spesifikasi fisik, chipset, memory, dan tren harga pasar untuk memberikan rekomendasi gadget paling presisi sesuai kebutuhan Anda.
          </p>
        </div>

        {step < 4 ? (
          <div className="max-w-3xl mx-auto relative">
            <div className="glass-panel p-4 sm:p-8 md:p-12">
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
                      <h2 className="text-xl sm:text-3xl font-black text-white mb-4 sm:mb-8 tracking-tight">Untuk kebutuhan utama apa?</h2>
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                        {[
                          { label: 'Creative Pro', desc: 'Editing video, foto, desain grafis & render', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                          { label: 'Hardcore Gaming', desc: 'Game AAA, 60+ FPS, thermal cooling & chipset flagship', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
                          { label: 'Productivity', desc: 'Multitasking, dokumen, bisnis & daya tahan baterai', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                          { label: 'Daily Lifestyle', desc: 'Sosmed, kamera jernih, hiburan & efisiensi budget', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
                        ].map(use => (
                          <button
                            key={use.label}
                            onClick={() => { setPreferences({...preferences, primaryUse: use.label}); setStep(2); }}
                            className={`p-3.5 sm:p-8 glass-panel border-white/5 hover:border-purple-500/50 hover:bg-purple-600/5 transition-all text-left group rounded-2xl flex flex-col justify-between ${preferences.primaryUse === use.label ? 'border-purple-500 bg-purple-600/10' : ''}`}
                          >
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-2 sm:mb-4 group-hover:bg-purple-600/20 group-hover:border-purple-500/30 transition-all flex-shrink-0">
                               <svg className="w-4 h-4 sm:w-6 sm:h-6 text-slate-500 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={use.icon}></path></svg>
                            </div>
                            <div>
                              <div className="text-white font-bold text-xs sm:text-lg leading-tight">{use.label}</div>
                              <p className="text-slate-400 text-[9px] sm:text-xs mt-1 leading-normal line-clamp-2">{use.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="animate-fade-in text-center">
                      <h2 className="text-xl sm:text-3xl font-black text-white mb-2 sm:mb-4 tracking-tight">Batas Budget Maksimal</h2>
                      <p className="text-slate-500 text-xs sm:text-base mb-6 sm:mb-10">AI akan mencari rasio spesifikasi, performa, dan harga terbaik dalam batas ini.</p>
                      <div className="mb-8 sm:mb-12">
                        <div className="text-2xl sm:text-6xl font-black text-white mb-4 sm:mb-10 glow-text">{formatPrice(preferences.budget)}</div>
                        <div className="px-4 sm:px-6">
                           <input 
                            type="range" 
                            min="2000000" 
                            max="35000000" 
                            step="500000"
                            value={preferences.budget}
                            onChange={(e) => setPreferences({...preferences, budget: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <div className="flex justify-between mt-3 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                             <span>2M IDR</span>
                             <span>18M IDR</span>
                             <span>35M IDR</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between gap-3">
                        <button onClick={() => setStep(1)} className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-xs sm:text-base hover:bg-slate-900 transition-all">Kembali</button>
                        <button onClick={() => setStep(3)} className="btn-primary !bg-purple-600 !from-purple-600 !to-indigo-600 !px-6 !py-2.5 text-xs sm:text-base">Lanjut</button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="animate-fade-in text-center">
                      <h2 className="text-xl sm:text-3xl font-black text-white mb-2 sm:mb-4 tracking-tight">Preferensi Brand / Ekosistem</h2>
                      <p className="text-slate-500 text-xs sm:text-base mb-6 sm:mb-10">Pilih brand spesifik atau pilih &quot;Any&quot; agar AI membandingkan seluruh ekosistem gadget.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-8 sm:mb-12">
                        {['Any', 'Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Asus', 'Other'].map(brand => (
                          <button
                            key={brand}
                            onClick={() => setPreferences({...preferences, brandPreference: brand})}
                            className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl border transition-all font-bold text-xs sm:text-sm ${preferences.brandPreference === brand ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-slate-800 text-slate-500 hover:border-slate-700 bg-slate-900/50'}`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between gap-3">
                        <button onClick={() => setStep(2)} className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-xs sm:text-base hover:bg-slate-900 transition-all">Kembali</button>
                        <button onClick={handleMatch} className="btn-primary !bg-purple-600 !from-purple-600 !to-indigo-600 flex items-center gap-2 text-xs sm:text-base !px-6 !py-2.5">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          Jalankan AI Matching
                        </button>
                      </div>
                    </div>
                  )}
               </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {matching ? (
              <div className="glass-panel p-20 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
                <div className="relative mb-10">
                   <div className="w-32 h-32 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-purple-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                   </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Gemini AI Sedang Menganalisis...</h3>
                <p className="text-slate-400">Mengevaluasi hardware, rasio performa-harga, dan rekomendasi khusus untuk <span className="text-purple-400 font-bold">{preferences.primaryUse}</span>.</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 px-4 gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 mb-2">
                       <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                       Hasil Analisis AI Matched
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1">Rekomendasi Perangkat Terbaik</h2>
                    <p className="text-slate-500 font-medium text-xs">Diurutkan berdasarkan skor kecocokan spesifikasi & budget</p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      <option value="score">Urutkan: Skor AI Tertinggi</option>
                      <option value="price_asc">Urutkan: Harga Terendah</option>
                      <option value="price_desc">Urutkan: Harga Tertinggi</option>
                    </select>

                    <button onClick={handleReset} className="text-xs font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest border-b border-purple-400/30 pb-1 flex-shrink-0">
                      Reset Profil / Analisis Baru
                    </button>
                  </div>
                </div>
                
                {sortedMatches.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8">
                    {sortedMatches.map((device, idx) => (
                      <div key={device.id} className="relative animate-fade-in flex flex-col" style={{animationDelay: `${idx * 150}ms`}}>
                        {/* Match Score Badge */}
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-xs font-black">
                              {device.matchScore || 85}%
                            </span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {device.aiTag || 'Match Teratas'}
                            </span>
                          </div>
                          {idx === 0 && (
                            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                              Top Match AI
                            </span>
                          )}
                        </div>

                        {/* Device Card */}
                        <DeviceCard device={device} />

                        {/* AI Insight Box */}
                        {device.aiReasoning && (
                          <div className="mt-3 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
                             <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                <span>Alasan Rekomendasi AI:</span>
                             </div>
                             <p className="leading-relaxed text-slate-300 text-[11px]">{device.aiReasoning}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel p-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-8 border border-slate-800">
                       <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4">Belum ada match yang pas</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mb-10">Kami belum menemukan perangkat yang sesuai budget dan preferensi. Coba ubah batasannya.</p>
                    <button onClick={() => setStep(2)} className="btn-primary !px-10">Naikkan Budget</button>
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
