"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { endSession } from '@/lib/session';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const signOut = () => {
    endSession();
    router.push('/');
  };

  return (
    <main className={styles.main}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
      <div className={styles.dotGrid} />
      <h1 className={styles.title}>Settings</h1>

      {user && (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Account</p>
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
        </section>
      )}

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Session</p>
        {user ? (
          <button onClick={signOut} className={styles.signOutBtn}>
            Sign Out
          </button>
        ) : (
          <button onClick={() => router.push('/auth')} className={styles.signInBtn}>
            Sign In
          </button>
        )}
      </section>
    </main>
  );
}
