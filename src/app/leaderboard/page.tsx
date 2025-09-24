"use client";
import React, { useState } from 'react';
import styles from './Leaderboard.module.css';

const mockData = [
  { name: 'Alice', streak: 21, badges: 12, avatar: '🦸‍♀️' },
  { name: 'Bob', streak: 18, badges: 10, avatar: '🧑‍💻' },
  { name: 'Charlie', streak: 15, badges: 8, avatar: '🦸‍♂️' },
];

export default function Leaderboard() {
  const [users] = useState(mockData);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>🏆 Leaderboard</h1>
      <p className={styles.subtitle}>See who’s crushing their coding streaks!</p>
      <ul className={styles.list}>
        {users.map((user, i) => (
          <li key={user.name} className={styles.item}>
            <span className={styles.rank}>{i + 1}</span>
            <span className={styles.avatar}>{user.avatar}</span>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.streak}>🔥 {user.streak} days</span>
            <span className={styles.badges}>🏅 {user.badges}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}