import styles from './Contact.module.css';

export default function Contact() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Contact Us</h1>
      <p className={styles.intro}>
        Have questions, feedback, or want to join our beta? Reach out to the NexusCode team!
      </p>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Contact Info</h2>
        <ul className={styles.infoList}>
          <li className={styles.infoItem}>📧 Email: <span className={styles.infoText}>support@nexuscode.app</span></li>
          <li className={styles.infoItem}>🐦 Twitter: <a href="https://twitter.com/NexusCodeApp" target="_blank" className={styles.link}>@NexusCodeApp</a></li>
          <li className={styles.infoItem}>💬 Discord: <a href="https://discord.gg/nexuscode" target="_blank" className={styles.link}>Join our community</a></li>
        </ul>
      </section>
      <section className={styles.cardAlt}>
        <h2 className={styles.sectionTitle}>Feedback Form</h2>
        <form className={styles.form}>
          <label className={styles.label}>
            Your Email:
            <input type="email" name="email" required className={styles.input} />
          </label>
          <label className={styles.label}>
            Message:
            <textarea name="message" required className={styles.input} />
          </label>
          <button type="submit" className={styles.button}>Send</button>
        </form>
      </section>
    </main>
  );
}