'use client';

import Link from 'next/link';
import { useState } from 'react';

const footerGroups = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Cari gadget', href: '/marketplace' },
      { label: 'Smart matching', href: '/smart-matching' },
      { label: 'Trade-in', href: '/trade-in' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'AI valuation', href: '/price-checker' },
      { label: 'IMEI verification', href: '/verification' },
      { label: 'Seller profile', href: '/seller-profile' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Masuk', href: '/login' },
      { label: 'Daftar', href: '/register' },
      { label: 'Keranjang', href: '/cart' },
    ],
  },
];

const socialLinks = [
  {
    name: 'Instagram',
    href: '#',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: 'Twitter/X',
    href: '#',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.08] bg-[#020617]">
      {/* Animated Mesh Glow Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="absolute -top-24 left-1/4 w-[600px] h-[300px] rounded-full bg-blue-600/[0.08] blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute -top-24 right-1/4 w-[500px] h-[250px] rounded-full bg-purple-600/[0.06] blur-[120px] pointer-events-none animate-pulse-glow delay-300" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Brand column */}
          <div className="max-w-sm space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all">
                <img src="/logo.png" alt="GadgetTrustX Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="text-white">Gadget</span>
                <span className="text-blue-400">TrustX</span>
              </span>
            </Link>

            <p className="text-sm leading-7 text-slate-400">
              Marketplace gadget baru dan preloved dengan katalog seller terverifikasi,
              estimasi AI real-time, dan tools pendukung agar Anda belanja lebih yakin.
            </p>

            {/* Status indicator */}
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-semibold text-emerald-300">Semua sistem beroperasi normal</span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/10 transition-all hover:scale-110"
                  title={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5">
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                      >
                        <span className="w-0 group-hover:w-2 overflow-hidden transition-all duration-300 text-blue-400">›</span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            &copy; 2026 GadgetTrustX. Semua hak dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
