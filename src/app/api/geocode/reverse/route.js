import { NextResponse } from 'next/server';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export async function GET(request) {
  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lon = Number(request.nextUrl.searchParams.get('lon'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Koordinat tidak valid.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'id',
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'SmartDeviceMarketplace/0.1 (local development)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan.' }, { status: response.status });
    }

    const result = await response.json();

    return NextResponse.json({
      address: result.display_name || '',
      lat: Number(result.lat) || lat,
      lon: Number(result.lon) || lon,
    });
  } catch (error) {
    console.error('Reverse geocode failed', error);
    return NextResponse.json({ error: 'Gagal membaca alamat dari maps.' }, { status: 500 });
  }
}
