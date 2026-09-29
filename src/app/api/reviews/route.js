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
  seller_response,
  seller_response_date,
  seller_response_image,
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

  // GUARD: Prevent duplicate reviews for same order_item_id
  if (body.orderItemId) {
    const { data: existingReview } = await result.supabase
      .from('reviews')
      .select('id')
      .eq('buyer_id', result.profile.id)
      .eq('order_item_id', body.orderItemId)
      .maybeSingle();
    if (existingReview) {
      return NextResponse.json({ error: 'Anda sudah memberikan ulasan untuk produk ini.' }, { status: 409 });
    }
  }

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

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  if (!body.reviewId || (!body.sellerResponse && !body.sellerResponseImage)) {
    return NextResponse.json({ error: 'Review ID and sellerResponse are required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existingReview, error: fetchErr } = await admin
    .from('reviews')
    .select('id, seller_id, device_id')
    .eq('id', body.reviewId)
    .single();

  if (fetchErr || !existingReview) {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  }

  // Obtain actual seller_id from review row or fallback to target device's seller_id
  let actualSellerId = existingReview.seller_id;
  if (!actualSellerId && existingReview.device_id) {
    const { data: targetDevice } = await admin
      .from('devices')
      .select('seller_id')
      .eq('id', existingReview.device_id)
      .single();
    if (targetDevice) actualSellerId = targetDevice.seller_id;
  }

  if (result.profile.role !== 'admin' && (!actualSellerId || actualSellerId !== result.profile.id)) {
    return NextResponse.json({ error: 'Forbidden: Hanya penjual pemilik produk ini yang dapat membalas ulasan.' }, { status: 403 });
  }

  const updateFields = {
    seller_response: body.sellerResponse || '',
    seller_response_date: new Date().toISOString(),
  };
  if (body.sellerResponseImage) {
    updateFields.seller_response_image = body.sellerResponseImage;
  }

  let { data, error } = await admin
    .from('reviews')
    .update(updateFields)
    .eq('id', body.reviewId)
    .select(reviewSelect)
    .single();

  if (error) {
    // Fallback if seller_response_image column isn't created yet in DB
    const { data: existing, error: getErr } = await admin
      .from('reviews')
      .select('comment')
      .eq('id', body.reviewId)
      .single();

    if (!getErr && existing) {
      const baseComment = (existing.comment || '').split(/\[Respon Penjual\]:/)[0].trim();
      const updatedComment = `${baseComment}\n\n[Respon Penjual]: ${body.sellerResponse || ''}`;

      const { data: fallbackData } = await admin
        .from('reviews')
        .update({ comment: updatedComment })
        .eq('id', body.reviewId)
        .select(reviewSelect)
        .single();

      if (fallbackData) {
        return NextResponse.json({ review: mapReviewRow(fallbackData) });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: mapReviewRow(data) });
}
