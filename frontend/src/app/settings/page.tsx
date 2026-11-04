"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { endSession, clearUserData } from '@/lib/session';
import PageShell from '@/components/PageShell';
import styles from './Settings.module.css';

type StoredUser = { username?: string; email?: string };

const SHORTCUTS = [
  { href: '/profile', title: 'Edit profile', desc: 'Change your name, emblem, bio and banner.' },
  { href: '/upgrade', title: 'Plan & upgrade', desc: 'See your plan and available upgrades.' },
  { href: '/achievements', title: 'Achievements', desc: 'Review the badges you have earned.' },
  { href: '/contact', title: 'Contact & support', desc: 'Get help or send us feedback.' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const signOut = () => {
    endSession();
    router.push('/');
  };

  const resetLocal = () => {
    clearUserData();
    setConfirmReset(false);
    setResetDone(true);
  };

  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.ambient} aria-hidden="true" />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.eyebrow}><span className={styles.dot} /> ACCOUNT</div>
          <h1 className={styles.title}>Sett<span>ings</span></h1>
          <p className={styles.subtitle}>Manage your account, shortcuts and saved data.</p>
        </header>

        <section className={styles.panel}>
          <p className={styles.sectionLabel}>Account</p>
          {user ? (
            <>
              <div className={styles.identity}>
                <span className={styles.avatar}>{(user.username ?? '?').charAt(0).toUpperCase()}</span>
                <div>
                  <div className={styles.name}>{user.username ?? '—'}</div>
                  {user.email && <div className={styles.email}>{user.email}</div>}
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Username</span>
                <span className={styles.infoVal}>{user.username ?? '—'}</span>
              </div>
              {user.email && (
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Email</span>
                  <span className={styles.infoVal}>{user.email}</span>
                </div>
              )}
            </>
          ) : (
            <p className={styles.note}>You are not signed in. Sign in to save progress and use the Community and AI.</p>
          )}
        </section>

        <section className={styles.panel}>
          <p className={styles.sectionLabel}>Shortcuts</p>
          <div className={styles.shortcutGrid}>
            {SHORTCUTS.map((s) => (
              <Link key={s.href} href={s.href} className={styles.shortcut}>
                <span className={styles.shortcutTitle}>{s.title}</span>
                <span className={styles.shortcutDesc}>{s.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <p className={styles.sectionLabel}>Saved data</p>
          <p className={styles.note}>
            Lesson progress, playground drafts and banner choices are cached in this browser. Clearing them does not delete your account.
          </p>
          {resetDone && <p className={styles.success} role="status">Local data cleared.</p>}
          {confirmReset ? (
            <div className={styles.row}>
              <button type="button" onClick={resetLocal} className={styles.dangerBtn}>Yes, clear it</button>
              <button type="button" onClick={() => setConfirmReset(false)} className={styles.ghostBtn}>Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => { setConfirmReset(true); setResetDone(false); }} className={styles.ghostBtn}>
              Clear local data
            </button>
          )}
        </section>

        <section className={styles.panel}>
          <p className={styles.sectionLabel}>Session</p>
          {user ? (
            <button type="button" onClick={signOut} className={styles.dangerBtn}>Sign Out</button>
          ) : (
            <button type="button" onClick={() => router.push('/auth')} className={styles.primaryBtn}>Sign In</button>
          )}
        </section>
      </div>
    </main>
  );
}
