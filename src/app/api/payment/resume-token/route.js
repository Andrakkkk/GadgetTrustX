import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { getRequestUser } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select(`
      id,
      midtrans_order_id,
      status,
      total,
      buyer_id,
      order_items (
        id,
        quantity,
        unit_price,
        device_id,
        devices:device_id (
          id,
          name,
          brand
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.buyer_id !== result.profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status !== 'Pending Payment') {
    return NextResponse.json({ error: 'Order is not pending payment.' }, { status: 400 });
  }

  // Generate a fresh unique Midtrans order ID for the new Snap payment session
  const baseMidtransId = order.midtrans_order_id
    ? order.midtrans_order_id.split('-R')[0]
    : `GTX-${order.id.slice(0, 8)}`;
  const freshMidtransOrderId = `${baseMidtransId}-R${Date.now().toString().slice(-6)}`;

  // Update midtrans_order_id in Supabase so the order stays linked to the new transaction
  await admin
    .from('orders')
    .update({ midtrans_order_id: freshMidtransOrderId, updated_at: new Date().toISOString() })
    .eq('id', order.id);

  const parameter = {
    transaction_details: {
      order_id: freshMidtransOrderId,
      gross_amount: order.total,
    },
    customer_details: {
      first_name: result.profile.name || 'Buyer',
      email: result.profile.email,
      phone: result.profile.phone || '',
    },
    item_details: (order.order_items || []).map((item) => ({
      id: item.device_id,
      price: item.unit_price,
      quantity: item.quantity,
      name: `${item.devices?.brand || ''} ${item.devices?.name || 'Device'}`.slice(0, 50),
    })),
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
      midtransOrderId: freshMidtransOrderId,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal membuat sesi pembayaran: ' + err.message }, { status: 500 });
  }
}
