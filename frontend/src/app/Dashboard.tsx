'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getProfile, getLocalCredits, getLocalCompletedLessons, type ProfileResponse } from '@/lib/api';
import { endSession } from '@/lib/session';
import EmblemAvatar from '@/components/EmblemAvatar';
import StatIcon from '@/components/StatIcon';
import styles from './Dashboard.module.css';

const PHRASES = ['Ship better code.', 'Build real projects.', 'Learn by doing.'];

type LeaderRow = { rank: number; username: string };

const LINKS = [
  { href: '/roadmap', title: 'Nexus Path', desc: 'Your guided roadmap' },
  { href: '/ai', title: 'Nexus AI', desc: 'Ask for help or a hint' },
  { href: '/community', title: 'Community', desc: 'Questions, projects, people' },
  { href: '/games', title: 'Games', desc: 'Practice and earn credits' },
  { href: '/store', title: 'Store', desc: 'Emblems and cosmetics' },
  { href: '/achievements', title: 'Achievements', desc: 'Milestones and rewards' },
];

export default function Dashboard({ signedIn }: { signedIn: boolean }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    let timer: ReturnType<typeof setTimeout>;
    if (!deleting) {
      timer = setTimeout(() => (charIdx < phrase.length ? setCharIdx((n) => n + 1) : setDeleting(true)), charIdx < phrase.length ? 65 : 1800);
    } else if (charIdx > 0) {
      timer = setTimeout(() => setCharIdx((n) => n - 1), 35);
    } else {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
      return;
    }
    return () => clearTimeout(timer);
  }, [charIdx, deleting, phraseIdx]);
  const [guestCredits, setGuestCredits] = useState(0);
  const [guestLessons, setGuestLessons] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      setGuestCredits(getLocalCredits());
      setGuestLessons(getLocalCompletedLessons().length);
      return;
    }
    getProfile()
      .then((p) => {
        setProfile(p);
        api
          .get<LeaderRow[]>('/api/leaderboard?limit=100')
          .then((rows) => setRank(rows.find((r) => r.username === p.username)?.rank ?? null))
          .catch(() => {});
      })
      .catch((e: unknown) => {
        // An expired or invalid token ends the session cleanly instead of leaving a broken dashboard.
        if (e instanceof Error && /unauthori[sz]ed|401|expired/i.test(e.message)) {
          endSession();
          window.location.reload();
        }
      });
    api
      .get<{ unread: number }>('/api/community/notifications')
      .then((d) => setUnread(d.unread))
      .catch(() => {});
  }, [signedIn]);

  const name = profile?.displayName || profile?.username || (signedIn ? '' : 'Guest');
  const lessons = signedIn ? profile?.completedLessons.length : guestLessons;
  const credits = signedIn ? profile?.credits : guestCredits;
  const isPro = profile?.plan === 'pro';

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.wrap}>
        <header className={styles.brand}>
          <div className={styles.badge}>Beta · v0.1</div>
          <h1 className={styles.brandTitle}>NexusCode</h1>
          <p className={styles.typewriter}>
            {PHRASES[phraseIdx].slice(0, charIdx)}
            <span className={styles.cursor}>|</span>
          </p>
        </header>

        <section className={styles.welcome}>
          <div className={styles.eyebrow}><span className={styles.dot} /> {signedIn ? 'DASHBOARD' : 'GUEST DASHBOARD'}</div>
          <h2>
            {signedIn ? 'Welcome back' : 'Welcome'}
            {name && <span>{name}</span>}
          </h2>
          <p>{signedIn ? 'Pick up where you left off.' : 'Your progress is saved on this device only.'}</p>
        </section>

        {!signedIn && (
          <section className={styles.guestBanner}>
            <span>Sign in to keep your XP, streak and credits across devices and join the leaderboard.</span>
            <Link href="/auth" className={styles.primary}>Sign in or create account</Link>
          </section>
        )}

        <section className={styles.continueCard}>
          {signedIn && profile?.avatar && (
            <EmblemAvatar value={profile.avatar} className={styles.emblem} />
          )}
          <div className={styles.continueText}>
            <div className={styles.label}>CONTINUE LEARNING</div>
            <h2>{lessons ? `${lessons} lesson${lessons === 1 ? '' : 's'} completed` : 'Start your first lesson'}</h2>
            <p>Jump back into the curriculum and keep your momentum going.</p>
          </div>
          <Link href="/curriculum" className={styles.primary}>Continue →</Link>
        </section>

        <section className={styles.stats}>
          {signedIn && (
            <>
              <div className={styles.stat}><StatIcon name="level" size={18} /><span>{profile?.level ?? '–'}</span>Level</div>
              <div className={styles.stat}><StatIcon name="xp" size={18} /><span>{profile?.xp?.toLocaleString() ?? '–'}</span>XP</div>
              <div className={styles.stat}><StatIcon name="streak" size={18} /><span>{profile?.streak ?? '–'}</span>Day streak</div>
              <div className={styles.stat}>
                <StatIcon name="energy" size={18} />
                <span>{isPro ? '∞' : profile ? `${profile.energy}/${profile.maxEnergy}` : '–'}</span>Energy
              </div>
            </>
          )}
          <div className={styles.stat}><StatIcon name="credits" size={18} /><span>{credits ?? '–'}</span>Credits</div>
          <div className={styles.stat}><StatIcon name="check" size={18} /><span>{lessons ?? '–'}</span>Lessons done</div>
          {signedIn && (
            <div className={styles.stat}><StatIcon name="trophy" size={18} /><span>{rank ? `#${rank}` : '–'}</span>Leaderboard</div>
          )}
        </section>

        {signedIn && unread > 0 && (
          <Link href="/community" className={styles.notice}>
            You have {unread} new Community notification{unread === 1 ? '' : 's'} →
          </Link>
        )}

        <p className={styles.sectionLabel}>JUMP TO</p>
        <section className={styles.links}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.linkCard}>
              <strong>{l.title}</strong>
              <span>{l.desc}</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
