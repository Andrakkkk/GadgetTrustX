import { NextResponse } from 'next/server';
import { getSupabasePassword } from '@/lib/authPassword';
import { createAdminClient } from '@/lib/supabase/admin';

const allowedRoles = new Set(['buyer', 'seller']);

export async function POST(request) {
  const body = await request.json();
  const role = allowedRoles.has(body.role) ? body.role : 'buyer';

  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: getSupabasePassword(body.password),
    email_confirm: true,
    user_metadata: {
      name: body.name,
      role,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
    },
  }, { status: 201 });
}
