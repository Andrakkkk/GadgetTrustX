'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DeviceCard from '@/components/DeviceCard';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import { apiFetch } from '@/lib/api-client';

export default function SellerProfilePage() {
  const { user, isLoading, updateProfile } = useAuth();
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wtbList, setWtbList] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [offerModal, setOfferModal] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Good', ram: '8GB', storage: '256GB', chipset: '', description: '',
  });
  const [uploading, setUploading] = useState(false);

  // Profile State
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', bio: '', storeName: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [offerForm, setOfferForm] = useState({ deviceName: '', price: '', condition: 'Good', ram: '', storage: '', description: '', imageFile: null, imagePreview: null });
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        storeName: user.storeName || user.name || ''
      });
      if (user.avatar) setAvatarPreview(user.avatar);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    let avatarUrl = user.avatar || null;
    const fileInput = e.target.elements.avatarFile;
    if (fileInput && fileInput.files[0]) {
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) avatarUrl = data.url;
      } catch (err) { console.error('Avatar upload failed', err); }
    }
    const result = await updateProfile({ ...profileForm, avatar: avatarUrl });
    setSavingProfile(false);
    if (!result.success) {
      alert(`Gagal menyimpan profile: ${result.message}`);
      return;
    }
    alert('Store profile updated successfully!');
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!offerModal) return;
    setSendingOffer(true);

    let imageUrl = null;
    if (offerForm.imageFile) {
      const fd = new FormData();
      fd.append('file', offerForm.imageFile);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error('Image upload failed', err); }
    }

    const buyer = offerModal.wtbItem;
    const catalog = {
      deviceName: offerForm.deviceName,
      price: offerForm.price,
      condition: offerForm.condition,
      ram: offerForm.ram,
      storage: offerForm.storage,
      description: offerForm.description,
      image: imageUrl,
      sellerName: user.name,
      sellerEmail: user.email
    };
    const res = await apiFetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otherEmail: buyer.authorEmail,
        message: {
          type: 'catalog',
          text: `Penawaran: ${offerForm.deviceName}`,
          metadata: { catalog },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSendingOffer(false);
      alert(data.error || 'Gagal mengirim penawaran.');
      return;
    }
    window.dispatchEvent(new Event('chatUpdated'));

    setSendingOffer(false);
    setOfferModal(null);
    setOfferForm({ deviceName: '', price: '', condition: 'Good', ram: '', storage: '', description: '', imageFile: null, imagePreview: null });
    alert(`Penawaran berhasil dikirim ke ${buyer.authorName}!`);
  };
  
  useEffect(() => {
    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setDevices(data.devices || []))
      .catch((error) => console.error('Failed to load devices', error));

    fetch('/api/wtb')
      .then((res) => res.json())
      .then((data) => setWtbList(data.listings || []))
      .catch((error) => console.error('Failed to load WTB listings', error));

    if (user) {
      apiFetch('/api/orders')
        .then((res) => res.json())
        .then((data) => setAllOrders(data.orders || []))
        .catch((error) => console.error('Failed to load seller orders', error));

      fetch(`/api/reviews?sellerEmail=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => setAllReviews(data.reviews || []))
        .catch((error) => console.error('Failed to load seller reviews', error));
    }
  }, [user]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    let imageUrl = null;
    const fileInput = e.target.elements.imageFile;
    if (fileInput && fileInput.files[0]) {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: formDataUpload });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error("Failed to upload image", err); }
      setUploading(false);
    }

    let updatedDevices;
    if (editingId) {
      const payload = {
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock) || 0,
        image: imageUrl || devices.find((d) => d.id === editingId)?.image,
      };
      const res = await apiFetch(`/api/devices/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      updatedDevices = devices.map(d => {
        if (d.id === editingId) {
          return data.device;
        }
        return d;
      });
    } else {
      const payload = {
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock) || 1,
        image: imageUrl || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800',
        sellerEmail: user.email,
        verifiedByTrustX: false,
      };
      const res = await apiFetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      updatedDevices = [data.device, ...devices];
    }

    setDevices(updatedDevices);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Good', ram: '8GB', storage: '256GB', chipset: '', description: '' });
  };

  const handleEditDevice = (device) => {
    setFormData({
      name: device.name || '', brand: device.brand || 'Apple', category: device.category || 'Smartphone',
      price: device.price !== undefined ? device.price : '', stock: device.stock !== undefined ? device.stock : 1,
      condition: device.condition || 'Good', ram: device.ram || '8GB', storage: device.storage || '256GB',
      chipset: device.chipset || '', description: device.description || ''
    });
    setEditingId(device.id);
    setShowAddForm(true);
  };

  const handleDeleteDevice = async (id) => {
    await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
    const updatedDevices = devices.filter(d => d.id !== id);
    setDevices(updatedDevices);
  };

  const myListings = devices.filter(d => d.seller?.id === user?.email);

  const sellerOrders = useMemo(() => allOrders.filter(order =>
    order.items?.some(item => item.seller?.id === user?.email)
  ), [allOrders, user]);

  const sellerReviews = useMemo(() => allReviews.filter(r => r.sellerEmail === user?.email), [allReviews, user]);

  const monthlySales = useMemo(() => {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
    return sellerOrders.reduce((sum, order) => {
      const d = new Date(order.date);
      if (d.getMonth() === m && d.getFullYear() === y) {
        return sum + order.items.filter(i => i.seller?.id === user?.email)
          .reduce((s, i) => s + (i.price * (i.cartQty || 1)), 0);
      }
      return sum;
    }, 0);
  }, [sellerOrders, user]);

  const trustScore = useMemo(() => {
    if (!sellerReviews.length) return null;
    const avg = sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length;
    return Math.round(avg * 20 * 10) / 10;
  }, [sellerReviews]);

  const lowStockCount = myListings.filter(d => d.stock > 0 && d.stock <= 3).length;

  const recentActivities = useMemo(() => {
    const acts = [];
    sellerOrders.slice(0, 3).forEach(order => acts.push({
      text: `Order ${order.id} — ${order.status}`,
      time: order.date,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: order.status === 'Completed' ? 'text-blue-400' : order.status === 'Delivered' ? 'text-emerald-400' : 'text-slate-400'
    }));
    sellerReviews.slice(0, 2).forEach(rev => acts.push({
      text: `${rev.buyerName} memberi ${rev.rating}★ untuk ${rev.deviceName}`,
      time: rev.date,
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      color: 'text-amber-400'
    }));
    return acts.slice(0, 5);
  }, [sellerOrders, sellerReviews]);

  if (isLoading || !user || user.role !== 'seller') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-panel p-10 text-center max-w-md animate-fade-in">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Seller Access Restricted</h3>
            <p className="text-slate-500 mb-8">This dashboard is only accessible for professional sellers. Please contact support to upgrade your account.</p>
            <button onClick={() => window.location.href = '/buyer-profile'} className="btn-primary !w-full">Return to Profile</button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="glass-panel p-6 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white/5 shadow-2xl">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
                        {(user.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl border-4 border-slate-900 shadow-xl" title="Verified Seller">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user.storeName || user.name}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.email}</p>
                
                <div className="flex gap-2 mt-4">
                   <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-tighter">Pro Seller</div>
                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                      {trustScore !== null ? `${trustScore}% Positive` : 'New Seller'}
                    </div>
                </div>
              </div>
              <nav className="glass-panel p-1 sm:p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { id: 'listings', label: 'My Listings', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                  { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', count: sellerOrders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length },
                  { id: 'wtb', label: 'Requests', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', count: wtbList.length },
                  { id: 'profile', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
                ].map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => { setActiveTab(item.id); setShowAddForm(false); }}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all font-bold text-[10px] sm:text-sm whitespace-nowrap flex-shrink-0 lg:flex-shrink-1 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                       <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                       {item.label}
                    </div>
                    {item.count > 0 && <span className="ml-2 bg-white/20 text-white text-[9px] sm:text-[10px] px-1.5 sm:py-1 rounded-lg">{item.count}</span>}
                  </button>
                ))}
              </nav>

              <button 
                onClick={() => { setEditingId(null); setFormData({name: '', brand: 'Apple', category: 'Smartphone', price: '', stock: 1, condition: 'Good', ram: '8GB', storage: '256GB', chipset: '', description: ''}); setShowAddForm(true); setActiveTab('listings'); }}
                className="w-full btn-primary !py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30 font-black uppercase tracking-widest text-xs"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Post New Listing
              </button>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20">
                       <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">Monthly Sales</p>
                       <h3 className="text-4xl font-black text-white mb-2">{monthlySales > 0 ? formatPrice(monthlySales) : 'Rp 0'}</h3>
                       <p className="text-xs text-slate-500 font-medium">{sellerOrders.length} total order{sellerOrders.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="glass-panel p-8">
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Active Listings</p>
                       <h3 className="text-4xl font-black text-white mb-2">{myListings.length}</h3>
                       <p className="text-xs text-slate-500 font-medium">{lowStockCount > 0 ? `${lowStockCount} low on stock` : 'All stocked'}</p>
                    </div>
                    <div className="glass-panel p-8">
                       <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-2">Trust Score</p>
                       {trustScore !== null ? (
                         <>
                           <h3 className="text-4xl font-black text-white mb-2">{trustScore}</h3>
                           <p className="text-xs text-slate-500 mb-2">Based on {sellerReviews.length} review{sellerReviews.length !== 1 ? 's' : ''}</p>
                           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{width: `${trustScore}%`}}></div>
                           </div>
                         </>
                       ) : (
                         <>
                           <h3 className="text-4xl font-black text-slate-600 mb-2">—</h3>
                           <p className="text-xs text-slate-600">No reviews yet</p>
                         </>
                       )}
                    </div>
                  </div>

                  <div className="glass-panel p-8">
                     <h3 className="text-xl font-bold text-white mb-6">Recent Activities</h3>
                     {recentActivities.length === 0 ? (
                       <p className="text-slate-500 text-sm text-center py-6">No activity yet. Start selling to see data here.</p>
                     ) : (
                       <div className="space-y-6 text-slate-400">
                         {recentActivities.map((act, i) => (
                           <div key={i} className="flex gap-4 items-start">
                              <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${act.color}`}>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={act.icon}></path></svg>
                              </div>
                              <div>
                                 <p className="text-sm text-slate-200 font-medium">{act.text}</p>
                                 <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{act.time}</p>
                              </div>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="animate-fade-in">
                  {showAddForm ? (
                    <div className="glass-panel p-8 relative overflow-hidden">
                       <div className="flex items-center justify-between mb-10">
                          <h2 className="text-3xl font-black text-white tracking-tight">{editingId ? 'Edit Listing' : 'Post New Listing'}</h2>
                          <button onClick={() => setShowAddForm(false)} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                       </div>
                       
                       <form onSubmit={handleAddDevice} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Device Title</label>
                             <input type="text" required placeholder="e.g. iPhone 15 Pro Max 512GB - Midnight Black" className="input-field !text-lg !py-4" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Brand</label>
                             <select className="input-field appearance-none cursor-pointer" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Asus', 'Other'].map(b => <option key={b}>{b}</option>)}
                             </select>
                          </div>
                          
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Price (IDR)</label>
                             <input type="number" required placeholder="15000000" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                          </div>

                          <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description & Condition Details</label>
                             <textarea required rows="4" className="input-field !py-4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Mention BH, scratches, warranty status..."></textarea>
                          </div>

                           <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Product Image</label>
                              <div className="relative group w-full h-40 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 border-dashed hover:border-blue-500 transition-all">
                                 <input type="file" name="imageFile" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => { if (e.target.files[0]) alert('Image selected: ' + e.target.files[0].name); }} />
                                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span className="text-xs font-bold">Click to upload product photo</span>
                                 </div>
                              </div>
                           </div>

                           <div className="md:col-span-2 pt-6">
                             <button type="submit" disabled={uploading} className="btn-primary !py-5 w-full flex items-center justify-center gap-3">
                                {uploading ? 'Processing...' : (editingId ? 'Save Changes' : 'Publish to Marketplace')}
                             </button>
                          </div>
                       </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myListings.length > 0 ? (
                        myListings.map(device => (
                          <div key={device.id} className="relative group animate-fade-in">
                            <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => handleEditDevice(device)} className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xl hover:bg-blue-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              </button>
                              <button onClick={() => handleDeleteDevice(device.id)} className="p-2.5 rounded-xl bg-red-600 text-white shadow-xl hover:bg-red-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                            <DeviceCard device={device} />
                          </div>
                        ))
                      ) : (
                        <div className="lg:col-span-3 py-20 text-center glass-panel">
                           <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                              <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                           </div>
                           <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
                           <p className="text-slate-500 mb-8">Start your selling journey by posting your first device.</p>
                           <button onClick={() => setShowAddForm(true)} className="btn-primary !px-8">Create Listing</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white mb-2">Buyer Orders</h2>
                  <p className="text-slate-500 mb-8">Manage orders for your products. Track status and handle returns.</p>
                  
                  <div className="space-y-4">
                    {sellerOrders.length > 0 ? (
                      sellerOrders.map(order => (
                        <div key={order.id} className="glass-panel p-6 border border-slate-800/50 hover:border-blue-500/30 transition-all">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Order #{order.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(order.date).toLocaleDateString()}</span>
                              </div>
                              <h3 className="text-lg font-bold text-white">{order.buyerEmail}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                              order.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              order.status === 'Returned' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {order.items
                              .filter(item => item.seller?.id === user?.email)
                              .map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                                      <p className="text-xs text-slate-500">{formatPrice(item.price)} x {item.cartQty || 1}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                     {item.returnStatus ? (
                                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                                         item.returnStatus === 'Approved' ? 'text-emerald-400' :
                                         item.returnStatus === 'Pending' ? 'text-amber-400' :
                                         'text-red-400'
                                       }`}>
                                         {item.returnStatus === 'Approved' ? '↩ Returned' : `↩ Return ${item.returnStatus}`}
                                       </span>
                                     ) : item.rated ? (
                                       <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">★ Rated</span>
                                     ) : (
                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">No Return</span>
                                     )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center glass-panel">
                        <p className="text-slate-500">No buyer orders found for your products.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'wtb' && (
                <div className="space-y-6 animate-fade-in">
                   <h2 className="text-2xl font-black text-white mb-2">Buyer Requests</h2>
                   <p className="text-slate-500 mb-8">Respond to buyers looking for specific gear with a custom catalog offer.</p>
                   
                   <div className="grid grid-cols-1 gap-4">
                     {wtbList.map(item => (
                       <div key={item.id} className="glass-panel p-8 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all">
                          <div className="flex gap-6 items-center w-full">
                             <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl font-black text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                                {item.device.charAt(0)}
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{item.authorName}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.date}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{item.device}</h3>
                                <div className="flex gap-4">
                                   <div className="text-emerald-400 font-bold text-sm">Budget: Up to {item.budget}</div>
                                   <div className="text-slate-500 font-bold text-sm uppercase tracking-tighter">Cond: {item.condition}</div>
                                </div>
                             </div>
                          </div>
                          <button 
                            onClick={() => setOfferModal({ wtbItem: item })}
                            className="w-full md:w-auto px-8 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
                          >
                            Send Offer
                          </button>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="glass-panel p-10 animate-fade-in">
                   <h2 className="text-3xl font-black text-white mb-2">Store Settings</h2>
                   <p className="text-slate-500 mb-10 text-sm">Update your public presence to build more trust with buyers.</p>
                                      <form onSubmit={handleProfileSave} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2 flex items-center gap-6 p-6 rounded-3xl bg-slate-900 border border-slate-800">
                             <div className="relative group w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/5">
                                {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                                <label htmlFor="avatar-up-seller" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                                </label>
                                <input id="avatar-up-seller" name="avatarFile" type="file" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) setAvatarPreview(URL.createObjectURL(file)); }} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-white mb-1">Store Avatar</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Identitas toko Anda</p>
                             </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Store Name</label>
                            <input type="text" className="input-field" value={profileForm.storeName} onChange={e => setProfileForm({...profileForm, storeName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Public Phone (WA)</label>
                            <input type="text" className="input-field" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Store Bio</label>
                            <textarea rows="3" className="input-field !py-4" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Tell us what makes your store special..."></textarea>
                         </div>
                      </div>
                      
                      <button type="submit" disabled={savingProfile} className="btn-primary !py-5 !px-10 flex items-center justify-center gap-3">
                         {savingProfile ? 'Saving...' : 'Update Store Profile'}
                      </button>
                   </form>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Offer Modal Redesigned */}
       {offerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={() => setOfferModal(null)}>
           <div className="glass-panel !rounded-3xl w-full max-w-2xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-white mb-1">Custom Catalog Offer</h3>
                    <p className="text-xs text-slate-500 font-medium">Pitching to <span className="text-blue-400 font-bold">{offerModal.wtbItem.authorName}</span></p>
                 </div>
                 <button onClick={() => setOfferModal(null)} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
              
              <form onSubmit={handleSendOffer} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Device Name</label>
                       <input type="text" required className="input-field" value={offerForm.deviceName} onChange={e => setOfferForm({...offerForm, deviceName: e.target.value})} placeholder="e.g. iPhone 13 Pro 256GB Sierra Blue" />
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Price (IDR)</label>
                       <input type="number" required className="input-field" value={offerForm.price} onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
                    </div>
                    
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Condition</label>
                       <select className="input-field appearance-none" value={offerForm.condition} onChange={e => setOfferForm({...offerForm, condition: e.target.value})}>
                          <option>Brand New</option>
                          <option>Like New</option>
                          <option>Good</option>
                          <option>Fair</option>
                       </select>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">RAM</label>
                       <select className="input-field appearance-none" value={offerForm.ram} onChange={e => setOfferForm({...offerForm, ram: e.target.value})}>
                          {['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'].map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Storage</label>
                       <select className="input-field appearance-none" value={offerForm.storage} onChange={e => setOfferForm({...offerForm, storage: e.target.value})}>
                          {['64GB', '128GB', '256GB', '512GB', '1TB'].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Offer Description</label>
                       <textarea rows="3" className="input-field !py-4" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} placeholder="Include details like battery health, warranty, or minor scratches..."></textarea>
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Device Photo (Optional)</label>
                       <div className="relative group w-full h-32 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 border-dashed hover:border-blue-500/50 transition-all flex items-center justify-center">
                          {offerForm.imagePreview ? (
                             <img src={offerForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                             <div className="flex flex-col items-center text-slate-600">
                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Product Photo</span>
                             </div>
                          )}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                             const file = e.target.files[0];
                             if (file) setOfferForm({...offerForm, imageFile: file, imagePreview: URL.createObjectURL(file)});
                          }} />
                       </div>
                    </div>
                 </div>
                 
                 <button type="submit" disabled={sendingOffer} className="btn-primary !py-5 w-full flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30">
                    {sendingOffer ? (
                       <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing Offer...</span>
                       </>
                    ) : (
                       <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          <span>Send Premium Offer</span>
                       </>
                    )}
                 </button>
              </form>
           </div>
        </div>
     )}
    </AuthGuard>
  );
}
