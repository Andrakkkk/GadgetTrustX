import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';
import { mapReviewRow } from '@/lib/supabase/commerce';

const reviewSelect = `
  id,
  device_id,
  buyer_name,
  rating,
  comment,
  image,
  order_id,
  order_item_id,
  created_at,
  devices:device_id (
    id,
    name
  ),
  buyer:buyer_id (
    email,
    name
  ),
  seller:seller_id (
    email
  )
`;

export async function GET(request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  let query = supabase.from('reviews').select(reviewSelect).order('created_at', { ascending: false });

  if (searchParams.get('deviceId')) {
    query = query.eq('device_id', searchParams.get('deviceId'));
  }
  if (searchParams.get('sellerEmail')) {
    const { data: seller } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', searchParams.get('sellerEmail'))
      .maybeSingle();
    query = query.eq('seller_id', seller?.id || '00000000-0000-0000-0000-000000000000');
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data.map(mapReviewRow) });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data: seller } = await result.supabase
    .from('profiles')
    .select('id')
    .eq('email', body.sellerEmail)
    .single();

  const { data, error } = await result.supabase
    .from('reviews')
    .insert({
      device_id: body.deviceId,
      seller_id: seller?.id,
      buyer_id: result.profile.id,
      buyer_name: body.buyerName || result.profile.name,
      rating: body.rating,
      comment: body.comment,
      image: body.image || null,
      order_id: body.orderId || null,
      order_item_id: body.orderItemId || null,
    })
    .select(reviewSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.orderId) {
    const [{ data: orderItems }, { data: reviews }] = await Promise.all([
      result.supabase
        .from('order_items')
        .select('id, return_status')
        .eq('order_id', body.orderId),
      result.supabase
        .from('reviews')
        .select('order_item_id')
        .eq('order_id', body.orderId)
        .not('order_item_id', 'is', null),
    ]);

    const ratedIds = new Set((reviews || []).map((review) => review.order_item_id));
    const allItemsResolved = (orderItems || []).every((item) =>
      ratedIds.has(item.id) || ['Approved', 'Rejected'].includes(item.return_status)
    );

    if (allItemsResolved && orderItems?.length) {
      await result.supabase
        .from('orders')
        .update({
          status: 'Completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.orderId);
    }
  }

  return NextResponse.json({ review: mapReviewRow(data) }, { status: 201 });
}
