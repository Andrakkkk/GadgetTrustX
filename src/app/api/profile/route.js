import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const updateFields = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.phone !== undefined) updateFields.phone = body.phone;
  if (body.address !== undefined) updateFields.address = body.address;
  if (body.bio !== undefined) updateFields.bio = body.bio;
  if (body.storeName !== undefined) updateFields.store_name = body.storeName;
  if (body.avatar !== undefined) updateFields.avatar = body.avatar;

  const { data, error } = await result.supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', result.profile.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
