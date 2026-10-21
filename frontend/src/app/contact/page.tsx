'use client';

import { useState } from 'react';
import styles from './Contact.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          message: fd.get('message'),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg: string = Array.isArray(data.message)
          ? data.message[0]
          : (data.message ?? 'Something went wrong. Please try again.');
        setErrorMsg(msg);
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Could not reach the server. Please check your connection.');
      setStatus('error');
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Contact Us</h1>

        {status === 'success' ? (
          <div className={styles.successBox}>
            <span className={styles.successIcon}>✓</span>
            <p className={styles.successTitle}>Message sent!</p>
            <p className={styles.successSub}>
              Thanks for reaching out — we&apos;ll get back to you soon.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.intro}>
              We&apos;d love to hear from you! Fill out the form below and we&apos;ll get back to you soon.
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label}>
                Name
                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  className={styles.input}
                  placeholder="Your name"
                />
              </label>
              <label className={styles.label}>
                Email
                <input
                  type="email"
                  name="email"
                  required
                  className={styles.input}
                  placeholder="you@email.com"
                />
              </label>
              <label className={styles.label}>
                Message
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  className={styles.input}
                  placeholder="Your message..."
                />
              </label>
              {status === 'error' && (
                <p className={styles.errorMsg}>{errorMsg}</p>
              )}
              <button
                type="submit"
                className={styles.button}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}