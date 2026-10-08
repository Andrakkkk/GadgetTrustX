import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDeviceRow } from '@/lib/supabase/devices';
import { getRequestUser } from '@/lib/supabase/auth';
import { validateDeviceListingInput } from '@/utils/validation';

const deviceSelect = `
  id,
  name,
  brand,
  category,
  price,
  stock,
  condition,
  ram,
  storage,
  battery_health,
  chipset,
  description,
  image,
  location,
  verified_by_trustx,
  is_trade_in,
  is_custom_offer,
  offer_buyer_id,
  profiles:seller_id (
    id,
    email,
    name,
    store_name,
    address,
    is_verified,
    badges
  )
`;

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('devices')
    .select(deviceSelect)
    .eq('is_custom_offer', false)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ devices: data.map(mapDeviceRow) });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const isTradeIn = Boolean(body.isTradeIn);
  if (!isTradeIn && !['seller', 'admin'].includes(result.profile.role)) {
    return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
  }

  const validation = validateDeviceListingInput({
    name: body.name,
    brand: body.brand,
    category: body.category,
    price: body.price,
    stock: body.stock,
    description: body.description,
    chipset: body.chipset,
  });

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { name, brand, category, price, stock, description, chipset } = validation.sanitized;

  const id = body.id || `dev_${Date.now()}`;
  const sellerId = result.profile.role === 'admin' && body.sellerId ? body.sellerId : result.profile.id;

  const { data, error } = await result.supabase
    .from('devices')
    .insert({
      id,
      seller_id: sellerId,
      name,
      brand,
      category,
      price,
      stock,
      condition: body.condition || (isTradeIn ? 'Good' : 'Brand New'),
      ram: body.ram || '8GB',
      storage: body.storage || '256GB',
      battery_health: body.batteryHealth || body.battery_health || 90,
      chipset,
      description,
      image: body.image,
      location: body.location || 'Jakarta',
      verified_by_trustx: body.verifiedByTrustX ?? false,
      is_trade_in: isTradeIn,
      is_custom_offer: body.isCustomOffer ?? false,
      offer_buyer_id: body.offerBuyerId ?? null,
    })
    .select(deviceSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ device: mapDeviceRow(data) }, { status: 201 });
}
