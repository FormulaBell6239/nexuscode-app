import styles from './GlitchedArt.module.css';

// Animated art for the glitched emblems (Datamosh lives in DatamoshArt).
const NOISE_ROWS = [4, 7, 10, 13, 16, 19];

function Static() {
  return (
    <svg className={styles.svg} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(203,213,225,0.08)" stroke="#cbd5e1" strokeWidth="1.2" />
      {NOISE_ROWS.map((y, i) => (
        <g key={y} className={styles.noiseRow} style={{ animationDelay: `${i * -0.37}s` }}>
          <rect x="5" y={y - 1} width="14" height="1.6" fill="#cbd5e1" />
          <rect x="5" y={y - 1} width="5" height="1.6" fill="#f43f5e" opacity="0.9" />
          <rect x="14" y={y - 1} width="5" height="1.6" fill="#22d3ee" opacity="0.9" />
        </g>
      ))}
      <rect x="3" y="3" width="18" height="2.2" fill="#ffffff" opacity="0.5" className={styles.roll} />
    </svg>
  );
}

function Scanline() {
  return (
    <svg className={`${styles.svg} ${styles.green}`} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" fill="rgba(16,185,129,0.1)" stroke="#6ee7b7" strokeWidth="1.2" className={styles.crt} />
      <path d="M5 8h14M5 11h14M5 14h14" stroke="#6ee7b7" strokeWidth="0.5" opacity="0.45" />
      <path d="M9 20h6M12 17v3" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round" />
      <g className={styles.beam}>
        <rect x="3.6" y="4.6" width="16.8" height="3" fill="#a3e635" opacity="0.28" />
        <rect x="3.6" y="5.6" width="16.8" height="0.9" fill="#22d3ee" />
      </g>
    </svg>
  );
}

function Corrupt() {
  return (
    <svg className={`${styles.svg} ${styles.pink}`} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="1.5" fill="rgba(219,39,119,0.1)" stroke="#f9a8d4" strokeWidth="1.2" />
      <g className={styles.xA}><path d="M7.5 7.5 11 11" stroke="#f9a8d4" strokeWidth="1.6" strokeLinecap="round" /><path d="M13 13l3.5 3.5" stroke="#f9a8d4" strokeWidth="1.6" strokeLinecap="round" /></g>
      <g className={styles.xB}><path d="M16.5 7.5 13 11" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" /><path d="M11 13l-3.5 3.5" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" /></g>
      <rect className={styles.blockA} x="15" y="3" width="4" height="3" fill="#22d3ee" />
      <rect className={styles.blockB} x="4" y="16" width="5" height="2.5" fill="#facc15" />
      <rect className={styles.blockC} x="10" y="9.5" width="6" height="1.6" fill="#f9a8d4" />
    </svg>
  );
}

function NullPointer() {
  return (
    <svg className={`${styles.svg} ${styles.gold}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className={styles.ring} cx="12" cy="12" r="8.5" fill="none" stroke="#fde68a" strokeWidth="1.3" strokeDasharray="10 4 3 4" />
      <g className={styles.slashRed}><path d="M6.5 17.5 17.5 6.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /></g>
      <g className={styles.slashBlue}><path d="M6.5 17.5 17.5 6.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" /></g>
      <path d="M6.5 17.5 17.5 6.5" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" className={styles.slash} />
      <text x="12" y="3.4" textAnchor="middle" fontSize="3.4" fill="#fde68a" fontFamily="monospace" className={styles.addr}>0x0</text>
    </svg>
  );
}

export default function GlitchedArt({ kind }: { kind: 'static' | 'scanline' | 'corrupt' | 'null' }) {
  if (kind === 'static') return <Static />;
  if (kind === 'scanline') return <Scanline />;
  if (kind === 'corrupt') return <Corrupt />;
  return <NullPointer />;
}
