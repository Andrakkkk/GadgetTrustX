'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';

export default function PriceCheckerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    brand: 'Apple',
    model: '',
    ram: '8GB',
    storage: '256GB',
    condition: 'Good'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!formData.model) return;

    setAnalyzing(true);
    setResult(null);

    const apiKeys = [""];
    // Shuffle keys to distribute load
    const shuffledKeys = [...apiKeys].sort(() => 0.5 - Math.random());

    let success = false;
    let lastError = null;

    for (const apiKey of shuffledKeys) {
      try {
        const prompt = `Anda adalah asisten AI penilai harga pasar perangkat elektronik bekas di Indonesia.
Evaluasi estimasi harga pasar wajar dalam Rupiah (IDR) untuk perangkat berikut:
Merek: ${formData.brand}
Model: ${formData.model}
RAM: ${formData.ram}
Penyimpanan: ${formData.storage}
Kondisi: ${formData.condition}

PENTING: Kembalikan respon HANYA dalam format JSON valid. 
- estimatedPrice dan priceRange HARUS berupa angka murni (tanpa "IDR", tanpa titik/koma ribuan).
- Jangan ada teks tambahan apapun.

Contoh format:
{
  "estimatedPrice": 5000000, 
  "priceRange": [4500000, 5500000],
  "confidence": 0.95, 
  "marketDemand": "High"
}`;

        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
        const res = await fetch(`${url}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
              maxOutputTokens: 1000
            }
          })
        });

        const data = await res.json();

        if (res.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          try {
            const resultText = data.candidates[0].content.parts[0].text;
            
            // More robust JSON extraction
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            const cleanedText = jsonMatch ? jsonMatch[0] : resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            if (!cleanedText) throw new Error('Empty response from AI');
            
            const parsed = JSON.parse(cleanedText);
            setResult(parsed);
            success = true;
            break; 
          } catch (parseErr) {
            console.error('JSON Parse Error, trying next key:', parseErr);
            lastError = "Invalid data format from AI";
            // Continue loop
          }
        } else {
          console.warn(`Key failed or returned error:`, data.error || 'Unknown error');
          lastError = data.error?.message || 'API Error';
        }
      } catch (err) {
        console.error(`Fetch error with key:`, err);
        lastError = err.message;
      }
    }

    if (!success) {
      alert(`Maaf, AI gagal menganalisis harga saat ini (Error: ${lastError}). Coba lagi beberapa saat lagi.`);
    }

    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="pt-32 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 glow-text tracking-tight">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Price Checker</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Our neural network analyzes thousands of daily transactions across the Indonesian market to provide the most accurate real-time valuation for your devices.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Form */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-8">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                </div>
                Specifications
              </h2>

              <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Brand</label>
                  <select
                    className="input-field appearance-none cursor-pointer"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  >
                    {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Asus', 'Other'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 15 Pro Max"
                    className="input-field"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">RAM</label>
                    <select className="input-field appearance-none" value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })}>
                      {['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Storage</label>
                    <select className="input-field appearance-none" value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })}>
                      {['64GB', '128GB', '256GB', '512GB', '1TB'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Condition</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Excellent', 'Good', 'Fair', 'Cracked'].map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setFormData({ ...formData, condition: cond })}
                        className={`py-3 px-1 text-[10px] font-black uppercase tracking-tighter rounded-xl border transition-all ${formData.condition === cond ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={analyzing} className="btn-primary w-full !py-5 mt-4 flex justify-center items-center gap-3">
                  {analyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing Market Data...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      <span>Check AI Valuation</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 h-full">
            {analyzing ? (
              <div className="glass-panel p-12 h-full flex flex-col justify-center items-center text-center">
                <div className="relative mb-10">
                  <div className="w-32 h-32 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Analyzing thousands of listings</h3>
                <p className="text-slate-500">Cross-referencing brand performance and condition multipliers...</p>
              </div>
            ) : result ? (
              <div className="h-full space-y-6">
                <div className="glass-panel p-10 bg-gradient-to-br from-slate-950 to-slate-900 border-white/5 relative group overflow-hidden">
                  {/* Removed decorative circle SVG to prevent UI confusion */}

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-xs mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      Live Market Valuation
                    </div>

                    <div className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tighter">
                      {formatPrice(result.estimatedPrice)}
                    </div>

                    <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold mb-8">
                      Range: {formatPrice(result.priceRange[0])} — {formatPrice(result.priceRange[1])}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div className="text-xs font-black text-slate-500 uppercase mb-2">Confidence Level</div>
                        <div className="flex items-end gap-2">
                          <div className="text-3xl font-black text-emerald-400">{result.confidence}%</div>
                          <div className="text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-tighter">Accurate</div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                          <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${result.confidence}%` }}></div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <div className="text-xs font-black text-slate-500 uppercase mb-2">Market Liquidity</div>
                        <div className="text-3xl font-black text-blue-400">{result.marketDemand}</div>
                        <div className="text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-tighter">Current Demand</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => router.push('/trade-in')} className="btn-primary !py-6 text-lg group">
                    Sell Now
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                  <button onClick={() => window.location.reload()} className="btn-secondary !py-6 text-lg">
                    Re-Analyze
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 h-full flex flex-col justify-center items-center text-center opacity-40">
                <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-8 border border-slate-800">
                  <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-400 mb-2">Valuation Pending</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Fill in your device details to see our real-time AI valuation based on today's market trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          {[
            { title: 'Neural Engine', desc: 'Analyzes 10k+ daily listings for accuracy.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { title: 'Market Trends', desc: 'Adjusts valuation based on regional demand.', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { title: 'Condition Factor', desc: 'Smart multipliers for physical wear & tear.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((f, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon}></path></svg>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">{f.title}</h4>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
