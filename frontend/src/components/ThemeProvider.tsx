'use client';
import { useEffect } from 'react';
import { getProfile } from '@/lib/api';

export default function ThemeProvider() {
  useEffect(() => {
    // 1. Apply saved theme immediately from localStorage (no flash)
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.dataset.theme = saved;
    }

    // 2. Sync with server profile in background
    const token = localStorage.getItem('token');
    if (!token) return;
    getProfile()
      .then(profile => {
        // The account is the source of truth, so a theme only changes when the user applies one
        if (profile.theme && profile.theme !== 'default') {
          document.documentElement.dataset.theme = profile.theme;
          localStorage.setItem('theme', profile.theme);
        } else {
          delete document.documentElement.dataset.theme;
          localStorage.removeItem('theme');
        }
      })
      .catch(() => {/* ignore — theme already applied from localStorage */});
  }, []);

  return null;
}
