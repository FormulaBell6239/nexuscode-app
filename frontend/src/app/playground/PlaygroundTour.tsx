'use client';

import { useEffect, useState } from 'react';
import styles from './Playground.module.css';

type Props = { target: string; text: string; title: string; onSkip: () => void; onDone?: () => void };

// Pulses a ring around the element tagged data-tour="<target>" and points a callout at it.
export default function PlaygroundTour({ target, text, title, onSkip, onDone }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    const id = setInterval(update, 250);
    window.addEventListener('resize', update);
    return () => { clearInterval(id); window.removeEventListener('resize', update); };
  }, [target]);

  if (!rect) return null;

  const below = rect.bottom + 150 < window.innerHeight;
  const width = Math.min(300, window.innerWidth - 24);
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const top = below ? rect.bottom + 14 : Math.max(12, rect.top - 14);

  return (
    <>
      <div
        className={styles.tourRing}
        style={{ left: rect.left - 5, top: rect.top - 5, width: rect.width + 10, height: rect.height + 10 }}
      />
      <div
        className={styles.tourCallout}
        role="status"
        style={{ left, top, width, transform: below ? 'none' : 'translateY(-100%)' }}
      >
        <strong className={styles.tourTitle}>{title}</strong>
        <p className={styles.tourText}>{text}</p>
        <div className={styles.introActions}>
          {onDone && <button className={styles.introPrimary} onClick={onDone}>Got it</button>}
          <button className={styles.introGhost} onClick={onSkip}>{onDone ? 'Close' : 'Skip tour'}</button>
        </div>
      </div>
    </>
  );
}
