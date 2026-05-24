'use client';
import { useState, useEffect } from 'react';
import { tradeInPrices } from '@/data/dummyDevices';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { apiFetch } from '@/lib/api-client';

function TradeInCard({ device, onNego }) {
  const router = useRouter();
  const { user } = useAuth();
  const handleBuy = (device) => { 
    if (user && user.email === device.seller?.id) {
      alert("Anda tidak bisa membeli produk Anda sendiri.");
      return;
    }
    router.push(`/product/${device.id}`); 
  };

  return (
    <div className="glass-panel p-6 flex flex-col hover:border-purple-500/50 transition-all h-full group relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full z-10 tracking-widest">
        USED
      </div>
      <div className="h-48 mb-6 overflow-hidden rounded-2xl bg-slate-900 relative border border-white/5">
        <img src={device.image} alt={device.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      </div>
      <div className="flex-grow">
        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">{device.brand}</p>
        <h3 className="text-xl font-bold text-white leading-tight mb-2 group-hover:text-purple-400 transition-colors">{device.name}</h3>
        <p className="text-2xl font-black text-white mb-4">{formatPrice(device.price)}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 bg-slate-900 text-slate-400 text-[10px] font-black rounded-lg border border-white/5">{device.storage}</span>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded-lg border border-purple-500/20">{device.condition}</span>
        </div>
      </div>
      <div className="pt-6 border-t border-white/5 flex gap-3">
        {device.stock === 0 ? (
          <button disabled className="w-full py-3 bg-slate-900 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl cursor-not-allowed">Sold Out</button>
        ) : (
          <>
            <button onClick={() => handleBuy(device)} className="flex-1 btn-primary !py-3 !text-[10px] font-black uppercase tracking-widest">Buy</button>
            <button onClick={() => onNego(device)} className="flex-1 py-3 bg-slate-900 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/5 transition-all">Nego</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TradeInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-white">Loading Hub...</div>}>
      <TradeInContent />
    </Suspense>
  );
}

function TradeInContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'catalog';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tradeInDevices, setTradeInDevices] = useState([]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ device: '', condition: 'Good', ram: '8GB', storage: '256GB', description: '' });
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [offer, setOffer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setTradeInDevices((data.devices || []).filter((device) => device.isTradeIn)))
      .catch((error) => console.error('Failed to load trade-in devices', error));
  }, [activeTab, step]);

  const calculateOffer = async (e) => {
    e.preventDefault();
    if (!formData.device || !formData.condition) return;
    
    setLoadingAI(true);
    try {
      const deviceName = formData.device === 'Custom Phone' ? customDeviceName : formData.device;
      const res = await fetch('/api/price-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: deviceName,
          brand: deviceName.includes('iPhone') ? 'Apple' : 'Device',
          condition: formData.condition,
          storage: formData.storage
        })
      });
      const data = await res.json();
      if (data.price) {
        setOffer(data.price);
        setStep(2);
      } else {
        throw new Error('AI valuation failed');
      }
    } catch (err) {
      console.error(err);
      alert("AI Valuation currently unavailable. Using basic estimation.");
      let baseValue = tradeInPrices[formData.device] || 3000000; 
      if (formData.condition === 'Perfect') baseValue *= 1.2;
      setOffer(Math.round(baseValue));
      setStep(2);
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    let imageUrl = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800'; 
    const fileInput = e.target.elements.imageFile;
    if (fileInput && fileInput.files[0]) {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error("Upload failed", err); }
      setUploading(false);
    }
    let deviceName = formData.device === 'Custom Phone' ? customDeviceName : formData.device;
    let brand = 'Other';
    if (deviceName.includes('iPhone')) brand = 'Apple';
    await apiFetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'used_' + Date.now(),
        name: deviceName,
        brand,
        category: 'Used Device',
        price: offer,
        stock: 1,
        condition: formData.condition,
        ram: formData.ram,
        storage: formData.storage,
        chipset: 'Used',
        description: formData.description,
        image: imageUrl,
        sellerEmail: user.email,
        verifiedByTrustX: false,
        isTradeIn: true,
      }),
    });
    setStep(3);
  };

  const handleNego = (device) => {
    if (!user) { router.push('/login'); return; }
    if (!device.seller?.id) {
      alert('Seller data is not available for this device.');
      return;
    }
    if (device.seller.id === user.email) { alert("Cannot negotiate with yourself."); return; }
    window.dispatchEvent(new CustomEvent('openChat', { detail: { id: device.seller.id, name: device.seller.name || 'Seller' } }));
  };

  return (
    <div className="min-h-screen pb-20 pt-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
           <h1 className="text-5xl font-black text-white tracking-tighter">TRADE-IN <span className="text-purple-500">HUB</span></h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Premium Second-Hand Marketplace & AI Valuation</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="glass-panel p-1.5 flex gap-1 rounded-2xl w-full max-w-md mx-auto">
            {['catalog', 'sell'].map(t => (
              <button key={t} onClick={() => { setActiveTab(t); setStep(1); }} className={`flex-1 px-4 sm:px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}>
                {t === 'catalog' ? 'Browse used' : 'Sell your device'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
             {tradeInDevices.length > 0 ? tradeInDevices.map(d => <TradeInCard key={d.id} device={d} onNego={handleNego} />) : (
               <div className="col-span-full py-32 text-center glass-panel">
                  <h3 className="text-2xl font-black text-slate-700 mb-2 uppercase tracking-widest">Market is Empty</h3>
                  <p className="text-slate-500 text-sm">Be the first to list a device!</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
             {step === 1 && (
               <div className="glass-panel p-10">
                  <h2 className="text-3xl font-black text-white mb-10 tracking-tight">AI Valuation Engine</h2>
                  <form onSubmit={calculateOffer} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Model</label>
                           <select className="input-field appearance-none cursor-pointer" value={formData.device} onChange={(e) => setFormData({...formData, device: e.target.value})} required>
                              <option value="">Select device model...</option>
                              {Object.keys(tradeInPrices).map(d => <option key={d} value={d}>{d}</option>)}
                              <option value="Custom Phone">Other / Not Listed</option>
                           </select>
                        </div>
                        {formData.device === 'Custom Phone' && (
                          <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Model Name</label>
                             <input type="text" required placeholder="e.g. Sony Xperia 1 V" className="input-field" value={customDeviceName} onChange={e => setCustomDeviceName(e.target.value)} />
                          </div>
                        )}
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Condition</label>
                           <select className="input-field appearance-none cursor-pointer" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                              <option>Perfect</option><option>Good</option><option>Cracked</option><option>Not Working</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Storage</label>
                           <select className="input-field appearance-none cursor-pointer" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})}>
                              <option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option>
                           </select>
                        </div>
                     </div>
                      <button type="submit" disabled={!formData.device || loadingAI} className="w-full btn-primary !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20">
                        {loadingAI ? (
                           <div className="flex items-center justify-center gap-3">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>AI is analyzing market...</span>
                           </div>
                        ) : 'Get AI Estimate'}
                      </button>
                  </form>
               </div>
             )}

             {step === 2 && (
               <div className="glass-panel p-10 animate-fade-in">
                  <div className="text-center mb-12">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Estimated Value</p>
                     <h3 className="text-5xl font-black text-white">{formatPrice(offer)}</h3>
                  </div>
                  <form onSubmit={handlePublish} className="space-y-8">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Asking Price (IDR)</label>
                        <input type="number" required className="input-field !text-2xl font-black text-emerald-400" value={offer} onChange={e => setOffer(Number(e.target.value))} />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Product Photo</label>
                        <input type="file" name="imageFile" accept="image/*" required className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Description</label>
                        <textarea required rows="4" className="input-field !py-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Mention BH, scratches, and box availability..."></textarea>
                     </div>
                     <button type="submit" disabled={uploading} className="w-full btn-primary !bg-purple-600 !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-purple-500/20">
                        {uploading ? 'Uploading...' : 'Publish to Catalog'}
                     </button>
                  </form>
               </div>
             )}

             {step === 3 && (
               <div className="glass-panel p-16 text-center animate-fade-in">
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Listing Published</h2>
                  <p className="text-slate-500 mb-10 font-medium">Your device is now live in the Trade-In Catalog.</p>
                  <button onClick={() => { setStep(1); setActiveTab('catalog'); }} className="btn-primary !px-12">View Catalog</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
