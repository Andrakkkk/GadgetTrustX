'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '@/components/Footer';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'Harga Lebih Transparan',
    description: 'Bandingkan nilai perangkat berdasarkan spesifikasi, kondisi, dan tren pasar sebelum memutuskan membeli.',
    href: '/price-checker',
    cta: 'Lihat estimasi',
    tone: 'blue',
    path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Verifikasi Perangkat',
    description: 'Periksa IMEI atau serial number untuk membantu memastikan perangkat yang Anda pilih lebih meyakinkan.',
    href: '/verification',
    cta: 'Periksa perangkat',
    tone: 'emerald',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Trade-In Praktis',
    description: 'Tukar tambah perangkat lama dengan proses yang lebih ringkas saat Anda ingin beralih ke gadget berikutnya.',
    href: '/trade-in',
    cta: 'Mulai trade-in',
    tone: 'violet',
    path: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
];

const stats = [
  { value: '10k+', label: 'produk tersedia' },
  { value: 'Baru & Preloved', label: 'pilihan lengkap' },
  { value: 'Seller tepercaya', label: 'transaksi lebih yakin' },
];

const steps = [
  'Jelajahi katalog',
  'Bandingkan detail',
  'Pilih dan checkout',
];

const toneClasses = {
  blue: {
    icon: 'bg-blue-500/20 text-blue-300',
    link: 'text-blue-300 hover:text-blue-200',
  },
  emerald: {
    icon: 'bg-emerald-500/20 text-emerald-300',
    link: 'text-emerald-300 hover:text-emerald-200',
  },
  violet: {
    icon: 'bg-violet-500/20 text-violet-300',
    link: 'text-violet-300 hover:text-violet-200',
  },
};

export default function Home() {
  const rootRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    let context;
    const timer = window.setTimeout(() => {
      if (!rootRef.current) return;

      context = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        gsap.set('.hero-copy > *, .hero-art, .hero-product-pill, .feature-card, .stat-chip, .step-item', {
          clearProps: 'all',
        });
        return;
      }

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-art', {
          scale: 1.12,
          opacity: 0,
          duration: 1.2,
          clearProps: 'transform,opacity',
        })
        .from('.hero-copy > *', {
          y: 28,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          clearProps: 'transform,opacity',
        }, '-=0.7')
        .from('.hero-product-pill', {
          y: 18,
          opacity: 0,
          duration: 0.55,
          stagger: 0.08,
          clearProps: 'transform,opacity',
        }, '-=0.45')
        .from(
          '.stat-chip',
          {
            y: 18,
            opacity: 0,
            duration: 0.5,
            stagger: 0.08,
            clearProps: 'transform,opacity',
          },
          '-=0.35'
        );

      gsap.to('.hero-art', {
        scale: 1.08,
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to('.hero-product-pill', {
        y: (index) => (index % 2 === 0 ? -8 : 8),
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: {
          each: 0.18,
          from: 'random',
        },
      });

      gsap.fromTo(
        '.feature-card',
        { y: 28, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.features-section',
            start: 'top 82%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.step-item',
        { y: 18 },
        {
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: '.steps-band',
            start: 'top 86%',
            once: true,
          },
        }
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());
      }, rootRef);
    }, 100);

    return () => {
      window.clearTimeout(timer);
      context?.revert();
    };
  }, [pathname]);

  return (
    <div ref={rootRef} className="min-h-screen">
      <section className="hero-section relative isolate min-h-[min(760px,calc(100svh-2rem))] overflow-hidden px-4 pb-14 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="hero-art absolute inset-0 -z-20">
          <Image
            src="/images/home-hero-devices.jpg"
            alt="Modern smartphones, smartwatch, and earbuds"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.88)_42%,rgba(2,6,23,0.45)_72%,rgba(2,6,23,0.82)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        <div className="mx-auto flex min-h-[min(620px,calc(100svh-10rem))] max-w-7xl flex-col justify-end">
          <div className="hero-copy max-w-2xl">
            <span className="mb-5 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
              Marketplace gadget baru & preloved
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Temukan gadget terbaik. Belanja dengan lebih percaya diri.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
              Jelajahi produk baru dan preloved dari berbagai seller, bandingkan detail penting, lalu pilih perangkat yang paling sesuai dalam satu pengalaman belanja yang lebih terarah.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/marketplace" className="btn-primary text-center text-base">
                Jelajahi Marketplace
              </Link>
              <Link href="/smart-matching" className="btn-secondary border border-slate-700 bg-slate-800/80 text-center text-base">
                Temukan Pilihan Saya
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-chip rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 pb-2 sm:mt-10">
            {['Smartphone', 'Wearable', 'Audio', 'Seller tepercaya'].map((item) => (
              <span
                key={item}
                className="hero-product-pill rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-md"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="steps-band border-y border-white/5 bg-slate-950/40">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
          {steps.map((step, index) => (
            <div key={step} className="step-item flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-blue-300">
                0{index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section border-y border-slate-800 bg-slate-900/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold text-blue-300">Kenapa GadgetTrustX</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Pengalaman belanja yang lebih cermat, dari awal sampai checkout.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card glass-panel card-hover p-7">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${toneClasses[feature.tone].icon}`}>
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.path} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-3 min-h-[72px] text-slate-400">{feature.description}</p>
                <Link href={feature.href} className={`mt-5 inline-flex items-center font-medium ${toneClasses[feature.tone].link}`}>
                  {feature.cta}
                  <span className="ml-1">-&gt;</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
