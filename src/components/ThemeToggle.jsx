'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('gtx_theme');
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.body?.classList.add('light');
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light');
      document.body?.classList.remove('light');
    }

    const handleSync = (e) => {
      const nextTheme = e.detail?.theme || localStorage.getItem('gtx_theme') || 'dark';
      setTheme(nextTheme);
    };

    window.addEventListener('gtx_theme_change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('gtx_theme_change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gtx_theme', nextTheme);

    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      document.body?.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body?.classList.remove('light');
    }

    window.dispatchEvent(new CustomEvent('gtx_theme_change', { detail: { theme: nextTheme } }));
  };

  // Render dummy placeholder until mounted to avoid SSR mismatch
  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] ${className}`} />
    );
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
      aria-label={isLight ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
      className={`relative p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center group ${
        isLight
          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 shadow-sm'
          : 'bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 hover:text-amber-300 border border-white/[0.06]'
      } ${className}`}
    >
      {isLight ? (
        /* Moon Icon for Light Mode (Click to switch to Dark) */
        <svg
          className="w-4 h-4 transition-transform group-hover:rotate-12 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        /* Sun Icon for Dark Mode (Click to switch to Light) */
        <svg
          className="w-4 h-4 transition-transform group-hover:rotate-45 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          />
        </svg>
      )}
    </button>
  );
}
