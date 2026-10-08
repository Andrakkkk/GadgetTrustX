import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/auth';
import { buildDescriptionPayload, mapWtbRow } from '@/lib/supabase/commerce';
import { validateWtbInput } from '@/utils/validation';

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
  const validation = validateWtbInput({
    device: body.device || body.title,
    budget: body.budget,
    condition: body.condition,
    notes: body.notes,
  });

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { device, budget, condition, notes } = validation.sanitized;
  const payloadWithSanitized = { ...body, device, budget, condition, notes };

  const { data, error } = await result.supabase
    .from('wtb_listings')
    .insert({
      buyer_id: result.profile.id,
      title: device,
      budget: budget,
      description: buildDescriptionPayload(payloadWithSanitized),
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
  const validation = validateWtbInput({
    device: body.device || body.title,
    budget: body.budget,
    condition: body.condition,
    notes: body.notes,
  });

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { device, budget, condition, notes } = validation.sanitized;
  const payloadWithSanitized = { ...body, device, budget, condition, notes };

  const { data, error } = await result.supabase
    .from('wtb_listings')
    .update({
      title: device,
      budget: budget,
      description: buildDescriptionPayload(payloadWithSanitized),
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
