import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDeviceRow } from '@/lib/supabase/devices';
import { getRequestUser } from '@/lib/supabase/auth';

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
  chipset,
  description,
  image,
  verified_by_trustx,
  is_trade_in,
  is_custom_offer,
  offer_buyer_id,
  profiles:seller_id (
    id,
    email,
    name,
    store_name,
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

  const id = body.id || `dev_${Date.now()}`;
  const sellerId = result.profile.role === 'admin' && body.sellerId ? body.sellerId : result.profile.id;

  const { data, error } = await result.supabase
    .from('devices')
    .insert({
      id,
      seller_id: sellerId,
      name: body.name,
      brand: body.brand,
      category: body.category,
      price: body.price,
      stock: body.stock,
      condition: body.condition,
      ram: body.ram,
      storage: body.storage,
      chipset: body.chipset,
      description: body.description,
      image: body.image,
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
