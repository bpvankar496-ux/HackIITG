import { useMemo } from 'react';
import { SEED_HERITAGE_SITES, HeritageSiteItem } from '../../data/seedHeritageSites';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const siteImage = (s: HeritageSiteItem): string | undefined => s.heritage_media?.[0]?.url;

export function useSites() {
  return useMemo(() => SEED_HERITAGE_SITES.filter(s => s.status !== 'rejected'), []);
}
