// filepath: src/app/about/page.tsx
import styles from './About.module.css';

export default function About() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>About NexusCode</h1>
      <p className={styles.intro}>
        NexusCode is a hands-on, gamified coding learning app inspired by Mimo and Duolingo.
        Our mission is to make programming fun, interactive, and accessible for everyone.
      </p>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Why Gamified Learning?</h2>
        <ul className={styles.featureList}>
          <li className={styles.featureItem}>🎯 Motivates you with streaks, badges, and levels</li>
          <li className={styles.featureItem}>🕹️ Turns coding practice into a game</li>
          <li className={styles.featureItem}>💡 Helps you build real skills through challenges</li>
        </ul>
      </section>
      <section className={styles.cardAlt}>
        <h2 className={styles.sectionTitle}>Meet the Team</h2>
        <p className={styles.teamText}>
          We’re passionate educators and developers who believe anyone can learn to code!
        </p>
      </section>
    </main>
  );
}