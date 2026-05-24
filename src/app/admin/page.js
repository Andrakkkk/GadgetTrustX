'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import { apiFetch } from '@/lib/api-client';

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    const [returnRequests, setReturnRequests] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // Modals state
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, itemId: null, action: null });

    const loadData = async () => {
        const ordersResponse = await apiFetch('/api/orders?scope=all');
        const ordersData = await ordersResponse.json();
        const parsedOrders = ordersData.orders || [];
        setAllOrders(parsedOrders);

        const reqs = [];
        parsedOrders.forEach(order => {
            order.items.forEach((item, idx) => {
                if (item.returnStatus === 'Pending') {
                    reqs.push({ orderId: order.id, buyerEmail: order.buyerEmail, item, itemIndex: idx });
                }
            });
        });
        setReturnRequests(reqs);

        // Products
        const devicesResponse = await fetch('/api/devices');
        const devicesData = await devicesResponse.json();
        setAllProducts(devicesData.devices || []);

        const usersResponse = await apiFetch('/api/admin/users');
        const usersData = await usersResponse.json();
        setAllUsers(usersData.users || []);
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            loadData();
        }
    }, [user]);

    // --- Orders Logic ---
    const handleOrderStatus = async (orderId, newStatus) => {
        const response = await apiFetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orderId, status: newStatus }),
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Failed to update order.');
            return;
        }
        setAllOrders((items) => items.map((order) => order.id === orderId ? data.order : order));
    };

    const handleReturnAction = async (orderId, itemIndex, action) => {
        const item = allOrders.find((order) => order.id === orderId)?.items[itemIndex];
        if (!item) return;

        const response = await apiFetch('/api/orders/returns', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderItemId: item.orderItemId, action }),
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Failed to update return request.');
            return;
        }

        await loadData();
        setConfirmModal({ isOpen: false, orderId: null, itemId: null, itemIndex: null, action: null });
        alert(`Return request ${action}d successfully.`);
    };

    // --- Products Logic ---
    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        await apiFetch(`/api/devices/${productId}`, { method: 'DELETE' });
        const updated = allProducts.filter(p => p.id !== productId);
        setAllProducts(updated);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        await apiFetch(`/api/devices/${editingProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingProduct),
        });
        const updated = allProducts.map(p => p.id === editingProduct.id ? editingProduct : p);
        setAllProducts(updated);
        setEditingProduct(null);
    };

    const handleVerifyProduct = async (productId) => {
        const current = allProducts.find((product) => product.id === productId);
        if (!current) return;
        const nextProduct = { ...current, verifiedByTrustX: !current.verifiedByTrustX };
        await apiFetch(`/api/devices/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextProduct),
        });
        const updated = allProducts.map(p => {
            if (p.id === productId) {
                return nextProduct;
            }
            return p;
        });
        setAllProducts(updated);
    };

    // --- Users Logic ---
    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const response = await apiFetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId }),
        });
        if (response.ok) {
            setAllUsers((items) => items.filter((item) => item.id !== userId));
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (editingUser.id === 'new') {
            if (!editingUser.password) { alert('Password is required for new users.'); return; }
            const response = await apiFetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to create user.');
                return;
            }
            setAllUsers((items) => [...items, data.user]);
        } else {
            const response = await apiFetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Failed to save user.');
                return;
            }
            setAllUsers((items) => items.map((item) => item.id === editingUser.id ? data.user : item));
        }
        setEditingUser(null);
    };

    const handleVerifyUser = async (userId) => {
        const current = allUsers.find((item) => item.id === userId);
        if (!current) return;
        const response = await apiFetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...current, isVerified: !current.isVerified }),
        });
        const data = await response.json();
        if (response.ok) {
            setAllUsers((items) => items.map((item) => item.id === userId ? data.user : item));
        }
    };

    const handleToggleBadge = async (userId, badge) => {
        const currentUser = allUsers.find((item) => item.id === userId);
        if (!currentUser) return;
        const current = currentUser.badges || [];
        const hasBadge = current.includes(badge);
        const badges = hasBadge ? current.filter((item) => item !== badge) : [...current, badge];
        const response = await apiFetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...currentUser, badges }),
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Failed to update badge.');
            return;
        }
        setAllUsers((items) => items.map((item) => item.id === userId ? data.user : item));
    };

    if (isLoading || user?.role !== 'admin') {
        return (
            <AuthGuard>
                <div className="flex justify-center items-center h-96">
                    <div className="glass-panel p-8 text-center">
                        <p className="text-xl text-white">Access Denied. Admin privileges required.</p>
                    </div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
                <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-700 mb-8 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Orders ({allOrders.filter(o => o.status !== 'Completed').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'products' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Products ({allProducts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 font-bold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Users ({allUsers.length})
                    </button>
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="glass-panel p-6 border-l-4 border-blue-500">
                                <p className="text-slate-400 text-sm mb-1">Total Users</p>
                                <p className="text-3xl font-bold text-white">{allUsers.length}</p>
                            </div>
                            <div className="glass-panel p-6 border-l-4 border-emerald-500">
                                <p className="text-slate-400 text-sm mb-1">Active Listings</p>
                                <p className="text-3xl font-bold text-white">{allProducts.length}</p>
                            </div>
                            <div className="glass-panel p-6 border-l-4 border-amber-500">
                                <p className="text-slate-400 text-sm mb-1">Pending Returns</p>
                                <p className="text-3xl font-bold text-white">{returnRequests.length}</p>
                            </div>
                        </div>

                        <div className="glass-panel p-8">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700/50">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Pending Return Requests</h2>
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 animate-pulse">
                                    Action Required
                                </span>
                            </div>

                            {returnRequests.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                                        <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No pending requests</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {returnRequests.map((req, idx) => (
                                        <div key={idx} className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden flex flex-col group hover:border-blue-500/30 transition-all">
                                            <div className="p-6 flex-grow">
                                                <div className="flex gap-4 mb-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border border-white/5 flex-shrink-0">
                                                        <img src={req.item.image} className="w-full h-full object-cover" alt="Product" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg leading-tight mb-1">{req.item.name}</h4>
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Order: <span className="text-slate-300">#{req.orderId.slice(-8)}</span></p>
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Buyer: <span className="text-blue-400">{req.buyerEmail}</span></p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 mb-6">
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Reason for Return</p>
                                                    <p className="text-sm text-slate-200 leading-relaxed font-medium">"{req.item.returnReason}"</p>
                                                </div>

                                                {req.item.returnImage && (
                                                    <div className="mb-6">
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Evidence Attached</p>
                                                        <div className="relative group/img rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black">
                                                            <img src={req.item.returnImage} alt="Return proof" className="w-full h-full object-contain" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button onClick={() => window.open(req.item.returnImage)} className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest">View Full Size</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 border-t border-slate-800">
                                                <button
                                                    onClick={() => setConfirmModal({ isOpen: true, orderId: req.orderId, itemIndex: req.itemIndex, action: 'approve' })}
                                                    className="py-4 bg-blue-500/5 text-blue-500 hover:bg-blue-600 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all border-r border-slate-800"
                                                >
                                                    Approve Return
                                                </button>
                                                <button
                                                    onClick={() => setConfirmModal({ isOpen: true, orderId: req.orderId, itemIndex: req.itemIndex, action: 'reject' })}
                                                    className="py-4 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="glass-panel p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-6">Manage Orders</h2>
                        {allOrders.length === 0 ? (
                            <p className="text-slate-400 text-center">No orders found.</p>
                        ) : (
                            <div className="space-y-4">
                                {allOrders.map(order => {
                                    const isLocked = ['Completed', 'Returned', 'Cancelled'].includes(order.status) ||
                                        order.items?.some(i => i.returnStatus === 'Pending' || i.returnStatus === 'Approved');
                                    return (
                                        <div key={order.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                                            {/* Order Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-slate-700/50">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-mono">{order.id}</p>
                                                        <p className="text-sm text-slate-300">{order.buyerEmail}</p>
                                                    </div>
                                                    <div className="hidden sm:block h-8 w-px bg-slate-700"></div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Date</p>
                                                        <p className="text-sm text-white">{order.date}</p>
                                                    </div>
                                                    <div className="hidden sm:block h-8 w-px bg-slate-700"></div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Total</p>
                                                        <p className="text-sm font-bold text-emerald-400">{formatPrice(order.total)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                                        order.status === 'Completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                        order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                        order.status === 'Partially Returned' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                        order.status === 'Returned' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                        order.status === 'Shipped' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                        'bg-slate-700/50 text-slate-400 border-slate-600'
                                                    }`}>{order.status}</span>
                                                    {isLocked ? (
                                                        <span className="text-xs text-slate-500 italic">Status locked</span>
                                                    ) : (
                                                        <select
                                                            className="bg-slate-900 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                                            value={order.status}
                                                            onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                                                        >
                                                            <option value="Processing">Processing</option>
                                                            <option value="Shipped">Shipped</option>
                                                            <option value="Delivered">Delivered</option>
                                                            <option value="Completed">Completed</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Items */}
                                            <div className="divide-y divide-slate-700/30">
                                                {order.items?.map((item, idx) => (
                                                    <div key={item.orderItemId || idx} className="flex items-center gap-4 px-5 py-3">
                                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-900 flex-shrink-0" />
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-sm text-white font-semibold truncate">{item.name}</p>
                                                            <p className="text-xs text-slate-500">{item.brand} · {formatPrice(item.price)}</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            {item.returnStatus === 'Pending' ? (
                                                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">↩ Return Pending</span>
                                                            ) : item.returnStatus === 'Approved' ? (
                                                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">✓ Returned</span>
                                                            ) : item.returnStatus === 'Rejected' ? (
                                                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">✕ Return Rejected</span>
                                                            ) : order.ratedItems?.includes(item.orderItemId) ? (
                                                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">★ Rated</span>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-700/50 text-slate-500 border border-slate-700">Pending Review</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                    <div className="glass-panel p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-6">Manage Products</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                        <th className="pb-3 px-4 font-semibold">Image</th>
                                        <th className="pb-3 px-4 font-semibold">Name</th>
                                        <th className="pb-3 px-4 font-semibold">Brand</th>
                                        <th className="pb-3 px-4 font-semibold">Price</th>
                                        <th className="pb-3 px-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProducts.map(product => (
                                        <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                            <td className="py-3 px-4">
                                                <img src={product.image} className="w-10 h-10 object-cover rounded bg-slate-800" />
                                            </td>
                                            <td className="py-3 px-4 text-white text-sm">{product.name}</td>
                                            <td className="py-3 px-4 text-slate-300 text-sm">{product.brand}</td>
                                            <td className="py-3 px-4 text-emerald-400 text-sm font-bold">{formatPrice(product.price)}</td>
                                            <td className="py-3 px-4 space-x-2">
                                                <button onClick={() => handleVerifyProduct(product.id)} className={`text-xs px-3 py-1 rounded transition-colors ${product.verifiedByTrustX ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'}`}>{product.verifiedByTrustX ? 'Verified' : 'Verify'}</button>
                                                <button onClick={() => setEditingProduct(product)} className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="glass-panel p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Manage Users</h2>
                            <button
                                onClick={() => setEditingUser({ id: 'new', name: '', email: '', password: '', role: 'buyer' })}
                                className="btn-primary px-4 py-2 text-sm"
                            >
                                + Add User
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                        <th className="pb-3 px-4 font-semibold">Name</th>
                                        <th className="pb-3 px-4 font-semibold">Email</th>
                                        <th className="pb-3 px-4 font-semibold">Role</th>
                                        <th className="pb-3 px-4 font-semibold">Badges (Seller)</th>
                                        <th className="pb-3 px-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map(u => (
                                        <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                            <td className="py-4 px-4 text-white text-sm">{u.name}</td>
                                            <td className="py-4 px-4 text-slate-300 text-sm">{u.email}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : u.role === 'seller' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {u.role === 'seller' && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {['Top Rated', 'Fast Shipper', 'Verified ID', 'Best Price', 'Responsive'].map(badge => {
                                                            const has = (u.badges || []).includes(badge);
                                                            return (
                                                                <button key={badge} type="button"
                                                                    onClick={() => handleToggleBadge(u.id, badge)}
                                                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${has ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-blue-500/40 hover:text-blue-400'}`}
                                                                >
                                                                    {has ? '✓ ' : ''}{badge}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 space-x-2">
                                                <button onClick={() => handleVerifyUser(u.id)} className={`text-xs px-3 py-1 rounded transition-colors ${u.isVerified ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'}`}>{u.isVerified ? 'Verified' : 'Verify'}</button>
                                                <button onClick={() => setEditingUser(u)} className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded transition-colors" disabled={u.email === user?.email}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* Editing Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Edit Product</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Price (Rp)</label>
                                <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Stock</label>
                                <input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} className="input-field" required />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary px-4 py-2">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Editing User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">{editingUser.id === 'new' ? 'Add User' : 'Edit User'}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                <input type="text" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email</label>
                                <input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Role</label>
                                <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} className="input-field">
                                    <option value="buyer">Buyer</option>
                                    <option value="seller">Seller</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">
                                    Password {editingUser.id !== 'new' && <span className="text-slate-600 text-xs ml-1">(kosongkan untuk tetap sama)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={editingUser.password || ''}
                                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                    className="input-field"
                                    required={editingUser.id === 'new'}
                                    placeholder={editingUser.id === 'new' ? 'Wajib diisi' : '••••••••'}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary px-4 py-2">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center animate-scale-in">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${confirmModal.action === 'approve' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                            {confirmModal.action === 'approve' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Confirm {confirmModal.action}al</h3>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">Are you sure you want to <span className="text-white font-bold">{confirmModal.action}</span> this return request? This action cannot be undone.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, orderId: null, itemId: null, action: null })}
                                className="py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReturnAction(confirmModal.orderId, confirmModal.itemIndex, confirmModal.action)}
                                className={`py-3 rounded-xl font-bold text-white transition-all ${confirmModal.action === 'approve' ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'}`}
                            >
                                Yes, {confirmModal.action}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthGuard>
    );
}
