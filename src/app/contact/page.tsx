import styles from './Contact.module.css';

export default function Contact() {
  return (
    <div className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.intro}>
          We'd love to hear from you! Fill out the form below and we'll get back to you soon.
        </p>
        <form className={styles.form}>
          <label className={styles.label}>
            Name
            <input type="text" className={styles.input} placeholder="Your name" />
          </label>
          <label className={styles.label}>
            Email
            <input type="email" className={styles.input} placeholder="you@email.com" />
          </label>
          <label className={styles.label}>
            Message
            <textarea className={styles.input} rows={4} placeholder="Your message..." />
          </label>
          <button type="submit" className={styles.button}>Send Message</button>
        </form>
      </div>
    </div>
  );
}