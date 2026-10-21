'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

const FEATURES = [
  { icon: '◈', title: 'Code Challenges', desc: 'Solve real-world problems every day and sharpen practical skills.' },
  { icon: '◎', title: 'Achievements', desc: 'Unlock badges as you hit milestones and master new concepts.' },
  { icon: '⟁', title: 'Streak Tracker', desc: 'Build consistency with daily learning streaks and momentum.' },
  { icon: '⌘', title: 'Adaptive Levels', desc: 'A curriculum that evolves to match your current skill level.' },
  { icon: '↗', title: 'Leaderboards', desc: 'Compete globally and see exactly how you rank over time.' },
  { icon: '▣', title: 'Live Playground', desc: 'Experiment freely in a live in-browser coding sandbox.' },
];

const PHRASES = ['Ship better code.', 'Build real projects.', 'Learn by doing.'];

export default function Home() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isGuest = localStorage.getItem('nexus_guest');
    const hasVisited = localStorage.getItem('nexus_visited');

    setIsLoggedIn(!!token);
    if (token) {
      const stored = localStorage.getItem('username') || localStorage.getItem('name') || '';
      setUsername(stored);
    }

    // First visit with no account and no guest session → send to onboarding
    if (!token && !isGuest && !hasVisited) {
      localStorage.setItem('nexus_visited', 'true');
      router.replace('/onboarding');
    }
  }, [router]);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting) {
      if (charIdx < phrase.length) {
        timer = setTimeout(() => setCharIdx(c => c + 1), 65);
      } else {
        timer = setTimeout(() => setDeleting(true), 1800);
      }
    } else {
      if (charIdx > 0) {
        timer = setTimeout(() => setCharIdx(c => c - 1), 35);
      } else {
        setDeleting(false);
        setPhraseIdx(i => (i + 1) % PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [charIdx, deleting, phraseIdx]);

  return (
    <main className={styles.main}>
      <div className={styles.welcomeBanner}>
        {isLoggedIn
          ? `Welcome back${username ? `, ${username}` : ''}! Ready to keep building?`
          : 'Welcome to NexusCode — your coding journey starts here.'}
      </div>

      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.dotGrid} />

      <header className={styles.header}>
        <div className={styles.badge}>Beta · v0.1</div>
        <h1 className={styles.title}>
          <span className={styles.titleGradient}>NexusCode</span>
        </h1>
        <p className={styles.typewriter}>
          {PHRASES[phraseIdx].slice(0, charIdx)}
          <span className={styles.cursor}>|</span>
        </p>
        <p className={styles.subtitle}>
          An interactive platform to learn coding through daily challenges,
          adaptive lessons, and real progress tracking.
        </p>
        <div className={styles.ctaRow}>
          <Link
            href={isLoggedIn ? '/curriculum' : '/auth'}
            className={styles.buttonPrimary}
          >
            {isLoggedIn ? 'Continue Learning →' : 'Start Learning →'}
          </Link>
          <Link href="/curriculum" className={styles.buttonGhost}>
            View Curriculum
          </Link>
        </div>

        <div className={styles.proBanner}>
          <span className={styles.proBannerText}>
            ✦ Unlock AI hints, unlimited challenges &amp; exclusive badges
          </span>
          <Link href="/upgrade" className={styles.proButton}>
            Upgrade to Pro →
          </Link>
        </div>
      </header>

      <section className={styles.featuresSection}>
        <p className={styles.sectionLabel}>What&apos;s inside</p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`${styles.featureCard} ${hoveredFeature === i ? styles.featureCardActive : ''}`}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerText}>NexusCode &copy; 2025</span>
      </footer>
    </main>
  );
}