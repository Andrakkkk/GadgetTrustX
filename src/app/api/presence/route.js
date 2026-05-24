import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/auth';

export async function POST(request) {
  const result = await getRequestUser(request);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const lastSeenAt = new Date().toISOString();
  const { error } = await result.supabase
    .from('profiles')
    .update({ last_seen_at: lastSeenAt, updated_at: lastSeenAt })
    .eq('id', result.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lastSeenAt });
}
