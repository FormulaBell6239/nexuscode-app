'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Games.module.css';
import PageShell from '@/components/PageShell';
import { getProfile, getOwnedItems, api } from '@/lib/api';

const GENRES = [
  {
    id: 'quiz',
    label: 'Quiz',
    icon: '◈',
    games: [
      { icon: '🧠', title: 'Code Quiz',        desc: 'Test your programming knowledge with timed Q&A rounds',       href: '/games/code-quiz',           difficulty: 'Easy' },
      { icon: '⚗️', title: 'Syntax Showdown',  desc: 'Spot the syntax error before time runs out',                  href: '#',                          difficulty: 'Medium', locked: true, creditsRequired: 50,  gameSlug: 'syntax-showdown'  },
      { icon: '📐', title: 'CS Theory',         desc: 'Answer questions on algorithms, data structures & more',      href: '#',                          difficulty: 'Hard',   locked: true, creditsRequired: 150, gameSlug: 'cs-theory'        },
    ],
  },
  {
    id: 'debug',
    label: 'Debug',
    icon: '◎',
    games: [
      { icon: '🐞', title: 'Debugging Challenge', desc: 'Find and fix bugs hidden in real code snippets',            href: '/games/debugging-challenge', difficulty: 'Medium' },
      { icon: '🔍', title: 'Error Hunt',           desc: 'Track down runtime errors across multiple files',          href: '#',                          difficulty: 'Hard',   locked: true, creditsRequired: 100, gameSlug: 'error-hunt'       },
      { icon: '📡', title: 'Stack Trace',           desc: 'Decode error stack traces and pinpoint where your app broke', href: '#',                       difficulty: 'Medium', locked: true, creditsRequired: 75,  gameSlug: 'stack-trace'      },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    icon: '⟁',
    games: [
      { icon: '⚡', title: 'Speed Coding', desc: 'Solve problems against the clock',                                 href: '/games/speed-coding',        difficulty: 'Hard'  },
      { icon: '🏎', title: 'Type Race',    desc: 'Race others by typing code as fast as you can',                    href: '#',                          difficulty: 'Easy',   locked: true, creditsRequired: 50,  gameSlug: 'type-race'        },
      { icon: '🔥', title: 'Chain Blitz',  desc: '5 rapid-fire problems back to back — each harder than the last',  href: '#',                          difficulty: 'Hard',   locked: true, creditsRequired: 125, gameSlug: 'chain-blitz'      },
    ],
  },
  {
    id: 'logic',
    label: 'Logic',
    icon: '⌘',
    games: [
      { icon: '🔗', title: 'Logic Puzzles',    desc: 'Strengthen problem-solving skills with brain teasers',         href: '/games/logic-puzzles',       difficulty: 'Medium' },
      { icon: '♟',  title: 'Algorithm Arena',  desc: 'Implement classic algorithms step by step',                   href: '#',                          difficulty: 'Hard',   locked: true, creditsRequired: 200, gameSlug: 'algorithm-arena'  },
      { icon: '🕸️', title: 'Graph Navigator',  desc: 'Trace BFS and DFS paths across interactive node graphs',     href: '#',                          difficulty: 'Hard',   locked: true, creditsRequired: 175, gameSlug: 'graph-navigator'  },
    ],
  },
  {
    id: 'build',
    label: 'Build',
    icon: '▣',
    games: [
      { icon: '🎨', title: 'CSS Battle',   desc: 'Match a target design pixel-perfectly using only CSS',             href: '#',                          difficulty: 'Easy',   locked: true, creditsRequired: 50,  gameSlug: 'css-battle'       },
      { icon: '🌐', title: 'HTML Blitz',   desc: 'Recreate page layouts from screenshots',                           href: '#',                          difficulty: 'Easy',   locked: true, creditsRequired: 75,  gameSlug: 'html-blitz'       },
      { icon: '🏗',  title: 'Mini Builder', desc: 'Build small UI components from guided specs',                     href: '#',                          difficulty: 'Medium', locked: true, creditsRequired: 125, gameSlug: 'mini-builder'     },
    ],
  },
  {
    id: 'multi',
    label: 'Multiplayer',
    icon: '↗',
    games: [
      { icon: '⚔️', title: 'Code Duel',  desc: 'Go head-to-head with another coder in real time',                   href: '#',                          difficulty: 'Medium', locked: true, creditsRequired: 200, gameSlug: 'code-duel'        },
      { icon: '🤝', title: 'Pair Mode',   desc: 'Collaborate on a challenge with a partner',                         href: '#',                          difficulty: 'Easy',   locked: true, creditsRequired: 150, gameSlug: 'pair-mode'        },
      { icon: '🏆', title: 'Tournament',  desc: 'Bracket-style competition across 8 players',                        href: '#',                          difficulty: 'Hard',   locked: true, creditsRequired: 300, gameSlug: 'tournament'       },
    ],
  },
];

interface CatalogItem { id: number; gameSlug: string | null; creditCost: number; }

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

export default function Games() {
  const [activeGenre, setActiveGenre] = useState('quiz');
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [ownedSlugs, setOwnedSlugs] = useState<Set<string>>(new Set());
  const [catalogMap, setCatalogMap] = useState<Map<string, number>>(new Map()); // slug → store item id
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const genre = GENRES.find(g => g.id === activeGenre)!;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    getProfile()
      .then(p => setUserCredits(p.credits))
      .catch(() => setUserCredits(0));

    Promise.all([
      api.get<{ credits: number; items: CatalogItem[] }>('/api/store'),
      token ? getOwnedItems() : Promise.resolve([]),
    ]).then(([cat, owned]) => {
      const map = new Map<string, number>();
      cat.items.forEach(i => { if (i.gameSlug) map.set(i.gameSlug, i.id); });
      setCatalogMap(map);
      const slugs = new Set(owned.flatMap(o => o.gameSlug ? [o.gameSlug] : []));
      setOwnedSlugs(slugs);
    }).catch(() => {});
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUnlock(gameSlug: string, creditsRequired: number) {
    const itemId = catalogMap.get(gameSlug);
    if (!itemId) { showToast('Item not found in store', false); return; }
    if ((userCredits ?? 0) < creditsRequired) return;
    setUnlocking(gameSlug);
    try {
      const res = await api.post<{ success: boolean; credits: number }>(`/api/store/buy/${itemId}`);
      setUserCredits(res.credits);
      setOwnedSlugs(prev => new Set([...prev, gameSlug]));
      showToast('🎮 Game unlocked!', true);
    } catch (e: any) {
      showToast(e?.message ?? 'Purchase failed', false);
    } finally {
      setUnlocking(null);
    }
  }

  return (
    <main className={styles.main}>
      <PageShell />

      {toast && (
        <div className={`${styles.toast} ${toast.ok ? '' : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.badge}>Games &amp; Challenges</div>
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>Play. Learn. Level Up.</span>
        </h1>
        <p className={styles.subtitle}>
          Choose a genre and jump into a challenge. Earn points, climb the leaderboard, and unlock
          new games as you progress.
        </p>
        <div className={styles.creditsBanner}>
          <span className={styles.creditsIcon}>⬡</span>
          <span className={styles.creditsAmount}>
            {userCredits === null ? '—' : userCredits}
          </span>
          <span className={styles.creditsLabel}>Credits</span>
          <span className={styles.creditsHint}>Earn more by completing lessons &amp; assignments</span>
        </div>
      </header>

      <section className={styles.arcadeSection}>
        <div className={styles.tabRow}>
          {GENRES.map(g => (
            <button
              key={g.id}
              className={`${styles.tab} ${activeGenre === g.id ? styles.tabActive : ''}`}
              onClick={() => setActiveGenre(g.id)}
            >
              <span className={styles.tabIcon}>{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>

        <div className={styles.gameGrid}>
          {genre.games.map((game, i) => {
            const g = game as any;
            const isOwned = g.gameSlug ? ownedSlugs.has(g.gameSlug) : false;
            const effectiveLocked = g.locked && !isOwned;
            const credits = userCredits ?? 0;
            const canAfford = credits >= (g.creditsRequired ?? 0);
            const almostThere = !canAfford && credits >= (g.creditsRequired ?? 0) - 15;
            const isUnlocking = unlocking === g.gameSlug;

            return (
              <div key={i} className={`${styles.gameCard} ${effectiveLocked ? styles.gameCardLocked : ''}`}>
                <div className={styles.gameCardContent}>
                  <span className={styles.gameIcon}>{game.icon}</span>
                  <span className={styles.diffBadge} style={{ color: DIFFICULTY_COLORS[game.difficulty] }}>
                    {game.difficulty}
                  </span>
                  <h3 className={styles.gameTitle}>{game.title}</h3>
                  <p className={styles.gameDesc}>{game.desc}</p>
                  {!effectiveLocked && (
                    <Link href={isOwned ? `/games/${g.gameSlug}` : game.href}>
                      <button className={styles.playButton}>Play →</button>
                    </Link>
                  )}
                </div>
                {effectiveLocked && (
                  <div className={styles.lockOverlay}>
                    {canAfford ? (
                      <button
                        className={styles.unlockBtn}
                        onClick={() => handleUnlock(g.gameSlug, g.creditsRequired)}
                        disabled={isUnlocking}
                      >
                        {isUnlocking ? '...' : (
                          <><span>⬡ {g.creditsRequired}</span><span className={styles.unlockArrow}>Unlock →</span></>
                        )}
                      </button>
                    ) : (
                      <>
                        <span className={styles.lockIcon}>🔒</span>
                        <span className={`${styles.lockCredits} ${almostThere ? styles.lockCreditsClose : ''}`}>
                          {almostThere
                            ? `${g.creditsRequired - credits} more to unlock`
                            : `${g.creditsRequired} Credits to Unlock`}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}