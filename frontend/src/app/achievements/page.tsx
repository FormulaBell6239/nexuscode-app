"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Achievements.module.css';
import PageShell from '@/components/PageShell';
import { api, getProfile } from '@/lib/api';

interface AchievementEntry {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: string;
  requiredCount: number;
  creditReward: number;
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
  { label: 'Level & XP',   icon: '⬆️', types: ['level', 'xp_earned'] },
  { label: 'Lessons',      icon: '📚', types: ['lessons_completed', 'first_try_lessons'] },
  { label: 'Streaks',      icon: '🔥', types: ['streak'] },
  { label: 'Games',        icon: '🎮', types: ['game_rounds_played'] },
  { label: 'Challenges',   icon: '🏆', types: ['speed_rounds_won', 'debug_challenges_fixed', 'logic_puzzles_solved'] },
  { label: 'Leaderboard',  icon: '🏅', types: ['leaderboard_top10'] },
];

// ── Achievement card — horizontal row layout ────────────────────────────────
function AchCard({ ach }: { ach: AchievementEntry }) {
  const tier = getTier(ach.creditReward);
  const pct = ach.requiredCount > 0
    ? Math.min(Math.round((ach.progress / ach.requiredCount) * 100), 100)
    : (ach.earned ? 100 : 0);

  return (
    <div className={`${styles.achCard} ${ach.earned ? styles.achCardEarned : styles.achCardLocked}`}>
      {/* Left — icon badge */}
      <div className={`${styles.achBadge} ${styles[`badge_${tier}`]}`}>
        <span className={styles.achBadgeIcon}>{ach.earned ? ach.icon : '🔒'}</span>
      </div>

      {/* Center — name, desc, progress */}
      <div className={styles.achBody}>
        <div className={styles.achMeta}>
          <span className={styles.achName}>{ach.name}</span>
          <span className={`${styles.tierLabel} ${styles[`tier_${tier}`]}`}>{TIER_LABELS[tier]}</span>
          {ach.earned && ach.earnedAt && (
            <span className={styles.earnedDate}>
              {new Date(ach.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
        <span className={styles.achDesc}>{ach.description}</span>
        <div className={styles.achProgress}>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${styles[`fill_${tier}`]}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {ach.requiredCount > 1 && (
            <span className={styles.progressCount}>
              {Math.min(ach.progress, ach.requiredCount)}/{ach.requiredCount}
            </span>
          )}
        </div>
      </div>

      {/* Right — credit reward */}
      {ach.creditReward > 0 && (
        <span className={`${styles.creditPill} ${ach.earned ? styles.creditPillEarned : ''}`}>
          ⬡ {ach.creditReward}
        </span>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const endpoint = token ? '/api/achievements/me' : '/api/achievements';

    Promise.all([
      api.get<AchievementEntry[]>(endpoint),
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
  if (others.length > 0) grouped.push({ label: 'Other', icon: '◈', items: others });

  return (
    <main className={styles.main}>
      <PageShell />

      <div className={styles.container}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.badge}>Achievements</div>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Your Badge Collection</span>
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
            <Link href="/store" className={styles.storeLink}>Store →</Link>
          </div>

          {/* Overall progress bar */}
          {!loading && (
            <div className={styles.overallBar}>
              <div className={styles.overallFill} style={{ width: `${overallPct}%` }} />
            </div>
          )}
        </header>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* ── Tier legend ── */}
        <div className={styles.tierLegend}>
          {(['bronze', 'silver', 'gold', 'platinum'] as Tier[]).map(t => (
            <div key={t} className={styles.tierLegendItem}>
              <div className={`${styles.tierDot} ${styles[`border_${t}`]}`} />
              <span className={`${styles.tierLegendLabel} ${styles[`tier_${t}`]}`}>
                {TIER_LABELS[t]}
              </span>
            </div>
          ))}
        </div>

        {/* ── Groups ── */}
        {loading
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
                  <span className={styles.groupIcon}>{g.icon}</span>
                  <span className={styles.groupLabel}>{g.label}</span>
                  <span className={styles.groupCount}>{groupEarned}/{g.items.length}</span>
                </div>
                <div className={styles.badgeGrid}>
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
