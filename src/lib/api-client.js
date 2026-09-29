'use client';

import { createClient } from '@/lib/supabase/client';

export async function apiFetch(path, options = {}) {
  const supabase = createClient();
  let session = null;

  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      session = data?.session || null;
    } catch {
      session = null;
    }
  }

  const headers = new Headers(options.headers || {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  try {
    return await fetch(path, {
      ...options,
      headers,
    });
  } catch (error) {
    console.warn(`[apiFetch] Network error requesting ${path}:`, error?.message || error);
    return new Response(JSON.stringify({ error: 'Network error or server unreachable' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
