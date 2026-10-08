'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import DeviceCard from '@/components/DeviceCard';
import { useAuth } from '@/hooks/useAuth';

const formatPrice = (price) => {
  if (!price && price !== 0) return 'Harga tidak tersedia';
  if (typeof price === 'string' && (price.startsWith('$') || price.startsWith('Rp'))) return price;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    ram: '',
    storage: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
  });
  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    ram: true,
    storage: true,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const [sortBy, setSortBy] = useState('latest');
  const [catalogPage, setCatalogPage] = useState(1);
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    setCatalogPage(1);
  }, [searchTerm, filters, sortBy]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const catalogRef = useRef(null);

  const defaultFeaturedList = [
    {
      id: 'd1',
      name: 'Samsung Galaxy Z Fold 5',
      condition: 'Sangat Mulus',
      ram: '12GB',
      storage: '512GB',
      price: 19999000,
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800',
      brand: 'Samsung',
    },
    {
      id: 'd2',
      name: 'MacBook Pro M3 Max 16"',
      condition: 'Brand New (Segel)',
      ram: '36GB',
      storage: '1TB',
      price: 42999000,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
      brand: 'Apple',
    },
    {
      id: 'd3',
      name: 'Apple Watch Ultra 2 Titanium',
      condition: 'Pristine Condition',
      ram: '-',
      storage: '64GB',
      price: 12499000,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
      brand: 'Apple',
    },
    {
      id: 'd4',
      name: 'Sony WH-1000XM5 Wireless',
      condition: 'Like New',
      ram: '-',
      storage: '-',
      price: 4599000,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      brand: 'Sony',
    },
  ];

  const featuredList = useMemo(() => {
    const hardwareOnly = devices.filter((d) => !d.isTradeIn && !d.is_trade_in);
    return hardwareOnly.length > 0 ? hardwareOnly : defaultFeaturedList;
  }, [devices]);

  // Auto-advance carousel
  useEffect(() => {
    const max = Math.max(1, Math.ceil(featuredList.length / 2));
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setFeaturedIndex(prev => (prev + 1) % max);
        setIsTransitioning(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredList]);

  useEffect(() => {
    fetch('/api/devices')
      .then((res) => res.json())
      .then((data) => setDevices(data.devices || []))
      .catch((error) => console.error('Failed to load devices', error));
  }, []);

  const filteredDevices = useMemo(() => {
    let result = devices.filter(device => {
      if (device.isTradeIn) return false;
      const matchSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRam = filters.ram ? device.ram === filters.ram : true;
      const matchStorage = filters.storage ? device.storage === filters.storage : true;
      const matchBrand = filters.brand ? device.brand === filters.brand : true;

      // Filter Rentang Harga
      const price = Number(device.price) || 0;
      const matchMinPrice = filters.minPrice !== '' && !isNaN(Number(filters.minPrice))
        ? price >= Number(filters.minPrice)
        : true;
      const matchMaxPrice = filters.maxPrice !== '' && !isNaN(Number(filters.maxPrice))
        ? price <= Number(filters.maxPrice)
        : true;

      return matchSearch && matchRam && matchStorage && matchBrand && matchMinPrice && matchMaxPrice;
    });
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => b.id.localeCompare(a.id));
    return result;
  }, [searchTerm, filters, devices, sortBy]);

  const toggleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const handlePricePreset = (presetMin, presetMax) => {
    const isCurrent = String(filters.minPrice) === String(presetMin) && String(filters.maxPrice) === String(presetMax);
    if (isCurrent) {
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
    } else {
      setFilters(prev => ({
        ...prev,
        minPrice: presetMin !== '' ? String(presetMin) : '',
        maxPrice: presetMax !== '' ? String(presetMax) : '',
      }));
    }
  };

  const resetFilters = () => {
    setFilters({ ram: '', storage: '', brand: '', minPrice: '', maxPrice: '' });
  };

  const handleExplore = () => {
    setShowCatalog(true);
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const currentPair = [0, 1].map(offset => {
    const idx = (featuredIndex * 2 + offset) % featuredList.length;
    return featuredList[idx];
  });

  return (
    <div className="min-h-screen bg-[#020817] text-white pb-24">

      {/* ===================== HERO ===================== */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-12 sm:pb-24 overflow-hidden min-h-[50vh] sm:min-h-[60vh]">
        {/* Background orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] rounded-full bg-blue-600/6 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/8 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
            </span>
            Katalog produk terverifikasi
          </div>

          <h1 className="text-3xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.15]">
            The Verified{' '}
            <span className="gradient-text">Gadget</span>
            <br />Marketplace
          </h1>

          <p className="text-xs sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed sm:leading-8">
            Temukan perangkat premium pilihan seller terverifikasi — kondisi teruji, harga transparan, dan pengiriman terjamin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleExplore}
              className="btn-primary w-full sm:w-auto px-10 py-4 text-sm tracking-wide uppercase"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              Jelajahi Semua Produk
            </button>
            <button
              onClick={() => window.location.href = '/price-checker'}
              className="btn-secondary w-full sm:w-auto px-10 py-4 text-sm tracking-wide uppercase"
            >
              Valuasi Harga AI
            </button>
          </div>
        </div>
      </section>

      {/* ===================== FEATURED HARDWARE (shown before catalog) ===================== */}
      {!showCatalog && (
        <section className="px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16 max-w-[1400px] mx-auto animate-fade-in-up">
          {/* Header */}
          <div className="flex justify-between items-end mb-3 sm:mb-8 gap-2">
            <div>
              <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-0.5 sm:mb-2">Pilihan Unggulan</p>
              <h2 className="text-lg sm:text-3xl md:text-4xl font-black text-white tracking-tight">Featured Hardware</h2>
            </div>
            <button
              onClick={handleExplore}
              className="flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-white transition-colors group flex-shrink-0 mb-0.5"
            >
              <span className="uppercase tracking-widest font-black text-[9px] sm:text-xs">Lihat Semua</span>
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:translate-x-1 transition-all text-xs sm:text-sm">→</span>
            </button>
          </div>

          {/* Carousel dots */}
          <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-6">
            {Array.from({ length: Math.ceil(featuredList.length / 2) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setFeaturedIndex(i)}
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${featuredIndex === i ? 'w-6 sm:w-8 bg-blue-500' : 'featured-dot-inactive w-1 sm:w-1.5 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>

          {/* Cards (2 per row on mobile) */}
          <div className={`grid grid-cols-2 gap-2.5 sm:gap-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {currentPair.map((item, idx) => {
              const inStock = item.stock === undefined ? true : item.stock > 0;
              const isProductPhoto = item.image && (
                item.image.includes('unsplash') ||
                item.image.includes('http') ||
                (item.brand && !item.image.includes('banner'))
              );
              return (
              <div
                key={`${item.id}-${idx}`}
                className="featured-card group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0d1117] border border-white/[0.08] hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(59,130,246,0.15)] min-h-[220px] sm:min-h-0 sm:aspect-[4/3] flex flex-col justify-between"
              >
                {/* Smart Adaptive Background Image */}
                <div className="absolute inset-0 overflow-hidden">
                  {isProductPhoto ? (
                    <>
                      {/* Ambient background blur fill */}
                      <img
                        src={item.image}
                        alt=""
                        className="featured-ambient-blur w-full h-full object-cover object-center blur-2xl opacity-35 scale-125 pointer-events-none group-hover:scale-140 transition-transform duration-700"
                      />
                      {/* Crisp uncropped product in foreground */}
                      <div className="absolute inset-0 p-2 pt-6 pb-14 sm:p-6 sm:pt-12 sm:pb-24 flex items-center justify-center pointer-events-none">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)] group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </>
                  ) : (
                    /* Standard full-bleed cover for banner / hero graphics */
                    <img
                      src={item.image || '/images/device-placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover object-center opacity-60 group-hover:opacity-70 transition-opacity duration-500"
                    />
                  )}
                  <div className="featured-overlay-t absolute inset-0 bg-gradient-to-t from-[#0d1117]/95 via-[#0d1117]/40 to-transparent pointer-events-none" />
                  <div className="featured-overlay-r absolute inset-0 bg-gradient-to-r from-[#0d1117]/60 to-transparent pointer-events-none" />
                </div>

                {/* Top bar */}
                <div className="relative z-10 p-2.5 sm:p-7 flex justify-between items-start">
                  <div className={`featured-stock-pill flex items-center gap-1.5 border rounded-full px-2 py-0.5 sm:px-3 sm:py-1.5 backdrop-blur-md ${inStock ? 'bg-black/40 border-white/10' : 'bg-red-500/10 border-red-500/30'}`}>
                    <span className="relative flex h-1.5 w-1.5">
                      {inStock ? (
                        <>
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </>
                      ) : (
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                      )}
                    </span>
                    <span className={`text-[8px] sm:text-[10px] font-bold ${inStock ? 'text-slate-300' : 'text-red-400'}`}>
                      {inStock ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                </div>

                {/* Bottom content */}
                <div className="relative z-10 p-2.5 sm:p-7 mt-auto">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-3">
                    <span className="text-[8px] sm:text-[10px] font-black tracking-widest text-blue-400 uppercase">{item.condition}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">{item.brand}</span>
                  </div>
                  <h3 className="featured-card-title text-xs sm:text-2xl font-black text-white mb-0.5 sm:mb-2 leading-snug group-hover:text-blue-300 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="featured-card-specs text-[9px] sm:text-xs text-slate-400 mb-2 font-medium line-clamp-1">
                    {item.ram && item.ram !== '-' ? `RAM ${item.ram}` : ''}
                    {item.ram && item.ram !== '-' && item.storage ? ' • ' : ''}
                    {item.storage ? `${item.storage}` : ''}
                    {item.specs && !item.ram ? item.specs : ''}
                  </p>
                  <div className="flex items-end justify-between gap-1 sm:gap-2">
                    <div>
                      <p className="text-[8px] sm:text-xs text-slate-500 mb-0.5">Mulai dari</p>
                      <p className="featured-card-price text-xs sm:text-3xl font-black text-white">{formatPrice(item.price)}</p>
                    </div>
                    <button
                      onClick={handleExplore}
                      className="btn-primary !px-2 !py-1 sm:!px-5 sm:!py-2.5 !text-[9px] sm:!text-xs !rounded-lg sm:!rounded-xl flex-shrink-0"
                    >
                      Detail →
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </section>
      )}

      {/* ===================== CATALOG ===================== */}
      {showCatalog && (
        <div
          ref={catalogRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 animate-fade-in-up"
        >
          {/* Search Bar (Centered) */}
          <div className="mb-10 relative group max-w-2xl mx-auto">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/30 to-violet-500/30 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center bg-[#0d1117] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-blue-500/40 transition-all shadow-2xl">
              <svg className="w-5 h-5 ml-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                className="flex-1 bg-transparent px-4 py-4 text-slate-100 placeholder:text-slate-500 focus:outline-none text-base font-medium"
                placeholder="Cari gadget, merek, atau spesifikasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mr-3 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="mr-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Cari
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* ── Sidebar ── */}
            <div className="lg:w-64 lg:shrink-0 lg:sticky lg:top-24 space-y-4">
              {/* Mobile toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-sm font-bold text-white"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                  </svg>
                  Filter
                </span>
                <svg className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
                <div className="rounded-2xl bg-[#0d1117] border border-white/[0.08] p-5 space-y-4 shadow-xl">
                  {/* Top Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                        </svg>
                      </div>
                      <h3 className="text-sm font-black text-white tracking-wide">
                        Filter Katalog
                      </h3>
                    </div>
                    {Object.values(filters).some(v => v !== '') && (
                      <button
                        onClick={resetFilters}
                        className="text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Reset Semua
                      </button>
                    )}
                  </div>

                  {/* 1. Accordion Section: Rentang Harga */}
                  <div className="border border-white/[0.06] rounded-xl bg-white/[0.01] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('price')}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">💰</span>
                        <span className="text-xs font-bold text-slate-200">Rentang Harga</span>
                        {(filters.minPrice || filters.maxPrice) && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(filters.minPrice || filters.maxPrice) && (
                          <span
                            onClick={(e) => { e.stopPropagation(); setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' })); }}
                            className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase px-1 py-0.5 rounded cursor-pointer"
                          >
                            Reset
                          </span>
                        )}
                        <svg
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openSections.price ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {openSections.price && (
                      <div className="p-3.5 pt-1 space-y-2.5 border-t border-white/[0.04]">
                        {/* Preset Quick Chips */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { label: '< Rp 5 Jt', min: '', max: '5000000' },
                            { label: '5 - 10 Jt', min: '5000000', max: '10000000' },
                            { label: '10 - 20 Jt', min: '10000000', max: '20000000' },
                            { label: '> Rp 20 Jt', min: '20000000', max: '' },
                          ].map((p, idx) => {
                            const isActive = String(filters.minPrice) === p.min && String(filters.maxPrice) === p.max;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handlePricePreset(p.min, p.max)}
                                className={`text-[10px] py-1.5 px-1 rounded-lg border font-bold transition-all text-center cursor-pointer ${
                                  isActive
                                    ? 'bg-cyan-600/25 border-cyan-500/60 text-cyan-300 shadow-sm'
                                    : 'border-white/[0.06] text-slate-400 hover:border-white/10 hover:text-slate-200 hover:bg-white/[0.03]'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                        {/* Custom Min / Max */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block mb-1">Min (Rp)</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={filters.minPrice}
                              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                              className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block mb-1">Maks (Rp)</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Tak hingga"
                              value={filters.maxPrice}
                              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                              className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Accordion Section: Brand */}
                  <div className="border border-white/[0.06] rounded-xl bg-white/[0.01] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('brand')}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🏷️</span>
                        <span className="text-xs font-bold text-slate-200">Brand</span>
                        {filters.brand && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            {filters.brand}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openSections.brand ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSections.brand && (
                      <div className="p-3.5 pt-1 border-t border-white/[0.04]">
                        <div className="flex flex-wrap gap-1.5">
                          {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Asus', 'Other'].map(b => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => toggleFilter('brand', b)}
                              className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                filters.brand === b
                                  ? 'bg-blue-600/25 border-blue-500/60 text-blue-300 shadow-sm'
                                  : 'border-white/[0.06] text-slate-400 hover:border-white/10 hover:text-slate-200 hover:bg-white/[0.03]'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Accordion Section: RAM */}
                  <div className="border border-white/[0.06] rounded-xl bg-white/[0.01] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('ram')}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">⚡</span>
                        <span className="text-xs font-bold text-slate-200">RAM</span>
                        {filters.ram && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
                            {filters.ram}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openSections.ram ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSections.ram && (
                      <div className="p-3.5 pt-1 border-t border-white/[0.04]">
                        <div className="grid grid-cols-3 gap-1.5">
                          {['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'].map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => toggleFilter('ram', r)}
                              className={`text-[11px] py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                filters.ram === r
                                  ? 'bg-violet-600/25 border-violet-500/60 text-violet-300 shadow-sm'
                                  : 'border-white/[0.06] text-slate-400 hover:border-white/10 hover:text-slate-200 hover:bg-white/[0.03]'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Accordion Section: Internal Storage (with 2TB!) */}
                  <div className="border border-white/[0.06] rounded-xl bg-white/[0.01] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('storage')}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">💾</span>
                        <span className="text-xs font-bold text-slate-200">Penyimpanan (Storage)</span>
                        {filters.storage && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            {filters.storage}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openSections.storage ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSections.storage && (
                      <div className="p-3.5 pt-1 border-t border-white/[0.04]">
                        <div className="grid grid-cols-3 gap-1.5">
                          {['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleFilter('storage', s)}
                              className={`text-[11px] py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                filters.storage === s
                                  ? 'bg-emerald-600/25 border-emerald-500/60 text-emerald-300 shadow-sm'
                                  : 'border-white/[0.06] text-slate-400 hover:border-white/10 hover:text-slate-200 hover:bg-white/[0.03]'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sell box */}
                {(!user || (user.role !== 'buyer' && user.role !== 'admin')) && (
                  <div className="rounded-2xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 p-5">
                    <h4 className="text-sm font-bold text-white mb-1">Mau jual perangkat?</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-5">Dapatkan estimasi AI instan dan pasang listing hanya dalam beberapa menit.</p>
                    <button
                      onClick={() => window.location.href = '/seller-profile'}
                      className="btn-primary w-full !py-2.5 !text-xs !rounded-xl"
                    >
                      Mulai Jual
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Product Grid ── */}
            <div className="flex-1 min-w-0">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                  Menampilkan <span className="text-white font-bold">{filteredDevices.length}</span> produk
                </p>
                <div className="flex items-center gap-2 bg-[#0d1117] border border-white/[0.08] rounded-xl px-4 py-2">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest font-black">Urutkan</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white text-xs font-bold border-none focus:ring-0 outline-none cursor-pointer hover:text-blue-400 transition-colors"
                  >
                    <option value="latest" className="bg-slate-900">Terbaru</option>
                    <option value="price-low" className="bg-slate-900">Harga: Rendah → Tinggi</option>
                    <option value="price-high" className="bg-slate-900">Harga: Tinggi → Rendah</option>
                  </select>
                </div>
              </div>

              {/* Active filter badges */}
              {(Object.entries(filters).some(([_, v]) => v !== '') || searchTerm) && (
                <div className="flex flex-wrap items-center gap-1.5 mb-5 p-3 rounded-2xl bg-[#0d1117] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Filter Aktif:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
                      Kata kunci: &quot;{searchTerm}&quot;
                      <button onClick={() => setSearchTerm('')} className="hover:text-white cursor-pointer" title="Hapus pencarian">✕</button>
                    </span>
                  )}
                  {filters.brand && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                      Brand: {filters.brand}
                      <button onClick={() => toggleFilter('brand', filters.brand)} className="hover:text-white cursor-pointer" title="Hapus filter brand">✕</button>
                    </span>
                  )}
                  {filters.ram && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
                      RAM: {filters.ram}
                      <button onClick={() => toggleFilter('ram', filters.ram)} className="hover:text-white cursor-pointer" title="Hapus filter RAM">✕</button>
                    </span>
                  )}
                  {filters.storage && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      Storage: {filters.storage}
                      <button onClick={() => toggleFilter('storage', filters.storage)} className="hover:text-white cursor-pointer" title="Hapus filter storage">✕</button>
                    </span>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                      Harga: {filters.minPrice ? formatPrice(Number(filters.minPrice)) : 'Rp 0'} - {filters.maxPrice ? formatPrice(Number(filters.maxPrice)) : 'Tak hingga'}
                      <button onClick={() => setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }))} className="hover:text-white cursor-pointer" title="Hapus filter harga">✕</button>
                    </span>
                  )}
                  <button
                    onClick={() => { resetFilters(); setSearchTerm(''); }}
                    className="text-xs text-red-400 hover:text-red-300 ml-auto cursor-pointer font-bold transition-colors"
                  >
                    Reset Semua
                  </button>
                </div>
              )}

              {filteredDevices.length > 0 ? (
                (() => {
                  const itemsPerPage = 12;
                  const totalCatalogPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
                  const currentCatalogPage = Math.min(catalogPage, totalCatalogPages);
                  const startIndex = (currentCatalogPage - 1) * itemsPerPage;
                  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

                  return (
                    <>
                      <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
                        {paginatedDevices.map((device) => (
                          <DeviceCard key={device.id} device={device} />
                        ))}
                      </div>

                      {/* Pagination Bar (Maksimal 12 Produk Per Halaman) */}
                      {totalCatalogPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#0d1117] border border-white/[0.08] text-xs mt-8">
                          <span className="text-slate-400 font-bold">
                            Menampilkan <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDevices.length)}</strong> dari <strong className="text-white">{filteredDevices.length}</strong> produk (Halaman {currentCatalogPage} dari {totalCatalogPages})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogPage((p) => Math.max(p - 1, 1));
                                catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              disabled={currentCatalogPage === 1}
                              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-slate-700"
                            >
                              ← Sebelumnya
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogPage((p) => Math.min(p + 1, totalCatalogPages));
                                catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              disabled={currentCatalogPage === totalCatalogPages}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all border border-blue-500 shadow-lg shadow-blue-500/20"
                            >
                              Selanjutnya →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl bg-[#0d1117] border border-white/[0.06]">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5 text-3xl">
                    🔍
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Tidak ada produk ditemukan</h3>
                  <p className="text-slate-500 text-sm mb-6">Coba ubah kata kunci atau reset filter yang dipilih.</p>
                  <button
                    onClick={() => { setSearchTerm(''); resetFilters(); }}
                    className="btn-secondary !py-2.5 !px-6 !text-sm !rounded-xl"
                  >
                    Reset semua filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
