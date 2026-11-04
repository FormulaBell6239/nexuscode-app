'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './FeedbackButton.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const CATEGORIES = [
  { id: 'bug', label: 'Bug' },
  { id: 'idea', label: 'Idea' },
  { id: 'other', label: 'Other' },
] as const;

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<'bug' | 'idea' | 'other'>('bug');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const close = () => {
    setOpen(false);
    setState('idle');
  };

  const send = async () => {
    setState('sending');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ category, message: message.trim(), page: pathname }),
      });
      if (!res.ok) throw new Error();
      setMessage('');
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen(true)} aria-label="Send feedback">
        Feedback
      </button>
      {open && (
        <div className={styles.backdrop} onClick={close}>
          <div className={styles.modal} role="dialog" aria-label="Send feedback" onClick={(e) => e.stopPropagation()}>
            <button className={styles.close} onClick={close} aria-label="Close">✕</button>
            {state === 'done' ? (
              <>
                <h3 className={styles.title}>Thanks!</h3>
                <p className={styles.text}>Your feedback was sent. It really helps during the beta.</p>
                <button className={styles.send} onClick={close}>Done</button>
              </>
            ) : (
              <>
                <h3 className={styles.title}>Beta feedback</h3>
                <div className={styles.cats}>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      className={`${styles.cat} ${category === c.id ? styles.catOn : ''}`}
                      onClick={() => setCategory(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className={styles.area}
                  value={message}
                  maxLength={2000}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What happened, or what would you like to see?"
                  rows={5}
                />
                {state === 'error' && <p className={styles.err}>Couldn&apos;t send. Please try again.</p>}
                <button className={styles.send} disabled={message.trim().length < 5 || state === 'sending'} onClick={send}>
                  {state === 'sending' ? 'Sending…' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
