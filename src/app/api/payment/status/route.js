import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { getRequestUser } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export async function GET(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, midtrans_order_id, status, payment_status, payment_method, total')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Fetch real Midtrans transaction status if midtrans_order_id exists
  if (order.midtrans_order_id) {
    try {
      const midtransStatus = await snap.transaction.status(order.midtrans_order_id);
      return NextResponse.json({
        order,
        midtransStatus,
      });
    } catch (err) {
      console.warn('[payment/status] Midtrans status error:', err?.message);
    }
  }

  return NextResponse.json({ order, midtransStatus: null });
}
