'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';

export default function BuyerProfilePage() {
  const { user, updateProfile } = useAuth();
  
  // WTB (Want to Buy) Listings State
  const [wtbList, setWtbList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    device: '',
    budget: '',
    condition: 'Any',
    notes: ''
  });

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
    alert('Profile updated successfully!');
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedList = localStorage.getItem('gadgetTrustX_wtbListings');
    if (savedList) {
      setWtbList(JSON.parse(savedList));
    }
  }, []);

  // Save to localStorage whenever list changes
  useEffect(() => {
    localStorage.setItem('gadgetTrustX_wtbListings', JSON.stringify(wtbList));
  }, [wtbList]);

  // Handle Form Submit (Create & Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.device || !formData.budget) return;

    if (editingId) {
      // Update
      setWtbList(wtbList.map(item => 
        item.id === editingId 
          ? { ...item, ...formData, date: new Date().toLocaleDateString() } 
          : item
      ));
    } else {
      // Create
      const newItem = {
        id: Date.now().toString(),
        authorEmail: user.email,
        authorName: user.name,
        date: new Date().toLocaleDateString(),
        ...formData
      };
      setWtbList([newItem, ...wtbList]);
    }

    // Reset
    setFormData({ device: '', budget: '', condition: 'Any', notes: '' });
    setShowForm(false);
    setEditingId(null);
  };

  // Handle Delete
  const handleDelete = (id) => {
    setWtbList(wtbList.filter(item => item.id !== id));
  };

  // Handle Edit Click
  const handleEdit = (item) => {
    setFormData({
      device: item.device,
      budget: item.budget,
      condition: item.condition,
      notes: item.notes
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  // Fetch Orders
  const [orders, setOrders] = useState([]);
  const [myTradeIns, setMyTradeIns] = useState([]);
  const [editingTradeIn, setEditingTradeIn] = useState(null);
  const [activeTab, setActiveTab] = useState('wtb'); // 'wtb', 'orders', 'tradein', 'profile'
  const [reviews, setReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null, orderId: null, rating: 5, comment: '', imageFile: null });
  const [uploadingReview, setUploadingReview] = useState(false);
  const [returnModal, setReturnModal] = useState({ isOpen: false, item: null, orderId: null, reason: '', imageFile: null });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const submitReview = async (e) => {
    e.preventDefault();
    setUploadingReview(true);
    let imageUrl = '';
    if (reviewModal.imageFile) {
      const fd = new FormData();
      fd.append('file', reviewModal.imageFile);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) {
        console.error("Failed to upload", err);
      }
    }

    const newReview = {
      id: 'rev_' + Date.now(),
      deviceId: reviewModal.item.id,
      orderId: reviewModal.orderId,
      buyerName: user.name,
      rating: reviewModal.rating,
      comment: reviewModal.comment,
      image: imageUrl,
      date: new Date().toLocaleDateString()
    };
    const saved = localStorage.getItem('gadgetTrustX_reviews');
    let allReviews = saved ? JSON.parse(saved) : [];
    allReviews.push(newReview);
    localStorage.setItem('gadgetTrustX_reviews', JSON.stringify(allReviews));
    setReviews(allReviews);
    setUploadingReview(false);
    setReviewModal({ isOpen: false, item: null, orderId: null, rating: 5, comment: '', imageFile: null });
    alert('Review submitted! It will now appear on the product page.');
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);
    let imageUrl = '';
    if (returnModal.imageFile) {
      const fd = new FormData();
      fd.append('file', returnModal.imageFile);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) imageUrl = data.url;
      } catch (err) {
        console.error("Failed to upload", err);
      }
    }

    const newOrders = [...orders];
    const orderIndex = newOrders.findIndex(o => o.id === returnModal.orderId);
    if (orderIndex !== -1) {
      const itemIndex = newOrders[orderIndex].items.findIndex(i => i.id === returnModal.item.id);
      if (itemIndex !== -1) {
        newOrders[orderIndex].items[itemIndex].returnStatus = 'Pending';
        newOrders[orderIndex].items[itemIndex].returnReason = returnModal.reason;
        newOrders[orderIndex].items[itemIndex].returnImage = imageUrl;
      }
    }
    
    // Save to global orders
    const savedOrders = localStorage.getItem('gadgetTrustX_orders');
    if (savedOrders) {
      let globalOrders = JSON.parse(savedOrders);
      const gOrderIndex = globalOrders.findIndex(o => o.id === returnModal.orderId);
      if (gOrderIndex !== -1) {
        globalOrders[gOrderIndex] = newOrders[orderIndex];
        localStorage.setItem('gadgetTrustX_orders', JSON.stringify(globalOrders));
      }
    }
    
    setOrders(newOrders);
    setSubmittingReturn(false);
    setReturnModal({ isOpen: false, item: null, orderId: null, reason: '', imageFile: null });
    alert('Return request submitted and is waiting for Admin approval.');
  };

  useEffect(() => {
    const savedOrders = localStorage.getItem('gadgetTrustX_orders');
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders);
      setOrders(allOrders.filter(o => o.buyerEmail === user?.email));
    }
    const savedDevices = localStorage.getItem('gadgetTrustX_devices');
    if (savedDevices) {
      const allDevices = JSON.parse(savedDevices);
      setMyTradeIns(allDevices.filter(d => d.isTradeIn && d.seller.id === user?.email));
    }
    const savedReviews = localStorage.getItem('gadgetTrustX_reviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, [user]);

  const handleDeleteTradeIn = (deviceId) => {
    if(!confirm('Are you sure you want to delete this listing?')) return;
    const savedDevices = localStorage.getItem('gadgetTrustX_devices');
    let allDevices = JSON.parse(savedDevices);
    allDevices = allDevices.filter(d => d.id !== deviceId);
    localStorage.setItem('gadgetTrustX_devices', JSON.stringify(allDevices));
    setMyTradeIns(myTradeIns.filter(d => d.id !== deviceId));
  };

  const handleSaveTradeIn = (e) => {
    e.preventDefault();
    const savedDevices = localStorage.getItem('gadgetTrustX_devices');
    let allDevices = JSON.parse(savedDevices);
    const idx = allDevices.findIndex(d => d.id === editingTradeIn.id);
    if (idx !== -1) {
      allDevices[idx] = editingTradeIn;
      localStorage.setItem('gadgetTrustX_devices', JSON.stringify(allDevices));
      setMyTradeIns(myTradeIns.map(d => d.id === editingTradeIn.id ? editingTradeIn : d));
    }
    setEditingTradeIn(null);
  };

  if (user?.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center h-96">
          <div className="glass-panel p-8 text-center">
            <p className="text-xl text-white">Please log in as a Buyer to view this page.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Filter listings by current user
  const myRequests = wtbList.filter(item => item.authorEmail === user.email);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Profile */}
        <div className="glass-panel p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl"></div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 p-1 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}'s Buyer Dashboard</h1>
              <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/50">
                Verified Buyer
              </span>
              <p className="text-slate-400 mt-4 max-w-xl mx-auto md:mx-0">
                Manage your profile, view purchase history, and post "Want to Buy" (WTB) requests for sellers to see.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-500/30 text-center min-w-[120px]">
                <p className="text-slate-400 text-xs mb-2 uppercase font-semibold">Active WTB</p>
                <div className="text-3xl font-bold text-emerald-400">{myRequests.length}</div>
              </div>
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-blue-500/30 text-center min-w-[120px]">
                <p className="text-slate-400 text-xs mb-2 uppercase font-semibold">Total Orders</p>
                <div className="text-3xl font-bold text-blue-400">{orders.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('wtb')}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'wtb' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            "Want to Buy" Board
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Order History
          </button>
          <button 
            onClick={() => setActiveTab('tradein')}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'tradein' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            My Trade-In Listings
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            My Profile
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="max-w-2xl animate-fade-in glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={profileForm.name}
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  placeholder="e.g. 08123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Address</label>
                <textarea 
                  className="input-field min-h-[100px]"
                  value={profileForm.address}
                  onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                  placeholder="Full shipping address..."
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-3">Save Profile</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {orders.length === 0 ? (
              <div className="glass-panel p-16 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                <h3 className="text-xl text-slate-300 font-medium mb-2">No Orders Yet</h3>
                <p className="text-slate-500 mb-6">Explore the marketplace and make your first purchase.</p>
                <a href="/marketplace" className="btn-primary px-6 py-2">Go to Marketplace</a>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="glass-panel p-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                    <div>
                      <span className="text-xs text-slate-400">Order ID</span>
                      <p className="font-mono text-sm text-slate-200">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Order Date</span>
                      <p className="text-sm text-slate-200">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Status</span>
                      <p className="text-sm font-bold text-blue-400">{order.status}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Total Amount</span>
                      <p className="text-lg font-bold text-emerald-400">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                        <div className="flex-grow">
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">Seller: {item.seller.name} <span className="ml-2 font-bold text-slate-300">Qty: {item.cartQty || 1}</span></p>
                          {item.returnStatus && (
                            <p className={`text-xs mt-1 font-bold ${item.returnStatus === 'Pending' ? 'text-amber-400' : item.returnStatus === 'Approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                              Return Status: {item.returnStatus}
                            </p>
                          )}
                        </div>
                        <div className="ml-auto text-right flex flex-col gap-2">
                          <p className="text-emerald-400 font-medium text-sm mb-1">{formatPrice(item.price)}</p>
                          <div className="flex flex-col gap-2 justify-end items-end">
                            {order.status === 'Delivered' && idx === 0 && (
                              <button 
                                onClick={() => {
                                  if(!confirm('Apakah Anda yakin pesanan sudah selesai dan diterima dengan baik? Setelah ini Anda tidak bisa melakukan retur.')) return;
                                  const savedOrders = localStorage.getItem('gadgetTrustX_orders');
                                  if (savedOrders) {
                                    let globalOrders = JSON.parse(savedOrders);
                                    const updated = globalOrders.map(o => o.id === order.id ? { ...o, status: 'Completed' } : o);
                                    localStorage.setItem('gadgetTrustX_orders', JSON.stringify(updated));
                                    setOrders(updated.filter(o => o.buyerEmail === user.email));
                                  }
                                }}
                                className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md transition-colors font-bold w-fit shadow-lg shadow-blue-500/20"
                              >
                                Pesanan Selesai
                              </button>
                            )}

                            <div className="flex gap-2 justify-end mt-1">
                              {!item.returnStatus && order.status !== 'Completed' && (
                                <button 
                                  onClick={() => setReturnModal({ isOpen: true, item, orderId: order.id, reason: '', imageFile: null })}
                                  className="text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1 rounded-md transition-colors"
                                >
                                  Return
                                </button>
                              )}
                              
                              {order.status === 'Completed' && !reviews.some(r => r.orderId === order.id && r.deviceId === item.id) ? (
                                <button 
                                  onClick={() => setReviewModal({ isOpen: true, item, orderId: order.id, rating: 5, comment: '', imageFile: null })}
                                  className="text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-3 py-1 rounded-md transition-colors"
                                >
                                  Rate Product
                                </button>
                              ) : order.status === 'Completed' ? (
                                <span className="text-xs text-emerald-400 px-3 py-1 border border-emerald-500/30 rounded-md">Rated ✓</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Trade-In Listings Tab */}
        {activeTab === 'tradein' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">My Trade-In Devices</h2>
                <p className="text-slate-400 text-sm mt-1">Manage the used devices you are selling on the Trade-In Catalog.</p>
              </div>
              <a href="/trade-in" className="btn-primary px-4 py-2 text-sm flex items-center">
                Sell Another Device
              </a>
            </div>

            {myTradeIns.length === 0 ? (
              <div className="glass-panel p-16 text-center">
                <h3 className="text-xl text-slate-300 font-medium mb-2">No Active Listings</h3>
                <p className="text-slate-500">You haven't listed any devices for trade-in yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTradeIns.map(device => (
                  <div key={device.id} className="glass-panel p-5 relative">
                    <img src={device.image} alt={device.name} className="w-full h-40 object-cover rounded-lg bg-slate-800 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-1">{device.name}</h3>
                    <p className="text-emerald-400 font-bold mb-4">{formatPrice(device.price)}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingTradeIn({...device})} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors">Edit</button>
                      <button onClick={() => handleDeleteTradeIn(device.id)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm transition-colors border border-red-500/20">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WTB Board Section */}
        {activeTab === 'wtb' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">My "Want to Buy" Requests</h2>
            <p className="text-slate-400 text-sm mt-1">These requests are visible to all sellers across the platform.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ device: '', budget: '', condition: 'Any', notes: '' });
              setEditingId(null);
              setShowForm(!showForm);
            }} 
            className="btn-primary py-2 px-4 flex items-center"
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {/* Form Modal / Area */}
        {showForm && (
          <div className="glass-panel p-6 mb-8 border-l-4 border-emerald-500 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Request' : 'Post a New Request'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Target Device</label>
                  <input 
                    type="text" 
                    placeholder="e.g. iPhone 13 Pro 256GB" 
                    className="input-field"
                    value={formData.device}
                    onChange={e => setFormData({...formData, device: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Maximum Budget (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 15000000" 
                    className="input-field"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Minimum Condition</label>
                  <select 
                    className="input-field appearance-none"
                    value={formData.condition}
                    onChange={e => setFormData({...formData, condition: e.target.value})}
                  >
                    <option>Any</option>
                    <option>Fair</option>
                    <option>Good</option>
                    <option>Excellent</option>
                    <option>Like New</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Additional Notes</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Must be battery > 90%" 
                    className="input-field"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary px-6">
                  {editingId ? 'Save Changes' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listings */}
        <div className="space-y-4">
          {myRequests.length === 0 && !showForm ? (
            <div className="glass-panel p-12 text-center text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <p>You haven't posted any requests yet.</p>
              <button onClick={() => setShowForm(true)} className="text-emerald-400 hover:underline mt-2">Post your first request</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myRequests.map(item => (
                <div key={item.id} className="glass-panel p-6 relative group">
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-20">
                    <h3 className="text-xl font-bold text-white">{item.device}</h3>
                    <span className="text-lg font-bold text-emerald-400">Up to {formatPrice(item.budget)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded">
                      Condition: {item.condition}
                    </span>
                    <span className="text-xs text-slate-500 px-2 py-1">
                      Posted: {item.date}
                    </span>
                  </div>

                  {item.notes && (
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-sm text-slate-400"><span className="text-slate-300 font-medium">Notes:</span> {item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
        
        {/* Global Board Visibility Note */}
        <div className="mt-12 text-center p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl max-w-3xl mx-auto">
          <svg className="w-8 h-8 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
          <h4 className="font-semibold text-blue-300 mb-1">Global Marketplace Connection</h4>
          <p className="text-sm text-blue-200/70">
            Because this data is stored in the browser's shared storage, any request you post here will be visible to sellers who log into this same system, ensuring your data remains connected across different test accounts.
          </p>
        </div>

        {/* Review Modal */}
        {reviewModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setReviewModal({ isOpen: false, item: null, orderId: null, rating: 5, comment: '', imageFile: null })}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <h3 className="text-xl font-bold text-white mb-2">Review Product</h3>
              <p className="text-sm text-slate-400 mb-6">How was your experience with {reviewModal.item.name}?</p>
              
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star} 
                        type="button" 
                        onClick={() => setReviewModal({...reviewModal, rating: star})}
                        className={`text-2xl transition-colors ${star <= reviewModal.rating ? 'text-amber-400' : 'text-slate-600 hover:text-slate-500'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Review</label>
                  <textarea 
                    rows="4" 
                    required 
                    placeholder="Tell others what you think about this device and the seller..." 
                    className="input-field bg-slate-900 border-slate-700 focus:border-blue-500"
                    value={reviewModal.comment}
                    onChange={e => setReviewModal({...reviewModal, comment: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Photo (Optional)</label>
                  <input type="file" accept="image/*" className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" onChange={e => setReviewModal({...reviewModal, imageFile: e.target.files[0]})} />
                </div>
                <button type="submit" disabled={uploadingReview} className="btn-primary w-full py-3">
                  {uploadingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {returnModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setReturnModal({ isOpen: false, item: null, orderId: null, reason: '', imageFile: null })}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <h3 className="text-xl font-bold text-white mb-2">Request Return</h3>
              <p className="text-sm text-slate-400 mb-6">Returning {returnModal.item.name}. Admins will review your request.</p>
              
              <form onSubmit={submitReturn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Return</label>
                  <textarea 
                    rows="4" 
                    required 
                    placeholder="Explain why you are returning this item (e.g., damaged, not as described)..." 
                    className="input-field bg-slate-900 border-slate-700 focus:border-red-500"
                    value={returnModal.reason}
                    onChange={e => setReturnModal({...returnModal, reason: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Photo Proof (Optional but highly recommended)</label>
                  <input type="file" accept="image/*" className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500/20 file:text-red-400 hover:file:bg-red-500/30" onChange={e => setReturnModal({...returnModal, imageFile: e.target.files[0]})} />
                </div>
                <button type="submit" disabled={submittingReturn} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Trade-In Edit Modal */}
        {editingTradeIn && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-lg w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Edit Trade-In Listing</h2>
              <form onSubmit={handleSaveTradeIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price (Rp)</label>
                  <input 
                    type="number" required 
                    className="input-field bg-slate-800 border-slate-700" 
                    value={editingTradeIn.price} 
                    onChange={e => setEditingTradeIn({...editingTradeIn, price: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea 
                    rows="3" required 
                    className="input-field bg-slate-800 border-slate-700" 
                    value={editingTradeIn.description} 
                    onChange={e => setEditingTradeIn({...editingTradeIn, description: e.target.value})} 
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingTradeIn(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
