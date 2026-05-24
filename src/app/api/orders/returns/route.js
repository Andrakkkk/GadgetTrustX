import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';

async function computeOrderStatus(supabase, orderId) {
  const { data: items } = await supabase
    .from('order_items')
    .select('return_status')
    .eq('order_id', orderId);

  const statuses = (items || []).map((item) => item.return_status);
  if (statuses.some((status) => status === 'Pending')) return 'Partially Returned';
  if (statuses.length && statuses.every((status) => status === 'Approved')) return 'Returned';
  if (statuses.some((status) => status === 'Approved')) return 'Partially Returned';
  return 'Delivered';
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (result.profile.role !== 'buyer') {
    return NextResponse.json({ error: 'Buyer access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { data: item, error: itemError } = await result.supabase
    .from('order_items')
    .select('id, order_id, orders!inner(buyer_id)')
    .eq('id', body.orderItemId)
    .maybeSingle();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }
  if (!item || item.orders.buyer_id !== result.profile.id) {
    return NextResponse.json({ error: 'Order item not found.' }, { status: 404 });
  }

  const { error } = await result.supabase
    .from('order_items')
    .update({
      return_status: 'Pending',
      return_reason: body.reason,
      return_image: body.image || null,
      return_date: new Date().toISOString(),
    })
    .eq('id', body.orderItemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await result.supabase
    .from('orders')
    .update({
      status: 'Partially Returned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.order_id);

  return NextResponse.json({ success: true });
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
  const status = body.action === 'approve' ? 'Approved' : 'Rejected';
  const { data: item, error: itemError } = await result.supabase
    .from('order_items')
    .update({ return_status: status })
    .eq('id', body.orderItemId)
    .select('id, order_id')
    .single();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  const orderStatus = await computeOrderStatus(result.supabase, item.order_id);
  await result.supabase
    .from('orders')
    .update({
      status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.order_id);

  return NextResponse.json({ success: true, orderStatus });
}
