'use client';

import { useState } from 'react';
import styles from './CheatSheet.module.css';

type Group = { title: string; colors: [string, string][] };

const GROUPS: Group[] = [
  { title: 'Basics', colors: [['Black', '#000000'], ['White', '#ffffff'], ['Gray', '#808080'], ['Light Gray', '#d3d3d3'], ['Dark Gray', '#333333'], ['Silver', '#c0c0c0']] },
  { title: 'Reds & Pinks', colors: [['Red', '#ff0000'], ['Crimson', '#dc143c'], ['Dark Red', '#8b0000'], ['Tomato', '#ff6347'], ['Salmon', '#fa8072'], ['Pink', '#ffc0cb'], ['Hot Pink', '#ff69b4'], ['Deep Pink', '#ff1493']] },
  { title: 'Oranges & Yellows', colors: [['Orange', '#ffa500'], ['Dark Orange', '#ff8c00'], ['Coral', '#ff7f50'], ['Gold', '#ffd700'], ['Yellow', '#ffff00'], ['Khaki', '#f0e68c']] },
  { title: 'Greens', colors: [['Green', '#008000'], ['Lime', '#00ff00'], ['Forest Green', '#228b22'], ['Sea Green', '#2e8b57'], ['Light Green', '#90ee90'], ['Olive', '#808000'], ['Teal', '#008080'], ['Mint', '#98ff98']] },
  { title: 'Blues & Cyans', colors: [['Blue', '#0000ff'], ['Navy', '#000080'], ['Royal Blue', '#4169e1'], ['Sky Blue', '#87ceeb'], ['Dodger Blue', '#1e90ff'], ['Light Blue', '#add8e6'], ['Cyan', '#00ffff'], ['Turquoise', '#40e0d0']] },
  { title: 'Purples', colors: [['Purple', '#800080'], ['Indigo', '#4b0082'], ['Violet', '#ee82ee'], ['Orchid', '#da70d6'], ['Lavender', '#e6e6fa'], ['Magenta', '#ff00ff']] },
  { title: 'Browns & Neutrals', colors: [['Brown', '#a52a2a'], ['Chocolate', '#d2691e'], ['Tan', '#d2b48c'], ['Beige', '#f5f5dc'], ['Ivory', '#fffff0'], ['Maroon', '#800000']] },
];

export default function ColorTable({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState('');

  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied(c => (c === hex ? '' : c)), 1200);
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="CSS color table" onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.head}>
          <div>
            <span className={styles.kicker}>CSS COLORS</span>
            <h2 className={styles.title}>Color <span>Table</span></h2>
            <p className={styles.hint}>Click a color to copy its hex code, then paste it into your CSS, e.g. <code>color: #ff0000;</code> (a color name like <code>red</code> works too).</p>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close color table">✕</button>
        </div>
        <div className={styles.grid}>
          {GROUPS.map(g => (
            <section key={g.title} className={styles.card} style={{ ['--c' as string]: '#36e4ff' }}>
              <h3 className={styles.cardTitle}>{g.title}</h3>
              {g.colors.map(([name, hex]) => (
                <button key={hex} className={styles.colorRow} onClick={() => copy(hex)} title={`Copy ${hex}`}>
                  <span className={styles.swatch} style={{ background: hex }} />
                  <span className={styles.colorName}>{name}</span>
                  <code className={styles.colorHex}>{copied === hex ? 'Copied!' : hex}</code>
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
