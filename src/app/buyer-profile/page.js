'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import { apiFetch } from '@/lib/api-client';

export default function BuyerProfilePage() {
  const { user, isLoading, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'wtb', 'orders', 'tradein', 'profile'
  const [wtbList, setWtbList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ device: '', budget: '', condition: 'Any', notes: '' });
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [orders, setOrders] = useState([]);
  const [myTradeIns, setMyTradeIns] = useState([]);
  const [editingTradeIn, setEditingTradeIn] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null, orderItemId: null, orderId: null, rating: 5, comment: '', imageFile: null });
  const [uploadingReview, setUploadingReview] = useState(false);
  const [returnModal, setReturnModal] = useState({ isOpen: false, item: null, orderItemId: null, orderId: null, reason: '', imageFile: null });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', bio: user.bio || '' });
      if (user.avatar) setAvatarPreview(user.avatar);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'buyer') return;

    apiFetch('/api/wtb')
      .then((res) => res.json())
      .then((data) => setWtbList(data.listings || []))
      .catch((error) => console.error('Failed to load WTB listings', error));

    apiFetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch((error) => console.error('Failed to load orders', error));

    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setMyTradeIns((data.devices || []).filter((device) => device.isTradeIn && device.seller?.id === user.email)))
      .catch((error) => console.error('Failed to load trade-in listings', error));

    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch((error) => console.error('Failed to load reviews', error));
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    let avatarUrl = user?.avatar || null;
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
    alert('Profile updated successfully!');
  };

  const handleWtbSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (editingId) {
      const res = await apiFetch('/api/wtb', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...formData }),
      });
      result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Gagal memperbarui request.');
        return;
      }
      setWtbList((items) => items.map((item) => item.id === editingId ? result.listing : item));
    } else {
      const res = await apiFetch('/api/wtb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Gagal membuat request.');
        return;
      }
      setWtbList((items) => [result.listing, ...items]);
    }
    setFormData({ device: '', budget: '', condition: 'Any', notes: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.item || !user) {
      alert('Data ulasan belum lengkap. Coba buka ulang halaman.');
      return;
    }

    setUploadingReview(true);
    let imageUrl = null;
    if (reviewModal.imageFile) {
      const fd = new FormData();
      fd.append('file', reviewModal.imageFile);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error('Review image upload failed', err); }
    }

    const reviewPayload = {
      deviceId: reviewModal.item.id,
      deviceName: reviewModal.item.name,
      buyerName: user?.name,
      buyerEmail: user?.email,
      sellerEmail: reviewModal.item.seller?.id,
      rating: reviewModal.rating,
      comment: reviewModal.comment,
      image: imageUrl,
      orderId: reviewModal.orderId,
      orderItemId: reviewModal.orderItemId,
    };
    const reviewRes = await apiFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    const reviewData = await reviewRes.json();
    if (!reviewRes.ok) {
      setUploadingReview(false);
      alert(reviewData.error || 'Gagal menyimpan ulasan.');
      return;
    }
    setReviews((items) => [reviewData.review, ...items]);

    setUploadingReview(false);
    setReviewModal({ isOpen: false, item: null, orderItemId: null, orderId: null, rating: 5, comment: '', imageFile: null });
    alert('Thank you for your review!');
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);

    let imageUrl = null;
    const fileInput = e.target.elements.returnImageFile;
    if (fileInput && fileInput.files[0]) {
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      try {
        const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) { console.error('Return image upload failed', err); }
    }

    const response = await apiFetch('/api/orders/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderItemId: returnModal.orderItemId,
        reason: returnModal.reason,
        image: imageUrl,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setSubmittingReturn(false);
      alert(data.error || 'Gagal mengirim return request.');
      return;
    }

    const ordersResponse = await apiFetch('/api/orders');
    const ordersData = await ordersResponse.json();
    setOrders(ordersData.orders || []);
    setSubmittingReturn(false);
    setReturnModal({ isOpen: false, item: null, orderItemId: null, orderId: null, reason: '', imageFile: null });
    alert('Return request submitted successfully. Our team will review your evidence.');
  };

  // Guard: tunggu sampai auth selesai loading, dan pastikan user adalah buyer
  if (isLoading || !user || user.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </AuthGuard>
    );
  }

  const safeOrders = orders.filter((order) => order?.id);
  const myRequests = wtbList.filter(item => item?.authorEmail === user.email);

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
                      <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-2xl font-black text-white">
                        {(user.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.email}</p>
                <div className="mt-4 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Verified Buyer</div>
              </div>

              <nav className="glass-panel p-1 sm:p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible custom-scrollbar scroll-smooth">
                {[
                  { id: 'dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', count: safeOrders.length },
                  { id: 'wtb', label: 'Requests', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', count: myRequests.length },
                  { id: 'tradein', label: 'Trade-Ins', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' },
                  { id: 'profile', label: 'Settings', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setShowForm(false); }}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all font-bold text-xs sm:text-sm whitespace-nowrap min-w-fit ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                      {item.label}
                    </div>
                    {item.count > 0 && <span className="ml-2 bg-white/20 text-white text-[9px] sm:text-[10px] px-1.5 sm:py-1 rounded-lg">{item.count}</span>}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-500/20">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">Total Spent</p>
                      <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 break-all">{formatPrice(safeOrders.reduce((acc, curr) => acc + (curr.total || 0), 0))}</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{safeOrders.length} successful orders</p>
                    </div>
                    <div className="glass-panel p-8">
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">Active Requests</p>
                      <h3 className="text-4xl font-black text-white mb-2">{myRequests.length}</h3>
                      <p className="text-xs text-slate-500 font-medium">Seeking for deals</p>
                    </div>
                    <div className="glass-panel p-8">
                      <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-2">Trade-In Value</p>
                      <h3 className="text-4xl font-black text-white mb-2">{formatPrice(myTradeIns.reduce((acc, curr) => acc + (curr.price || 0), 0))}</h3>
                      <p className="text-xs text-slate-500 font-medium">{myTradeIns.length} listed items</p>
                    </div>
                  </div>

                  <div className="glass-panel p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Orders</h3>
                    <div className="space-y-4">
                      {safeOrders.length > 0 ? safeOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-white/5">
                              {order.items && order.items[0]?.image ? (
                                <img src={order.items[0].image} className="w-full h-full object-cover" alt="Product" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Order #{order.id.slice(-6)}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black">
                                {order.date} • {(order.items || []).reduce((sum, i) => sum + (i?.cartQty || 1), 0)} Items
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-400">{formatPrice(order.total)}</p>
                            <p className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">{order.status}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-slate-500 text-center py-10">No orders yet. Ready for your first hunt?</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-black text-white mb-6">Order History</h2>
                  {safeOrders.map(order => (
                    <div key={order.id} className="glass-panel p-8 overflow-hidden group hover:border-emerald-500/30 transition-all">
                      <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
                        <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Order Identifier</p>
                          <h4 className="text-lg font-black text-white uppercase tracking-tighter">{order.id} <span className="text-slate-600 ml-2">({(order.items || []).reduce((sum, i) => sum + (i?.cartQty || 1), 0)} Items)</span></h4>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Status</p>
                            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">{order.status}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Amount</p>
                            <p className="text-lg font-black text-emerald-400">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(order.items || []).filter(Boolean).map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shadow-2xl" />
                            <div className="flex-grow">
                              <h5 className="font-bold text-white">{item.name} <span className="text-emerald-500 ml-2">x{item.cartQty || 1}</span></h5>
                              <p className="text-xs text-slate-500">Seller: <span className="text-slate-300">{item.seller?.name || 'Unknown seller'}</span></p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="font-bold text-white text-sm">{formatPrice(item.price * (item.cartQty || 1))}</p>
                              {order.status !== 'Cancelled' && (
                                <div className="flex gap-3">
                                  {item.returnStatus === 'Pending' ? (
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">↩ Return Pending</span>
                                  ) : item.returnStatus === 'Approved' ? (
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">✓ Return Approved</span>
                                  ) : item.returnStatus === 'Rejected' ? (
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">✕ Return Rejected</span>
                                  ) : order.ratedItems?.includes(item.orderItemId) ? (
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">★ Rated</span>
                                  ) : (
                                    <>
                                      {(order.status === 'Delivered' || order.status === 'Partially Returned') && (
                                        <button onClick={() => setReviewModal({ ...reviewModal, isOpen: true, item, orderItemId: item.orderItemId, orderId: order.id })} className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400">Rate</button>
                                      )}
                                      {(order.status === 'Delivered' || order.status === 'Partially Returned') && (
                                        <button onClick={() => setReturnModal({ ...returnModal, isOpen: true, item, orderItemId: item.orderItemId, orderId: order.id })} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white">Return</button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'wtb' && (
                <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">WTB Requests</h2>
                      <p className="text-slate-500 text-sm mt-1">Sellers will see these and send you custom offers.</p>
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({ device: '', budget: '', condition: 'Any', notes: '' }); setShowForm(true); }} className="btn-primary !px-8">New Request</button>
                  </div>

                  {showForm ? (
                    <div className="glass-panel p-10 mb-8 border-emerald-500/30">
                      <form onSubmit={handleWtbSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Device</label>
                          <input type="text" required placeholder="e.g. iPhone 15 Pro Max 256GB" className="input-field !text-lg !py-4" value={formData.device} onChange={e => setFormData({ ...formData, device: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Maximum Budget (IDR)</label>
                          <input type="number" required placeholder="15000000" className="input-field" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Condition Preferance</label>
                          <select className="input-field appearance-none" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                            {['Any', 'Brand New', 'Like New', 'Good', 'Fair'].map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Notes to Sellers</label>
                          <textarea rows="3" className="input-field !py-4" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. Must have battery health > 90%..."></textarea>
                        </div>
                        <div className="md:col-span-2 flex gap-4">
                          <button type="submit" className="btn-primary !py-4 flex-grow font-black uppercase tracking-widest text-xs">Publish Request</button>
                          <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 bg-slate-900 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {myRequests.length > 0 ? myRequests.map(item => (
                        <div key={item.id} className="glass-panel p-8 relative group hover:border-emerald-500/30 transition-all">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                            <button onClick={() => { setEditingId(item.id); setFormData({ device: item.device, budget: item.budget, condition: item.condition, notes: item.notes }); setShowForm(true); }} className="p-2 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button onClick={async () => {
                              const res = await apiFetch('/api/wtb', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: item.id }),
                              });
                              if (res.ok) setWtbList((items) => items.filter((listing) => listing.id !== item.id));
                            }} className="p-2 bg-red-600 text-white rounded-xl shadow-xl hover:bg-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                          </div>
                          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">{item.date}</p>
                          <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{item.device}</h3>
                          <div className="flex gap-4 items-center">
                            <span className="text-lg font-black text-white">Up to {formatPrice(item.budget)}</span>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter px-2 py-1 bg-slate-900 rounded-lg">{item.condition}</span>
                          </div>
                          {item.notes && <p className="mt-4 text-xs text-slate-500 italic">"{item.notes}"</p>}
                        </div>
                      )) : (
                        <div className="md:col-span-2 py-20 text-center glass-panel">
                          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                            <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">No requests yet</h3>
                          <p className="text-slate-500 mb-8">Post what you're looking for and let the deals come to you.</p>
                          <button onClick={() => setShowForm(true)} className="btn-primary !px-10">Create WTB</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tradein' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight">My Trade-In Listings</h2>
                      <p className="text-slate-500 text-sm mt-1">These are the used devices you've listed for sale/trade-in.</p>
                    </div>
                    <button onClick={() => window.location.href = '/trade-in?tab=sell'} className="btn-primary !px-8 text-xs font-black uppercase tracking-widest">List New Used Device</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myTradeIns.length > 0 ? (
                      myTradeIns.map(device => (
                        <div key={device.id} className="glass-panel p-6 flex gap-4 bg-slate-900 border-white/5">
                          <img src={device.image} alt={device.name} className="w-20 h-20 rounded-xl object-cover border border-white/5" />
                          <div className="flex-grow">
                            <h4 className="text-white font-bold">{device.name}</h4>
                            <p className="text-emerald-400 font-black text-sm">{formatPrice(device.price)}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-[9px] px-2 py-0.5 bg-white/5 text-slate-500 rounded uppercase font-black">{device.condition}</span>
                              <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded uppercase font-black">Stock: {device.stock}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 glass-panel p-12 text-center">
                        <p className="text-slate-500 font-bold">You haven't listed any used devices for trade-in yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="glass-panel p-10 animate-fade-in">
                  <h2 className="text-3xl font-black text-white mb-2">Account Settings</h2>
                  <p className="text-slate-500 mb-10 text-sm">Manage your shipping info and profile details.</p>

                  <form onSubmit={handleProfileSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 flex items-center gap-6 p-6 rounded-3xl bg-slate-900 border border-slate-800">
                        <div className="relative group w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/5">
                          {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                          <label htmlFor="avatar-up" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                          </label>
                          <input id="avatar-up" name="avatarFile" type="file" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) setAvatarPreview(URL.createObjectURL(file)); }} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white mb-1">Avatar Identity</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Recomended 512x512 PNG/JPG</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Display Name</label>
                        <input type="text" className="input-field" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Contact Number</label>
                        <input type="text" className="input-field" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Shipping Address</label>
                        <textarea rows="3" className="input-field !py-4" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Enter your full shipping address for smooth deliveries..."></textarea>
                      </div>
                    </div>

                    <button type="submit" disabled={savingProfile} className="btn-primary !py-5 !px-10 flex items-center justify-center gap-3">
                      {savingProfile ? 'Updating...' : 'Save All Changes'}
                    </button>
                  </form>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && reviewModal.item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel !rounded-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Rate Product</h3>
              <button onClick={() => setReviewModal({ ...reviewModal, isOpen: false })} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 mb-6">
                <img src={reviewModal.item.image} alt={reviewModal.item.name} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-white">{reviewModal.item.name}</h4>
                  <p className="text-xs text-slate-500">How was your experience?</p>
                </div>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${reviewModal.rating >= star ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-600'}`}
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Review Comment</label>
                <textarea
                  required
                  rows="4"
                  className="input-field !py-4"
                  placeholder="Tell others about the device condition, performance, or seller's service..."
                  value={reviewModal.comment}
                  onChange={e => setReviewModal({ ...reviewModal, comment: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Photo (Optional)</label>
                <input type="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-amber-500 file:text-white" onChange={e => setReviewModal({ ...reviewModal, imageFile: e.target.files[0] })} />
              </div>

              <button type="submit" disabled={uploadingReview} className="w-full btn-primary !bg-amber-500 !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-500/20">
                {uploadingReview ? 'Publishing...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass-panel !rounded-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Return Request</h3>
              <button onClick={() => setReturnModal({ ...returnModal, isOpen: false })} className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-8 space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6">
                <p className="text-xs text-red-400 font-bold leading-relaxed">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Return requests must be made within 48 hours of delivery. TrustX verification fee is non-refundable.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Reason for Return</label>
                <select
                  required
                  className="input-field appearance-none cursor-pointer"
                  value={returnModal.reason}
                  onChange={e => setReturnModal({ ...returnModal, reason: e.target.value })}
                >
                  <option value="">Select a reason...</option>
                  <option>Defective / Not working</option>
                  <option>Item not as described</option>
                  <option>Wrong item received</option>
                  <option>Authenticity concerns</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Problem Details</label>
                <textarea
                  required
                  rows="4"
                  className="input-field !py-4"
                  placeholder="Describe the issue in detail. If defective, explain what's not working..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Proof Photo (Evidence)</label>
                <input type="file" name="returnImageFile" required className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-700 file:text-white" />
              </div>

              <button type="submit" disabled={submittingReturn} className="w-full btn-primary !bg-red-600 !py-5 font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-500/20">
                {submittingReturn ? 'Processing...' : 'Submit Return Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
