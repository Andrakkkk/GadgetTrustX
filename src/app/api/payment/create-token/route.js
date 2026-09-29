import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { getRequestUser } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const isValidUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

const CART_ITEM_SELECT = `
  id,
  quantity,
  devices:device_id (
    id,
    name,
    brand,
    price,
    stock,
    seller_id
  )
`;

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (result.profile.role !== 'buyer') {
    return NextResponse.json({ error: 'Only buyers can checkout.' }, { status: 403 });
  }

  const body           = await request.json();
  const shippingFee    = Number(body.shippingFee)    || 0;
  const shippingCourier = body.shippingCourier       || 'JNE Express';
  const shippingService = body.shippingService       || 'REG';
  const rawTradeInId   = body.tradeInId              ?? null;
  const rawTradeInDiscount = Number(body.tradeInDiscount) || 0;
  const tradeInDeviceId = body.tradeInDeviceId       ?? null;

  const rawCartItemIds = Array.isArray(body.cartItemIds) ? body.cartItemIds : [];
  const validCartIds   = rawCartItemIds.filter(isValidUuid);

  const admin = createAdminClient();

  // ── resolvedItems: [{ deviceId, name, price, qty, cartItemId|null, sellerId|null }]
  let resolvedItems = [];

  // Step 1: Try to find cart items by UUID cart_item ids
  if (validCartIds.length > 0) {
    const { data, error: cartErr } = await admin
      .from('cart_items')
      .select(CART_ITEM_SELECT)
      .eq('buyer_id', result.profile.id)
      .in('id', validCartIds);

    if (cartErr) return NextResponse.json({ error: cartErr.message }, { status: 500 });

    for (const row of (data || [])) {
      if (!row.devices) continue;
      resolvedItems.push({
        deviceId:   row.devices.id,
        name:       `${row.devices.brand} ${row.devices.name}`,
        price:      row.devices.price,
        qty:        row.quantity,
        cartItemId: row.id,
        sellerId:   isValidUuid(row.devices.seller_id) ? row.devices.seller_id : null,
      });
    }
  }

  // Step 2: If still empty, try cart_items by device_id (tradeInDeviceId)
  if (!resolvedItems.length && isValidUuid(tradeInDeviceId)) {
    const { data } = await admin
      .from('cart_items')
      .select(CART_ITEM_SELECT)
      .eq('buyer_id', result.profile.id)
      .eq('device_id', tradeInDeviceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.devices) {
      resolvedItems.push({
        deviceId:   data.devices.id,
        name:       `${data.devices.brand} ${data.devices.name}`,
        price:      data.devices.price,
        qty:        1,          // force 1 unit for trade-in
        cartItemId: data.id,
        sellerId:   isValidUuid(data.devices.seller_id) ? data.devices.seller_id : null,
      });
    }
  }

  // Step 3: If STILL empty, query devices table directly by tradeInDeviceId (item not in cart yet)
  if (!resolvedItems.length && isValidUuid(tradeInDeviceId)) {
    const { data: device } = await admin
      .from('devices')
      .select('id, name, brand, price, stock, seller_id')
      .eq('id', tradeInDeviceId)
      .maybeSingle();

    if (device) {
      resolvedItems.push({
        deviceId:   device.id,
        name:       `${device.brand} ${device.name}`,
        price:      device.price,
        qty:        1,
        cartItemId: null,
        sellerId:   isValidUuid(device.seller_id) ? device.seller_id : null,
      });
    }
  }

  if (!resolvedItems.length) {
    return NextResponse.json({ error: 'No valid cart items found.' }, { status: 400 });
  }

  // ── Totals (backend is source of truth for price) ─────────────────────────
  const itemsTotal      = resolvedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tradeInDiscount = Math.min(rawTradeInDiscount, itemsTotal);
  const grandTotal      = Math.max(0, itemsTotal - tradeInDiscount + shippingFee);
  const midtransOrderId = `GTX-${result.profile.id.slice(0, 8)}-${Date.now()}`;

  // ── Create order ───────────────────────────────────────────────────────────
  const orderPayload = {
    buyer_id:          result.profile.id,
    status:            'Pending Payment',
    total:             grandTotal,
    shipping_fee:      shippingFee,
    shipping_courier:  shippingCourier,
    shipping_service:  shippingService,
    midtrans_order_id: midtransOrderId,
    payment_status:    'pending',
    trade_in_discount: tradeInDiscount,
  };
  if (isValidUuid(rawTradeInId)) orderPayload.trade_in_id = rawTradeInId;

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // Link trade_in_request → order (skip if rawTradeInId is not a UUID)
  if (rawTradeInId && rawTradeInId !== 'null' && rawTradeInId !== 'undefined') {
    try {
      await admin.from('trade_in_requests').update({ order_id: order.id }).eq('id', rawTradeInId);
    } catch (e) {
      console.warn('Trade-in link skipped:', e.message);
    }
  }

  // ── Insert order_items ─────────────────────────────────────────────────────
  const orderItemsPayload = resolvedItems.map((item) => {
    const row = {
      order_id:   order.id,
      device_id:  item.deviceId,
      quantity:   item.qty,
      unit_price: item.price,
    };
    if (item.sellerId) row.seller_id = item.sellerId;
    return row;
  });

  const { error: itemsError } = await admin.from('order_items').insert(orderItemsPayload);
  if (itemsError) {
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // ── Delete processed cart items ────────────────────────────────────────────
  const cartIdsToDelete = resolvedItems.map((i) => i.cartItemId).filter(isValidUuid);
  if (cartIdsToDelete.length) {
    await admin
      .from('cart_items')
      .delete()
      .in('id', cartIdsToDelete)
      .eq('buyer_id', result.profile.id);
  }

  // ── Build Midtrans item_details ────────────────────────────────────────────
  const itemDetails = resolvedItems.map((item) => ({
    id:       item.deviceId,
    price:    item.price,
    quantity: item.qty,
    name:     item.name.slice(0, 50),
  }));

  if (shippingFee > 0) {
    itemDetails.push({
      id:       'SHIPPING-FEE',
      price:    shippingFee,
      quantity: 1,
      name:     `Ongkir (${shippingCourier} - ${shippingService})`.slice(0, 50),
    });
  }
  if (tradeInDiscount > 0) {
    itemDetails.push({
      id:       'TRADE-IN-DISCOUNT',
      price:    -tradeInDiscount,
      quantity: 1,
      name:     'Diskon Tukar Tambah (Trade-In)',
    });
  }

  const parameter = {
    transaction_details: {
      order_id:     midtransOrderId,
      gross_amount: grandTotal,
    },
    customer_details: {
      first_name: result.profile.name || 'Buyer',
      email:      result.profile.email,
      phone:      result.profile.phone || '',
    },
    item_details: itemDetails,
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success`,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({
      snapToken:      transaction.token,
      redirectUrl:    transaction.redirect_url,
      orderId:        order.id,
      midtransOrderId,
      cartItemIds:    cartIdsToDelete,
    });
  } catch (err) {
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'Gagal membuat transaksi: ' + err.message }, { status: 500 });
  }
}
