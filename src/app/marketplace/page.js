'use client';
import { useState, useMemo, useEffect } from 'react';
import { dummyDevices } from '@/data/dummyDevices';
import DeviceCard from '@/components/DeviceCard';
import AuthGuard from '@/components/AuthGuard';

export default function MarketplacePage() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    ram: '',
    storage: '',
    brand: ''
  });

  useEffect(() => {
    // Load from localStorage or initialize
    const saved = localStorage.getItem('gadgetTrustX_devices');
    if (saved) {
      let parsed = JSON.parse(saved);
      let updated = false;
      // Auto-seed new dummy devices if missing
      dummyDevices.forEach(d => {
         if (!parsed.find(p => p.id === d.id)) {
            parsed.push(d);
            updated = true;
         }
      });
      if (updated) localStorage.setItem('gadgetTrustX_devices', JSON.stringify(parsed));
      setDevices(parsed);
    } else {
      localStorage.setItem('gadgetTrustX_devices', JSON.stringify(dummyDevices));
      setDevices(dummyDevices);
    }
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      if (device.isTradeIn) return false;
      const matchSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRam = filters.ram ? device.ram === filters.ram : true;
      const matchStorage = filters.storage ? device.storage === filters.storage : true;
      const matchBrand = filters.brand ? device.brand === filters.brand : true;
      return matchSearch && matchRam && matchStorage && matchBrand;
    });
  }, [searchTerm, filters, devices]);

  const toggleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value
    }));
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8">

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Explore Devices</h1>
            <p className="text-slate-400">Find verified electronics at the best market prices.</p>
          </div>
          <div className="w-full md:w-[450px] mt-4 md:mt-0 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <input
              type="text"
              className="input-field !pl-14 py-3.5 bg-slate-900/90 border-slate-700 focus:border-transparent focus:ring-2 focus:ring-blue-500 relative z-10 shadow-lg rounded-xl text-white placeholder-slate-400"
              placeholder="Search devices by name, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 group-hover:text-blue-400 transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 space-y-6">
            <div className="glass-panel p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Filter Specs
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Brand</p>
                  <div className="flex flex-wrap gap-2">
                    {['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Asus', 'Infinix', 'Poco', 'OnePlus'].map(b => (
                      <button
                        key={b}
                        onClick={() => toggleFilter('brand', b)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filters.brand === b ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">RAM</p>
                  <div className="flex flex-wrap gap-2">
                    {['6GB', '8GB', '12GB', '16GB'].map(r => (
                      <button
                        key={r}
                        onClick={() => toggleFilter('ram', r)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filters.ram === r ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Storage</p>
                  <div className="flex flex-wrap gap-2">
                    {['128GB', '256GB', '512GB'].map(s => (
                      <button
                        key={s}
                        onClick={() => toggleFilter('storage', s)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filters.storage === s ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {Object.values(filters).some(v => v !== '') && (
                <button
                  onClick={() => setFilters({ ram: '', storage: '', brand: '' })}
                  className="mt-6 w-full text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            {filteredDevices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDevices.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-xl font-medium text-white mb-2">No devices found</h3>
                <p className="text-slate-400">Try adjusting your filters or search term.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
