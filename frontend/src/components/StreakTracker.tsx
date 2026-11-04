"use client";
import { useState, useEffect } from 'react';
import StatIcon from './StatIcon';
import { api, ProfileResponse } from '@/lib/api';

// Flame heat: red (days 1-2), orange (3), blue (4), white-hot (5+)
function streakColor(days: number) {
  if (days <= 0) return '#64748b';
  if (days <= 2) return '#ef4444';
  if (days === 3) return '#fb923c';
  if (days === 4) return '#3b82f6';
  return '#f8fafc';
}

export default function StreakTracker({ streak: streakProp }: { streak?: number }) {
  const [streak, setStreak] = useState<number | null>(streakProp ?? null);

  useEffect(() => {
    if (streakProp !== undefined) { setStreak(streakProp); return; }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    api.get<ProfileResponse>('/api/profile')
      .then((data) => setStreak(data.streak))
      .catch(() => {});
  }, [streakProp]);

  if (streak === null) return null;
  const color = streakColor(streak);

  return (
    <span
      title={`${streak}-day streak`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color,
      }}
    >
      <StatIcon name="streak" size={14} muted={streak === 0} color={color} /> {streak}d
    </span>
  );
}
