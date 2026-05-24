import { NextResponse } from 'next/server';
import { getSupabasePassword } from '@/lib/authPassword';
import { getRequestUser } from '@/lib/supabase/auth';

function mapUser(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    isVerified: profile.is_verified,
    badges: profile.badges || [],
  };
}

async function requireAdmin(request) {
  const result = await getRequestUser(request);
  if (result.error) return result;
  if (result.profile.role !== 'admin') return { error: 'Admin access required.', status: 403 };
  return result;
}

export async function GET(request) {
  const result = await requireAdmin(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data, error } = await result.supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data.map(mapUser) });
}

export async function POST(request) {
  const result = await requireAdmin(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { data, error } = await result.supabase.auth.admin.createUser({
    email: body.email,
    password: getSupabasePassword(body.password),
    email_confirm: true,
    user_metadata: {
      name: body.name,
      role: body.role,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await result.supabase
    .from('profiles')
    .update({
      name: body.name,
      role: body.role,
      is_verified: body.isVerified ?? true,
      badges: body.badges || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.user.id)
    .select('*')
    .single();

  return NextResponse.json({ user: mapUser(profile) }, { status: 201 });
}

export async function PATCH(request) {
  const result = await requireAdmin(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  if (body.password) {
    const { error: passwordError } = await result.supabase.auth.admin.updateUserById(body.id, {
      password: getSupabasePassword(body.password),
    });
    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 500 });
    }
  }

  const { data, error } = await result.supabase
    .from('profiles')
    .update({
      name: body.name,
      role: body.role,
      is_verified: body.isVerified,
      badges: body.badges || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: mapUser(data) });
}

export async function DELETE(request) {
  const result = await requireAdmin(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const { error } = await result.supabase.auth.admin.deleteUser(body.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
