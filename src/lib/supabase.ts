/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client. The one place the client reads its settings.
 * Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).
 */
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let clientInstance: SupabaseClient | null = null;

/** Returns the shared client. Check `isSupabaseConfigured` first; throws when env is missing. */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      // PKCE keeps OAuth (Google) returns out of the URL hash, which this app uses for routing.
      auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce' },
    });
  }
  return clientInstance;
}

/** Bearer header for calls to our own /api routes. Empty when signed out. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
