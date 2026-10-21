import styles from './Onboarding.module.css';
import PageShell from '@/components/PageShell';
import Link from 'next/link';

const STEPS = [
  { icon: '◈', title: 'Daily Challenges',   desc: 'Complete one challenge every day to build and hold your streak.' },
  { icon: '◎', title: 'Earn Badges',        desc: 'Hit milestones and unlock achievement badges as you level up.' },
  { icon: '⟁', title: 'Climb the Board',   desc: 'Compete globally on the leaderboard and see how you rank.' },
  { icon: '⌘', title: 'Unlock Content',    desc: 'New games and lessons open as you grow your skill level.' },
];

export default function Onboarding() {
  return (
    <main className={styles.main}>
      <PageShell />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>Welcome to NexusCode</div>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Here’s how it works.</span>
          </h1>
          <p className={styles.subtitle}>
            Your coding adventure starts now. Here’s everything you need to know before you begin.
          </p>
        </header>

        <div className={styles.stepsGrid}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.stepCard}>
              <span className={styles.stepIcon}>{s.icon}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <Link href="/curriculum">
            <button className={styles.buttonPrimary}>Start Learning →</button>
          </Link>
          <Link href="/games">
            <button className={styles.buttonGhost}>Browse Games</button>
          </Link>
        </div>
      </div>
    </main>
  );
}