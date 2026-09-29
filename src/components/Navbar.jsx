'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 20);
      setVisible(true);
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      if (!user) {
        if (isMounted) {
          setCartCount(0);
          setUnreadCount(0);
        }
        return;
      }
      try {
        const [cartResponse, chatsResponse] = await Promise.all([
          apiFetch('/api/cart'),
          apiFetch('/api/chats'),
        ]);
        const [cartData, chatsData] = await Promise.all([cartResponse.json(), chatsResponse.json()]);
        if (isMounted) {
          setCartCount((cartData.items || []).reduce((sum, item) => sum + (item.cartQty || 1), 0));
          setUnreadCount((chatsData.chats || []).filter((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            return lastMsg && lastMsg.senderId !== user.email && !lastMsg.read;
          }).length);
        }
      } catch (err) {
        console.error('Failed updating badges:', err);
      }
    };

    fetchBadges();
    window.addEventListener('cartUpdated', fetchBadges);
    window.addEventListener('chatUpdated', fetchBadges);
    return () => {
      isMounted = false;
      window.removeEventListener('cartUpdated', fetchBadges);
      window.removeEventListener('chatUpdated', fetchBadges);
    };
  }, [user]);

  const navLinks = [
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'AI Valuation', path: '/price-checker' },
    { name: 'Scanner', path: '/verification' },
    { name: 'Smart Match', path: '/smart-matching' },
    { name: 'HP Bekas', path: '/trade-in' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out
          ${visible ? 'translate-y-0' : '-translate-y-full'}
          ${scrolled ? 'py-1.5' : 'py-3'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`relative flex justify-between h-14 items-center px-4 sm:px-6 rounded-2xl transition-all duration-500
              ${scrolled
                ? 'bg-slate-950/65 backdrop-blur-3xl saturate-150 border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]'
                : 'bg-slate-950/40 backdrop-blur-3xl saturate-150 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]'
              }
            `}
          >
            {/* Glass top reflection line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Left: Logo + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link href="/" className="flex items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                  <img src="/logo.png" alt="GadgetTrustX Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </div>
                <span className="text-lg font-black tracking-tight hidden sm:block">
                  <span className="text-white group-hover:text-blue-300 transition-colors">Gadget</span>
                  <span className="text-blue-400">TrustX</span>
                </span>
              </Link>
            </div>

            {/* Center: Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300
                    ${pathname === link.path
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {link.name}
                  {pathname === link.path && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link
                href="/cart"
                id="cart-icon"
                className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-300 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[9px] font-black text-white bg-blue-600 rounded-full shadow-lg shadow-blue-500/40">
                    {cartCount}
                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-60" />
                  </span>
                )}
              </Link>

              {/* Chat badge */}
              {unreadCount > 0 && (
                <div className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[9px] font-black text-white bg-emerald-600 rounded-full">
                    {unreadCount}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="w-px h-6 bg-white/10" />

              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller-profile' : '/buyer-profile'}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black text-white shadow-md flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block leading-tight">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Dashboard</p>
                      <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{user.name.split(' ')[0]}</p>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden sm:flex p-2.5 rounded-xl bg-red-500/[0.08] text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/15 group"
                    title="Keluar"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary !py-2 !px-5 !text-[11px] !rounded-xl font-black uppercase tracking-wider"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[200] lg:hidden transition-all duration-400 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/8 flex flex-col transition-transform duration-400 ease-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-lg font-black">
                <span className="text-white">Gadget</span>
                <span className="text-blue-400">TrustX</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all
                  ${pathname === link.path
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/8 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-white">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Masuk sebagai</p>
                    <p className="text-sm font-bold text-white">{user.name}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Keluar
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary w-full text-center !rounded-xl">
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
