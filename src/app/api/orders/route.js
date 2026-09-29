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
  updated_at,
  midtrans_order_id,
  payment_method,
  payment_status,
  shipping_courier,
  shipping_service,
  shipping_fee,
  waybill_number,
  trade_in_discount,
  buyer:buyer_id (
    id,
    email,
    name,
    phone,
    address
  ),
  trade_in:trade_in_id (
    id,
    status,
    old_device_name,
    old_device_brand,
    old_device_condition,
    old_device_storage,
    old_device_ram,
    old_device_battery_health,
    old_device_accessories,
    old_device_description,
    old_device_images,
    old_device_waybill,
    old_device_courier,
    inspection_images,
    final_trade_in_value
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
  const ti = row.trade_in;
  return {
    id: row.id,
    midtransOrderId: row.midtrans_order_id,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    shippingCourier: row.shipping_courier,
    shippingService: row.shipping_service,
    shippingFee: row.shipping_fee || 0,
    waybillNumber: row.waybill_number,
    tradeInDiscount: row.trade_in_discount || 0,
    buyerEmail: row.buyer?.email || '',
    buyerName: row.buyer?.name || '',
    buyerPhone: row.buyer?.phone || '',
    shippingAddress: row.buyer?.address || '',
    createdAt: row.created_at,
    date: formatDateLabel(row.created_at),
    // Full trade-in details joined from trade_in_requests
    tradeIn: ti ? {
      id: ti.id,
      status: ti.status,
      oldDeviceName: ti.old_device_name || '',
      oldDeviceCondition: ti.old_device_condition || '',
      oldDeviceStorage: ti.old_device_storage || '',
      oldDeviceRam: ti.old_device_ram || '',
      oldDeviceBatteryHealth: ti.old_device_battery_health || null,
      oldDeviceAccessories: ti.old_device_accessories || '',
      oldDeviceDescription: ti.old_device_description || '',
      oldDeviceImages: ti.old_device_images || [],
      oldDeviceWaybill: ti.old_device_waybill || '',
      oldDeviceCourier: ti.old_device_courier || '',
      inspectionImages: ti.inspection_images || [],
      finalValue: ti.final_trade_in_value || 0,
    } : null,
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

  // AUTO-COMPLETE: Delivered orders older than 3 days are auto-completed
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const deliveredOldIds = data
    .filter((o) => o.status === 'Delivered' && o.updated_at && o.updated_at < threeDaysAgo)
    .map((o) => o.id);
  if (deliveredOldIds.length > 0) {
    await result.supabase
      .from('orders')
      .update({ status: 'Completed', updated_at: new Date().toISOString() })
      .in('id', deliveredOldIds);
    // Reflect in local data
    deliveredOldIds.forEach((id) => {
      const row = data.find((o) => o.id === id);
      if (row) row.status = 'Completed';
    });
  }

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

  const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  const rawTradeInId = body.tradeInId;
  const isTradeInUuid = isValidUuid(rawTradeInId);
  const tradeInIdToSave = isTradeInUuid ? rawTradeInId : null;

  const itemsTotal = cartItems.reduce((sum, item) => sum + item.devices.price * item.quantity, 0);
  const rawDiscount = Number(body.tradeInDiscount) || 0;
  const tradeInDiscount = Math.min(rawDiscount, itemsTotal);
  const shippingFee = Number(body.shippingFee) || 0;
  const grandTotal = Math.max(0, itemsTotal - tradeInDiscount + shippingFee);

  const orderInsertData = {
    buyer_id: result.profile.id,
    status: 'Processing',
    total: grandTotal,
    trade_in_discount: tradeInDiscount,
  };

  if (isTradeInUuid) {
    orderInsertData.trade_in_id = tradeInIdToSave;
  }
  if (body.shippingCourier) orderInsertData.shipping_courier = body.shippingCourier;
  if (body.shippingService) orderInsertData.shipping_service = body.shippingService;
  if (body.shippingFee) orderInsertData.shipping_fee = body.shippingFee;

  const { data: order, error: orderError } = await result.supabase
    .from('orders')
    .insert(orderInsertData)
    .select('id')
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Link order_id back to trade_in_requests
  if (rawTradeInId && rawTradeInId !== 'null' && rawTradeInId !== 'undefined') {
    try {
      await result.supabase
        .from('trade_in_requests')
        .update({
          order_id: order.id,
          status: 'shipping',
          updated_at: new Date().toISOString()
        })
        .eq('id', rawTradeInId);
    } catch (e) {
      console.warn('Trade-in request update skipped:', e);
    }
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

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
  }

  // Verify ownership and role authorization
  const { data: existingOrder, error: fetchError } = await result.supabase
    .from('orders')
    .select('id, buyer_id, status, order_items(seller_id)')
    .eq('id', body.id)
    .single();

  if (fetchError || !existingOrder) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const userId = result.profile.id;
  const userRole = result.profile.role;

  const isBuyer = existingOrder.buyer_id === userId;
  const isSeller = (existingOrder.order_items || []).some((item) => item.seller_id === userId);
  const isAdmin = userRole === 'admin';

  if (!isAdmin && !isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to update this order.' }, { status: 403 });
  }

  // Buyer specific restriction: buyers can only cancel pending/processing orders or confirm delivery
  if (isBuyer && !isSeller && !isAdmin) {
    if (body.status && !['Cancelled', 'Completed'].includes(body.status)) {
      return NextResponse.json({ error: 'Forbidden: Buyers can only cancel or complete orders.' }, { status: 403 });
    }
  }

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (body.status) updatePayload.status = body.status;
  if (body.waybillNumber !== undefined) updatePayload.waybill_number = body.waybillNumber;
  if (body.shippingCourier) updatePayload.shipping_courier = body.shippingCourier;
  if (body.shippingService) updatePayload.shipping_service = body.shippingService;

  const { data, error } = await result.supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', body.id)
    .select(orderSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ratedItemsByOrder = await getRatedItemsByOrder(result.supabase, [data.id]);
  return NextResponse.json({ order: mapOrderRow(data, ratedItemsByOrder.get(data.id) || []) });
}
