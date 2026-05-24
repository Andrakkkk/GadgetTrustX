'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

export default function CartPage() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      apiFetch('/api/cart')
        .then((res) => res.json())
        .then((data) => setCartItems((data.items || []).map((item) => ({ ...item, selected: true }))))
        .catch((error) => console.error('Failed to load cart', error));
    }
  }, [user]);

  const handleRemove = async (index) => {
    const item = cartItems[index];
    const res = await apiFetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItemId: item.cartItemId }),
    });
    const data = await res.json();
    setCartItems((data.items || []).map((cartItem) => ({ ...cartItem, selected: true })));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleQuantityChange = async (index, delta) => {
    const item = cartItems[index];
    const newQty = (item.cartQty || 1) + delta;
    if (newQty <= 0) { handleRemove(index); return; }
    if (newQty > item.stock) { alert(`Only ${item.stock} in stock!`); return; }
    const res = await apiFetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItemId: item.cartItemId, quantity: newQty }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Unable to update quantity.');
      return;
    }
    setCartItems((data.items || []).map((cartItem) => ({ ...cartItem, selected: true })));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const toggleSelect = (index) => {
    const newCart = [...cartItems];
    newCart[index].selected = !newCart[index].selected;
    setCartItems(newCart);
  };

  const selectedItems = cartItems.filter(item => item.selected);
  const total = selectedItems.reduce((sum, item) => sum + (item.price * (item.cartQty || 1)), 0);

  const handleCheckout = () => {
    setCheckingOut(true);
    setTimeout(async () => {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemIds: selectedItems.map((item) => item.cartItemId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Checkout failed.');
        setCheckingOut(false);
        return;
      }

      const cartRes = await apiFetch('/api/cart');
      const cartData = await cartRes.json();
      setCartItems((cartData.items || []).map((cartItem) => ({ ...cartItem, selected: true })));
      window.dispatchEvent(new Event('cartUpdated'));
      setCheckingOut(false);
      setCheckoutSuccess(true);
    }, 2000);
  };



  if (user?.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-panel p-10 text-center max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
            <p className="text-slate-500 mb-0">Only Buyers can access the shopping cart features.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (checkoutSuccess) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-panel p-12 text-center max-w-lg w-full animate-fade-in">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Order Confirmed</h2>
            <p className="text-slate-500 mb-10 font-medium">Your payment was successful and the seller has been notified.</p>
            <Link href="/buyer-profile" className="btn-primary !px-12">View My Orders</Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Shopping <span className="text-blue-500">Cart</span></h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{cartItems.length} items total • {selectedItems.length} selected</p>
          </div>

          {cartItems.length === 0 ? (
            <div className="glass-panel p-20 text-center animate-fade-in">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-800">
                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Cart is Empty</h3>
              <p className="text-slate-500 mb-10">Your next favorite gadget is waiting in the marketplace.</p>
              <Link href="/marketplace" className="btn-primary !px-10">Start Shopping</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
              <div className="lg:col-span-8 space-y-6">
                {cartItems.map((item, index) => (
                  <div key={index} className={`glass-panel p-6 flex flex-col sm:flex-row items-center gap-8 relative group transition-all ${item.selected ? 'border-blue-500/30' : 'opacity-60 border-transparent grayscale-[0.5]'}`}>
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleSelect(index)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.selected ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
                      >
                        {item.selected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </button>
                    </div>
                    <button onClick={() => handleRemove(index)} className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <img src={item.image} alt={item.name} className="w-32 h-32 object-cover rounded-2xl bg-slate-900 shadow-2xl" />
                    <div className="flex-grow">
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">{item.brand}</p>
                      <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                      <p className="text-lg font-black text-white mb-4">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-white/5">
                          <button onClick={() => handleQuantityChange(index, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-all">-</button>
                          <span className="w-10 text-center text-xs font-black text-white">{item.cartQty || 1}</span>
                          <button onClick={() => handleQuantityChange(index, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-all">+</button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Seller: <span className="text-slate-300">{item.seller?.name || 'Unknown Seller'}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4">
                <div className="glass-panel p-8 sticky top-24">
                  <h3 className="text-xl font-black text-white mb-8 border-b border-white/5 pb-4 uppercase tracking-tighter">Summary</h3>
                  <div className="space-y-4 mb-10">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-white">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Tax (VAT)</span>
                      <span className="text-emerald-400">0.00</span>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-white/5">
                      <span className="text-sm font-black text-white uppercase tracking-widest">Total</span>
                      <span className="text-xl font-black text-emerald-400">{formatPrice(total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut || selectedItems.length === 0}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center transition-all ${checkingOut || selectedItems.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'btn-primary shadow-2xl shadow-blue-500/20'}`}
                  >
                    {checkingOut ? 'Authenticating...' : `Checkout (${selectedItems.length})`}
                  </button>
                  <p className="text-[10px] text-slate-600 font-medium text-center mt-6 flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Secure Checkout via TrustX Engine
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
