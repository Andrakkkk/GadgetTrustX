'use client';

import { createBrowserClient } from '@supabase/ssr';

let browserClient = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      url,
      publishableKey
    );
  }

  return browserClient;
}
