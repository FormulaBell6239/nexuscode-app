"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import Achievements from './Achievements';

const Navbar: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>NexusCode</Link>
      <ul className={styles.navLinks}>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/games">Games</Link></li>
        <li><Link href="/auth" className={styles.loginLink}>Login/Register</Link></li>
        <li
          className={styles.dropdown}
        >
          <span
            className={styles.dropdownToggle}
            onClick={() => setDropdownOpen((open) => !open)}
          >
            More <span style={{fontSize: '1.2em', marginLeft: '0.3em'}}>▼</span>
          </span>
          {dropdownOpen && (
            <ul
              className={styles.dropdownMenu}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <li><Link href="/profile">Profile</Link></li>
              <li><Link href="/leaderboard">Leaderboard</Link></li>
              <li><Link href="/achievements">Achievements</Link></li>
              <li><Link href="/onboarding">Onboarding</Link></li>
              <li className={styles.divider}></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>
          )}
        </li>
      </ul>
      {/* <div className={styles.profile}>
        <span className={styles.streak}>🔥 7-day streak</span>
      </div> */}
    </nav>
  );
};

export default Navbar;