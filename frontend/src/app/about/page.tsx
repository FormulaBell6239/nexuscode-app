import styles from './About.module.css';
import PageShell from '@/components/PageShell';

const WHY = [
  { icon: '◈', title: 'Streaks & Badges',    desc: 'Stay motivated with daily streaks, milestone badges, and XP that tracks your progress.' },
  { icon: '◎', title: 'Games, Not Lectures', desc: 'Every lesson is a playable challenge. You learn by doing, not by watching slides.' },
  { icon: '⟁', title: 'Real Skills',         desc: 'From HTML to algorithms — content built to match what real developers actually use.' },
];

const TEAM = [
  { name: 'Jordan', role: 'Lead Engineer',   avatar: '🧑‍💻' },
  { name: 'Sam',    role: 'Curriculum Lead', avatar: '🧑‍🏫' },
  { name: 'Alex',   role: 'Product Design',  avatar: '🧑‍🎨' },
];

export default function About() {
  return (
    <main className={styles.main}>
      <PageShell />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>About Us</h1>
          <p className={styles.subtitle}>Learn more about our mission and team.</p>
        </header>

        <section className={styles.featureGrid}>
          {WHY.map((w, i) => (
            <div key={i} className={styles.featureCard}>
              <span className={styles.featureIcon}>{w.icon}</span>
              <h3 className={styles.featureTitle}>{w.title}</h3>
              <p className={styles.featureDesc}>{w.desc}</p>
            </div>
          ))}
        </section>

        <section className={styles.teamSection}>
          <h2>Our Team</h2>
          <div className={styles.teamGrid}>
            {TEAM.map((member, i) => (
              <div key={i} className={styles.teamCard}>
                <div className={styles.avatar}>{member.avatar}</div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
