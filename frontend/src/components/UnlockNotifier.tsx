'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getOwnedItems, OwnedItem } from '../lib/api';
import RewardPopup from './RewardPopup';

const SEEN_KEY = 'nexus-seen-unlocks';

function readSeen(): Set<number> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set<number>(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function typeLabel(item: OwnedItem) {
  if (item.cosmeticType === 'theme') return 'New skin';
  if (item.cosmeticType === 'avatar') return 'New emblem';
  if (item.cosmeticType === 'callingCard') return 'New calling card';
  return 'New reward';
}

// Announces newly earned prizes. Never equips anything: the user applies it from Profile.
export default function UnlockNotifier() {
  const pathname = usePathname();
  const [queue, setQueue] = useState<OwnedItem[]>([]);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const owned = await getOwnedItems();
      const seen = readSeen();
      const ids = owned.map(o => o.itemId);
      if (seen) {
        const fresh = owned.filter(o => o.isPrize && !seen.has(o.itemId));
        if (fresh.length) setQueue(q => [...q, ...fresh.filter(f => !q.some(x => x.itemId === f.itemId))]);
      }
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      /* logged out or offline */
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => { check(); }, [pathname, check]);

  const current = queue[0];
  return (
    <RewardPopup
      open={!!current}
      onClose={() => setQueue(q => q.slice(1))}
      eyebrow={current ? `${typeLabel(current)} unlocked` : undefined}
      title={current?.name ?? ''}
      description="Added to your collection. Equip it anytime from your Profile."
      icon="✨"
      closeBtnLabel="Nice!"
    />
  );
}
