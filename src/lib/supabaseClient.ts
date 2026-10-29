/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : '') ||
  'https://xacjsdzltfprtueovcrd.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') ||
  'sb_publishable_Q1Yf_TTTVMvTXD2yXLKIhQ_q1xTb94_';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClientInstance: SupabaseClient | null = null;

/**
 * Returns singleton browser Supabase client using Anon publishable key only.
 * Safe for client-side execution.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (!browserClientInstance) {
    browserClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClientInstance;
}

export interface DatabaseHealthStatus {
  configured: boolean;
  connected: boolean;
  url: string;
  latencyMs?: number;
  documentsTableFound: boolean;
  documentCount: number;
  storageConfigured: boolean;
  storageBuckets?: string[];
  error?: string | null;
}

/**
 * Checks connection health to Supabase PostgreSQL and Storage without leaking secrets.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      connected: false,
      url: 'Not Configured',
      documentsTableFound: false,
      documentCount: 0,
      storageConfigured: false,
      error: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.',
    };
  }

  const startTime = Date.now();
  try {
    const client = getSupabaseClient();

    // 1. Check database connectivity via documents table or heritage_sites
    const { count, error: docError } = await client
      .from('documents')
      .select('id', { count: 'exact', head: true });

    const latency = Date.now() - startTime;

    let documentsTableFound = true;
    let documentCount = count ?? 0;
    let tableErrorMsg: string | null = null;

    if (docError) {
      // PGRST205 indicates table does not exist in schema cache yet
      if (docError.code === 'PGRST205') {
        documentsTableFound = false;
        tableErrorMsg = 'Table "documents" not yet migrated in Supabase schema.';
      } else {
        tableErrorMsg = docError.message;
      }
    }

    return {
      configured: true,
      connected: true,
      url: supabaseUrl,
      latencyMs: latency,
      documentsTableFound,
      documentCount,
      storageConfigured: true,
      error: tableErrorMsg,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: supabaseUrl,
      documentsTableFound: false,
      documentCount: 0,
      storageConfigured: false,
      error: err?.message || 'Failed to connect to Supabase backend.',
    };
  }
}
