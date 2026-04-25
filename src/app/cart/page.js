'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import { formatPrice } from '@/utils/formatPrice';
import Link from 'next/link';

export default function CartPage() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gadgetTrustX_cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  const handleRemove = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
    localStorage.setItem('gadgetTrustX_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleQuantityChange = (index, delta) => {
    const newCart = [...cartItems];
    const item = newCart[index];
    const newQty = (item.cartQty || 1) + delta;
    
    if (newQty <= 0) {
      handleRemove(index);
      return;
    }
    if (newQty > item.stock) {
      alert(`Sorry, the seller only has ${item.stock} in stock!`);
      return;
    }
    
    item.cartQty = newQty;
    setCartItems(newCart);
    localStorage.setItem('gadgetTrustX_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleCheckout = () => {
    setCheckingOut(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // 1. Process Orders (Save to Order History)
      const savedOrders = localStorage.getItem('gadgetTrustX_orders');
      let orders = savedOrders ? JSON.parse(savedOrders) : [];
      
      const newOrder = {
        id: 'ORD-' + Date.now(),
        buyerEmail: user.email,
        date: new Date().toLocaleDateString(),
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + (item.price * (item.cartQty || 1)), 0),
        status: 'Processing'
      };
      
      orders.unshift(newOrder);
      localStorage.setItem('gadgetTrustX_orders', JSON.stringify(orders));

      // 2. Decrease Stock in Global Inventory
      const savedDevices = localStorage.getItem('gadgetTrustX_devices');
      if (savedDevices) {
        let devices = JSON.parse(savedDevices);
        cartItems.forEach(cartItem => {
          const deviceIndex = devices.findIndex(d => d.id === cartItem.id);
          const qty = cartItem.cartQty || 1;
          if (deviceIndex !== -1 && devices[deviceIndex].stock >= qty) {
            devices[deviceIndex].stock -= qty;
          }
        });
        localStorage.setItem('gadgetTrustX_devices', JSON.stringify(devices));
      }

      // 3. Clear Cart
      setCartItems([]);
      localStorage.removeItem('gadgetTrustX_cart');
      window.dispatchEvent(new Event('cartUpdated'));
      
      setCheckingOut(false);
      setCheckoutSuccess(true);
    }, 2000);
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * (item.cartQty || 1)), 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + (item.cartQty || 1), 0);

  if (user?.role !== 'buyer') {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center h-96">
          <div className="glass-panel p-8 text-center">
            <p className="text-xl text-white">Only Buyers have a shopping cart.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (checkoutSuccess) {
    return (
      <AuthGuard>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="glass-panel p-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-8">Your order has been placed and is being processed by the sellers.</p>
            <Link href="/buyer-profile" className="btn-primary px-8 py-3">View Order History</Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Your Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <svg className="w-20 h-20 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <h2 className="text-2xl font-medium text-slate-300 mb-2">Your cart is empty</h2>
            <p className="text-slate-400 mb-8">Looks like you haven't added any devices to your cart yet.</p>
            <Link href="/marketplace" className="btn-primary px-8">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="glass-panel p-4 flex items-center gap-4 relative pr-12">
                  <button 
                    onClick={() => handleRemove(index)}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-slate-800" />
                  <div>
                    <p className="text-xs text-blue-400 mb-1">{item.brand}{item.condition ? ` • ${item.condition}` : ''}</p>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{item.name}</h3>
                    <p className="text-emerald-400 font-bold">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border border-slate-700 rounded-lg w-max bg-slate-900/50">
                        <button onClick={() => handleQuantityChange(index, -1)} className="px-3 py-1 text-slate-400 hover:text-white transition-colors">-</button>
                        <span className="px-3 py-1 text-sm text-white font-medium min-w-[2rem] text-center">{item.cartQty || 1}</span>
                        <button onClick={() => handleQuantityChange(index, 1)} className="px-3 py-1 text-slate-400 hover:text-white transition-colors">+</button>
                      </div>
                      <p className="text-xs text-slate-500">Sold by: {item.seller.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="glass-panel p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal ({totalItemsCount} items)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>TrustX Protection Fee</span>
                    <span className="text-emerald-400">Free</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-b border-slate-700 pb-4">
                    <span>Shipping</span>
                    <span className="text-emerald-400">Free</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-xl pt-2">
                    <span>Total</span>
                    <span className="text-emerald-400">{formatPrice(total)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="btn-primary w-full py-4 text-lg font-bold flex justify-center items-center"
                >
                  {checkingOut ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing...
                    </>
                  ) : 'Proceed to Checkout'}
                </button>
                <div className="mt-4 flex items-center justify-center text-xs text-slate-500">
                  <svg className="w-4 h-4 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Secure SSL Encryption
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
