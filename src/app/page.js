'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'Valuasi Harga AI',
    description: 'Ketahui harga pasar perangkat Anda dalam hitungan detik. AI kami menganalisis kondisi, spesifikasi, dan tren harga terkini untuk memberikan estimasi yang akurat dan adil.',
    href: '/price-checker',
    cta: 'Cek harga sekarang',
    tone: 'blue',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
  },
  {
    title: 'Verifikasi IMEI & Keaslian',
    description: 'Sebelum beli, pastikan perangkat berstatus bersih. Cek IMEI untuk mengetahui apakah HP pernah dilaporkan hilang, dicuri, atau terblokir jaringan operator.',
    href: '/verification',
    cta: 'Verifikasi perangkat',
    tone: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
  },
  {
    title: 'Tukar Tambah HP Lama',
    description: 'Upgrade gadget jadi lebih mudah. Tukarkan HP lama Anda dengan HP baru pilihan, dan hemat lebih banyak dengan potongan harga langsung dari nilai tukar perangkat Anda.',
    href: '/trade-in',
    cta: 'Mulai tukar tambah',
    tone: 'violet',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
      </svg>
    ),
  },
];

const stats = [
  { value: '10K+', label: 'Listing Aktif', icon: '📦' },
  { value: '4.8/5', label: 'Rating Kepuasan', icon: '⭐' },
  { value: '500+', label: 'Seller Terverifikasi', icon: '🛡️' },
];

const brands = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'ASUS', 'Sony', 'OnePlus', 'Oppo'];

const toneConfig = {
  blue: {
    icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    glow: 'group-hover:shadow-blue-500/20',
    link: 'text-blue-400 hover:text-blue-300',
    border: 'group-hover:border-blue-500/30',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/20',
    link: 'text-emerald-400 hover:text-emerald-300',
    border: 'group-hover:border-emerald-500/30',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/20',
    link: 'text-violet-400 hover:text-violet-300',
    border: 'group-hover:border-violet-500/30',
  },
};

export default function Home() {
  const { user } = useAuth();
  const rootRef = useRef(null);
  const [counters, setCounters] = useState({ products: 0, satisfaction: 0, sellers: 0 });

  useEffect(() => {
    let ctx;
    const timer = setTimeout(() => {
      if (!rootRef.current) return;

      ctx = gsap.context(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) return;

        // Hero entrance
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.hero-badge', { y: 20, opacity: 0, duration: 0.6 })
          .from('.hero-title', { y: 40, opacity: 0, duration: 0.8 }, '-=0.3')
          .from('.hero-desc', { y: 30, opacity: 0, duration: 0.7 }, '-=0.5')
          .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4')
          .from('.hero-stat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, clearProps: 'all' }, '-=0.3')
          .from('.hero-pills', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3');

        // Parallax hero image
        gsap.to('.hero-img', {
          yPercent: -15,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });

        // Feature cards
        gsap.fromTo('.feature-card',
          { y: 40, opacity: 0, scale: 0.95 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.7, stagger: 0.12, ease: 'power3.out', clearProps: 'transform',
            scrollTrigger: { trigger: '.features-section', start: 'top 80%', once: true },
          }
        );

        // Stats section
        gsap.fromTo('.stats-section',
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.8,
            scrollTrigger: { trigger: '.stats-section', start: 'top 85%', once: true },
          }
        );

        // Brand logos
        gsap.fromTo('.brand-item',
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1, scale: 1,
            duration: 0.4, stagger: 0.06, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: '.brands-section', start: 'top 88%', once: true },
          }
        );

        // Steps
        gsap.fromTo('.step-card',
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.6, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: '.steps-section', start: 'top 82%', once: true },
          }
        );

        ScrollTrigger.refresh();
      }, rootRef);
    }, 100);

    return () => {
      clearTimeout(timer);
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen">

      {/* ===================== HERO ===================== */}
      <section className="hero-section relative isolate min-h-[85vh] sm:min-h-[90svh] flex items-end pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background image */}
        <div className="hero-img absolute inset-0 -z-20 scale-105">
          <Image
            src="/images/home-hero-devices.jpg"
            alt="Premium gadgets collection"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020817]/98 via-[#020817]/85 to-[#020817]/50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#020817] via-transparent to-[#020817]/60" />

        {/* Orbs */}
        <div className="orb absolute top-1/3 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-blue-600/8 animate-pulse-glow" />
        <div className="orb absolute bottom-0 right-1/4 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-violet-600/6" />

        {/* Grid texture */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="mx-auto max-w-7xl w-full pt-24 sm:pt-32 pb-4 sm:pb-0">
          <div className="max-w-2xl space-y-5 sm:space-y-8">
            {/* Badge */}
            <div className="hero-badge">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-blue-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                </span>
                Platform gadget terpercaya #1 Indonesia
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] tracking-tight text-white">
              Gadget impian,{' '}
              <span className="relative">
                <span className="gradient-text">harga nyata.</span>
                <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 150 2 298 8" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6"/>
                      <stop offset="50%" stopColor="#06b6d4"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />Belanja lebih percaya diri.
            </h1>

            {/* Description */}
            <p className="hero-desc text-xs sm:text-base leading-relaxed sm:leading-8 text-slate-400 max-w-xl">
              Beli dan jual gadget bekas dengan aman. Seller terverifikasi, harga transparan, cek IMEI terintegrasi — semua dalam satu platform yang Anda bisa percaya.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta flex flex-row flex-wrap gap-2.5 sm:gap-3">
              <Link href="/marketplace" className="btn-primary text-xs sm:text-base px-4 py-2.5 sm:px-8 sm:py-4 flex justify-center items-center flex-1 sm:flex-none">
                <svg className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Jelajahi Marketplace
              </Link>
              <Link href="/smart-matching" className="btn-secondary text-xs sm:text-base px-4 py-2.5 sm:px-8 sm:py-4 flex justify-center items-center flex-1 sm:flex-none">
                Temukan HP yang Tepat →
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="hero-stat rounded-2xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2.5 sm:px-4 sm:py-3.5 backdrop-blur-sm hover:border-white/10 hover:bg-white/[0.05] transition-all"
                >
                  <p className="text-sm sm:text-lg font-black text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Category pills */}
            <div className="hero-pills flex flex-wrap gap-1.5 sm:gap-2 pb-2 sm:pb-0">
              {['📱 Smartphone', '⌚ Smartwatch', '🎧 Audio', '💻 Laptop', '🛡️ Terverifikasi IMEI'].map((item) => (
                <span
                  key={item}
                  className="badge-pill hover:border-white/20 hover:text-slate-200 hover:bg-white/[0.06] transition-all cursor-default text-[10px] sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-40">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent animate-bounce-soft" />
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="steps-section border-y border-white/[0.05] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: '01', label: 'Cari & filter produk', desc: 'Ribuan listing dari seller terpercaya di seluruh Indonesia' },
              { num: '02', label: 'Bandingkan spesifikasi', desc: 'Lihat detail lengkap, kondisi, dan riwayat harga' },
              { num: '03', label: 'Bayar & diterima', desc: 'Pembayaran aman via Midtrans, barang dikirim langsung' },
            ].map((step) => (
              <div key={step.num} className="step-card flex items-center gap-4 py-4 px-2 rounded-2xl hover:bg-white/[0.02] transition-all group">
                <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-black text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all">
                  {step.num}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{step.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="features-section py-12 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-10 sm:mb-16 text-center max-w-2xl mx-auto">
            <span className="badge-pill border-blue-400/20 bg-blue-500/8 text-blue-400 mb-4 inline-flex text-xs px-3 py-1">
              ✨ Kenapa GadgetTrustX?
            </span>
            <h2 className="text-2xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight leading-tight">
            Fitur yang dirancang untuk{' '}
            <span className="gradient-text-blue">keamanan</span> dan kemudahan Anda.
          </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`feature-card group glass-panel p-5 sm:p-8 card-hover transition-all duration-500 ${toneConfig[feature.tone].glow} hover:shadow-2xl ${toneConfig[feature.tone].border}`}
              >
                <div className={`mb-4 sm:mb-6 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border ${toneConfig[feature.tone].icon} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed sm:leading-7 mb-4 sm:mb-6">{feature.description}</p>
                <Link
                  href={feature.href}
                  className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold ${toneConfig[feature.tone].link} group-hover:gap-3 transition-all`}
                >
                  {feature.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STATS BAND ===================== */}
      <section className="stats-section relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-violet-600/5 to-emerald-600/5" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            {[
              { num: '12.400+', label: 'Listing Aktif', sublabel: 'dari berbagai kategori perangkat' },
              { num: 'Rp 1,8 Jt', label: 'Rata-rata Penghematan', sublabel: 'dibanding harga toko resmi' },
              { num: '500+', label: 'Seller Terverifikasi', sublabel: 'dengan reputasi dan rating tinggi' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <p className="text-4xl sm:text-5xl font-black gradient-text">{stat.num}</p>
                <p className="text-lg font-bold text-white">{stat.label}</p>
                <p className="text-sm text-slate-500">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== BRANDS ===================== */}
      <section className="brands-section py-16 border-y border-white/[0.04] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-slate-600 mb-10">
            Tersedia produk dari brand terkemuka
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {brands.map((brand) => (
              <div
                key={brand}
                className="brand-item px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-slate-400 text-sm font-bold hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-default hover:scale-105"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA BANNER ===================== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden p-12 text-center border border-white/[0.08]"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(16,185,129,0.06) 100%)' }}
          >
            {/* Orbs inside card */}
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
            {/* Top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

            <div className="relative z-10 space-y-6">
              <span className="badge-pill border-blue-400/20 bg-blue-500/8 text-blue-400 inline-flex">
                🚀 Mulai sekarang — gratis
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Siap upgrade gadget Anda?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Bergabung dengan puluhan ribu pembeli yang sudah menemukan gadget terbaik mereka di GadgetTrustX — aman, transparan, dan terpercaya.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/marketplace" className="btn-primary px-8 py-4 text-base">
                  Mulai Belanja
                </Link>
                {user ? (
                  <Link
                    href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller-profile' : '/buyer-profile'}
                    className="btn-secondary px-8 py-4 text-base !border-blue-500/40 !bg-blue-500/10 text-blue-300"
                  >
                    Dashboard Saya ({user.name.split(' ')[0]}) →
                  </Link>
                ) : (
                  <Link href="/register" className="btn-secondary px-8 py-4 text-base">
                    Daftar Gratis
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
