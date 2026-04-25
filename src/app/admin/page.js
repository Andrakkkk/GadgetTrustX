'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';

export default function AdminPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    const [returnRequests, setReturnRequests] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // Modals state
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            loadData();
        }
    }, [user]);

    const loadData = () => {
        // Orders
        const savedOrders = localStorage.getItem('gadgetTrustX_orders');
        if (savedOrders) {
            const parsedOrders = JSON.parse(savedOrders);
            setAllOrders(parsedOrders);

            const reqs = [];
            parsedOrders.forEach(order => {
                order.items.forEach(item => {
                    if (item.returnStatus === 'Pending') {
                        reqs.push({ orderId: order.id, buyerEmail: order.buyerEmail, item: item });
                    }
                });
            });
            setReturnRequests(reqs);
        }

        // Products
        const savedDevices = localStorage.getItem('gadgetTrustX_devices');
        if (savedDevices) {
            let parsed = JSON.parse(savedDevices);
            let updated = false;
            // Ensure we import dummyDevices at the top of the file if needed, but since it's admin,
            // we'll just let marketplace handle the main seeding, or we can just read.
            setAllProducts(parsed);
        }

        // Users
        let savedUsers = localStorage.getItem('gadgetTrustX_users');
        if (!savedUsers) {
            const defaultUsers = [
                { id: 'user_1', email: 'admin@gmail.com', name: 'Admin', role: 'admin', password: 'admin' },
                { id: 'user_2', email: 'buyer@gmail.com', name: 'Test Buyer', role: 'buyer', password: 'buyer' },
                { id: 'user_3', email: 'seller@gmail.com', name: 'Test Seller', role: 'seller', password: 'seller' }          ];
            localStorage.setItem('gadgetTrustX_users', JSON.stringify(defaultUsers));
            setAllUsers(defaultUsers);
        } else {
            setAllUsers(JSON.parse(savedUsers));
        }
    };

    // --- Orders Logic ---
    const handleOrderStatus = (orderId, newStatus) => {
        const updated = allOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        localStorage.setItem('gadgetTrustX_orders', JSON.stringify(updated));
        setAllOrders(updated);
    };

    const handleReturnAction = (orderId, itemId, action) => {
        if (!confirm(`Are you sure you want to ${action} this return?`)) return;

        let updatedOrders = [...allOrders];
        let found = false;
        for (let i = 0; i < updatedOrders.length; i++) {
            if (updatedOrders[i].id === orderId) {
                for (let j = 0; j < updatedOrders[i].items.length; j++) {
                    if (updatedOrders[i].items[j].id === itemId) {
                        updatedOrders[i].items[j].returnStatus = action === 'approve' ? 'Approved' : 'Rejected';
                        found = true;
                        break;
                    }
                }
            }
            if (found) break;
        }

        if (found) {
            localStorage.setItem('gadgetTrustX_orders', JSON.stringify(updatedOrders));
            setAllOrders(updatedOrders);
            setReturnRequests(returnRequests.filter(req => !(req.orderId === orderId && req.item.id === itemId)));
        }
    };

    // --- Products Logic ---
    const handleDeleteProduct = (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const updated = allProducts.filter(p => p.id !== productId);
        localStorage.setItem('gadgetTrustX_devices', JSON.stringify(updated));
        setAllProducts(updated);
    };

    const handleSaveProduct = (e) => {
        e.preventDefault();
        const updated = allProducts.map(p => p.id === editingProduct.id ? editingProduct : p);
        localStorage.setItem('gadgetTrustX_devices', JSON.stringify(updated));
        setAllProducts(updated);
        setEditingProduct(null);
    };

    const handleVerifyProduct = (productId) => {
        const updated = allProducts.map(p => {
            if (p.id === productId) {
                return { ...p, verifiedByTrustX: !p.verifiedByTrustX };
            }
            return p;
        });
        localStorage.setItem('gadgetTrustX_devices', JSON.stringify(updated));
        setAllProducts(updated);
    };

    // --- Users Logic ---
    const handleDeleteUser = (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const updated = allUsers.filter(u => u.id !== userId);
        localStorage.setItem('gadgetTrustX_users', JSON.stringify(updated));
        setAllUsers(updated);
    };

    const handleSaveUser = (e) => {
        e.preventDefault();
        if (editingUser.id === 'new') {
            const newUser = { ...editingUser, id: 'user_' + Date.now() };
            const updated = [...allUsers, newUser];
            localStorage.setItem('gadgetTrustX_users', JSON.stringify(updated));
            setAllUsers(updated);
        } else {
            const updated = allUsers.map(u => u.id === editingUser.id ? editingUser : u);
            localStorage.setItem('gadgetTrustX_users', JSON.stringify(updated));
            setAllUsers(updated);
        }
        setEditingUser(null);
    };

    const handleVerifyUser = (userId) => {
        const updated = allUsers.map(u => {
            if (u.id === userId) {
                return { ...u, isVerified: !u.isVerified };
            }
            return u;
        });
        localStorage.setItem('gadgetTrustX_users', JSON.stringify(updated));
        setAllUsers(updated);
    };

    if (user?.role !== 'admin') {
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
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-700 mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        Orders ({allOrders.filter(o => o.status !== 'Completed').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'products' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        Products ({allProducts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
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
                            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Pending Return Requests</h2>
                            {returnRequests.length === 0 ? (
                                <p className="text-slate-400 text-center py-6">No pending return requests at the moment.</p>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {returnRequests.map((req, idx) => (
                                        <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold text-white">{req.item.name}</p>
                                                    <p className="text-xs text-slate-400">Order ID: {req.orderId}</p>
                                                    <p className="text-xs text-slate-400">Buyer: {req.buyerEmail}</p>
                                                </div>
                                                <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs border border-amber-500/30">Action Required</span>
                                            </div>
                                            <div className="bg-slate-900/50 p-3 rounded mt-3 mb-3 border border-slate-700/30">
                                                <p className="text-sm text-slate-300"><span className="text-slate-500 mr-2">Reason:</span>{req.item.returnReason}</p>
                                            </div>
                                            {req.item.returnImage && (
                                                <div className="mb-4">
                                                    <p className="text-xs text-slate-500 mb-2">Attached Proof:</p>
                                                    <img src={req.item.returnImage} alt="Return proof" className="w-full max-w-sm h-auto object-contain rounded-lg border border-slate-700 shadow-md" />
                                                </div>
                                            )}
                                            <div className="flex gap-2 border-t border-slate-700/50 pt-3">
                                                <button
                                                    onClick={() => handleReturnAction(req.orderId, req.item.id, 'approve')}
                                                    className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 py-2 rounded text-sm transition-colors"
                                                >
                                                    Approve Return
                                                </button>
                                                <button
                                                    onClick={() => handleReturnAction(req.orderId, req.item.id, 'reject')}
                                                    className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 py-2 rounded text-sm transition-colors"
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                            <th className="pb-3 px-4 font-semibold">Order ID</th>
                                            <th className="pb-3 px-4 font-semibold">Buyer</th>
                                            <th className="pb-3 px-4 font-semibold">Total</th>
                                            <th className="pb-3 px-4 font-semibold">Date</th>
                                            <th className="pb-3 px-4 font-semibold">Status</th>
                                            <th className="pb-3 px-4 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allOrders.map(order => (
                                            <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                                <td className="py-4 px-4 text-white text-sm font-mono">{order.id}</td>
                                                <td className="py-4 px-4 text-slate-300 text-sm">{order.buyerEmail}</td>
                                                <td className="py-4 px-4 text-emerald-400 text-sm font-bold">{formatPrice(order.total)}</td>
                                                <td className="py-4 px-4 text-slate-400 text-sm">{order.date}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <select
                                                        className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                                        value={order.status}
                                                        onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                                                        disabled={order.status === 'Completed'}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Processing">Processing</option>
                                                        <option value="Shipped">Shipped</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                onClick={() => setEditingUser({ id: 'new', name: '', email: '', role: 'buyer' })}
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
                                            <td className="py-4 px-4 space-x-2">
                                                <button onClick={() => handleVerifyUser(u.id)} className={`text-xs px-3 py-1 rounded transition-colors ${u.isVerified ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'}`}>{u.isVerified ? 'Verified' : 'Verify'}</button>
                                                <button onClick={() => setEditingUser(u)} className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded transition-colors" disabled={u.email === user.email}>Delete</button>
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
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 btn-primary px-4 py-2">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthGuard>
    );
}
