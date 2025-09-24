import Achievements from '@/components/Achievements';
import styles from './Achievements.module.css';

const achievementsData = [
  { name: 'Gold Medal', description: 'Awarded for top performance', icon: '🏅', earned: true },
  { name: 'Target Master', description: 'Hit 100 coding targets', icon: '🎯', earned: true },
  { name: 'Rocket Coder', description: 'Completed 50 challenges', icon: '🚀', earned: false },
  { name: 'Puzzle Solver', description: 'Solved 25 puzzles', icon: '🧩', earned: true },
];

export default function AchievementsPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>🎉 Achievements</h1>
      <p className={styles.subtitle}>Collect badges by reaching milestones and completing challenges!</p>
      <ul className={styles.list}>
        {achievementsData.map((ach, i) => (
          <li key={ach.name} className={styles.item + ' ' + (ach.earned ? styles.earned : styles.locked)}>
            <span className={styles.icon}>{ach.icon}</span>
            <span className={styles.name}>{ach.name}</span>
            <span className={styles.desc}>{ach.description}</span>
            <span className={styles.status}>
              {ach.earned ? '✅ Earned' : '🔒 Locked'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}