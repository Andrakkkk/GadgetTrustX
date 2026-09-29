'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/utils/formatPrice';
import { apiFetch } from '@/lib/api-client';

export default function ShippingSelector({ originCity = 'Jakarta Pusat', destinationCity = 'Jakarta', totalWeightGrams = 1000, onSelectShipping }) {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourierCode, setSelectedCourierCode] = useState('jne');
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
      try {
        const res = await apiFetch('/api/shipping/cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originCity, destinationCity, totalWeightGrams }),
        });
        const data = await res.json();
        if (!isMounted) return;

        const DEFAULT_FALLBACK_COURIERS = [
          {
            code: 'jne',
            name: 'JNE Express',
            services: [
              { service: 'REG', description: 'JNE Reguler', cost: 18000, etd: '1-2 Hari' },
              { service: 'YES', description: 'Yakin Esok Sampai', cost: 28000, etd: '1 Hari' },
              { service: 'JTR', description: 'JNE Trucking Cargo', cost: 12000, etd: '3-4 Hari' },
            ]
          },
          {
            code: 'jnt',
            name: 'J&T Express',
            services: [
              { service: 'EZ', description: 'J&T Reguler Express', cost: 15000, etd: '1-2 Hari' },
              { service: 'BEST', description: 'J&T Besok Sampai', cost: 25000, etd: '1 Hari' },
            ]
          },
          {
            code: 'sicepat',
            name: 'SiCepat Ekspres',
            services: [
              { service: 'REG', description: 'SiCepat Reguler', cost: 16000, etd: '1-2 Hari' },
              { service: 'BEST', description: 'Besok Sampai Tujuan', cost: 27000, etd: '1 Hari' },
              { service: 'GOKIL', description: 'Cargo Kilat', cost: 12000, etd: '4-7 Hari' },
            ]
          },
          {
            code: 'anteraja',
            name: 'Anteraja',
            services: [
              { service: 'REG', description: 'Anteraja Reguler', cost: 14000, etd: '1-2 Hari' },
              { service: 'NEXTDAY', description: 'Anteraja Next Day', cost: 22000, etd: '1 Hari' },
            ]
          },
          {
            code: 'pos',
            name: 'POS Indonesia',
            services: [
              { service: 'Kilat', description: 'POS Kilat Khusus', cost: 12000, etd: '2-3 Hari' },
              { service: 'Express', description: 'POS Next Day', cost: 20000, etd: '1 Hari' },
            ]
          }
        ];

        const list = (data.couriers && data.couriers.length > 0) ? data.couriers : DEFAULT_FALLBACK_COURIERS;
        setCouriers(list);
        setLoading(false);

        const defaultCourier = list.find((c) => c.code === 'jne') || list[0];
        if (defaultCourier && defaultCourier.services?.length) {
          setSelectedCourierCode(defaultCourier.code);
          const defaultSvc = defaultCourier.services[0];
          setSelectedService(defaultSvc);
          onSelectShipping?.({
            courierName: defaultCourier.name,
            service: defaultSvc.service,
            cost: defaultSvc.cost,
            etd: defaultSvc.etd,
          });
        }
      } catch (err) {
        console.error('Error fetching shipping rates, using fallback:', err);
        if (isMounted) {
          const DEFAULT_FALLBACK_COURIERS = [
            {
              code: 'jne',
              name: 'JNE Express',
              services: [
                { service: 'REG', description: 'JNE Reguler', cost: 18000, etd: '1-2 Hari' },
                { service: 'YES', description: 'Yakin Esok Sampai', cost: 28000, etd: '1 Hari' },
              ]
            }
          ];
          setCouriers(DEFAULT_FALLBACK_COURIERS);
          setSelectedCourierCode('jne');
          setSelectedService(DEFAULT_FALLBACK_COURIERS[0].services[0]);
          setLoading(false);
          onSelectShipping?.({
            courierName: 'JNE Express',
            service: 'REG',
            cost: 18000,
            etd: '1-2 Hari',
          });
        }
      }
    };

    fetchRates();
    return () => {
      isMounted = false;
    };
  }, [originCity, destinationCity, totalWeightGrams, onSelectShipping]);

  const activeCourier = couriers.find((c) => c.code === selectedCourierCode);

  const handleSelectCourier = (code) => {
    setSelectedCourierCode(code);
    const courier = couriers.find((c) => c.code === code);
    if (courier && courier.services?.length) {
      const svc = courier.services[0];
      setSelectedService(svc);
      onSelectShipping?.({
        courierName: courier.name,
        service: svc.service,
        cost: svc.cost,
        etd: svc.etd,
      });
    }
  };

  const handleSelectService = (svc) => {
    setSelectedService(svc);
    if (activeCourier) {
      onSelectShipping?.({
        courierName: activeCourier.name,
        service: svc.service,
        cost: svc.cost,
        etd: svc.etd,
      });
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-white">Ekspedisi Pengiriman</h3>
            <p className="text-xs text-slate-400">Pilih jasa pengiriman dari <span className="text-blue-400 font-bold">{originCity}</span> ke {destinationCity}</p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
          ~{(totalWeightGrams / 1000).toFixed(1)} kg
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Mengkalkulasi tarif pengiriman real-time...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Courier Selection Tabs (3 per row on mobile) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
            {couriers.map((c) => {
              const isSelected = c.code === selectedCourierCode;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCourier(c.code)}
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">{c.name.split(' ')[0]}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 font-medium">{c.services?.length} Opsi</span>
                </button>
              );
            })}
          </div>

          {/* Services List for Active Courier (3 per row on mobile) */}
          {activeCourier && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Pilihan Paket {activeCourier.name}
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {activeCourier.services.map((svc) => {
                  const isSelected = selectedService?.service === svc.service;
                  return (
                    <div
                      key={svc.service}
                      onClick={() => handleSelectService(svc)}
                      className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 sm:gap-3 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-white">{svc.service}</h4>
                          <p className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5 line-clamp-1">{svc.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-t border-white/5 pt-1.5 sm:pt-2 gap-0.5">
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{svc.etd}</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-400">{formatPrice(svc.cost)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
