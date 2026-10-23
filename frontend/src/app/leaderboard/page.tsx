"use client";
import React, { useState, useEffect } from 'react';
import StatIcon from "@/components/StatIcon";
import styles from './Leaderboard.module.css';
import PageShell from '@/components/PageShell';
import { api } from '@/lib/api';
import EmblemAvatar from '@/components/EmblemAvatar';

function Avatar({ value }: { value: string }) {
  return <EmblemAvatar value={value} className={styles.emblemAvatar} />;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
}

const PODIUM_META = [
  { label: '1st', color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.50)', height: 88 },
  { label: '2nd', color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', border: 'rgba(148,163,184,0.40)', height: 64 },
  { label: '3rd', color: '#b45309', glow: 'rgba(180,83,9,0.25)',   border: 'rgba(180,83,9,0.40)',   height: 48 },
];

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<LeaderboardEntry[]>('/api/leaderboard?limit=10')
      .then(setUsers)
      .catch(() => setError('Could not load leaderboard. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  // podium display order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumMeta  = [PODIUM_META[1], PODIUM_META[0], PODIUM_META[2]];

  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>◈ RANKINGS</div>
          <h1 className={styles.title}><span className={styles.titleGradient}>Leaderboard</span></h1>
          <p className={styles.subtitle}>See who&apos;s crushing their coding streaks!</p>
        </header>

        {loading && <p className={styles.msg}>Loading…</p>}
        {error   && <p className={styles.msgError}>{error}</p>}
        {!loading && !error && users.length === 0 && (
          <p className={styles.msg}>No players yet. Complete lessons to get on the board!</p>
        )}

        {users.length > 0 && (
          <>
            {/* ── Podium (top 3) ── */}
            <div className={styles.podium}>
              {podiumOrder.map((user, i) => {
                const meta = podiumMeta[i];
                const isFirst = user.rank === 1;
                return (
                  <div
                    key={user.rank}
                    className={`${styles.podiumCard} ${isFirst ? styles.podiumFirst : ''}`}
                    style={{ '--pc': meta.color, '--pg': meta.glow, '--pb': meta.border } as React.CSSProperties}
                  >
                    {isFirst && <div className={styles.podiumCrown}>👑</div>}
                    <div className={styles.podiumAvatar}><Avatar value={user.avatar} /></div>
                    <span className={styles.podiumName}>{user.username}</span>
                    <span className={styles.podiumXp}>{user.xp.toLocaleString()} XP</span>
                    <div className={styles.podiumRankBadge} style={{ height: meta.height }}>
                      <span className={styles.podiumRankLabel}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Rest of list ── */}
            {rest.length > 0 && (
              <>
                <div className={styles.listDivider} />
                <div className={styles.listCard}>
                  {rest.map((user) => (
                    <div key={user.rank} className={styles.listRow}>
                      <span className={styles.listRank}>#{user.rank}</span>
                      <span className={styles.listAvatar}><Avatar value={user.avatar} /></span>
                      <span className={styles.listName}>{user.username}</span>
                      <div className={styles.listRight}>
                        <span className={styles.listXp}>{user.xp.toLocaleString()} XP</span>
                        <span className={styles.listMeta}>Lv.{user.level} · <StatIcon name="streak" size={12} /> {user.streak}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

