import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>NexusCode</Link>
      <ul className={styles.navLinks}>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/games">Games</Link></li>
        <li><Link href="/contact">Contact</Link></li>
        <li>
          <Link href="/auth" className={styles.loginLink}>Login/Register</Link>
        </li>
      </ul>
      <div className={styles.profile}>
        <span className={styles.streak}>🔥 7-day streak</span>
      </div>
    </nav>
  );
};

export default Navbar;