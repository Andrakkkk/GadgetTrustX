'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on pathname change
    setMobileMenuOpen(false);
  }, [pathname]);

  // ... updateNavbarBadges and other effects ...
  const updateNavbarBadges = async () => {
    if (user) {
      const [cartResponse, chatsResponse] = await Promise.all([
        apiFetch('/api/cart'),
        apiFetch('/api/chats'),
      ]);
      const [cartData, chatsData] = await Promise.all([cartResponse.json(), chatsResponse.json()]);
      setCartCount((cartData.items || []).reduce((sum, item) => sum + (item.cartQty || 1), 0));
      setUnreadCount((chatsData.chats || []).filter((chat) => {
        const lastMsg = chat.messages[chat.messages.length - 1];
        return lastMsg && lastMsg.senderId !== user.email && !lastMsg.read;
      }).length);
    } else {
      setCartCount(0);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    updateNavbarBadges();
    window.addEventListener('cartUpdated', updateNavbarBadges);
    window.addEventListener('chatUpdated', updateNavbarBadges);
    return () => {
      window.removeEventListener('cartUpdated', updateNavbarBadges);
      window.removeEventListener('chatUpdated', updateNavbarBadges);
    };
  }, [user]);

  const navLinks = [
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'AI Valuation', path: '/price-checker' },
    { name: 'Scanner', path: '/verification' },
    { name: 'Smart Match', path: '/smart-matching' },
    { name: 'Trade-In', path: '/trade-in' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`glass-panel !rounded-3xl border border-white/10 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-2xl shadow-2xl shadow-blue-500/10' : 'bg-slate-950/20 backdrop-blur-md'}`}>
            <div className="flex justify-between h-14 items-center px-4 sm:px-6">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>

                <Link href="/" className="text-xl sm:text-2xl font-black tracking-tighter flex items-center group">
                  <span className="text-white group-hover:text-blue-400 transition-colors">Gadget</span>
                  <span className="text-blue-500">TrustX</span>
                </Link>
              </div>

              <div className="hidden lg:flex space-x-1 items-center">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:bg-white/5 ${pathname === link.path ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* Cart Icon */}
                <Link href="/cart" id="cart-icon" className="relative p-2.5 rounded-2xl bg-slate-900/50 border border-white/5 text-slate-400 hover:text-blue-400 transition-all group">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[9px] font-black text-white bg-blue-600 rounded-lg shadow-lg shadow-blue-500/40 animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-white/10">
                    <Link
                      href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller-profile' : '/buyer-profile'}
                      className="flex items-center gap-3 p-1 sm:pr-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Dashboard</p>
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{user.name.split(' ')[0]}</p>
                      </div>
                    </Link>
                    <button onClick={logout} className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 group hidden sm:flex">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center pl-2 sm:pl-4 border-l border-white/10">
                    <Link href="/login" className="btn-primary !py-2.5 !px-4 sm:!px-6 !text-[10px] sm:!text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-500 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-slate-900 border-r border-white/10 p-6 transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="text-xl font-black tracking-tighter flex items-center">
              <span className="text-white">Gadget</span>
              <span className="text-blue-500">TrustX</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center px-4 py-4 rounded-2xl text-sm font-bold transition-all ${pathname === link.path ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="h-px bg-white/5 my-6" />

            {user && (
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
