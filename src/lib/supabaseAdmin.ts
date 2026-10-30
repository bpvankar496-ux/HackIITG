/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Server-side Supabase URL. Uses the same VITE_* variable as the browser so there is one setting. */
export function getServerSupabaseUrl(): string {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('VITE_SUPABASE_URL is not set. See .env.example.');
  }
  return url;
}

let adminInstance: SupabaseClient | null = null;

/**
 * Returns a server-only Supabase client with Service Role privileges.
 * WARNING: NEVER IMPORT OR EXECUTE FROM BROWSER-SIDE CODE.
 */
export function getServiceSupabaseClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations.');
  }
  if (!adminInstance) {
    adminInstance = createClient(getServerSupabaseUrl(), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminInstance;
}
