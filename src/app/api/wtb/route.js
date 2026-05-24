import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';
import { buildDescriptionPayload, mapWtbRow } from '@/lib/supabase/commerce';

const wtbSelect = `
  id,
  title,
  description,
  budget,
  created_at,
  profiles:buyer_id (
    email,
    name
  )
`;

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('wtb_listings')
    .select(wtbSelect)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listings: data.map(mapWtbRow) });
}

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data, error } = await result.supabase
    .from('wtb_listings')
    .insert({
      buyer_id: result.profile.id,
      title: body.device,
      budget: Number(body.budget),
      description: buildDescriptionPayload(body),
    })
    .select(wtbSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: mapWtbRow(data) }, { status: 201 });
}

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data, error } = await result.supabase
    .from('wtb_listings')
    .update({
      title: body.device,
      budget: Number(body.budget),
      description: buildDescriptionPayload(body),
    })
    .eq('id', body.id)
    .eq('buyer_id', result.profile.id)
    .select(wtbSelect)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: mapWtbRow(data) });
}

export async function DELETE(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { error } = await result.supabase
    .from('wtb_listings')
    .delete()
    .eq('id', body.id)
    .eq('buyer_id', result.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
