import React from 'react';

const badges = [
  { emoji: '🏅', label: 'Gold Medal' },
  { emoji: '🎯', label: 'Target Master' },
  { emoji: '🚀', label: 'Rocket Coder' },
  { emoji: '🧩', label: 'Puzzle Solver' },
];

export default function Achievements() {
  return (
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
            cursor: 'pointer'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.3) rotate(-10deg)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          {badge.emoji}
        </span>
      ))}
    </section>
  );
}