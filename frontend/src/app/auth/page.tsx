"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.css';
import PageShell from '@/components/PageShell';
import { api, getProfile } from '@/lib/api';
import { startSession } from '@/lib/session';

interface AuthResponse {
  token: string;
  user: { id: number; username: string; email: string; plan: string };
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // If already logged in, skip the auth page
  useEffect(() => {
    if (localStorage.getItem('token')) router.replace('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    try {
      const session = isLogin
        ? await api.post<AuthResponse>('/api/auth/login', {
            identifier: formData.get('identifier'),
            password: formData.get('password'),
          })
        : await api.post<AuthResponse>('/api/auth/register', {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
          });

      startSession(session);
      try {
        const profile = await getProfile();
        localStorage.setItem('nexus_completed', JSON.stringify(profile.completedLessons ?? []));
      } catch {}

      if (isLogin) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Could not connect to server. Is the backend running?'
        : err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <PageShell />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.badge}>{isLogin ? 'Welcome back' : 'Get started'}</span>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>{isLogin ? 'Sign In' : 'Create Account'}</span>
          </h1>
          <p className={styles.subtitle}>
            {isLogin ? 'Log in to continue your learning streak.' : 'Join NexusCode and start building.'}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input type="text" name="username" required className={styles.input} placeholder="nexuscoder" minLength={3} maxLength={30} autoComplete="username" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input type="email" name="email" required className={styles.input} placeholder="you@example.com" autoComplete="email" />
              </div>
            </>
          )}
          {isLogin && (
            <div className={styles.field}>
              <label className={styles.label}>Email or Username</label>
              <input type="text" name="identifier" required className={styles.input} placeholder="you@example.com" autoComplete="username" />
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <input type={showPw ? 'text' : 'password'} name="password" required className={styles.input} placeholder="••••••••" minLength={isLogin ? 1 : 12} autoComplete={isLogin ? 'current-password' : 'new-password'} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {!isLogin && <p className={styles.hint}>Use at least 12 characters with uppercase, lowercase, a number, and a symbol.</p>}
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : (isLogin ? 'Sign In →' : 'Create Account →')}
          </button>
        </form>

        <button className={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
        </button>

        <div className={styles.divider}><span>or</span></div>

        <button
          type="button"
          className={styles.guestBtn}
          onClick={() => {
            localStorage.setItem('nexus_guest', 'true');
            router.push('/onboarding');
          }}
        >
          Continue as Guest
          <span className={styles.guestNote}>Progress won&apos;t be saved between sessions</span>
        </button>
      </div>
    </main>
  );
}