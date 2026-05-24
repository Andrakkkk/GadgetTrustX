import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDeviceRow } from '@/lib/supabase/devices';
import { getRequestUser } from '@/lib/supabase/auth';

const deviceSelect = `
  id,
  seller_id,
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

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('devices')
    .select(deviceSelect)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (data.is_custom_offer) {
    const result = await getRequestUser(request);
    const canView =
      !result.error &&
      (result.profile.role === 'admin' ||
        result.profile.id === data.seller_id ||
        result.profile.id === data.offer_buyer_id);
    if (!canView) {
      return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
    }
  }

  return NextResponse.json({ device: mapDeviceRow(data) });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data: existing } = await result.supabase
    .from('devices')
    .select('seller_id')
    .eq('id', id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
  }
  if (existing.seller_id !== result.profile.id && result.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed to update this device.' }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await result.supabase
    .from('devices')
    .update({
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
      verified_by_trustx: body.verifiedByTrustX,
      is_trade_in: body.isTradeIn,
      is_custom_offer: body.isCustomOffer,
      offer_buyer_id: body.offerBuyerId,
    })
    .eq('id', id)
    .select(deviceSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ device: mapDeviceRow(data) });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const result = await getRequestUser(_request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { data: existing } = await result.supabase
    .from('devices')
    .select('seller_id')
    .eq('id', id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
  }
  if (existing.seller_id !== result.profile.id && result.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed to delete this device.' }, { status: 403 });
  }

  const { error } = await result.supabase.from('devices').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
