import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome to NexusCode!</h1>
        <p className={styles.subtitle}>
          Level up your coding skills with interactive lessons, fun games, and real progress tracking.
        </p>
      </header>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Features</h2>
        <ul className={styles.featureList}>
          <li className={styles.featureItem}>🎯 <span className={styles.featureText}>Daily coding challenges</span></li>
          <li className={styles.featureItem}>🏆 <span className={styles.featureText}>Earn badges and achievements</span></li>
          <li className={styles.featureItem}>📈 <span className={styles.featureText}>Track your learning streak</span></li>
          <li className={styles.featureItem}>🧩 <span className={styles.featureText}>Unlock new lessons and levels</span></li>
          <li className={styles.featureItem}>🤝 <span className={styles.featureText}>Compete with friends on leaderboards</span></li>
        </ul>
      </section>
      <section className={styles.cardAlt}>
        <h2 className={styles.sectionTitle}>Get Started</h2>
        <p className={styles.ctaText}>
          <strong>Sign up</strong> to begin your coding adventure and start earning rewards!
        </p>
        <button className={styles.button}>Start Learning</button>
      </section>
      <footer className={styles.footer}>
        <span className={styles.footerText}>🚀 NexusCode &copy; 2025</span>
      </footer>
    </main>
  );
}