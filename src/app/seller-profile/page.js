'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DeviceCard from '@/components/DeviceCard';
import AuthGuard from '@/components/AuthGuard';
import { dummyDevices } from '@/data/dummyDevices';

export default function SellerProfilePage() {
  const { user, updateProfile } = useAuth();
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' or 'wtb'
  const [wtbList, setWtbList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Apple',
    category: 'Smartphone',
    price: '',
    stock: 1,
    condition: 'Good',
    ram: '8GB',
    storage: '256GB',
    chipset: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);

  // Profile State
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
    }
  }, [user]);

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
    alert('Store profile updated successfully!');
  };
  
  // Load global devices and WTB
  useEffect(() => {
    const saved = localStorage.getItem('gadgetTrustX_devices');
    if (saved) {
      setDevices(JSON.parse(saved));
    } else {
      localStorage.setItem('gadgetTrustX_devices', JSON.stringify(dummyDevices));
      setDevices(dummyDevices);
    }
    
    const savedWtb = localStorage.getItem('gadgetTrustX_wtbListings');
    if (savedWtb) {
      setWtbList(JSON.parse(savedWtb));
    }
  }, []);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    
    let imageUrl = null;
    const fileInput = e.target.elements.imageFile;
    if (fileInput && fileInput.files[0]) {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', fileInput.files[0]);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) {
        console.error("Failed to upload image", err);
      }
      setUploading(false);
    }

    let updatedDevices;

    if (editingId) {
      // Update existing
      updatedDevices = devices.map(d => {
        if (d.id === editingId) {
          return {
            ...d,
            ...formData,
            price: parseInt(formData.price),
            stock: parseInt(formData.stock) || 0,
            image: imageUrl || d.image, // keep old image if no new one
          };
        }
        return d;
      });
    } else {
      // Create new
      const newDevice = {
        id: 'dev_' + Date.now(),
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock) || 1,
        image: imageUrl || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800',
        seller: {
          id: user.email, 
          name: user.name,
          reputationScore: 100, 
          verified: true,
          transactions: 0
        },
        verifiedByTrustX: false 
      };
      updatedDevices = [newDevice, ...devices];
    }

    setDevices(updatedDevices);
    localStorage.setItem('gadgetTrustX_devices', JSON.stringify(updatedDevices));
    
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Good', ram: '8GB', storage: '256GB', chipset: '', description: ''
    });
  };

  const handleEditDevice = (device) => {
    setFormData({
      name: device.name || '',
      brand: device.brand || 'Apple',
      category: device.category || 'Smartphone',
      price: device.price !== undefined ? device.price : '',
      stock: device.stock !== undefined ? device.stock : 1,
      condition: device.condition || 'Good',
      ram: device.ram || '8GB',
      storage: device.storage || '256GB',
      chipset: device.chipset || '',
      description: device.description || ''
    });
    setEditingId(device.id);
    setShowAddForm(true);
  };

  const handleDeleteDevice = (id) => {
    const updatedDevices = devices.filter(d => d.id !== id);
    setDevices(updatedDevices);
    localStorage.setItem('gadgetTrustX_devices', JSON.stringify(updatedDevices));
  };

  // Mock data for seller reputation
  const sellerStats = {
    score: 98.5,
    totalSales: 450,
    activeListings: devices.filter(d => d.seller.id === user?.email || d.seller.id === 'sel1').length,
    joinDate: 'Oct 2024',
    badges: ['Top Rated', 'Fast Shipper', 'Verified ID']
  };

  if (user?.role !== 'seller') {
    return (
      <AuthGuard>
      <div className="flex justify-center items-center h-96">
        <div className="glass-panel p-8 text-center">
          <p className="text-xl text-white">Please log in as a Seller to view this page.</p>
        </div>
      </div>
      </AuthGuard>
    );
  }

  // Seller's own listings
  const myListings = devices.filter(d => d.seller.id === user.email || d.seller.id === 'sel1');

  return (
    <AuthGuard>
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Profile */}
      <div className="glass-panel p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl z-[-1]"></div>
        
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 flex-shrink-0">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{user.name}'s Store</h1>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/50 flex items-center w-fit mx-auto md:mx-0">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Identity Verified
            </span>
          </div>
          <p className="text-slate-400 mb-6">Member since {sellerStats.joinDate}</p>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {sellerStats.badges.map(badge => (
              <span key={badge} className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-md border border-slate-700">
                {badge}
              </span>
            ))}
          </div>
        </div>
        
        {/* Reputation Score Card */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-blue-500/30 text-center min-w-[200px] shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Trust Score</p>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            {sellerStats.score}
          </div>
          <p className="text-xs text-blue-400">Based on AI analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Col - Stats & Action */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-2 flex flex-col gap-2">
            <button 
              onClick={() => { setActiveTab('listings'); setShowAddForm(false); }}
              className={`py-3 px-4 rounded-xl text-left font-semibold transition-all flex items-center ${activeTab === 'listings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              My Active Listings
            </button>
            <button 
              onClick={() => { setActiveTab('wtb'); setShowAddForm(false); }}
              className={`py-3 px-4 rounded-xl text-left font-semibold transition-all flex items-center justify-between ${activeTab === 'wtb' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                Buyer WTB Requests
              </div>
              {wtbList.length > 0 && (
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{wtbList.length}</span>
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('profile'); setShowAddForm(false); }}
              className={`py-3 px-4 rounded-xl text-left font-semibold transition-all flex items-center ${activeTab === 'profile' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Store Profile
            </button>
          </div>

          {activeTab === 'listings' && (
            <button 
            onClick={() => {
              setEditingId(null);
              setFormData({name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Good', ram: '8GB', storage: '256GB', chipset: '', description: ''});
              setShowAddForm(!showAddForm);
            }} 
            className="w-full btn-primary py-4 text-lg font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center mb-6"
          >
            {showAddForm ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Cancel Form
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Create New Listing
              </>
            )}
          </button>
          )}
          <div className="glass-panel p-6">
            <h3 className="font-semibold text-white mb-4">Transaction History</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-slate-400">Total Sales</span>
                <span className="text-white font-bold">{sellerStats.totalSales}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-slate-400">Active Listings</span>
                <span className="text-blue-400 font-bold">{myListings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Avg. Response Time</span>
                <span className="text-white font-bold">&lt; 1 hour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Listings or Form */}
        <div className="xl:col-span-3">
          {showAddForm ? (
            <div className="glass-panel p-0 mb-8 overflow-hidden animate-fade-in border border-blue-500/30">
              <div className="bg-slate-800/80 p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  {editingId ? 'Edit Device Listing' : 'New Device Listing'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">Fill out the details below to publish your device to the GadgetTrustX global marketplace.</p>
              </div>

              <form onSubmit={handleAddDevice} className="p-6 space-y-8">
                {/* SECTION: Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center border-b border-slate-700 pb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Device Name <span className="text-red-400">*</span></label>
                      <input type="text" required placeholder="e.g. iPhone 15 Pro Max 256GB Titanium" className="input-field bg-slate-900 border-slate-700 focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Brand</label>
                      <select className="input-field bg-slate-900 border-slate-700 focus:border-blue-500 appearance-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
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
                      <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                      <select className="input-field bg-slate-900 border-slate-700 focus:border-blue-500 appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option>Smartphone</option>
                        <option>Tablet</option>
                        <option>Laptop</option>
                        <option>Smartwatch</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION: Pricing & Stock */}
                <div>
                  <h3 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center border-b border-slate-700 pb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Pricing & Inventory
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Price (Rp) <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 sm:text-sm">Rp</span>
                        </div>
                        <input type="number" required placeholder="15000000" className="input-field pl-10 bg-slate-900 border-slate-700 focus:border-emerald-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Available Stock <span className="text-red-400">*</span></label>
                      <input type="number" min="1" required className="input-field bg-slate-900 border-slate-700 focus:border-emerald-500" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* SECTION: Specs */}
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center border-b border-slate-700 pb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">RAM</label>
                      <select className="input-field bg-slate-900 border-slate-700 focus:border-purple-500 appearance-none" value={formData.ram} onChange={e => setFormData({...formData, ram: e.target.value})}>
                        <option>4GB</option>
                        <option>6GB</option>
                        <option>8GB</option>
                        <option>12GB</option>
                        <option>16GB</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Storage</label>
                      <select className="input-field bg-slate-900 border-slate-700 focus:border-purple-500 appearance-none" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})}>
                        <option>64GB</option>
                        <option>128GB</option>
                        <option>256GB</option>
                        <option>512GB</option>
                        <option>1TB</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Chipset</label>
                      <input type="text" placeholder="e.g. A17 Pro, Snapdragon 8 Gen 2" className="input-field bg-slate-900 border-slate-700 focus:border-purple-500" value={formData.chipset} onChange={e => setFormData({...formData, chipset: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* SECTION: Media & Description */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-300 mb-4 flex items-center border-b border-slate-700 pb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Media & Description
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Product Description <span className="text-red-400">*</span></label>
                      <textarea required rows="4" placeholder="Describe the device, battery health, included accessories, any scratches, etc." className="input-field bg-slate-900 border-slate-700 focus:border-amber-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Product Photo <span className="text-red-400">*</span></label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-xl bg-slate-900 hover:border-amber-500 transition-colors">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-slate-400 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-amber-400 hover:text-amber-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500 px-3 py-1">
                              <span>Upload a file</span>
                              <input id="file-upload" name="imageFile" type="file" className="sr-only" accept="image/*" required={!editingId} />
                            </label>
                          </div>
                          <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700 flex justify-end">
                  <button type="submit" disabled={uploading} className="btn-primary px-8 py-3 text-lg font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center">
                    {uploading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {uploading ? 'Processing & Uploading...' : (editingId ? 'Save Changes' : 'Publish Listing')}
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'listings' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Manage Listings ({myListings.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map(device => (
                  <div key={device.id} className="relative group">
                    <div className="absolute top-2 left-2 z-30 flex space-x-2">
                      <button 
                        onClick={() => handleEditDevice(device)}
                        className="p-2 bg-blue-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
                        title="Edit Listing"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-2 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        title="Delete Listing"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                    {/* Stock Indicator overlay */}
                    <div className="absolute top-2 right-2 z-30">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg shadow-lg ${device.stock > 0 ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                        {device.stock > 0 ? `Stock: ${device.stock}` : 'Out of Stock'}
                      </span>
                    </div>
                    <DeviceCard device={device} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Buyer WTB Requests</h2>
                <p className="text-slate-400 text-sm">Offer your devices to buyers looking for specific items.</p>
              </div>
              
              {wtbList.length === 0 ? (
                <div className="glass-panel p-12 text-center text-slate-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  <p>There are no Want-To-Buy requests right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {wtbList.map(item => (
                    <div key={item.id} className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-500/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{item.date}</span>
                          <span className="text-xs text-blue-400 font-semibold">{item.authorName} is looking for:</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{item.device}</h3>
                        <div className="flex gap-3 text-sm text-slate-300">
                          <span className="flex items-center text-emerald-400 font-semibold">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Up to {item.budget}
                          </span>
                          <span className="flex items-center">
                            Condition: {item.condition}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-slate-400 mt-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                            Notes: {item.notes}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openChat', { 
                            detail: { 
                              sellerName: item.authorName,
                              initialMessage: `Hello ${item.authorName}, I saw your WTB request for ${item.device}. I have a device you might be interested in!`
                            } 
                          }));
                        }}
                        className="btn-secondary whitespace-nowrap bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30"
                      >
                        Offer Device
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && !showAddForm && (
            <div className="animate-fade-in glass-panel p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Edit Store Profile</h2>
              <form onSubmit={handleProfileSave} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Store Name</label>
                  <input type="text" className="input-field" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <input type="tel" className="input-field" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="e.g. 08123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Store Address</label>
                  <textarea className="input-field min-h-[100px]" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} placeholder="Full store address..." />
                </div>
                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full md:w-auto px-8 py-3">Save Profile</button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
