import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const KEY = 'saved_heritage_sites';
export const SAVED_EVENT = 'virasat-saved-changed';

export function readSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function writeSaved(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(new Set(slugs))));
  } catch { /* storage may be blocked */ }
  window.dispatchEvent(new Event(SAVED_EVENT));
}

/** Saves or removes a slug locally, and in Supabase when a user is signed in. Returns the new saved state. */
export async function toggleSaved(slug: string, userId?: string): Promise<boolean> {
  const current = readSaved();
  const nowSaved = !current.includes(slug);
  writeSaved(nowSaved ? [...current, slug] : current.filter(s => s !== slug));

  if (userId && isSupabaseConfigured) {
    try {
      const db = getSupabaseClient();
      if (nowSaved) {
        await db.from('saved_heritage').upsert({ user_id: userId, site_slug: slug }, { onConflict: 'user_id,site_slug' });
      } else {
        await db.from('saved_heritage').delete().eq('user_id', userId).eq('site_slug', slug);
      }
    } catch (err) {
      console.warn('Could not sync saved record:', err);
    }
  }
  return nowSaved;
}

/** On sign-in: merge this browser's saved list with the account's, then upload anything missing. */
export async function syncSavedOnLogin(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const db = getSupabaseClient();
    const { data, error } = await db.from('saved_heritage').select('site_slug').eq('user_id', userId);
    if (error) throw error;
    const remote = (data || []).map(r => r.site_slug as string);
    const local = readSaved();
    const merged = Array.from(new Set([...remote, ...local]));
    const toUpload = merged.filter(s => !remote.includes(s));
    if (toUpload.length) {
      await db.from('saved_heritage').upsert(
        toUpload.map(site_slug => ({ user_id: userId, site_slug })),
        { onConflict: 'user_id,site_slug' }
      );
    }
    writeSaved(merged);
  } catch (err) {
    console.warn('Could not sync saved records:', err);
  }
}
