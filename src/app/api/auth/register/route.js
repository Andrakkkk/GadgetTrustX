import { NextResponse } from 'next/server';
import { getSupabasePassword } from '@/lib/authPassword';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { getRequestIp, verifyTurnstileToken } from '@/lib/verifyTurnstile';

const allowedRoles = new Set(['buyer', 'seller']);

export async function POST(request) {
  try {
    const body = await request.json();
    const role = allowedRoles.has(body.role) ? body.role : 'buyer';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    const captchaResult = await verifyTurnstileToken(body.captchaToken, getRequestIp(request));
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ini sudah terdaftar. Silakan masuk atau gunakan fitur lupa password.' },
        { status: 409 }
      );
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: getSupabasePassword(password),
      options: {
        emailRedirectTo: `${origin}/login?verified=true`,
        data: {
          name,
          role,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message || 'Gagal mendaftarkan akun.' }, { status: 400 });
    }

    const hasNewIdentity = !Array.isArray(data.user?.identities) || data.user.identities.length > 0;
    if (data.user?.id && hasNewIdentity) {
      const { error: profileError } = await admin.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        role,
        is_verified: false,
      });

      if (profileError) {
        console.warn('Profile upsert warning:', profileError.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        requireVerification: true,
        message: `Akun berhasil dibuat. Supabase sudah mengirim email verifikasi ke ${email}; buka link tersebut sebelum masuk.`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Gagal mendaftarkan akun.' }, { status: 500 });
  }
}
