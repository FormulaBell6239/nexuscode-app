"use client";
import React, { useEffect, useState } from "react";
import StatIcon from "@/components/StatIcon";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { addLocalCredits, submitXp } from "@/lib/api";
import styles from "./Assignments.module.css";

// ── Types ────────────────────────────────────────────────────────────
type Rarity     = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
type RewardType = 'xp' | 'emblem' | 'callingCard' | 'skin' | 'powerup';
type PlanTier   = 'free' | 'pro' | 'quantum';

interface Assignment {
  id:            string;
  title:         string;
  description:   string;
  task:          string;
  rarity:        Rarity;
  reward:        { type: RewardType; label: string; icon: string; value?: number };
  requiredTier:  PlanTier;
  xpBonus:       number;
  creditReward:  number;
  expiresLabel:  string;
  category:      string;
  requirements?: { prefix: string; total: number }[];
}

// ── Static assignment data ───────────────────────────────────────────
const ASSIGNMENTS: Assignment[] = [
  {
    id: 'a-html-blitz',
    title: 'The HTML Blitz',
    description: 'Structure a full semantic page from scratch — headings, links, forms and all.',
    task: 'Complete all 18 HTML lessons in the Web Fundamentals track.',
    rarity: 'Rare',
    reward: { type: 'emblem', label: 'HTML Pioneer Emblem', icon: '🔷' },
    requiredTier: 'free',
    xpBonus: 325,
    creditReward: 70,
    expiresLabel: '4d 22h',
    category: 'HTML',
    requirements: [{ prefix: 'html-', total: 18 }],
  },
  {
    id: 'a-style-sprint',
    title: 'Style Sprint',
    description: 'Prove your CSS mastery by conquering the complete styling track.',
    task: 'Complete all 18 CSS lessons in the Web Fundamentals track.',
    rarity: 'Common',
    reward: { type: 'xp', label: '+300 Bonus XP', icon: '⚡', value: 300 },
    requiredTier: 'free',
    xpBonus: 100,
    creditReward: 20,
    expiresLabel: '6d 8h',
    category: 'CSS',
    requirements: [{ prefix: 'css-', total: 18 }],
  },
  {
    id: 'a-sql-scholar',
    title: 'SQL Scholar',
    description: 'Master the fundamentals of databases and relational queries.',
    task: 'Complete all 18 SQL lessons and practice each query pattern in the reference database.',
    rarity: 'Uncommon',
    reward: { type: 'xp', label: '+150 Bonus XP', icon: '⚡', value: 150 },
    requiredTier: 'free',
    xpBonus: 150,
    creditReward: 40,
    expiresLabel: '5d 14h',
    category: 'SQL',
    requirements: [{ prefix: 'sql-', total: 18 }],
  },
  {
    id: 'a-js-dominator',
    title: 'JS Dominator',
    description: 'JavaScript runs the modern web. Show us you can handle the whole track.',
    task: 'Complete all 18 JavaScript lessons in the Web Fundamentals track.',
    rarity: 'Epic',
    reward: { type: 'callingCard', label: 'Neon Script Calling Card', icon: '🃏' },
    requiredTier: 'pro',
    xpBonus: 750,
    creditReward: 180,
    expiresLabel: '5d 3h',
    category: 'JavaScript',
    requirements: [{ prefix: 'js-', total: 18 }],
  },
  {
    id: 'a-py-serpent',
    title: 'The Serpent Run',
    description: 'From print() to classes — a full Python gauntlet for those who\'ve earned their stripes.',
    task: 'Complete all 17 Python lessons, from print() through range steps.',
    rarity: 'Epic',
    reward: { type: 'skin', label: 'Serpent UI Skin', icon: '🎨' },
    requiredTier: 'pro',
    xpBonus: 2500,
    creditReward: 500,
    expiresLabel: '2d 17h',
    category: 'Python',
    requirements: [{ prefix: 'py-', total: 17 }],
  },
  {
    id: 'a-quantum-grind',
    title: 'Quantum Grind',
    description: 'The ultimate weekly challenge — an AI-curated multi-track sprint.',
    task: 'Complete all four foundation sections: HTML, CSS, JavaScript, and Python.',
    rarity: 'Legendary',
    reward: { type: 'powerup', label: '3× XP Multiplier (7 days)', icon: '⬡' },
    requiredTier: 'quantum',
    xpBonus: 4000,
    creditReward: 800,
    expiresLabel: '1d 6h',
    category: 'All Tracks',
    requirements: [
      { prefix: 'html-', total: 18 },
      { prefix: 'css-', total: 18 },
      { prefix: 'js-', total: 18 },
      { prefix: 'py-', total: 17 },
    ],
  },
  {
    id: 'a-nexus-codex',
    title: 'The Nexus Codex',
    description: 'A handcrafted challenge reserved for Quantum subscribers. The ultimate test of mastery.',
    task: 'Achieve a 7-day learning streak and get a first-try score on 5 lessons in any track.',
    rarity: 'Legendary',
    reward: { type: 'emblem', label: 'Nexus Codex Emblem', icon: '◈' },
    requiredTier: 'quantum',
    xpBonus: 2200,
    creditReward: 450,
    expiresLabel: '6d 0h',
    category: 'Multi-Track',
  },
];

// ── Rarity / reward colour maps ──────────────────────────────────────
const RARITY_COLOR: Record<Rarity, string> = {
  Common:    '#64748b',
  Uncommon:  '#10b981',
  Rare:      '#3b82f6',
  Epic:      '#a855f7',
  Legendary: '#f59e0b',
};
const RARITY_GLOW: Record<Rarity, string> = {
  Common:    'rgba(100,116,139,0.2)',
  Uncommon:  'rgba(16,185,129,0.22)',
  Rare:      'rgba(59,130,246,0.22)',
  Epic:      'rgba(168,85,247,0.22)',
  Legendary: 'rgba(245,158,11,0.28)',
};
const REWARD_COLOR: Record<RewardType, string> = {
  xp:          '#f59e0b',
  emblem:      '#6366f1',
  callingCard: '#06b6d4',
  skin:        '#10b981',
  powerup:     '#a855f7',
};
const TIER_ORDER: Record<PlanTier, number> = { free: 0, pro: 1, quantum: 2 };

// ── Tier config ───────────────────────────────────────────────────────
const TIER_CONFIG: { id: PlanTier; label: string; eyebrow: string; accentColor: string; dotColor: string }[] = [
  { id: 'free',    label: 'Nexus Core',    eyebrow: 'FREE TIER',    accentColor: '#475569', dotColor: '#64748b'  },
  { id: 'pro',     label: 'Nexus Pro',     eyebrow: 'PRO TIER',     accentColor: '#6366f1', dotColor: '#818cf8'  },
  { id: 'quantum', label: 'Nexus Quantum', eyebrow: 'QUANTUM TIER', accentColor: '#f59e0b', dotColor: '#fbbf24'  },
];

const CATEGORY_OPTIONS = ['All tracks', ...new Set(ASSIGNMENTS.map(a => a.category))];

function getAssignmentProgress(assignment: Assignment, completedLessons: Set<string>) {
  if (!assignment.requirements?.length) return null;
  const total = assignment.requirements.reduce((sum, requirement) => sum + requirement.total, 0);
  const done = assignment.requirements.reduce((sum, requirement) => {
    const count = [...completedLessons].filter(key => key.startsWith(requirement.prefix)).length;
    return sum + Math.min(count, requirement.total);
  }, 0);
  return { done, total, percent: Math.round((done / total) * 100) };
}

// ── Page ─────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [plan, setPlan]           = useState<PlanTier>('free');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [mounted, setMounted]     = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All tracks');
  const [statusFilter, setStatusFilter] = useState<'open' | 'completed' | 'all'>('open');
  const [toast, setToast] = useState<{ xp: number; credits: number; rarity: Rarity; reward: string; icon: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const p = localStorage.getItem('nexus_plan') as PlanTier | null;
      if (p && ['free','pro','quantum'].includes(p)) setPlan(p);
      const raw = localStorage.getItem('nexus_completed_assignments');
      if (raw) setCompleted(new Set(JSON.parse(raw)));
      const rawLessons = localStorage.getItem('nexus_completed');
      if (rawLessons) setCompletedLessons(new Set(JSON.parse(rawLessons)));
    } catch {}

    const syncLessonProgress = () => {
      try {
        const rawLessons = localStorage.getItem('nexus_completed');
        setCompletedLessons(rawLessons ? new Set(JSON.parse(rawLessons)) : new Set());
      } catch {}
    };
    window.addEventListener('focus', syncLessonProgress);
    return () => window.removeEventListener('focus', syncLessonProgress);
  }, []);

  function handleComplete(id: string) {
    if (completed.has(id)) return;
    const a = ASSIGNMENTS.find(x => x.id === id);
    if (!a) return;

    addLocalCredits(a.creditReward);

    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      submitXp(Math.min(a.xpBonus, 500)).catch(() => {});
    }

    setToast({ xp: a.xpBonus, credits: a.creditReward, rarity: a.rarity, reward: a.reward.label, icon: a.reward.icon });
    setTimeout(() => setToast(null), 3500);

    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem('nexus_completed_assignments', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const planLabel   = plan === 'free' ? 'Nexus Core' : plan === 'pro' ? 'Nexus Pro' : 'Nexus Quantum';
  const weeklySlots = plan === 'free' ? '1 / week'   : plan === 'pro' ? '3 / week'  : 'Unlimited';
  const filteredAssignments = ASSIGNMENTS.filter(assignment => {
    const matchesCategory = categoryFilter === 'All tracks' || assignment.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'completed' ? completed.has(assignment.id) : !completed.has(assignment.id));
    return matchesCategory && matchesStatus;
  });
  const featuredId = filteredAssignments.find(assignment =>
    TIER_ORDER[plan] >= TIER_ORDER[assignment.requiredTier] && !completed.has(assignment.id)
  )?.id;

  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.container}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.eyebrow}>◈ RARE DROPS</div>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Assignments</span>
          </h1>
          <p className={styles.subtitle}>
            Semi-rare challenges with exclusive rewards. Complete them before they expire.
          </p>
          {mounted && (
            <div className={styles.tierBar}>
              <span className={styles.tierCurrent}>{planLabel}</span>
              <span className={styles.tierDivider}>·</span>
              <span className={styles.tierSlots}>{weeklySlots}</span>
              {plan === 'free' && (
                <Link href="/upgrade" className={styles.tierUpgrade}>Upgrade for more →</Link>
              )}
            </div>
          )}
        </header>

        {mounted && (
          <div className={styles.assignmentControls}>
            <label className={styles.categorySelectLabel}>
              <span>Track</span>
              <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className={styles.categorySelect}>
                {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <div className={styles.statusTabs} role="tablist" aria-label="Assignment status">
              {(['open', 'completed', 'all'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === status}
                  className={`${styles.statusTab} ${statusFilter === status ? styles.statusTabActive : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'open' ? 'Open' : status === 'completed' ? 'Collected' : 'All'}
                  <span>{status === 'open' ? ASSIGNMENTS.filter(a => !completed.has(a.id)).length : status === 'completed' ? completed.size : ASSIGNMENTS.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {TIER_CONFIG.map(tier => {
          const tierAssignments = filteredAssignments.filter(assignment => assignment.requiredTier === tier.id);
          if (!tierAssignments.length) return null;
          return (
            <TierSection
              key={tier.id}
              tier={tier}
              assignments={tierAssignments}
              userPlan={plan}
              completed={completed}
              completedLessons={completedLessons}
              featuredId={featuredId}
              onComplete={handleComplete}
              mounted={mounted}
            />
          );
        })}

        {mounted && filteredAssignments.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>◈</span>
            <strong>No assignments in this view</strong>
            <p>Try another track or switch to all assignments.</p>
          </div>
        )}

      </div>

      {mounted && toast && (
        <div
          className={styles.rewardToast}
          style={{ '--toast-rarity': RARITY_COLOR[toast.rarity] } as React.CSSProperties}
        >
          <span className={`${styles.toastIcon} ${styles.toastIconReward}`} style={{ color: RARITY_COLOR[toast.rarity] }}>{toast.icon}</span>
          <div className={styles.toastBody}>
            <span className={styles.toastTitle}>Assignment Complete!</span>
            <span className={styles.toastDrop}>{toast.reward} · {toast.rarity} drop</span>
            <div className={styles.toastRewards}>
              <span className={styles.toastXp}>+{toast.xp.toLocaleString()} XP</span>
              <span className={styles.toastDot}>·</span>
              <span className={styles.toastCredits}>+{toast.credits} Credits</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Animated divider between tier sections ────────────────────────────
// ── Tier section ──────────────────────────────────────────────────────
function TierSection({
  tier, assignments, userPlan, completed, completedLessons, featuredId, onComplete, mounted,
}: {
  tier:        { id: PlanTier; label: string; eyebrow: string; accentColor: string; dotColor: string };
  assignments: Assignment[];
  userPlan:    PlanTier;
  completed:   Set<string>;
  completedLessons: Set<string>;
  featuredId?: string;
  onComplete:  (id: string) => void;
  mounted:     boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const canAccess = TIER_ORDER[userPlan] >= TIER_ORDER[tier.id];
  const visibleIndex = Math.min(activeIdx, assignments.length - 1);

  return (
    <section className={styles.tierSection}>

      {/* ── Section header ── */}
      <div className={styles.tierSectionHeader}>
        <h2 className={styles.tierTitle}>
          <span className={styles.tierDot} style={{ background: tier.dotColor }} />
          {tier.label} Drops
        </h2>
        <div className={styles.tierMeta}>
          <span
            className={styles.tierEyebrow}
            style={{ color: tier.accentColor, borderColor: `${tier.accentColor}44`, background: `${tier.accentColor}12` }}
          >
            {tier.eyebrow}
          </span>
          <span
            className={styles.tierAssignmentCount}
            style={{ color: tier.dotColor, borderColor: `${tier.dotColor}40`, background: `${tier.dotColor}10` }}
          >
            {assignments.length}
          </span>
        </div>
      </div>

      {/* ── Lock banner (higher-tier sections) ── */}
      {!canAccess && (
        <div className={styles.tierLockBanner} style={{ borderColor: `${tier.accentColor}30` }}>
          <span><StatIcon name="lock" size={13} /></span>
          <span>
            {tier.id === 'pro' ? 'Nexus Pro' : 'Nexus Quantum'} exclusive —{' '}
            <Link href="/upgrade" className={styles.tierLockLink}>upgrade to unlock</Link>
          </span>
        </div>
      )}

      <div className={styles.carousel}>
        <button
          type="button"
          className={styles.carouselArrow}
          onClick={() => setActiveIdx(index => Math.max(0, Math.min(index, assignments.length - 1) - 1))}
          disabled={visibleIndex === 0}
          aria-label="Previous assignment"
        >‹</button>
        <div className={styles.carouselTrack}>
          {assignments.map((a, index) => {
            const offset = index - visibleIndex;
            const positionClass = offset === 0 ? styles.slideActive : offset === -1 ? styles.slideLeft : offset === 1 ? styles.slideRight : styles.slideHidden;
            const isFeatured = a.id === featuredId;
            return (
              <div key={a.id} className={`${styles.slide} ${positionClass}`} onClick={() => offset !== 0 && setActiveIdx(index)}>
                {!mounted ? <div className={styles.skeleton} />
                  : completed.has(a.id) ? <CompletedCard a={a} />
                  : canAccess ? <AssignmentCard a={a} featured={isFeatured} completedLessons={completedLessons} onComplete={onComplete} />
                  : <LockedCard a={a} plan={userPlan} />}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.carouselArrow}
          onClick={() => setActiveIdx(index => Math.min(assignments.length - 1, index + 1))}
          disabled={visibleIndex === assignments.length - 1}
          aria-label="Next assignment"
        >›</button>
      </div>
      <div className={styles.carouselDots}>
        {assignments.map((assignment, index) => (
          <button
            key={assignment.id}
            type="button"
            className={`${styles.dot} ${index === visibleIndex ? styles.dotActive : ''}`}
            style={index === visibleIndex ? { background: tier.dotColor } : undefined}
            onClick={() => setActiveIdx(index)}
            aria-label={`View assignment ${index + 1}: ${assignment.title}`}
            aria-current={index === visibleIndex ? 'true' : undefined}
          />
        ))}
      </div>

    </section>
  );
}

// ── Active assignment card ────────────────────────────────────────────
function RewardShowcase({ a, earned = false, compact = false }: { a: Assignment; earned?: boolean; compact?: boolean }) {
  const rewardColor = REWARD_COLOR[a.reward.type];
  return (
    <div
      className={`${styles.rewardShowcase} ${compact ? styles.rewardShowcaseCompact : ''}`}
      style={{ '--reward': rewardColor, '--rarity': RARITY_COLOR[a.rarity], '--rarity-glow': RARITY_GLOW[a.rarity] } as React.CSSProperties}
    >
      <div className={styles.rewardArtifact}>
        <span className={styles.rewardArtifactIcon}>{a.reward.icon}</span>
        <span className={styles.rewardArtifactTier}>{a.rarity}</span>
      </div>
      <div className={styles.rewardShowcaseContent}>
        <span className={styles.rewardShowcaseEyebrow}>{earned ? 'Reward collected' : 'Featured drop'}</span>
        <strong className={styles.rewardShowcaseName}>{a.reward.label}</strong>
        <div className={styles.rewardPayout}>
          <span><b>+{a.xpBonus.toLocaleString()}</b><small>XP BONUS</small></span>
          <span><b>+{a.creditReward}</b><small>CREDITS</small></span>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({ a, featured, completedLessons, onComplete }: { a: Assignment; featured: boolean; completedLessons: Set<string>; onComplete: (id: string) => void }) {
  const rc = RARITY_COLOR[a.rarity];
  const progress = getAssignmentProgress(a, completedLessons);
  const canClaim = !progress || progress.done >= progress.total;
  return (
    <article
      className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
      style={{ '--rarity': rc, '--rarity-glow': RARITY_GLOW[a.rarity], '--reward': REWARD_COLOR[a.reward.type] } as React.CSSProperties}
    >
      <span className={styles.cardAccentIcon} aria-hidden="true">{a.reward.icon}</span>
      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <span className={styles.rarityBadge} style={{ color: rc, borderColor: `${rc}44`, background: `${rc}14` }}>
            {a.rarity}
          </span>
          <span className={styles.categoryPill}>{a.category}</span>
          <span className={styles.expiry}>⏱ {a.expiresLabel}</span>
        </div>
        {featured && <span className={styles.featuredLabel}>NEXT PROJECT</span>}
        <h3 className={styles.cardTitle}>{a.title}</h3>
        <p className={styles.cardDesc}>{a.description}</p>
        <div className={styles.taskBox}>
          <span className={styles.taskLabel}>PROJECT BRIEF</span>
          <p className={styles.taskText}>{a.task}</p>
        </div>
        {progress && (
          <div className={styles.requirementProgress}>
            <div className={styles.requirementProgressTop}>
              <span>Lesson progress</span>
              <b>{progress.done} / {progress.total}</b>
            </div>
            <div className={styles.requirementTrack}>
              <div className={styles.requirementFill} style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        )}
        <RewardShowcase a={a} />
        <p className={styles.claimNote}>Complete the brief in Curriculum, then come back to claim this drop.</p>
        <div className={styles.assignmentActions}>
          <Link href="/curriculum" className={styles.curriculumLink}>Open curriculum ↗</Link>
          <button className={styles.startBtn} onClick={() => onComplete(a.id)} disabled={!canClaim}>
            {canClaim ? 'Claim rewards' : `${progress?.done ?? 0}/${progress?.total ?? 0} lessons`}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Locked card ───────────────────────────────────────────────────────
function LockedCard({ a, plan }: { a: Assignment; plan: PlanTier }) {
  const isSlotLimit = TIER_ORDER[a.requiredTier] <= TIER_ORDER[plan];
  const rc = RARITY_COLOR[a.rarity];
  return (
    <article
      className={`${styles.card} ${styles.cardLocked}`}
      style={{ '--rarity': rc, '--rarity-glow': 'transparent' } as React.CSSProperties}
    >
      <div className={styles.cardStripe} style={{ opacity: 0.2 }} />
      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <span className={styles.rarityBadge} style={{ color: rc, borderColor: `${rc}30`, background: `${rc}08` }}>
            {a.rarity}
          </span>
          <span className={styles.categoryPill}>{a.category}</span>
        </div>
        <h3 className={styles.cardTitle}>{a.title}</h3>
        <p className={styles.cardDesc}>{a.description}</p>
        <RewardShowcase a={a} compact />
        <div className={styles.lockedBlock}>
          {isSlotLimit ? (
            <>
              <span className={styles.lockIcon}>⏳</span>
              <p className={styles.lockReason}>Weekly slot used — resets next Monday.</p>
              <Link href="/upgrade" className={styles.lockBtn}>Upgrade for more slots →</Link>
            </>
          ) : (
            <>
              <span className={styles.lockIcon}><StatIcon name="lock" size={13} /></span>
              <p className={styles.lockReason}>
                {a.requiredTier === 'pro' ? 'Nexus Pro' : 'Nexus Quantum'} exclusive
              </p>
              <Link href="/upgrade" className={styles.lockBtn}>
                Unlock with {a.requiredTier === 'pro' ? 'Nexus Pro' : 'Nexus Quantum'} →
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Completed card ────────────────────────────────────────────────────
function CompletedCard({ a }: { a: Assignment }) {
  return (
    <article className={`${styles.card} ${styles.cardCompleted}`}>
      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <span className={styles.completedMark}>✓ Completed</span>
          <span className={styles.categoryPill}>{a.category}</span>
        </div>
        <h3 className={styles.cardTitle}>{a.title}</h3>
        <p className={styles.cardDesc}>{a.description}</p>
        <div className={`${styles.taskBox} ${styles.completedBrief}`}>
          <span className={styles.taskLabel}>PROJECT BRIEF</span>
          <p className={styles.taskText}>{a.task}</p>
        </div>
        <div className={styles.collectedStatus}>
          <span className={styles.collectedStatusMark}>✓</span>
          <span>Assignment collected</span>
          <span className={styles.collectedStatusLine} />
        </div>
        <RewardShowcase a={a} earned />
        <Link href="/curriculum" className={styles.curriculumLink}>Review related lessons ↗</Link>
      </div>
    </article>
  );
}
