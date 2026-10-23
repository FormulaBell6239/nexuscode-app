'use client';
import { useEffect, useState } from 'react';
import GameIcon, { slugifyGame } from "@/components/GameIcon";
import StatIcon from "@/components/StatIcon";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getOwnedItems } from '@/lib/api';
import styles from './GameLocked.module.css';

interface CatalogItem {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  creditCost: number;
  gameSlug: string | null;
  owned: boolean;
}

type State = 'loading' | 'not-found' | 'locked-authed' | 'locked-guest' | 'owned';

export default function LockedGamePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [state, setState] = useState<State>('loading');
  const [item, setItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    async function load() {
      try {
        // Always fetch catalog (public endpoint returns owned: false for guests)
        const catalog = await api.get<{ credits: number; items: CatalogItem[] }>('/api/store');
        const match = catalog.items.find(i => i.gameSlug === slug);

        if (!match) {
          setState('not-found');
          return;
        }

        setItem(match);

        if (match.owned) {
          setState('owned');
          return;
        }

        // Check if owned via /owned endpoint
        if (token) {
          try {
            const owned = await getOwnedItems();
            const isOwned = owned.some(o => o.gameSlug === slug);
            setState(isOwned ? 'owned' : 'locked-authed');
          } catch {
            setState('locked-authed');
          }
        } else {
          setState('locked-guest');
        }
      } catch {
        setState('not-found');
      }
    }

    load();
  }, [slug]);

  if (state === 'loading') {
    return (
      <main className={styles.main}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.dotGrid} />
        <div className={`${styles.card}`}>
          <p style={{ color: '#475569', fontSize: '0.9rem' }}>Loading…</p>
        </div>
      </main>
    );
  }

  if (state === 'not-found') {
    return (
      <main className={styles.main}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.dotGrid} />
        <div className={`${styles.card} ${styles.notFoundCard}`}>
          <div className={styles.lockRing}>404</div>
          <h1 className={styles.title}>Game Not Found</h1>
          <p className={styles.desc}>
            This game doesn&apos;t exist in our library yet. Check out the store for available titles.
          </p>
          <div className={styles.actions}>
            <Link href="/store" className={styles.btnPrimary}>Browse Store</Link>
            <Link href="/games" className={styles.btnGhost}>All Games</Link>
          </div>
        </div>
      </main>
    );
  }

  if (state === 'owned') {
    return (
      <main className={styles.main}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.dotGrid} />
        <div className={`${styles.card} ${styles.comingSoonCard}`}>
          <div className={styles.comingSoonRing}><GameIcon slug={slug} fallback={item?.icon ?? '🎮'} size={34} /></div>
          <span className={styles.comingSoonBadge}>Coming Soon</span>
          <h1 className={styles.title}>{item?.name ?? 'This Game'}</h1>
          <p className={styles.desc}>
            🚧 This game is in development. You&apos;ve unlocked access — it will appear here as soon as it launches.
          </p>
          <div className={styles.actions}>
            <Link href="/games" className={styles.btnGhost}>← Back to Games</Link>
          </div>
        </div>
      </main>
    );
  }

  // locked-authed or locked-guest
  const isGuest = state === 'locked-guest';
  return (
    <main className={styles.main}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.dotGrid} />
      <div className={styles.card}>
        <div className={styles.lockRing}><StatIcon name="lock" size={28} /></div>
        <span className={styles.gameIcon}><GameIcon slug={slug} fallback={item?.icon ?? '🎮'} size={30} /></span>
        <span className={styles.badge}>Locked Game</span>
        <h1 className={styles.title}>{item?.name ?? slug}</h1>
        <p className={styles.desc}>{item?.description ?? 'Unlock this game to start playing.'}</p>

        <div className={styles.costRow}>
          <span className={styles.costLabel}>Unlock for</span>
          <span className={styles.costPill}>
            <span>⬡</span>
            <span>{item?.creditCost ?? '—'}</span>
            <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.75rem' }}>credits</span>
          </span>
        </div>

        <div className={styles.actions}>
          {isGuest ? (
            <>
              <Link href="/auth/signin" className={styles.btnPrimary}>Sign In to Unlock</Link>
              <Link href="/store" className={styles.btnGhost}><StatIcon name="lock" size={13} /> View in Store</Link>
            </>
          ) : (
            <>
              <Link href="/store" className={styles.btnPrimary}><StatIcon name="lock" size={13} /> Unlock in Store →</Link>
              <Link href="/achievements" className={styles.btnGhost}>Earn free via challenges →</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
