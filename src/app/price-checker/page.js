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

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!formData.model) return;
    
    setAnalyzing(true);
    setResult(null);
    
    // Simulate AI processing time
    setTimeout(() => {
      // Mock calculation based on specs
      let basePrice = formData.brand === 'Apple' ? 10000000 : 7000000;
      if (formData.ram === '16GB' || formData.ram === '12GB') basePrice += 2500000;
      if (formData.storage === '512GB') basePrice += 2000000;
      if (formData.storage === '1TB') basePrice += 4000000;
      
      let conditionMultiplier = 1;
      if (formData.condition === 'Excellent') conditionMultiplier = 1.2;
      if (formData.condition === 'Fair') conditionMultiplier = 0.8;
      
      const finalPrice = Math.round(basePrice * conditionMultiplier);
      
      setResult({
        estimatedPrice: finalPrice,
        priceRange: [Math.round(finalPrice * 0.9), Math.round(finalPrice * 1.1)],
        confidence: 92,
        marketDemand: 'High'
      });
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <AuthGuard>
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Smart Price Checker</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Our AI system analyzes real-time market data across thousands of listings to give you the most accurate valuation for your device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="glass-panel p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Device Specifications</h2>
          <form onSubmit={handleAnalyze} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
              <select 
                className="input-field appearance-none"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
              >
                <option>Apple</option>
                <option>Samsung</option>
                <option>Google</option>
                <option>Xiaomi</option>
                <option>Oppo</option>
                <option>Vivo</option>
                <option>Realme</option>
                <option>Asus</option>
                <option>Infinix</option>
                <option>Poco</option>
                <option>OnePlus</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Model Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. iPhone 14 Pro"
                className="input-field"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">RAM</label>
                <select className="input-field appearance-none" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})}>
                  <option>4GB</option>
                  <option>6GB</option>
                  <option>8GB</option>
                  <option>12GB</option>
                  <option>16GB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Storage</label>
                <select className="input-field appearance-none" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})}>
                  <option>64GB</option>
                  <option>128GB</option>
                  <option>256GB</option>
                  <option>512GB</option>
                  <option>1TB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Condition</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Brand New', 'Like New', 'Excellent', 'Good', 'Fair', 'Cracked', 'Not Working'].map(cond => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setFormData({...formData, condition: cond})}
                    className={`py-2 px-1 text-xs rounded-lg border transition-all ${formData.condition === cond ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={analyzing} className="btn-primary w-full mt-6 flex justify-center items-center">
              {analyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Market...
                </>
              ) : 'Analyze Market Price'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-center">
          {analyzing ? (
            <div className="glass-panel p-8 text-center h-full flex flex-col justify-center items-center animate-pulse">
              <div className="w-16 h-16 mb-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <h3 className="text-xl font-medium text-blue-400 mb-2">AI is analyzing listings...</h3>
              <p className="text-slate-400 text-sm">Comparing against recent transactions</p>
            </div>
          ) : result ? (
            <div className="glass-panel p-8 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
              
              <h3 className="text-lg font-medium text-slate-300 mb-1">Recommended Price</h3>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mb-2">
                {formatPrice(result.estimatedPrice)}
              </div>
              <p className="text-sm text-slate-400 mb-8">Expected Range: {formatPrice(result.priceRange[0])} - {formatPrice(result.priceRange[1])}</p>

              <div className="space-y-4 mb-8 flex-grow">
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    AI Confidence Score
                  </span>
                  <span className="font-semibold text-emerald-400">{result.confidence}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-300 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Market Demand
                  </span>
                  <span className="font-semibold text-blue-400">{result.marketDemand}</span>
                </div>
              </div>

              <button onClick={() => router.push('/trade-in')} className="btn-secondary w-full group relative overflow-hidden">
                <span className="relative z-10">List Device at this Price</span>
                <div className="absolute inset-0 h-full w-0 bg-blue-600 transition-all duration-300 ease-out group-hover:w-full z-0"></div>
              </button>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center h-full flex flex-col justify-center items-center opacity-50">
              <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              <h3 className="text-xl font-medium text-slate-300 mb-2">Waiting for Input</h3>
              <p className="text-slate-400 text-sm">Fill out the specifications on the left to see the AI recommended price.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
