import React, { useState } from 'react';
import RewardPopup from './RewardPopup';

const badges = [
  { emoji: '🏅', label: 'Gold Medal' },
  { emoji: '🎯', label: 'Target Master' },
  { emoji: '🚀', label: 'Rocket Coder' },
  { emoji: '🧩', label: 'Puzzle Solver' },
];

export default function Achievements() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [popup, setPopup] = useState<{open: boolean, badge?: typeof badges[0]}>(() => ({open: false}));

  // Simulate unlocking a badge (replace with your real logic)
  const unlockBadge = (badge: typeof badges[0]) => {
    if (!unlocked.includes(badge.label)) {
      setUnlocked([...unlocked, badge.label]);
      setPopup({ open: true, badge });
    }
  };

  return (
    <>
      <section style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        margin: '1rem 0'
      }}>
        {badges.map(badge => (
          <span
            key={badge.label}
            title={badge.label}
            style={{
              fontSize: '2rem',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              opacity: unlocked.includes(badge.label) ? 1 : 0.5
            }}
            onClick={() => unlockBadge(badge)}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.3) rotate(-10deg)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
          >
            {badge.emoji}
          </span>
        ))}
      </section>
      <RewardPopup
        open={popup.open}
        onClose={() => setPopup({ open: false })}
        title="Achievement Unlocked!"
        description={popup.badge ? popup.badge.label : ""}
        icon={popup.badge ? popup.badge.emoji : ""}
      />
    </>
  );
}