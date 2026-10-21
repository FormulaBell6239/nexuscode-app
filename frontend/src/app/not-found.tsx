import Link from 'next/link';
import PageShell from '@/components/PageShell';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.sub}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className={styles.btn}>← Back to home</Link>
      </div>
    </main>
  );
}
