'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tradeInPrices } from '@/data/dummyDevices';
import { formatPrice } from '@/utils/formatPrice';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api-client';
import TradeInCard from '@/components/trade-in/TradeInCard';
import TradeInDetailModal from '@/components/trade-in/TradeInDetailModal';
import TradeInPhotoModal from '@/components/trade-in/TradeInPhotoModal';

export default function TradeInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-white">Memuat Hub...</div>}>
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
  const [formData, setFormData] = useState({ device: '', condition: 'Good', ram: '8GB', storage: '256GB', batteryHealth: 90, description: '' });
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [offer, setOffer] = useState(null);
  const [aiValuation, setAiValuation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Photo Upload State: Main Photo (Required) + Condition Photos (Optional max 6)
  const [mainProductPhoto, setMainProductPhoto] = useState(null); // File
  const [mainProductPreview, setMainProductPreview] = useState(null); // URL

  const PHOTO_SLOTS = [
    { key: 'front',  label: 'Bagian Depan' },
    { key: 'back',   label: 'Bagian Belakang' },
    { key: 'screen', label: 'Kondisi Layar' },
    { key: 'side',   label: 'Bagian Samping' },
    { key: 'box',    label: 'Dus & Charger' },
    { key: 'detail', label: 'Cacat / Gores' },
  ];
  const [conditionPhotos, setConditionPhotos] = useState({}); // { front: File, back: File, ... }
  const [conditionPreviews, setConditionPreviews] = useState({}); // { front: url, ... }

  // Modals state
  const [detailDeviceModal, setDetailDeviceModal] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Restore state from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('trade_in_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          if (parsed.step) setStep(parsed.step);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.customDeviceName) setCustomDeviceName(parsed.customDeviceName);
          if (parsed.offer) setOffer(parsed.offer);
          if (parsed.aiValuation) setAiValuation(parsed.aiValuation);
        }
      } catch (e) {
        console.error('Failed to restore trade_in_state:', e);
      } finally {
        setIsRestored(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (!isRestored) return;
    try {
      localStorage.setItem('trade_in_state', JSON.stringify({
        activeTab,
        step,
        formData,
        customDeviceName,
        offer,
        aiValuation
      }));
    } catch (e) {
      console.error('Failed to save trade_in_state:', e);
    }
  }, [activeTab, step, formData, customDeviceName, offer, aiValuation, isRestored]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const tab = searchParams.get('tab');
      if (tab) setActiveTab(tab);
    }, 0);
    return () => clearTimeout(timer);
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
    const deviceName = formData.device === 'Custom Phone' ? customDeviceName : formData.device;
    let brand = 'Other';
    if (deviceName.toLowerCase().includes('iphone')) brand = 'Apple';
    else if (deviceName.toLowerCase().includes('samsung') || deviceName.toLowerCase().includes('galaxy')) brand = 'Samsung';
    else if (deviceName.toLowerCase().includes('pixel')) brand = 'Google';
    else if (deviceName.toLowerCase().includes('xiaomi')) brand = 'Xiaomi';

    try {
      const res = await fetch('/api/price-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: deviceName,
          brand,
          condition: formData.condition,
          storage: formData.storage,
          ram: formData.ram
        })
      });
      const data = await res.json();
      if (data.price) {
        setOffer(data.price);
        setAiValuation(data);
        setStep(2);
      } else {
        throw new Error('AI valuation failed');
      }
    } catch (err) {
      console.error(err);
      let baseValue = tradeInPrices[formData.device] || 4500000; 
      if (formData.condition === 'Perfect') baseValue *= 1.15;
      setOffer(Math.round(baseValue));
      setAiValuation({
        confidence: 85,
        marketDemand: 'Moderate',
        reasoning: `Perkiraan AI pasar berdasarkan kondisi ${formData.condition} dan kapasitas ${formData.storage}.`
      });
      setStep(2);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleMainPhotoChange = (file) => {
    if (!file) return;
    setMainProductPhoto(file);
    setMainProductPreview(URL.createObjectURL(file));
  };

  const handleConditionPhotoChange = (key, file) => {
    if (!file) return;
    setConditionPhotos(prev => ({ ...prev, [key]: file }));
    const url = URL.createObjectURL(file);
    setConditionPreviews(prev => ({ ...prev, [key]: url }));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }

    setUploading(true);

    // 1. Upload foto utama (Required)
    let imageUrl = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800';
    if (mainProductPhoto) {
      try {
        const fd = new FormData();
        fd.append('file', mainProductPhoto);
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error("Upload main image failed", err); }
    }

    // 2. Upload foto kondisi opsional (Optional max 6)
    const uploadedConditionUrls = [];
    for (const slot of PHOTO_SLOTS) {
      const file = conditionPhotos[slot.key];
      if (file) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.url) uploadedConditionUrls.push(data.url);
        } catch (err) { console.error(`Upload ${slot.key} failed`, err); }
      }
    }
    setUploading(false);

    let deviceName = formData.device === 'Custom Phone' ? customDeviceName : formData.device;
    let brand = 'Other';
    if (deviceName.toLowerCase().includes('iphone')) brand = 'Apple';
    else if (deviceName.toLowerCase().includes('samsung')) brand = 'Samsung';
    else if (deviceName.toLowerCase().includes('pixel')) brand = 'Google';

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
        batteryHealth: formData.batteryHealth || 90,
        chipset: 'Used',
        description: formData.description,
        image: imageUrl,
        extraImages: uploadedConditionUrls,
        sellerEmail: user.email,
        verifiedByTrustX: false,
        isTradeIn: true,
      }),
    });

    try { localStorage.removeItem('trade_in_state'); } catch (e) {}
    setMainProductPhoto(null);
    setMainProductPreview(null);
    setConditionPhotos({});
    setConditionPreviews({});
    setStep(3);
  };

  const handleNego = (device) => {
    if (!user) { router.push('/login'); return; }
    if (!device.seller?.id) {
      alert('Data seller tidak tersedia untuk perangkat ini.');
      return;
    }
    if (device.seller.id === user.email) { alert("Anda tidak bisa nego dengan diri sendiri."); return; }
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: {
        id: device.seller.id,
        name: device.seller.name || 'Seller',
        product: {
          id: device.id,
          name: device.name,
          image: device.image,
          price: device.price,
          condition: device.condition,
          isBekas: true,
        },
      },
    }));
  };

  return (
    <div className="min-h-screen pb-12 sm:pb-20 pt-24 sm:pt-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
           <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">HP BEKAS <span className="text-purple-500">HUB</span></h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Marketplace bekas premium & estimasi Gemini AI</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="glass-panel p-1.5 flex gap-1 rounded-2xl w-full max-w-md mx-auto">
            {['catalog', 'sell'].map(t => (
              <button key={t} onClick={() => { setActiveTab(t); setStep(1); }} className={`flex-1 px-4 sm:px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}>
                {t === 'catalog' ? 'Lihat barang bekas' : 'Jual perangkat'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'catalog' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 animate-fade-in">
             {tradeInDevices.length > 0 ? tradeInDevices.map(d => (
               <TradeInCard key={d.id} device={d} onNego={handleNego} onOpenDetail={(device) => setDetailDeviceModal(device)} />
             )) : (
               <div className="col-span-full py-32 text-center glass-panel">
                  <h3 className="text-2xl font-black text-slate-700 mb-2 uppercase tracking-widest">Market Masih Kosong</h3>
                  <p className="text-slate-500 text-sm">Jadilah yang pertama memasang perangkat!</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
             {step === 1 && (
               <div className="glass-panel p-4 sm:p-10">
                  <h2 className="text-xl sm:text-3xl font-black text-white mb-2 sm:mb-6 tracking-tight">Gemini AI Valuation Engine</h2>
                  <p className="text-slate-400 text-xs mb-6 sm:mb-8">Isi rincian spesifikasi HP Bekas milik Anda untuk mendapatkan estimasi harga wajar AI secara live.</p>

                  <form onSubmit={calculateOffer} className="space-y-6 sm:space-y-8">
                     <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        <div className="col-span-2">
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Model Target</label>
                           <select className="input-field appearance-none cursor-pointer" value={formData.device} onChange={(e) => setFormData({...formData, device: e.target.value})} required>
                              <option value="">Pilih model perangkat...</option>
                              {Object.keys(tradeInPrices).map(d => <option key={d} value={d}>{d}</option>)}
                              <option value="Custom Phone">Lainnya / Tidak ada di daftar</option>
                           </select>
                        </div>
                        {formData.device === 'Custom Phone' && (
                          <div className="col-span-2">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Nama Model / Perangkat</label>
                             <input type="text" required placeholder="e.g. Sony Xperia 1 V" className="input-field" value={customDeviceName} onChange={e => setCustomDeviceName(e.target.value)} />
                          </div>
                        )}
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Kondisi Fisik</label>
                           <select className="input-field appearance-none cursor-pointer text-xs sm:text-sm" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                              <option>Brand New</option><option>Perfect</option><option>Good</option><option>Cracked</option><option>Not Working</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Kapasitas RAM</label>
                           <select className="input-field appearance-none cursor-pointer text-xs sm:text-sm" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})}>
                              <option>4GB</option><option>6GB</option><option>8GB</option><option>12GB</option><option>16GB</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Penyimpanan Storage</label>
                           <select className="input-field appearance-none cursor-pointer text-xs sm:text-sm" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})}>
                              <option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Battery Health (%)</label>
                           <input
                             type="number"
                             min="50"
                             max="100"
                             required
                             placeholder="e.g. 88"
                             className="input-field text-xs sm:text-sm"
                             value={formData.batteryHealth || ''}
                             onChange={e => setFormData({...formData, batteryHealth: parseInt(e.target.value) || 90})}
                           />
                        </div>
                     </div>
                      <button type="submit" disabled={!formData.device || loadingAI} className="w-full btn-primary !py-4 sm:!py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20">
                        {loadingAI ? (
                           <div className="flex items-center justify-center gap-3">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Gemini AI sedang menganalisis pasar...</span>
                           </div>
                        ) : 'Dapatkan Estimasi AI & Lanjut'}
                      </button>
                  </form>
               </div>
             )}

             {step === 2 && (
                <div className="glass-panel p-4 sm:p-10 animate-fade-in">
                   <div className="text-center mb-6 sm:mb-8">
                      <div className="inline-flex items-center gap-2 text-[10px] text-purple-400 font-black uppercase tracking-widest mb-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                         <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                         Estimasi Gemini AI Live
                      </div>
                      <h3 className="text-lg sm:text-3xl md:text-5xl font-black text-white glow-text break-all px-2">{formatPrice(offer)}</h3>
                   </div>

                   {aiValuation && (
                     <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                       <div>
                         <div className="text-[10px] uppercase font-black text-slate-500">Keyakinan AI</div>
                         <div className="text-sm sm:text-base font-bold text-emerald-400">{aiValuation.confidence || 90}%</div>
                       </div>
                       <div>
                         <div className="text-[10px] uppercase font-black text-slate-500">Likuiditas Pasar</div>
                         <div className="text-sm sm:text-base font-bold text-purple-400">{aiValuation.marketDemand || 'High'}</div>
                       </div>
                       <div className="col-span-2 sm:col-span-1">
                         <div className="text-[10px] uppercase font-black text-slate-500">Analisis Pasar</div>
                         <div className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2" title={aiValuation.reasoning}>{aiValuation.reasoning}</div>
                       </div>
                     </div>
                   )}

                   {/* Penjual Info Summary */}
                   {user && (
                     <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl bg-slate-900 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                       <div>
                         <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">Informasi Penjual</span>
                         <p className="font-bold text-white mt-0.5">{user.name} ({user.email})</p>
                       </div>
                       <span className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                         Buyer Terverifikasi
                       </span>
                     </div>
                   )}

                   <form onSubmit={handlePublish} className="space-y-6 sm:space-y-8">
                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">Harga Jual Yang Diinginkan (IDR)</label>
                         <input type="number" required className="input-field !text-lg sm:!text-2xl font-black text-emerald-400" value={offer} onChange={e => setOffer(Number(e.target.value))} />
                      </div>

                      {/* 1. FOTO PRODUK UTAMA (WAJIB) */}
                      <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-black text-white uppercase tracking-wider">
                              🖼️ Foto Produk Utama <span className="text-purple-400">*Wajib</span>
                            </label>
                            <p className="text-[10px] text-slate-400">Foto ini yang akan muncul sebagai sampul/thumbnail di katalog marketplace.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase tracking-widest">
                            Main Cover
                          </span>
                        </div>

                        <label
                          htmlFor="main-product-photo-input"
                          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden flex flex-col items-center justify-center p-6 text-center
                            ${mainProductPreview ? 'border-purple-500 bg-slate-900/60' : 'border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-400'}`}
                        >
                          {mainProductPreview ? (
                            <div className="flex items-center gap-4 w-full">
                              <img src={mainProductPreview} alt="Foto Utama" className="w-24 h-24 object-cover rounded-xl border border-white/10 shadow-lg flex-shrink-0" />
                              <div className="text-left flex-1 min-w-0">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">✓ Foto Sampul Terpilih</span>
                                <p className="text-xs font-bold text-white mt-1 truncate">{mainProductPhoto?.name || 'Foto Produk Utama'}</p>
                                <p className="text-[10px] text-purple-400 mt-1 font-semibold group-hover:underline">Klik di sini untuk mengganti foto utama</p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-3xl mb-2">📸</div>
                              <p className="text-xs font-black text-purple-300 uppercase tracking-wider">Pilih Foto Utama Produk</p>
                              <p className="text-[10px] text-slate-500 mt-1">Format PNG, JPG, JPEG (Maks 10MB)</p>
                            </div>
                          )}
                          <input
                            id="main-product-photo-input"
                            type="file"
                            accept="image/*"
                            required
                            className="sr-only"
                            onChange={ev => handleMainPhotoChange(ev.target.files[0])}
                          />
                        </label>
                      </div>

                      {/* 2. FOTO KONDISI FISIK (OPSIONAL - MAKS 6) */}
                      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-black text-white uppercase tracking-wider">
                              🔎 Foto Kondisi Fisik & Detail <span className="text-slate-500 font-normal">(Opsional · Maks 6 Foto)</span>
                            </label>
                            <p className="text-[10px] text-slate-400">Upload foto sudut detail (lecet, kelengkapan dus, layar, BH) untuk menambah kepercayaan pembeli.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-black uppercase tracking-widest">
                            Opsional
                          </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                          {PHOTO_SLOTS.map((slot) => (
                            <label
                              key={slot.key}
                              htmlFor={`photo-${slot.key}`}
                              className={`relative group cursor-pointer rounded-xl border border-dashed transition-all duration-200 overflow-hidden flex flex-col items-center justify-center aspect-square p-1
                                ${
                                  conditionPreviews[slot.key]
                                    ? 'border-purple-500/60 bg-slate-900'
                                    : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-900/50'
                                }`}
                            >
                              {conditionPreviews[slot.key] ? (
                                <>
                                  <img
                                    src={conditionPreviews[slot.key]}
                                    alt={slot.label}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 text-white text-[8px] font-black uppercase bg-black/70 px-1.5 py-0.5 rounded">Ganti</span>
                                  </div>
                                  <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase">✓</span>
                                  <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-bold text-white drop-shadow bg-black/40 py-0.5 truncate px-0.5">{slot.label}</span>
                                </>
                              ) : (
                                <>
                                  <div className="text-lg text-slate-600 mb-0.5">+</div>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter text-center leading-tight">{slot.label}</p>
                                </>
                              )}
                              <input
                                id={`photo-${slot.key}`}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={ev => handleConditionPhotoChange(slot.key, ev.target.files[0])}
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Catatan Kelengkapan & Deskripsi Fisik</label>
                         <textarea required rows="4" className="input-field !py-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Sebutkan Battery Health (BH), lecet fisik, kelengkapan dus/charger original, garansi..."></textarea>
                      </div>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-4 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-900 transition-all text-xs uppercase tracking-widest">
                           Kembali
                        </button>
                        <button
                          type="submit"
                          disabled={uploading || !mainProductPhoto}
                          className="flex-1 btn-primary !bg-purple-600 !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {uploading ? 'Mengunggah Foto & Menerbitkan...' : 'Publikasikan ke Katalog'}
                        </button>
                      </div>
                  </form>
               </div>
             )}

             {step === 3 && (
               <div className="glass-panel p-16 text-center animate-fade-in">
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Listing Dipublikasikan</h2>
                  <p className="text-slate-500 mb-10 font-medium">Perangkat Anda sekarang tampil di katalog HP Bekas.</p>
                  <button onClick={() => { setStep(1); setActiveTab('catalog'); }} className="btn-primary !px-12">Lihat Katalog</button>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Pop-Up Modal Detail Produk HP Bekas (Mirip Card Marketplace) */}
      <TradeInDetailModal
        detailDeviceModal={detailDeviceModal}
        setDetailDeviceModal={setDetailDeviceModal}
        setPreviewImageModal={setPreviewImageModal}
        handleNego={handleNego}
        user={user}
        router={router}
      />

      {/* Fullscreen Photo Preview Modal */}
      <TradeInPhotoModal
        previewImageModal={previewImageModal}
        setPreviewImageModal={setPreviewImageModal}
      />
    </div>
  );
}
