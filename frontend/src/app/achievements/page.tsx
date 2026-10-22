"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Achievements.module.css';
import PageShell from '@/components/PageShell';
import { api, getProfile, getOwnedItems } from '@/lib/api';
import { EMBLEMS, EMBLEM_CATEGORIES } from '@/lib/emblems';

interface AchievementEntry {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: string;
  requiredCount: number;
  creditReward: number;
  emblemId?: string | null;
  progress: number;
  earned: boolean;
  earnedAt: string | null;
}

// ── Tier system ─────────────────────────────────────────────────────────────
type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

function getTier(creditReward: number): Tier {
  if (creditReward <= 15) return 'bronze';
  if (creditReward <= 35) return 'silver';
  if (creditReward <= 75) return 'gold';
  return 'platinum';
}

const TIER_LABELS: Record<Tier, string> = {
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
};

// ── Achievement categories ───────────────────────────────────────────────────
const GROUPS: { label: string; icon: string; types: string[] }[] = [
  { label: 'Level & XP',   icon: 'level', types: ['level', 'xp_earned'] },
  { label: 'Lessons',      icon: 'lessons', types: ['lessons_completed', 'first_try_lessons'] },
  { label: 'Streaks',      icon: 'streak', types: ['streak'] },
  { label: 'Games',        icon: 'games', types: ['game_rounds_played'] },
  { label: 'Challenges',   icon: 'challenges', types: ['speed_rounds_won', 'debug_challenges_fixed', 'logic_puzzles_solved'] },
  { label: 'Leaderboard',  icon: 'leaderboard', types: ['leaderboard_top10'] },
];

const gp = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const GROUP_ICONS: Record<string, React.ReactElement> = {
  level: <svg {...gp}><path d="M12 20V5" /><path d="M6 11l6-6 6 6" /><path d="M7 20h10" /></svg>,
  lessons: <svg {...gp}><path d="M4 5.5A1.5 1.5 0 015.5 4H19v14H5.5A1.5 1.5 0 004 19.5z" /><path d="M4 19.5A1.5 1.5 0 005.5 21H19v-3" /><path d="M9 9h6" /></svg>,
  streak: <svg {...gp}><path d="M13 3L5 13h6l-1 8 8-10h-6z" /></svg>,
  games: <svg {...gp}><rect x="3" y="8" width="18" height="10" rx="4" /><path d="M8 11v4M6 13h4" /><circle cx="15.5" cy="12" r="0.9" fill="currentColor" /><circle cx="18" cy="14.5" r="0.9" fill="currentColor" /></svg>,
  challenges: <svg {...gp}><path d="M7 4h10v5a5 5 0 01-10 0z" /><path d="M7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3" /><path d="M12 14v4M8.5 20h7" /></svg>,
  leaderboard: <svg {...gp}><path d="M4 20V12h4v8M10 20V5h4v15M16 20v-6h4v6" /></svg>,
  emblems: <svg {...gp}><path d="M12 2.8l7.5 4.3v9.8L12 21.2l-7.5-4.3V7.1z" /><path d="M12 7.5l3.6 2.1v4.3L12 16l-3.6-2.1V9.6z" fill="currentColor" fillOpacity="0.35" /></svg>,
  other: <svg {...gp}><path d="M12 3l8 9-8 9-8-9z" /></svg>,
};
const TYPE_ICON: Record<string, string> = {
  level: 'level', xp_earned: 'level', lessons_completed: 'lessons', first_try_lessons: 'lessons', streak: 'streak',
  game_rounds_played: 'games', speed_rounds_won: 'challenges', debug_challenges_fixed: 'challenges',
  logic_puzzles_solved: 'challenges', leaderboard_top10: 'leaderboard',
};

// ── Achievement card — horizontal row layout ────────────────────────────────
function AchCard({ ach }: { ach: AchievementEntry }) {
  const tier = getTier(ach.creditReward);
  const pct = ach.requiredCount > 0
    ? Math.min(Math.round((ach.progress / ach.requiredCount) * 100), 100)
    : (ach.earned ? 100 : 0);

  const col = ach.earned ? '#22d3ee' : '#64748b';
  const em = ach.emblemId ? EMBLEMS[ach.emblemId] : null;

  return (
    <div
      className={`${styles.emblemTile} ${ach.earned ? '' : styles.emblemTileLocked}`}
      style={{ ['--ec' as string]: col }}
    >
      {ach.creditReward > 0 && <span className={styles.emblemRarityTag}>⬡ {ach.creditReward}</span>}
      <div className={styles.emblemStage}>
        <div className={styles.emblemMedal} style={{ background: 'linear-gradient(145deg,#141a2a,#070a12)', borderColor: col, filter: ach.earned ? 'none' : 'grayscale(0.8)' }}>
          <span style={{ display: 'inline-flex', transform: 'scale(2.1)' }}>{GROUP_ICONS[TYPE_ICON[ach.type] ?? 'other']}</span>
        </div>
        {!ach.earned && <span className={styles.emblemLock}>🔒</span>}
      </div>
      <div className={styles.emblemTileName}>{ach.name}</div>
      <div className={styles.emblemReq}>{ach.description}</div>
      {!ach.earned && ach.requiredCount > 1 && (
        <div className={styles.msProgress}>
          <div className={styles.msTrack}><div className={styles.msFill} style={{ width: `${pct}%` }} /></div>
          <span>{Math.min(ach.progress, ach.requiredCount)}/{ach.requiredCount}</span>
        </div>
      )}
      <div className={styles.emblemAlt}>
        {ach.earned
          ? `✓ Completed${ach.earnedAt ? ' · ' + new Date(ach.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}`
          : 'In progress'}
        {em && <div style={{ marginTop: 4, color: ach.earned ? '#6ee7b7' : '#a5b4fc' }}>{ach.earned ? '✓' : '🔒'} Emblem: {em.mark} {em.name}</div>}
      </div>
    </div>
  );
}

// ── Themes (interface skins) ────────────────────────────────────────────────
const THEMES: { slug: string; name: string; icon: string; bg: string; accent: string; accent2: string; free?: boolean; how: string; cost?: number }[] = [
  { slug: 'solar-light',  name: 'Solar Light',  icon: '◐',  bg: '#091628', accent: '#60a5fa', accent2: '#a78bfa', free: true, how: 'Included for everyone' },
  { slug: 'minimal-dark', name: 'Midnight',     icon: '🌑', bg: '#0a0a0a', accent: '#94a3b8', accent2: '#e2e8f0', how: 'Buy in the Store', cost: 60 },
  { slug: 'cyber-neon',   name: 'Cyber Neon',   icon: '🔮', bg: '#000a08', accent: '#10b981', accent2: '#00ff88', how: 'Buy in the Store', cost: 80 },
  { slug: 'matrix-green', name: 'Matrix',       icon: '⌨️', bg: '#000500', accent: '#22c55e', accent2: '#4ade80', how: 'Complete a mid-reward milestone (16–50 ⬡), or buy in the Store', cost: 80 },
  { slug: 'ember',        name: 'Ember',        icon: '🔥', bg: '#0d0705', accent: '#ea580c', accent2: '#fbbf24', how: 'Complete a starter milestone (up to 15 ⬡)' },
  { slug: 'solar',        name: 'Solara',       icon: '☀️', bg: '#0d0a03', accent: '#f59e0b', accent2: '#fde68a', how: 'Complete a high-reward milestone (51+ ⬡)' },
];

// ── Toggle icons (custom SVG, inherit text color) ───────────────────────────
const svgProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const TAB_ICONS: Record<string, React.ReactElement> = {
  achievements: (
    <svg {...svgProps}><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" /><circle cx="12" cy="11.5" r="1.4" fill="currentColor" stroke="none" /></svg>
  ),
  emblems: (
    <svg {...svgProps}><path d="M12 2.8l7.5 4.3v9.8L12 21.2l-7.5-4.3V7.1z" /><path d="M12 7.5l3.6 2.1v4.3L12 16l-3.6-2.1V9.6z" fill="currentColor" fillOpacity="0.35" /></svg>
  ),
  themes: (
    <svg {...svgProps}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 010 17z" fill="currentColor" fillOpacity="0.4" /><path d="M12 3.5v17" /></svg>
  ),
  textures: (
    <svg {...svgProps}><path d="M4 8l8-4 8 4-8 4z" /><path d="M4 12l8 4 8-4" /><path d="M4 16l8 4 8-4" /></svg>
  ),
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownedThemes, setOwnedThemes] = useState<Set<string>>(new Set());
  const [ownedEmblems, setOwnedEmblems] = useState<Set<string>>(new Set());
  const [emblemCat, setEmblemCat] = useState<string>(EMBLEM_CATEGORIES[0]?.id ?? '');
  const [tab, setTab] = useState<'achievements' | 'emblems' | 'themes' | 'textures'>('achievements');

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    getOwnedItems()
      .then(o => {
        setOwnedEmblems(new Set(o.filter(i => i.cosmeticType === 'avatar' && i.applyValue).map(i => i.applyValue as string)));
        setOwnedThemes(new Set(o.filter(i => i.cosmeticType === 'theme' && i.applyValue).map(i => i.applyValue as string)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const endpoint = token ? '/api/achievements/me' : '/api/achievements';

    Promise.all([
      api.get<AchievementEntry[]>(endpoint).catch(() =>
        token ? api.get<AchievementEntry[]>('/api/achievements') : Promise.reject(new Error('fail'))
      ),
      token ? getProfile().catch(() => null) : Promise.resolve(null),
    ])
      .then(([achs, profile]) => {
        setAchievements(achs);
        if (profile) { setCredits(profile.credits); setXp(profile.xp); }
      })
      .catch(() => setError('Could not load achievements. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const earned      = achievements.filter(a => a.earned).length;
  const total       = achievements.length;
  const overallPct  = total > 0 ? Math.round((earned / total) * 100) : 0;

  // Group achievements
  const grouped: { label: string; icon: string; items: AchievementEntry[] }[] = [];
  const usedIds = new Set<number>();

  for (const g of GROUPS) {
    const items = achievements.filter(a => g.types.includes(a.type));
    if (items.length > 0) {
      grouped.push({ label: g.label, icon: g.icon, items });
      items.forEach(a => usedIds.add(a.id));
    }
  }
  const others = achievements.filter(a => !usedIds.has(a.id));
  if (others.length > 0) grouped.push({ label: 'Other', icon: 'other', items: others });

  return (
    <main className={styles.main}>
      <PageShell />

      <div className={styles.container}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.badge}>Achievements</div>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Your Nexus Collection</span>
          </h1>
          <p className={styles.subtitle}>
            Earn badges by hitting XP milestones, completing challenges, and building streaks.
          </p>

          {/* Stats bar */}
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statVal}>{loading ? '—' : `${earned}/${total}`}</span>
              <span className={styles.statLbl}>Badges Earned</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statVal}>{loading ? '—' : `${overallPct}%`}</span>
              <span className={styles.statLbl}>Completion</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statVal} style={{ color: '#818cf8' }}>
                {credits === null ? '—' : credits}
              </span>
              <span className={styles.statLbl}>Credits</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statVal} style={{ color: '#f59e0b' }}>
                {xp === null ? '—' : xp.toLocaleString()}
              </span>
              <span className={styles.statLbl}>Total XP</span>
            </div>
            <Link href="/store" className={styles.storeLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9" /><path d="M5 12v8h14v-8" /><path d="M10 20v-4h4v4" /></svg>
              Store
              <svg className={styles.storeArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>

          {/* Overall progress bar */}
          {!loading && (
            <div className={styles.overallBar}>
              <div className={styles.overallFill} style={{ width: `${overallPct}%` }} />
            </div>
          )}
        </header>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* ── Category toggles ── */}
        <div className={styles.segmented} role="tablist">
          {([['achievements', 'Milestones'], ['emblems', 'Emblems'], ['themes', 'Themes'], ['textures', 'Textures']] as const).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`${styles.segBtn} ${tab === k ? styles.segBtnActive : ''}`}
            ><span className={styles.segIcon}>{TAB_ICONS[k]}</span>{label}</button>
          ))}
        </div>

        {tab === 'themes' && (
          <div className={styles.emblemShowcase}>
            {THEMES.map(t => {
              const owned = t.free || ownedThemes.has(t.slug);
              return (
                <div key={t.slug} className={`${styles.emblemTile} ${owned ? '' : styles.emblemTileLocked}`} style={{ ['--ec' as string]: t.accent }}>
                  {t.cost && <span className={styles.emblemRarityTag}>⬡ {t.cost}</span>}
                  <div className={styles.emblemStage}>
                    <div className={styles.emblemMedal} style={{ background: `linear-gradient(145deg,${t.bg},#000)`, borderColor: t.accent, borderRadius: 18 }}>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <span style={{ display: 'flex', gap: 4 }}>
                          <i style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent }} />
                          <i style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent2 }} />
                        </span>
                      </span>
                    </div>
                    {!owned && <span className={styles.emblemLock}>🔒</span>}
                  </div>
                  <div className={styles.emblemTileName}>{t.name}</div>
                  <div className={styles.emblemReq}>{owned ? '✓ Unlocked — equip it on your Profile' : t.how}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'textures' && (
          <p style={{ opacity: 0.7, padding: '24px 0' }}>Profile textures are coming soon — unlock requirements will show up here.</p>
        )}

        {/* ── Emblem rewards ── */}
        {tab === 'emblems' && !loading && (
          <div className={styles.subTabs}>
            {EMBLEM_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setEmblemCat(c.id)}
                className={`${styles.subTab} ${emblemCat === c.id ? styles.subTabActive : ''}`}
              >{c.name}</button>
            ))}
          </div>
        )}

        {tab === 'emblems' && !loading && (
          <section className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupIcon}>{GROUP_ICONS.emblems}</span>
              <span className={styles.groupLabel}>Emblem Rewards</span>
              <span className={styles.groupCount}>
                {(EMBLEM_CATEGORIES.find(c => c.id === emblemCat)?.emblems ?? []).filter(e => ownedEmblems.has(e.id) || achievements.some(x => x.emblemId === e.id && x.earned)).length}/{EMBLEM_CATEGORIES.find(c => c.id === emblemCat)?.emblems.length ?? 0}
              </span>
            </div>
            <div className={styles.emblemShowcase}>
              {(EMBLEM_CATEGORIES.find(c => c.id === emblemCat)?.emblems ?? []).map(e => {
                const a = achievements.find(x => x.emblemId === e.id);
                const owned = ownedEmblems.has(e.id) || !!a?.earned;
                return (
                  <div
                    key={e.id}
                    className={`${styles.emblemTile} ${owned ? '' : styles.emblemTileLocked}`}
                    style={{ ['--ec' as string]: e.border }}
                  >
                    <span className={styles.emblemRarityTag}>{e.rarity}</span>
                    <div className={styles.emblemStage}>
                      <div className={styles.emblemMedal} style={{ background: e.background, color: e.color, borderColor: e.border, textShadow: e.textShadow }}>
                        {e.mark}
                      </div>
                      {!owned && <span className={styles.emblemLock}>🔒</span>}
                    </div>
                    <div className={styles.emblemTileName}>{e.name}</div>
                    <div className={styles.emblemReq}>
                      {owned ? '✓ Unlocked' : a ? a.description : 'Available in the Store'}
                    </div>
                    <div className={styles.emblemAlt}>
                      {owned
                        ? (a?.earned ? `via ${a.name}` : 'Owned')
                        : a ? `${a.name} · or ${e.cost} credits` : `${e.cost} credits`}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Groups ── */}
        {tab !== 'achievements' && !loading ? null : loading
          ? (
            <div className={styles.badgeGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          )
          : grouped.map(g => {
            const groupEarned = g.items.filter(a => a.earned).length;
            return (
              <section key={g.label} className={styles.group}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupIcon}>{GROUP_ICONS[g.icon] ?? GROUP_ICONS.other}</span>
                  <span className={styles.groupLabel}>{g.label}</span>
                  <span className={styles.groupCount}>{groupEarned}/{g.items.length}</span>
                </div>
                <div className={styles.emblemShowcase}>
                  {g.items.map(ach => <AchCard key={ach.id} ach={ach} />)}
                </div>
              </section>
            );
          })
        }
      </div>
    </main>
  );
}
