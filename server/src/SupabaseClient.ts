import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Returns the server-side Supabase client (service role — bypasses RLS).
 * Returns null if SUPABASE_URL / SUPABASE_SERVICE_KEY are not set, which
 * means the server runs in guest-only mode (no rating persistence).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}
