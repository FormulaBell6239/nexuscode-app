import { useId } from 'react';
import styles from './DatamoshArt.module.css';

export default function DatamoshArt() {
  const uid = useId().replace(/:/g, '');
  const shape = (
    <>
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" />
      <path d="M8 9.5h8v5H8z" />
    </>
  );
  return (
    <svg className={styles.moshSvg} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id={`moshTop${uid}`}><rect x="0" y="0" width="24" height="9" /></clipPath>
        <clipPath id={`moshMid${uid}`}><rect x="0" y="9" width="24" height="5" /></clipPath>
        <clipPath id={`moshBot${uid}`}><rect x="0" y="14" width="24" height="10" /></clipPath>
      </defs>
      <g className={styles.moshRed} fill="none" stroke="#ff2e63" strokeWidth="1.4" strokeLinejoin="round">{shape}</g>
      <g className={styles.moshCyan} fill="none" stroke="#08f7fe" strokeWidth="1.4" strokeLinejoin="round">{shape}</g>
      <g fill="rgba(196,181,253,0.18)" stroke="#e9e3ff" strokeWidth="1.3" strokeLinejoin="round">
        <g clipPath={`url(#moshTop${uid})`}>{shape}</g>
        <g clipPath={`url(#moshMid${uid})`} className={styles.moshSlice}>{shape}</g>
        <g clipPath={`url(#moshBot${uid})`}>{shape}</g>
      </g>
      <path d="M2 11h4M18 13h4M5 18h3" stroke="#fcee0a" strokeWidth="1" strokeLinecap="round" className={styles.moshBits} />
    </svg>
  );
}
