import { useId } from 'react';
import styles from './SingularityArt.module.css';

type Kind = 'pinpoint' | 'accretion' | 'gravitywell' | 'eventhorizon' | 'core';

const ORBITERS = [0, 1, 2, 3, 4];

export default function SingularityArt({ kind }: { kind: Kind }) {
  const uid = useId().replace(/:/g, '');

  if (kind === 'pinpoint') {
    return (
      <svg className={`${styles.svg} ${styles.slate}`} viewBox="0 0 24 24" aria-hidden="true">
        <circle className={styles.pulse} cx="12" cy="12" r="9" fill="none" stroke="#94a3b8" strokeWidth="0.6" />
        <circle className={`${styles.pulse} ${styles.delay}`} cx="12" cy="12" r="9" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
        <circle className={styles.breathe} cx="12" cy="12" r="2.2" fill="#f8fafc" />
        <circle cx="12" cy="12" r="4" fill="#94a3b8" opacity="0.18" />
      </svg>
    );
  }

  if (kind === 'accretion') {
    return (
      <svg className={`${styles.svg} ${styles.orange}`} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <radialGradient id={`acc${uid}`}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.55" stopColor="#000" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="8.5" fill={`url(#acc${uid})`} />
        <g className={styles.spinFast}>
          <ellipse cx="12" cy="12" rx="9" ry="3.2" fill="none" stroke="#fdba74" strokeWidth="1.1" strokeDasharray="14 5 4 6" />
        </g>
        <g className={styles.spinSlow}>
          <ellipse cx="12" cy="12" rx="9" ry="3.2" fill="none" stroke="#ea580c" strokeWidth="0.8" strokeDasharray="6 8" transform="rotate(60 12 12)" />
        </g>
        <circle cx="12" cy="12" r="3" fill="#050202" stroke="#fdba74" strokeWidth="0.8" />
      </svg>
    );
  }

  if (kind === 'gravitywell') {
    return (
      <svg className={`${styles.svg} ${styles.violet}`} viewBox="0 0 24 24" aria-hidden="true">
        {[10, 7.4, 5, 3].map((r, i) => (
          <circle key={r} className={styles.well} style={{ animationDelay: `${i * -0.5}s` }} cx="12" cy="12" r={r} fill="none" stroke={i % 2 ? '#8b5cf6' : '#c4b5fd'} strokeWidth="0.9" />
        ))}
        {ORBITERS.slice(0, 3).map((i) => (
          <g key={i} className={styles.orbit} style={{ animationDuration: `${3 + i * 1.3}s`, animationDelay: `${i * -0.9}s` }}>
            <circle cx={12 + 3.2 + i * 2.4} cy="12" r="0.9" fill="#ede9fe" />
          </g>
        ))}
        <circle cx="12" cy="12" r="1.6" fill="#fff" className={styles.breathe} />
      </svg>
    );
  }

  if (kind === 'eventhorizon') {
    return (
      <svg className={`${styles.svg} ${styles.magenta}`} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <radialGradient id={`eh${uid}`}>
            <stop offset="0.62" stopColor="#000" />
            <stop offset="0.8" stopColor="#c026d3" stopOpacity="0.9" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className={styles.breathe} cx="12" cy="12" r="11" fill={`url(#eh${uid})`} />
        <g className={styles.spinSlow}>
          <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" fill="none" stroke="#f0abfc" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M12 21.5A9.5 9.5 0 0 1 2.5 12" fill="none" stroke="#f0abfc" strokeWidth="1.3" strokeLinecap="round" />
        </g>
        <g className={styles.spinRev}>
          <path d="M20 8A9 9 0 0 0 16 4" fill="none" stroke="#e879f9" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M4 16a9 9 0 0 0 4 4" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeLinecap="round" />
        </g>
        <circle cx="12" cy="12" r="5.2" fill="#02000a" stroke="#fdf4ff" strokeWidth="0.7" />
        <circle className={styles.photon} cx="12" cy="12" r="5.2" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="2.2 30.5" />
      </svg>
    );
  }

  return (
    <svg className={`${styles.svg} ${styles.gold}`} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id={`core${uid}`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={styles.spinSlow}>
        {[0, 45, 90, 135].map((a) => (
          <path key={a} d="M12 0.5v23" stroke="#fde047" strokeWidth="0.7" opacity="0.7" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
      <g className={styles.spinRev}>
        {[22.5, 67.5, 112.5, 157.5].map((a) => (
          <path key={a} d="M12 3v18" stroke="#f59e0b" strokeWidth="0.5" opacity="0.6" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
      <circle className={styles.pulse} cx="12" cy="12" r="9.5" fill="none" stroke="#facc15" strokeWidth="0.8" />
      <circle className={`${styles.pulse} ${styles.delay}`} cx="12" cy="12" r="9.5" fill="none" stroke="#fff" strokeWidth="0.6" />
      <circle className={styles.breathe} cx="12" cy="12" r="7" fill={`url(#core${uid})`} />
      <circle cx="12" cy="12" r="2.4" fill="#fff" />
    </svg>
  );
}
