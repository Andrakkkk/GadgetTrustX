import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';
import { deviceSelect, mapCartRow } from '@/lib/supabase/commerce';

const cartSelect = `
  id,
  quantity,
  devices:device_id (
    ${deviceSelect}
  )
`;

export async function GET(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data, error } = await result.supabase
    .from('cart_items')
    .select(cartSelect)
    .eq('buyer_id', result.profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data.map(mapCartRow) });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const quantity = Math.max(Number(body.quantity || 1), 1);
  const { data: device } = await result.supabase
    .from('devices')
    .select('id, stock, is_custom_offer, offer_buyer_id')
    .eq('id', body.deviceId)
    .single();

  if (!device) {
    return NextResponse.json({ error: 'Device not found.' }, { status: 404 });
  }
  if (device.is_custom_offer && device.offer_buyer_id !== result.profile.id) {
    return NextResponse.json({ error: 'This offer is not available for your account.' }, { status: 403 });
  }

  const { data: existing } = await result.supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('buyer_id', result.profile.id)
    .eq('device_id', body.deviceId)
    .maybeSingle();

  const nextQuantity = Math.min((existing?.quantity || 0) + quantity, device.stock);
  if (nextQuantity <= 0) {
    return NextResponse.json({ error: 'Device is out of stock.' }, { status: 409 });
  }

  const query = existing
    ? result.supabase
        .from('cart_items')
        .update({ quantity: nextQuantity })
        .eq('id', existing.id)
    : result.supabase
        .from('cart_items')
        .insert({ buyer_id: result.profile.id, device_id: body.deviceId, quantity: nextQuantity });

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return GET(request);
}

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data: item } = await result.supabase
    .from('cart_items')
    .select('id, device_id, devices:device_id ( stock )')
    .eq('id', body.cartItemId)
    .eq('buyer_id', result.profile.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Cart item not found.' }, { status: 404 });
  }

  const quantity = Math.max(Number(body.quantity || 1), 1);
  if (quantity > item.devices.stock) {
    return NextResponse.json({ error: `Only ${item.devices.stock} in stock.` }, { status: 409 });
  }

  const { error } = await result.supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', item.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return GET(request);
}

export async function DELETE(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const ids = Array.isArray(body.cartItemIds) ? body.cartItemIds : [body.cartItemId].filter(Boolean);

  const { error } = await result.supabase
    .from('cart_items')
    .delete()
    .in('id', ids)
    .eq('buyer_id', result.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return GET(request);
}
