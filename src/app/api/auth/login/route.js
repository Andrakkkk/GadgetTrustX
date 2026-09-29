import { NextResponse } from 'next/server';
import { getSupabasePassword } from '@/lib/authPassword';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { getRequestIp, verifyTurnstileToken } from '@/lib/verifyTurnstile';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const expectedRole = typeof body.role === 'string' ? body.role : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    const captchaResult = await verifyTurnstileToken(body.captchaToken, getRequestIp(request));
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error }, { status: 400 });
    }

    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: getSupabasePassword(password),
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'Login gagal.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil akun tidak ditemukan.' }, { status: 404 });
    }

    if (expectedRole && profile.role !== 'admin' && profile.role !== expectedRole) {
      const actualRoleName = profile.role === 'seller' ? 'Penjual' : profile.role === 'buyer' ? 'Pembeli' : profile.role;
      const expectedRoleName = expectedRole === 'seller' ? 'Penjual' : expectedRole === 'buyer' ? 'Pembeli' : expectedRole;

      return NextResponse.json(
        {
          error: `Role tidak sesuai. Akun ini terdaftar sebagai ${actualRoleName}, bukan ${expectedRoleName}.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      session: data.session,
      user: data.user,
      profile,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Login gagal.' }, { status: 500 });
  }
}
