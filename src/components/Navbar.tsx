"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>NexusCode</Link>
      <div className={styles.spacer}></div>
      <ul className={`${styles.navLinks} ${isHome ? styles.homeNavLinks : ""}`}>
        {!isHome && (
          <li><Link href="/">Home</Link></li>
        )}
        <li><Link href="/games">Games</Link></li>
        <li><Link href="/curriculum">Curriculum</Link></li>
        {isHome && (
          <li><Link href="/auth" className={styles.loginLink}>Login/Register</Link></li>
        )}
        <li className={styles.dropdown}>
          <button
            className={styles.dropdownToggle}
            onClick={() => setDropdownOpen(open => !open)}
            onBlur={() => setDropdownOpen(false)}
            aria-label="Open menu"
          >
            {"<>"} <span style={{fontSize: '1.2em', marginLeft: '0.3em'}}>▼</span>
          </button>
          {dropdownOpen && (
            <ul className={styles.dropdownMenu}>
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
    </nav>
  );
};

export default Navbar;