'use client';
import { useState, useMemo, useEffect } from 'react';
import DeviceCard from '@/components/DeviceCard';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    ram: '',
    storage: '',
    brand: ''
  });
  const [sortBy, setSortBy] = useState('latest');

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
      return matchSearch && matchRam && matchStorage && matchBrand;
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // Default latest (by ID or timestamp if available, here we use ID which is based on Date.now in creation)
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [searchTerm, filters, devices, sortBy]);

  const toggleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value
    }));
  };

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="min-h-screen pb-20">
      {/* Premium Hero Section */}
      <div className="relative pt-24 sm:pt-32 pb-20 sm:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight animate-fade-in">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Verified</span> <br/>
              Gadget Marketplace
            </h1>
            <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
              Browse through a curated selection of high-end electronics, all verified by TrustX and priced by real-time market AI.
            </p>

            <div className="max-w-2xl mx-auto relative group px-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <input
                  type="text"
                  className="input-field !pl-12 sm:!pl-14 !py-4 sm:!py-5 !text-base sm:!text-lg !rounded-2xl bg-slate-900/80 border-slate-700/50"
                  placeholder="Search gadgets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-5 h-5 sm:w-6 h-6 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 flex gap-4">
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex-grow flex items-center justify-center gap-2 p-4 glass-panel !rounded-2xl text-white font-bold"
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-panel !rounded-2xl px-4 text-white font-bold appearance-none bg-slate-900"
          >
            <option value="latest">Latest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 lg:sticky lg:top-24 space-y-6 transition-all duration-300`}>
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                  Filters
                </h3>
                {Object.values(filters).some(v => v !== '') && (
                  <button onClick={() => setFilters({ ram: '', storage: '', brand: '' })} className="text-xs text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider">Reset</button>
                )}
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Brand</p>
                  <div className="flex flex-wrap gap-2">
                    {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Asus', 'Other'].map(b => (
                      <button
                        key={b}
                        onClick={() => toggleFilter('brand', b)}
                        className={`text-[10px] px-3 py-2 rounded-xl border transition-all font-bold ${filters.brand === b ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800'}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Performance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['8GB', '12GB', '16GB', '24GB'].map(r => (
                      <button
                        key={r}
                        onClick={() => toggleFilter('ram', r)}
                        className={`text-xs px-4 py-2 rounded-xl border transition-all font-bold ${filters.ram === r ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        {r} RAM
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Storage</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['128GB', '256GB', '512GB', '1TB'].map(s => (
                      <button
                        key={s}
                        onClick={() => toggleFilter('storage', s)}
                        className={`text-xs px-4 py-2 rounded-xl border transition-all font-bold ${filters.storage === s ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sell Prompt - Only for non-buyers/admins */}
            {(!user || (user.role !== 'buyer' && user.role !== 'admin')) && (
              <div className="glass-panel p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
                <h4 className="text-white font-bold mb-2">Sell your device?</h4>
                <p className="text-slate-400 text-sm mb-4">Get an instant AI valuation and list your item in minutes.</p>
                <button 
                  onClick={() => window.location.href = '/seller-profile'} 
                  className="w-full btn-primary !py-3 !text-sm"
                >
                  Start Selling
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-8 px-2">
              <p className="text-slate-400 font-medium">Showing <span className="text-white">{filteredDevices.length}</span> verified results</p>
              <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Sort:</span>
                <select 
                  className="bg-transparent text-white text-xs font-black border-none focus:ring-0 cursor-pointer outline-none hover:text-blue-400 transition-colors"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest" className="bg-slate-900 text-white">Latest Arrivals</option>
                  <option value="price-low" className="bg-slate-900 text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-slate-900 text-white">Price: High to Low</option>
                </select>
              </div>
              </div>
            </div>

            {filteredDevices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDevices.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
                <p className="text-slate-400">Try broadening your search or resetting filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
