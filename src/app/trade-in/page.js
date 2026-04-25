'use client';
import { useState, useEffect } from 'react';
import { tradeInPrices } from '@/data/dummyDevices';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

function TradeInCard({ device, onNego }) {
  const router = useRouter();
  
  const handleBuy = () => {
    router.push(`/product/${device.id}`);
  };

  return (
    <div className="glass-panel p-4 flex flex-col hover:border-blue-500/50 transition-colors h-full group relative overflow-hidden">
      <div className="absolute top-2 right-2 bg-purple-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
        USED DEVICE
      </div>
      <div className="h-48 mb-4 overflow-hidden rounded-lg bg-slate-800 relative">
        <img 
          src={device.image} 
          alt={device.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="flex-grow">
        <p className="text-xs text-blue-400 font-semibold mb-1">{device.brand}</p>
        <h3 className="text-lg font-bold text-white leading-tight mb-2">{device.name}</h3>
        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mb-2">
          {formatPrice(device.price)}
        </p>
        <div className="flex flex-wrap gap-2 mt-3 mb-4 text-xs">
          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">{device.ram} RAM</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">{device.storage}</span>
          <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/30">
            {device.condition}
          </span>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-700 mt-2 flex gap-2">
        {device.stock === 0 ? (
          <button disabled className="btn-secondary flex-1 py-2 text-sm opacity-50 cursor-not-allowed bg-slate-800 text-slate-400">
            Out of Stock
          </button>
        ) : (
          <>
            <button 
              onClick={handleBuy}
              className="btn-primary flex-1 py-2 text-sm"
            >
              Buy Now
            </button>
            <button 
              onClick={() => onNego(device)}
              className="btn-secondary flex-1 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white"
            >
              Nego Harga
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TradeInPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'sell'
  const [tradeInDevices, setTradeInDevices] = useState([]);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    device: '',
    condition: 'Good',
    ram: '8GB',
    storage: '256GB',
    description: ''
  });
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [offer, setOffer] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gadgetTrustX_devices');
    if (saved) {
      const allDevices = JSON.parse(saved);
      setTradeInDevices(allDevices.filter(d => d.isTradeIn));
    }
  }, [activeTab, step]);

  const calculateOffer = (e) => {
    e.preventDefault();
    if (!formData.device || !formData.condition) return;
    
    let baseValue = tradeInPrices[formData.device] || 3000000; 
    if (formData.condition === 'Perfect') baseValue *= 1.2;
    if (formData.condition === 'Good') baseValue *= 1.0;
    if (formData.condition === 'Cracked') baseValue *= 0.6;
    if (formData.condition === 'Not Working') baseValue *= 0.3;
    
    if (formData.storage === '512GB') baseValue += 1000000;
    if (formData.storage === '1TB') baseValue += 2000000;

    setOffer(Math.round(baseValue));
    setStep(2);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    
    let imageUrl = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800'; 
    const fileInput = e.target.elements.imageFile;
    if (fileInput && fileInput.files[0]) {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) {
        console.error("Failed to upload", err);
      }
      setUploading(false);
    }

    let deviceName = formData.device === 'Custom Phone' ? customDeviceName : formData.device;
    let brand = 'Other';
    if (deviceName.includes('iPhone') || deviceName.includes('iPad')) brand = 'Apple';
    if (deviceName.includes('Samsung') || deviceName.includes('Galaxy')) brand = 'Samsung';
    if (deviceName.includes('Pixel')) brand = 'Google';

    const newDevice = {
      id: 'used_' + Date.now(),
      name: deviceName,
      brand: brand,
      category: 'Used Device',
      price: offer, 
      stock: 1,
      condition: formData.condition,
      ram: formData.ram,
      storage: formData.storage,
      chipset: 'Used',
      description: formData.description,
      image: imageUrl,
      seller: {
        id: user.email,
        name: user.name,
        reputationScore: user.role === 'seller' ? 98 : 85,
        verified: false,
        transactions: 0
      },
      verifiedByTrustX: false,
      isTradeIn: true
    };

    const saved = localStorage.getItem('gadgetTrustX_devices');
    let devices = saved ? JSON.parse(saved) : [];
    devices.unshift(newDevice);
    localStorage.setItem('gadgetTrustX_devices', JSON.stringify(devices));

    setStep(3);
  };

  const handleNego = (device) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (device.seller.id === user.email) {
      alert("Anda tidak bisa melakukan negosiasi untuk barang Anda sendiri.");
      return;
    }
    const event = new CustomEvent('openChat', { 
      detail: { 
        id: device.seller.id,
        name: device.seller.name
      } 
    });
    window.dispatchEvent(event);
  };

  return (
    <AuthGuard>
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-4">Trade-In Hub</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Jelajahi HP bekas berkualitas atau jual langsung HP lama Anda ke komunitas GadgetTrustX!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-800/80 p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            Katalog Trade-In
          </button>
          <button 
            onClick={() => setActiveTab('sell')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sell' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            Jual HP Bekas
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="animate-fade-in">
          {tradeInDevices.length === 0 ? (
            <div className="glass-panel p-16 text-center">
              <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-xl font-medium text-white mb-2">Belum ada HP bekas</h3>
              <p className="text-slate-400">Jadilah yang pertama menjual perangkat Anda di sini!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tradeInDevices.map(device => (
                <TradeInCard key={device.id} device={device} onNego={handleNego} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="max-w-3xl mx-auto glass-panel p-8 md:p-12 relative overflow-hidden shadow-2xl animate-fade-in">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Detail Perangkat Anda</h2>
              <form onSubmit={calculateOffer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Model</label>
                    <select 
                      className="input-field appearance-none"
                      value={formData.device}
                      onChange={(e) => setFormData({...formData, device: e.target.value})}
                      required
                    >
                      <option value="">Pilih perangkat...</option>
                      {Object.keys(tradeInPrices).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="Custom Phone">Lainnya...</option>
                    </select>
                  </div>
                  {formData.device === 'Custom Phone' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Nama Perangkat Anda <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Masukkan nama tipe dan merek HP Anda" 
                        className="input-field" 
                        value={customDeviceName} 
                        onChange={e => setCustomDeviceName(e.target.value)} 
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Kondisi</label>
                    <select 
                      className="input-field appearance-none"
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <option>Perfect</option>
                      <option>Good</option>
                      <option>Cracked</option>
                      <option>Not Working</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">RAM</label>
                      <input type="text" placeholder="e.g. 8GB" className="input-field" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})} required />
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
                </div>
                <button type="submit" disabled={!formData.device} className="btn-primary w-full py-4 text-lg">
                  Dapatkan Valuasi AI
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Kembali
              </button>
              
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-blue-500/30 text-center mb-8">
                <p className="text-slate-300 mb-2">Rekomendasi Harga Jual AI</p>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  {formatPrice(offer)}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Finalisasi Iklan</h3>
              <form onSubmit={handlePublish} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Harga Jual Anda (Rp) <span className="text-red-400">*</span></label>
                  <input 
                    type="number" 
                    required 
                    className="input-field text-lg font-bold text-emerald-400" 
                    value={offer} 
                    onChange={e => setOffer(Number(e.target.value))} 
                  />
                  <p className="text-xs text-slate-500 mt-1">AI memberikan rekomendasi harga, namun Anda bebas menentukannya sendiri.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Upload Foto Fisik HP</label>
                  <input type="file" name="imageFile" accept="image/*" required className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi / Minus Barang</label>
                  <textarea 
                    required rows="3" 
                    placeholder="Sebutkan kondisi fisik, kesehatan baterai, kelengkapan dll..." 
                    className="input-field"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                
                <button type="submit" disabled={uploading} className="btn-primary w-full py-4 text-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] flex justify-center items-center">
                  {uploading ? 'Mempublikasikan...' : 'Publikasikan ke Katalog'}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Berhasil Dipublikasikan!</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">{formData.device} bekas Anda sekarang sudah tampil di Katalog Trade-In. Pembeli lain kini bisa melihat dan melakukan nego dengan Anda!</p>
              
              <button onClick={() => { setStep(1); setActiveTab('catalog'); }} className="btn-primary px-8 py-3">
                Lihat Katalog
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
