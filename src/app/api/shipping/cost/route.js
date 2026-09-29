import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';

const RAJAONGKIR_BASE = 'https://api.rajaongkir.com/starter';

/**
 * Query BinderByte API for shipping rates using city names directly.
 * BinderByte endpoint: GET https://api.binderbyte.com/v1/cost
 */
async function queryBinderbyteCost(apiKey, originCity, destinationCity, weightKg, courier) {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      origin: originCity.toLowerCase().replace(/kota\s+/i, '').trim(),
      destination: destinationCity.toLowerCase().replace(/kota\s+/i, '').trim(),
      weight: String(weightKg),
      courier,
    });

    const res = await fetch(`https://api.binderbyte.com/v1/cost?${params.toString()}`);
    const json = await res.json();

    if (json?.status === 200 && json?.data?.costs?.length) {
      return json.data.costs.map((item) => ({
        service: item.service || item.code,
        description: item.description || item.name || 'Layanan Pengiriman',
        etd: item.etd ? (item.etd.includes('Hari') ? item.etd : `${item.etd} Hari`) : '1-3 Hari',
        cost: item.cost || item.price || 0,
      }));
    }
  } catch (err) {
    console.warn(`[shipping/cost] Binderbyte API error for ${courier}:`, err.message);
  }
  return null;
}

/**
 * Fetch city list from RajaOngkir and find city ID by name (fuzzy match).
 */
async function findCityId(apiKey, cityName) {
  if (!cityName) return null;
  try {
    const res = await fetch(`${RAJAONGKIR_BASE}/city`, {
      headers: { key: apiKey },
    });
    const data = await res.json();
    const cities = data?.rajaongkir?.results || [];
    const needle = cityName.toLowerCase().trim();

    let found = cities.find((c) => c.city_name.toLowerCase() === needle);
    if (!found) found = cities.find((c) => needle.includes(c.city_name.toLowerCase()) || c.city_name.toLowerCase().includes(needle));
    if (!found) {
      found = cities.find((c) =>
        `${c.type} ${c.city_name}`.toLowerCase().includes(needle) ||
        needle.includes(c.city_name.toLowerCase().replace('kota ', '').replace('kabupaten ', ''))
      );
    }
    return found?.city_id || null;
  } catch (e) {
    return null;
  }
}

/**
 * Query RajaOngkir shipping cost for a single courier.
 */
async function queryRajaongkirCost(apiKey, originId, destId, weight, courier) {
  try {
    const res = await fetch(`${RAJAONGKIR_BASE}/cost`, {
      method: 'POST',
      headers: {
        key: apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: originId,
        destination: destId,
        weight: String(weight),
        courier,
      }),
    });
    const data = await res.json();
    const costs = data?.rajaongkir?.results?.[0]?.costs || [];
    if (!costs.length) return null;

    return costs.map((c) => ({
      service: c.service,
      description: c.description,
      etd: c.cost?.[0]?.etd ? `${c.cost[0].etd} Hari` : '1-3 Hari',
      cost: c.cost?.[0]?.value || 0,
    }));
  } catch (e) {
    return null;
  }
}

/**
 * Fallback zone-based internal calculator.
 */
const CITY_ZONE = {
  'jakarta pusat': 1, 'jakarta selatan': 1, 'jakarta barat': 1, 'jakarta utara': 1, 'jakarta timur': 1,
  jakarta: 1, bogor: 1, depok: 1, tangerang: 1, bekasi: 1,
  bandung: 1, surabaya: 1, yogyakarta: 1, semarang: 1, solo: 1, malang: 1,
  medan: 2, palembang: 2, pekanbaru: 2, padang: 2, batam: 2, aceh: 2, lampung: 2,
  balikpapan: 3, samarinda: 3, pontianak: 3, banjarmasin: 3,
  makassar: 4, manado: 4, denpasar: 4, mataram: 4, ambon: 4, jayapura: 4, kupang: 4,
};

function getZone(city) {
  if (!city) return 1;
  const k = city.toLowerCase().trim();
  for (const [name, zone] of Object.entries(CITY_ZONE)) {
    if (k.includes(name) || name.includes(k)) return zone;
  }
  return 1;
}

function getMultiplier(originCity, destCity) {
  const oZone = getZone(originCity);
  const dZone = getZone(destCity);
  const oN = (originCity || '').toLowerCase();
  const dN = (destCity || '').toLowerCase();
  if (oN === dN || (oN.includes('jakarta') && dN.includes('jakarta'))) return 0.7;
  if (oZone === dZone) return 1.0;
  if ((oZone === 1 && dZone === 2) || (oZone === 2 && dZone === 1)) return 1.5;
  if ((oZone === 1 && dZone === 3) || (oZone === 3 && dZone === 1)) return 1.7;
  if ((oZone === 1 && dZone === 4) || (oZone === 4 && dZone === 1)) return 2.2;
  return 2.5;
}

function internalFallback(originCity, destinationCity, weightKg) {
  const m = getMultiplier(originCity, destinationCity);
  const oZ = getZone(originCity);
  const dZ = getZone(destinationCity);
  const same = (originCity || '').toLowerCase() === (destinationCity || '').toLowerCase();
  const etdReg = same ? '1 Hari' : oZ === dZ ? '1-2 Hari' : oZ + dZ <= 4 ? '2-3 Hari' : '3-5 Hari';
  const etdExp = same ? 'Hari Ini / Esok' : '1 Hari';
  const etdEco = same ? '1-2 Hari' : '4-7 Hari';

  return [
    {
      code: 'jne', name: 'JNE Express',
      services: [
        { service: 'REG', description: 'Layanan Reguler', etd: etdReg, cost: Math.round(18000 * m * weightKg) },
        { service: 'YES', description: 'Yakin Esok Sampai', etd: etdExp, cost: Math.round(30000 * m * weightKg) },
        { service: 'OKE', description: 'Ongkos Kirim Ekonomis', etd: etdEco, cost: Math.round(14000 * m * weightKg) },
      ],
    },
    {
      code: 'jnt', name: 'J&T Express',
      services: [
        { service: 'EZ', description: 'Layanan Reguler J&T', etd: etdReg, cost: Math.round(17000 * m * weightKg) },
        { service: 'SUPER', description: 'Layanan Prioritas', etd: etdExp, cost: Math.round(28000 * m * weightKg) },
      ],
    },
    {
      code: 'sicepat', name: 'SiCepat Ekspres',
      services: [
        { service: 'REG', description: 'SiCepat Reguler', etd: etdReg, cost: Math.round(16000 * m * weightKg) },
        { service: 'BEST', description: 'Besok Sampai Tujuan', etd: etdExp, cost: Math.round(27000 * m * weightKg) },
        { service: 'GOKIL', description: 'Cargo Kilat', etd: etdEco, cost: Math.round(12000 * m * weightKg) },
      ],
    },
    {
      code: 'anteraja', name: 'Anteraja',
      services: [
        { service: 'REGULAR', description: 'Layanan Reguler Anteraja', etd: etdReg, cost: Math.round(15000 * m * weightKg) },
        { service: 'NEXT DAY', description: 'Layanan Kilat Esok Hari', etd: etdExp, cost: Math.round(26000 * m * weightKg) },
      ],
    },
    {
      code: 'pos', name: 'POS Indonesia',
      services: [
        { service: 'Pos Reguler', description: 'Pengiriman Standar Nusantara', etd: etdEco, cost: Math.round(14500 * m * weightKg) },
        { service: 'Pos Nextday', description: 'Pengiriman Kilat Khusus', etd: etdExp, cost: Math.round(29000 * m * weightKg) },
      ],
    },
  ];
}

/**
 * POST /api/shipping/cost
 * Body: { originCity, destinationCity, totalWeightGrams }
 */
export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const {
    destinationCity = 'Jakarta',
    totalWeightGrams = 1000,
    originCity = 'Jakarta Pusat',
  } = body;

  const weightGrams = Math.max(1, totalWeightGrams);
  const weightKg = Math.ceil(weightGrams / 1000);

  const bbApiKey = process.env.BINDERBYTE_API_KEY;
  const roApiKey = process.env.RAJAONGKIR_API_KEY;

  // 1. Try BinderByte API
  if (bbApiKey) {
    try {
      const couriersToQuery = [
        { code: 'jne', name: 'JNE Express' },
        { code: 'jnt', name: 'J&T Express' },
        { code: 'sicepat', name: 'SiCepat Ekspres' },
        { code: 'pos', name: 'POS Indonesia' },
      ];

      const bbResults = await Promise.all(
        couriersToQuery.map(async (c) => {
          const services = await queryBinderbyteCost(bbApiKey, originCity, destinationCity, weightKg, c.code);
          return services && services.length > 0 ? { code: c.code, name: c.name, services } : null;
        })
      );

      const validCouriers = bbResults.filter(Boolean);

      if (validCouriers.length > 0) {
        return NextResponse.json({
          source: 'binderbyte',
          originCity,
          destinationCity,
          totalWeightGrams,
          weightKg,
          couriers: validCouriers,
        });
      }
    } catch (err) {
      console.warn('[shipping/cost] Binderbyte API error:', err.message);
    }
  }

  // 2. Try RajaOngkir API
  if (roApiKey) {
    try {
      const [originId, destId] = await Promise.all([
        findCityId(roApiKey, originCity),
        findCityId(roApiKey, destinationCity),
      ]);

      if (originId && destId) {
        const [jne, jnt, sicepat, pos] = await Promise.all([
          queryRajaongkirCost(roApiKey, originId, destId, weightGrams, 'jne'),
          queryRajaongkirCost(roApiKey, originId, destId, weightGrams, 'jnt'),
          queryRajaongkirCost(roApiKey, originId, destId, weightGrams, 'sicepat'),
          queryRajaongkirCost(roApiKey, originId, destId, weightGrams, 'pos'),
        ]);

        const roCouriers = [
          jne?.length ? { code: 'jne', name: 'JNE Express', services: jne } : null,
          jnt?.length ? { code: 'jnt', name: 'J&T Express', services: jnt } : null,
          sicepat?.length ? { code: 'sicepat', name: 'SiCepat Ekspres', services: sicepat } : null,
          pos?.length ? { code: 'pos', name: 'POS Indonesia', services: pos } : null,
        ].filter(Boolean);

        if (roCouriers.length > 0) {
          return NextResponse.json({
            source: 'rajaongkir',
            originCity,
            destinationCity,
            totalWeightGrams,
            weightKg,
            couriers: roCouriers,
          });
        }
      }
    } catch (err) {
      console.warn('[shipping/cost] RajaOngkir API error:', err.message);
    }
  }

  // 3. Fallback to Internal Calculator
  const couriers = internalFallback(originCity, destinationCity, weightKg);

  return NextResponse.json({
    source: 'internal',
    originCity,
    destinationCity,
    totalWeightGrams,
    weightKg,
    couriers,
  });
}
