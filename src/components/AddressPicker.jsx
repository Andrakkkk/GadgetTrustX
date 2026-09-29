'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CENTER = { lat: -6.2, lon: 106.816666 };
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  const existingCss = document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`);
  if (!existingCss) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_URL;
    document.head.appendChild(link);
  }

  const existingScript = document.querySelector(`script[src="${LEAFLET_JS_URL}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function AddressPicker({ value, onChange }) {
  const addressValue = value || '';
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [message, setMessage] = useState('');
  const skipNextSearchRef = useRef(false);
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const generateAddress = useCallback(async (lat, lon) => {
    setIsGenerating(true);
    setSuggestions([]);
    setMessage('Membaca alamat dari titik maps...');

    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      const data = await response.json();

      if (!response.ok || !data.address) {
        setMessage(data.error || 'Alamat tidak ditemukan. Coba titik yang lebih dekat jalan utama.');
        return;
      }

      skipNextSearchRef.current = true;
      markerRef.current?.setLatLng([data.lat, data.lon]);
      mapRef.current?.setView([data.lat, data.lon], Math.max(mapRef.current.getZoom(), 15), {
        animate: true,
      });
      onChangeRef.current(data.address);
      setMessage('Alamat berhasil dibuat dari titik maps.');
    } catch (error) {
      console.error('Address generation failed', error);
      setMessage('Gagal generate alamat. Coba klik titik lain atau ketik alamat yang lebih spesifik.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadLeaflet()
      .then((L) => {
        if (!isMounted || !mapElementRef.current || mapRef.current) return;

        const map = L.map(mapElementRef.current, {
          center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lon],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([DEFAULT_CENTER.lat, DEFAULT_CENTER.lon], {
          draggable: true,
        }).addTo(map);

        map.on('contextmenu', (event) => {
          generateAddress(event.latlng.lat, event.latlng.lng);
        });
        marker.on('dragend', (event) => {
          const position = event.target.getLatLng();
          generateAddress(position.lat, position.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setIsMapReady(true);
      })
      .catch(() => {
        setMessage('Maps interaktif belum bisa dimuat. Rekomendasi alamat tetap bisa digunakan.');
      });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [generateAddress]);

  useEffect(() => {
    const query = addressValue.trim();

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (query.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setMessage('');

      try {
        const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
          setMessage('Rekomendasi belum tersedia. Coba ketik alamat yang lebih spesifik.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [addressValue]);

  const handleAddressChange = (event) => {
    setMessage('');
    if (event.target.value.trim().length < 3) {
      setSuggestions([]);
    }
    onChange(event.target.value);
  };

  const selectLocation = (location) => {
    const nextCenter = { lat: Number(location.lat), lon: Number(location.lon) };
    skipNextSearchRef.current = true;
    markerRef.current?.setLatLng([nextCenter.lat, nextCenter.lon]);
    mapRef.current?.setView([nextCenter.lat, nextCenter.lon], 17, { animate: true });
    setSuggestions([]);
    setMessage('Maps dipindahkan ke lokasi yang dipilih.');
    onChange(location.address);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Browser belum mendukung akses lokasi. Silakan pilih dari maps atau ketik alamat.');
      return;
    }

    setIsGenerating(true);
    setMessage('Mengambil lokasi perangkat...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        generateAddress(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsGenerating(false);
        setMessage('Izin lokasi ditolak. Anda tetap bisa klik kanan di maps atau ketik alamat.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4">
        <div className="space-y-3">
          <input
            type="text"
            className="input-field"
            value={addressValue}
            onChange={handleAddressChange}
            placeholder="Cari alamat, nama gedung, jalan, kecamatan, atau pilih titik di maps..."
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-50"
            >
              Gunakan Lokasi Saya
            </button>
          </div>

          {(isSearching || suggestions.length > 0 || message) && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {suggestions.length > 0 ? 'Rekomendasi Alamat' : 'Status Alamat'}
                </p>
                {isSearching && <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Mencari...</span>}
              </div>

              {suggestions.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectLocation(item)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="block text-sm font-bold text-white line-clamp-1">{item.title}</span>
                      <span className="block text-xs text-slate-500 mt-1 leading-relaxed">{item.address}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-4 text-xs text-slate-500">{message}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[280px] relative">
          <div ref={mapElementRef} className="absolute inset-0 z-0" />
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 px-6 text-center">
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Maps interaktif sedang dimuat...
              </p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-between gap-3">
            <span className="rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 backdrop-blur">
              Klik kanan titik alamat
            </span>
            {isGenerating && (
              <span className="rounded-xl bg-blue-500/20 border border-blue-500/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-200 backdrop-blur">
                Generate...
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs text-slate-300 leading-relaxed">
              Geser dan zoom maps seperti biasa. Klik kanan atau drag marker untuk generate alamat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
