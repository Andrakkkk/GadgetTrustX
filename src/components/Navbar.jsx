'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const saved = localStorage.getItem('gadgetTrustX_cart');
    if (saved) {
      const cartItems = JSON.parse(saved);
      const totalCount = cartItems.reduce((sum, item) => sum + (item.cartQty || 1), 0);
      setCartCount(totalCount);
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    if (user?.role === 'buyer') {
      updateCartCount();
      window.addEventListener('cartUpdated', updateCartCount);
      return () => window.removeEventListener('cartUpdated', updateCartCount);
    }
  }, [user]);

  const navLinks = [
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Price Checker', path: '/price-checker' },
    { name: 'Verification', path: '/verification' },
    { name: 'Smart Match', path: '/smart-matching' },
    { name: 'Trade-In', path: '/trade-in' },
  ];

  return (
    <nav className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              GadgetTrustX
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-6 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  pathname === link.path ? 'text-blue-500' : 'text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 border-l border-slate-700 pl-4">
                {user.role === 'buyer' && (
                  <Link href="/cart" id="cart-icon" className="relative p-2 text-slate-300 hover:text-white transition-colors group">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full group-hover:bg-red-600 transition-colors shadow-lg animate-bounce" id="cart-badge">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link 
                  href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller-profile' : '/buyer-profile'} 
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  My Profile
                </Link>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-200">{user.name}</span>
                  <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 text-right">Logout</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 border-l border-slate-700 pl-4">
                <Link href="/login" className="text-slate-300 hover:text-white text-sm font-medium">Sign In</Link>
                <Link href="/register" className="btn-primary py-2 px-4 text-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
