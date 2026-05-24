import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data, error } = await result.supabase
    .from('profiles')
    .update({
      name: body.name,
      phone: body.phone,
      address: body.address,
      bio: body.bio,
      store_name: body.storeName,
      avatar: body.avatar,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.profile.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
