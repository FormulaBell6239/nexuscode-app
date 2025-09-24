'use client';
import { useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  return (
    <button
      aria-label="Toggle dark mode"
      style={{
        background: dark ? '#222' : '#e3f2fd',
        color: dark ? '#ffd700' : '#0070f3',
        borderRadius: '999px',
        padding: '0.6rem 1.4rem',
        border: 'none',
        fontWeight: 600,
        fontSize: '1.1rem',
        boxShadow: '0 2px 8px rgba(0,112,243,0.10)',
        cursor: 'pointer',
        transition: 'background 0.2s, color 0.2s'
      }}
      onClick={() => setDark(d => !d)}
    >
      {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}