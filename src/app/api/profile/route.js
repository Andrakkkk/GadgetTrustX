import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';
import { validatePhone, validateName, sanitizeText } from '@/utils/validation';

export async function PATCH(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await request.json();
  const updateFields = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) {
    const nameVal = validateName(body.name);
    if (!nameVal.isValid) {
      return NextResponse.json({ error: nameVal.error }, { status: 400 });
    }
    updateFields.name = nameVal.sanitized;
  }

  if (body.phone !== undefined) {
    // Nomor telepon wajib angka, panjang 10-15 digit jika diisi
    const phoneVal = validatePhone(body.phone, { required: false });
    if (!phoneVal.isValid) {
      return NextResponse.json({ error: phoneVal.error }, { status: 400 });
    }
    updateFields.phone = phoneVal.sanitized;
  }

  if (body.address !== undefined) {
    updateFields.address = sanitizeText(body.address, 300);
  }

  if (body.bio !== undefined) {
    updateFields.bio = sanitizeText(body.bio, 500);
  }

  if (body.storeName !== undefined) {
    updateFields.store_name = sanitizeText(body.storeName, 50);
  }

  if (body.avatar !== undefined) {
    updateFields.avatar = body.avatar;
  }

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
