"use client";
import { useState, useEffect } from 'react';
import { api, ProfileResponse } from '@/lib/api';

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

  return (
    <span
      title={`${streak}-day streak`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: streak > 0 ? '#f59e0b' : '#64748b',
      }}
    >
      🔥 {streak}d
    </span>
  );
}
