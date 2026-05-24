import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';
import { deviceSelect, formatDateLabel } from '@/lib/supabase/commerce';
import { mapDeviceRow } from '@/lib/supabase/devices';

const orderSelect = `
  id,
  status,
  total,
  created_at,
  buyer:buyer_id (
    id,
    email,
    name
  ),
  order_items (
    id,
    quantity,
    unit_price,
    return_status,
    return_reason,
    return_image,
    return_date,
    devices:device_id (
      ${deviceSelect}
    )
  )
`;

function mapOrderRow(row, ratedItems = []) {
  return {
    id: row.id,
    buyerEmail: row.buyer?.email || '',
    date: formatDateLabel(row.created_at),
    items: (row.order_items || []).flatMap((item) => {
      const device = item.devices ? mapDeviceRow(item.devices) : null;
      if (!device) return [];

      return [{
        ...device,
        price: item.unit_price,
        cartQty: item.quantity,
        orderItemId: item.id,
        returnStatus: item.return_status,
        returnReason: item.return_reason,
        returnImage: item.return_image,
        returnDate: item.return_date ? formatDateLabel(item.return_date) : null,
      }];
    }),
    total: row.total,
    status: row.status,
    ratedItems,
  };
}

async function getRatedItemsByOrder(supabase, orderIds) {
  if (!orderIds.length) return new Map();

  const { data } = await supabase
    .from('reviews')
    .select('order_id, order_item_id')
    .in('order_id', orderIds)
    .not('order_item_id', 'is', null);

  return (data || []).reduce((map, review) => {
    const items = map.get(review.order_id) || [];
    items.push(review.order_item_id);
    map.set(review.order_id, items);
    return map;
  }, new Map());
}

export async function GET(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { searchParams } = new URL(request.url);
  let query = result.supabase.from('orders').select(orderSelect).order('created_at', { ascending: false });

  if (searchParams.get('scope') !== 'all' || result.profile.role !== 'admin') {
    if (result.profile.role === 'seller') {
      const { data: sellerItems } = await result.supabase
        .from('order_items')
        .select('order_id')
        .eq('seller_id', result.profile.id);
      const orderIds = [...new Set((sellerItems || []).map((item) => item.order_id))];
      query = query.in('id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']);
    } else {
      query = query.eq('buyer_id', result.profile.id);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ratedItemsByOrder = await getRatedItemsByOrder(result.supabase, data.map((order) => order.id));
  return NextResponse.json({
    orders: data.map((order) => mapOrderRow(order, ratedItemsByOrder.get(order.id) || [])),
  });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const selectedIds = body.cartItemIds || [];
  const { data: cartItems, error: cartError } = await result.supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      devices:device_id (
        id,
        price,
        stock,
        seller_id
      )
    `)
    .eq('buyer_id', result.profile.id)
    .in('id', selectedIds);

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 500 });
  }
  if (!cartItems?.length) {
    return NextResponse.json({ error: 'No cart items selected.' }, { status: 400 });
  }
  if (cartItems.some((item) => item.quantity > item.devices.stock)) {
    return NextResponse.json({ error: 'Some items no longer have enough stock.' }, { status: 409 });
  }

  const total = cartItems.reduce((sum, item) => sum + item.devices.price * item.quantity, 0);
  const { data: order, error: orderError } = await result.supabase
    .from('orders')
    .insert({
      buyer_id: result.profile.id,
      status: 'Processing',
      total,
    })
    .select('id')
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const { error: itemsError } = await result.supabase
    .from('order_items')
    .insert(
      cartItems.map((item) => ({
        order_id: order.id,
        device_id: item.devices.id,
        seller_id: item.devices.seller_id,
        quantity: item.quantity,
        unit_price: item.devices.price,
      }))
    );

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  for (const item of cartItems) {
    await result.supabase
      .from('devices')
      .update({
        stock: item.devices.stock - item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.devices.id);
  }

  await result.supabase.from('cart_items').delete().in('id', selectedIds).eq('buyer_id', result.profile.id);

  const { data } = await result.supabase
    .from('orders')
    .select(orderSelect)
    .eq('id', order.id)
    .single();

  return NextResponse.json({ order: mapOrderRow(data) }, { status: 201 });
}

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (result.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await result.supabase
    .from('orders')
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select(orderSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ratedItemsByOrder = await getRatedItemsByOrder(result.supabase, [data.id]);
  return NextResponse.json({ order: mapOrderRow(data, ratedItemsByOrder.get(data.id) || []) });
}
