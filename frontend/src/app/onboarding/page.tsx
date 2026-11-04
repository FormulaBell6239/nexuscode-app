import styles from './Onboarding.module.css';
import PageShell from '@/components/PageShell';
import Link from 'next/link';

const STEPS = [
  { n: '01', icon: '◈', title: 'Learn your way',    desc: 'Follow the Nexus Path through Web, Python and SQL tracks, lesson by lesson.', href: '/roadmap' },
  { n: '02', icon: '⟁', title: 'Ask Nexus AI',      desc: 'Stuck? Chat with the AI, attach code or screenshots, and get unstuck fast.', href: '/ai' },
  { n: '03', icon: '◎', title: 'Join the Community', desc: 'Ask questions, share projects, swap snippets and learn from other developers.', href: '/community' },
  { n: '04', icon: '⌘', title: 'Play and practice', desc: 'Sharpen your skills with games, assignments and daily challenges.', href: '/games' },
  { n: '05', icon: '◆', title: 'Earn XP and credits', desc: 'Keep a streak, level up, and spend credits in the store on power-ups and cosmetics.', href: '/store' },
  { n: '06', icon: '✦', title: 'Climb the board',   desc: 'Unlock achievements and see how you rank against everyone on the leaderboard.', href: '/leaderboard' },
];

export default function Onboarding() {
  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.ambient} aria-hidden="true" />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.eyebrow}><span className={styles.dot} /> WELCOME TO NEXUSCODE</div>
          <h1 className={styles.title}>Here&apos;s how it <span>works</span></h1>
          <p className={styles.subtitle}>
            Everything you need to get started. Learn, build, and grow alongside other developers.
          </p>
        </header>

        <div className={styles.stepsGrid}>
          {STEPS.map((s) => (
            <Link key={s.n} href={s.href} className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepIcon}>{s.icon}</span>
                <span className={styles.stepNum}>{s.n}</span>
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
              <span className={styles.stepGo}>Open →</span>
            </Link>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <Link href="/curriculum" className={styles.buttonPrimary}>Start Learning →</Link>
          <Link href="/community" className={styles.buttonGhost}>Visit Community</Link>
        </div>
      </div>
    </main>
  );
}
