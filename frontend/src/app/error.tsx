'use client';

import { useEffect } from 'react';
import PageShell from '@/components/PageShell';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.card}>
        <span className={styles.icon}>⚠</span>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.sub}>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button onClick={reset} className={styles.btn}>
          Try again
        </button>
      </div>
    </main>
  );
}
