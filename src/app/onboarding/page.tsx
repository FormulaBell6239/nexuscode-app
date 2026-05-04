import styles from './Onboarding.module.css';

export default function Onboarding() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>👋 Welcome to NexusCode!</h1>
      <p className={styles.intro}>
        Ready to start your coding adventure? Here’s how it works:
      </p>
      <ol className={styles.steps}>
        <li>Complete daily challenges to build your streak</li>
        <li>Earn badges and level up as you learn</li>
        <li>Compete with friends on the leaderboard</li>
        <li>Unlock new games and lessons as you progress</li>
      </ol>
      <button className={styles.startBtn}>Let’s Go!</button>
    </main>
  );
}