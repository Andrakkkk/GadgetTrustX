import { NextResponse } from 'next/server';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'id',
    'accept-language': 'id',
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'SmartDeviceMarketplace/0.1 (local development)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] }, { status: response.status });
    }

    const results = await response.json();
    const suggestions = results.map((item) => ({
      id: String(item.place_id),
      title: item.name || item.display_name?.split(',')[0] || 'Lokasi',
      address: item.display_name || '',
      lat: Number(item.lat),
      lon: Number(item.lon),
      type: item.type || item.category || 'address',
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Geocode search failed', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
