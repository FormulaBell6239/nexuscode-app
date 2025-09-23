import styles from './Games.module.css';

export default function Games() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Coding Games & Challenges</h1>
        <p className={styles.subtitle}>
          Practice your skills with fun, interactive games. Earn points and climb the leaderboard!
        </p>
      </header>
      <section className={styles.gamesSection}>
        <h2 className={styles.sectionTitle}>Available Games</h2>
        <div className={styles.gamesGrid}>
          <div className={styles.gameCard}>
            <span className={styles.gameIcon}>🧠</span>
            <h3 className={styles.gameTitle}>Code Quiz</h3>
            <p className={styles.gameDesc}>Test your programming knowledge</p>
            <button className={styles.playButton}>Play</button>
          </div>
          <div className={styles.gameCard}>
            <span className={styles.gameIcon}>🐞</span>
            <h3 className={styles.gameTitle}>Debugging Challenge</h3>
            <p className={styles.gameDesc}>Find and fix code errors</p>
            <button className={styles.playButton}>Play</button>
          </div>
          <div className={styles.gameCard}>
            <span className={styles.gameIcon}>⚡</span>
            <h3 className={styles.gameTitle}>Speed Coding</h3>
            <p className={styles.gameDesc}>Solve problems against the clock</p>
            <button className={styles.playButton}>Play</button>
          </div>
          <div className={styles.gameCard}>
            <span className={styles.gameIcon}>🔗</span>
            <h3 className={styles.gameTitle}>Logic Puzzles</h3>
            <p className={styles.gameDesc}>Strengthen your problem-solving skills</p>
            <button className={styles.playButton}>Play</button>
          </div>
        </div>
      </section>
      <section className={styles.progressSection}>
        <h2 className={styles.sectionTitle}>Your Progress</h2>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '60%' }}></div>
        </div>
        <div className={styles.stats}>
          <span className={styles.stat}><strong>Level:</strong> 3</span>
          <span className={styles.stat}><strong>Badges:</strong> 5</span>
          <span className={styles.stat}><strong>Current Streak:</strong> 7 days</span>
        </div>
      </section>
    </main>
  );
}