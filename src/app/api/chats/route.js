import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';
import { mapChatRow } from '@/lib/supabase/commerce';

const chatSelect = `
  id,
  buyer:buyer_id (
    id,
    email,
    name,
    last_seen_at
  ),
  seller:seller_id (
    id,
    email,
    name,
    store_name,
    last_seen_at
  ),
  chat_messages (
    id,
    body,
    message_type,
    metadata,
    is_read,
    created_at,
    sender:sender_id (
      email
    )
  )
`;

export async function GET(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data, error } = await result.supabase
    .from('chats')
    .select(chatSelect)
    .or(`buyer_id.eq.${result.profile.id},seller_id.eq.${result.profile.id}`)
    .order('created_at', { referencedTable: 'chat_messages', ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chats: data.map(mapChatRow) });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data: otherProfile } = await result.supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('email', body.otherEmail)
    .single();

  if (!otherProfile || otherProfile.id === result.profile.id) {
    return NextResponse.json({ error: 'Invalid chat participant.' }, { status: 400 });
  }

  const buyerId = result.profile.role === 'seller' ? otherProfile.id : result.profile.id;
  const sellerId = result.profile.role === 'seller' ? result.profile.id : otherProfile.id;

  let { data: chat } = await result.supabase
    .from('chats')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (!chat) {
    const created = await result.supabase
      .from('chats')
      .insert({ buyer_id: buyerId, seller_id: sellerId })
      .select('id')
      .single();
    chat = created.data;
  }

  if (body.message) {
    let metadata = body.message.metadata || {};

    if (body.message.type === 'catalog' && result.profile.role === 'seller') {
      const catalog = metadata.catalog || {};
      const offerId = `offer_${crypto.randomUUID()}`;
      const { error: offerError } = await result.supabase.from('devices').insert({
        id: offerId,
        seller_id: result.profile.id,
        name: catalog.deviceName,
        brand: catalog.brand || 'Other',
        category: catalog.category || 'Custom Offer',
        price: Number(catalog.price || 0),
        stock: 1,
        condition: catalog.condition || 'Good',
        ram: catalog.ram || '',
        storage: catalog.storage || '',
        chipset: catalog.chipset || 'Custom Offer',
        description: catalog.description || '',
        image: catalog.image || null,
        verified_by_trustx: false,
        is_trade_in: false,
        is_custom_offer: true,
        offer_buyer_id: buyerId,
      });

      if (offerError) {
        return NextResponse.json({ error: offerError.message }, { status: 500 });
      }

      metadata = {
        ...metadata,
        catalog: {
          ...catalog,
          id: offerId,
          sellerEmail: result.profile.email,
        },
      };
    }

    await result.supabase.from('chat_messages').insert({
      chat_id: chat.id,
      sender_id: result.profile.id,
      body: body.message.text,
      message_type: body.message.type || 'text',
      metadata,
    });
  }

  const { data, error } = await result.supabase
    .from('chats')
    .select(chatSelect)
    .eq('id', chat.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chat: mapChatRow(data) }, { status: 201 });
}
