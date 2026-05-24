import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';

export async function POST(request, { params }) {
  const { id } = await params;
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data: chat } = await result.supabase
    .from('chats')
    .select('id')
    .eq('id', id)
    .or(`buyer_id.eq.${result.profile.id},seller_id.eq.${result.profile.id}`)
    .single();

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found.' }, { status: 404 });
  }

  if (
    body.type === 'nego_accepted' &&
    result.profile.role === 'seller' &&
    body.metadata?.originalCatalog?.id &&
    body.metadata?.finalPrice
  ) {
    await result.supabase
      .from('devices')
      .update({ price: Number(body.metadata.finalPrice), updated_at: new Date().toISOString() })
      .eq('id', body.metadata.originalCatalog.id)
      .eq('seller_id', result.profile.id)
      .eq('is_custom_offer', true);
  }

  const { error } = await result.supabase.from('chat_messages').insert({
    chat_id: chat.id,
    sender_id: result.profile.id,
    body: body.text,
    message_type: body.type || 'text',
    metadata: body.metadata || {},
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data: chat } = await result.supabase
    .from('chats')
    .select('id')
    .eq('id', id)
    .or(`buyer_id.eq.${result.profile.id},seller_id.eq.${result.profile.id}`)
    .single();

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found.' }, { status: 404 });
  }

  const { error } = await result.supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('chat_id', chat.id)
    .neq('sender_id', result.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
