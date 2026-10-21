"use client";
import Link from 'next/link';
import styles from './More.module.css';

const MORE_LINKS = [
  { href: '/achievements', icon: '🏅', label: 'Achievements',  desc: 'Track your milestones' },
  { href: '/leaderboard',  icon: '◆',  label: 'Leaderboard',   desc: "See who's on top"       },
  { href: '/roadmap',      icon: '⬡',  label: 'Nexus Path',    desc: 'Your learning roadmap' },
  { href: '/playground',   icon: '⌥',  label: 'Playground',    desc: 'Free-form coding space' },
  { href: '/about',        icon: '◉',  label: 'About',         desc: 'About NexusCode'        },
  { href: '/contact',      icon: '✉',  label: 'Contact',       desc: 'Get in touch'           },
  { href: '/settings',     icon: '⚙',  label: 'Settings',      desc: 'Account & preferences'  },
];

export default function MorePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>More</h1>
      <div className={styles.list}>
        {MORE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.row}>
            <span className={styles.icon}>{link.icon}</span>
            <div className={styles.text}>
              <span className={styles.label}>{link.label}</span>
              <span className={styles.desc}>{link.desc}</span>
            </div>
            <span className={styles.arrow}>›</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
