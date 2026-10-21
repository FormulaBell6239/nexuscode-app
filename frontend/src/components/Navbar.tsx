"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import StreakTracker from './StreakTracker';
import { api } from '@/lib/api';

interface ProfileSnap {
  energy: number;
  maxEnergy: number;
  credits: number;
  level: number;
  xp: number;
  streak: number;
}

function NavStats() {
  const [stats, setStats] = useState<ProfileSnap | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get<ProfileSnap>('/api/profile')
      .then(d => setStats({ energy: d.energy, maxEnergy: d.maxEnergy, credits: d.credits, level: d.level, xp: d.xp, streak: d.streak }))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <>
      <div className={styles.statPills}>
        <span className={styles.statPill} title="Energy">⚡ {stats.energy}<span className={styles.statMax}>/{stats.maxEnergy}</span></span>
        <span className={styles.statPill} title="Credits">💎 {stats.credits}</span>
        <span className={styles.statPill} title={`${stats.xp} XP`}>⭐ Lv.{stats.level}</span>
      </div>
      <StreakTracker streak={stats.streak} />
    </>
  );
}

type NavItem = { href: string; icon: string; label: string };
type NavGroup = { id: string; icon: string; label: string; items: NavItem[] };

const BOTTOM_GROUPS: NavGroup[] = [
  {
    id: 'learn',
    icon: '◎',
    label: 'learn',
    items: [
      { href: '/roadmap',     icon: '⬡', label: 'nexus-path'  },
      { href: '/assignments', icon: '◎', label: 'assignments' },
      { href: '/upgrade',     icon: '✦', label: 'upgrade'     },
    ],
  },
  {
    id: 'play',
    icon: '◈',
    label: 'play',
    items: [
      { href: '/games',      icon: '◈', label: 'games'      },
      { href: '/playground', icon: '⌥', label: 'playground' },
    ],
  },
  {
    id: 'compete',
    icon: '◆',
    label: 'compete',
    items: [
      { href: '/leaderboard',  icon: '◆',  label: 'leaderboard'  },
      { href: '/achievements', icon: '🏅', label: 'achievements' },
      { href: '/store',        icon: '⬡',  label: 'store'        },
    ],
  },
  {
    id: 'profile',
    icon: '⟁',
    label: 'profile',
    items: [
      { href: '/profile', icon: '⟁', label: 'profile' },
    ],
  },
  {
    id: 'utility',
    icon: '⚙',
    label: 'utility',
    items: [
      { href: '/settings', icon: '⚙', label: 'settings' },
    ],
  },
];

const SIDEBAR_SECTIONS = [
  {
    label: 'learn',
    items: [
      { href: '/roadmap',     icon: '⬡', label: 'nexus-path'  },
      { href: '/assignments', icon: '◎', label: 'assignments'  },
      { href: '/upgrade',     icon: '✦', label: 'upgrade'     },
    ],
  },
  {
    label: 'play',
    items: [
      { href: '/games',      icon: '◈', label: 'games'       },
      { href: '/playground', icon: '⌥', label: 'playground'  },
    ],
  },
  {
    label: 'compete',
    items: [
      { href: '/leaderboard',  icon: '◆',  label: 'leaderboard'  },
      { href: '/achievements', icon: '🏅', label: 'achievements' },
      { href: '/store',        icon: '⬡',  label: 'store'        },
    ],
  },
  {
    label: 'you',
    items: [
      { href: '/profile',  icon: '⟁', label: 'profile'  },
      { href: '/settings', icon: '⚙', label: 'settings' },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const noSidebar = pathname === '/' || pathname === '/auth' || pathname === '/onboarding';
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Sync login state on every route change
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, [pathname]);

  // Close sidebar and mobile panel whenever the route changes
  useEffect(() => { setOpen(false); setOpenGroup(null); }, [pathname]);

  // Prevent body scroll while sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const isGroupActive = (group: NavGroup) =>
    group.items.some(item => pathname.startsWith(item.href));
  const openGroupData = BOTTOM_GROUPS.find(g => g.id === openGroup) ?? null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('nexus_guest');
    setLoggedIn(false);
    router.push('/auth');
  };

  return (
    <>
      {/* ── Top header ── */}
      <header className={styles.topHeader}>
        {/* Hamburger — desktop only, hidden on home/auth/onboarding */}
        {!noSidebar && (
          <button
            className={styles.toggle}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span className={`${styles.bar} ${open ? styles.barTop : ''}`} />
            <span className={`${styles.bar} ${open ? styles.barMid : ''}`} />
            <span className={`${styles.bar} ${open ? styles.barBot : ''}`} />
          </button>
        )}
        <div className={styles.headerRight}>
          <NavStats />
          {loggedIn && <button type="button" className={styles.logoutButton} onClick={handleLogout}>Sign out</button>}
        </div>
      </header>

      {/* ── Mobile panel backdrop ── */}
      <div
        className={`${styles.mobilePanelBackdrop} ${openGroup ? styles.mobilePanelBackdropVisible : ''}`}
        onClick={() => setOpenGroup(null)}
        aria-hidden='true'
      />

      {/* ── Mobile directory panel (slides up above the bar) ── */}
      <div
        className={`${styles.mobilePanel} ${openGroup ? styles.mobilePanelOpen : ''}`}
        aria-hidden={!openGroup}
      >
        {openGroupData && (
          <>
            <div className={styles.mobilePanelHeader}>
              <span className={styles.dirCaret}>▸</span>
              <span className={styles.mobilePanelFolder}>{openGroupData.label}/</span>
            </div>
            <div key={openGroupData.id} className={styles.mobilePanelItems}>
              {openGroupData.items.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ '--i': i } as React.CSSProperties}
                  className={`${styles.dirItem} ${styles.mobileDirItem} ${isActive(item.href) ? styles.dirItemActive : ''} ${item.href === '/upgrade' ? styles.dirItemUpgrade : ''}`}
                  onClick={() => setOpenGroup(null)}
                >
                  <span className={styles.dirLine} aria-hidden='true' />
                  <span className={styles.sidebarIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Mobile grouped bottom tab bar ── */}
      <nav className={styles.mobileGroupBar} aria-label='Main navigation'>
        {BOTTOM_GROUPS.map(group => (
          <button
            key={group.id}
            type='button'
            className={`${styles.mobileGroupBtn} ${isGroupActive(group) ? styles.mobileGroupBtnActive : ''} ${openGroup === group.id ? styles.mobileGroupBtnOpen : ''}`}
            onClick={() => setOpenGroup(prev => prev === group.id ? null : group.id)}
            aria-expanded={openGroup === group.id}
            aria-label={group.label}
          >
            <span className={styles.mobileGroupIcon}>{group.icon}</span>
            <span className={styles.mobileGroupLabel}>
              <span className={styles.mobileGroupChevron}>{'>'}</span>
              {group.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Desktop collapsible sidebar (hidden on home/auth/onboarding) ── */}
      {!noSidebar && (
        <>
          <div
            className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
            onClick={() => setOpen(false)}
            aria-hidden='true'
          />
          <aside
            className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
            aria-label='Sidebar navigation'
          >
            <div className={styles.sidebarHeader}>
              <Link href='/' className={styles.sidebarLogo}>NexusCode</Link>
              <button
                className={styles.sidebarClose}
                onClick={() => setOpen(false)}
                aria-label='Close sidebar'
              >
                ×
              </button>
            </div>

            <nav className={styles.sidebarNav}>
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.label} className={styles.dirSection}>
                  <span className={styles.dirFolder}>
                    <span className={styles.dirCaret}>▸</span>
                    {section.label}/
                  </span>
                  <div className={styles.dirItems}>
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.dirItem} ${isActive(item.href) ? styles.dirItemActive : ''} ${item.href === '/upgrade' ? styles.dirItemUpgrade : ''}`}
                      >
                        <span className={styles.dirLine} aria-hidden='true' />
                        <span className={styles.sidebarIcon}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className={styles.sidebarFooter}>
              <StreakTracker />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
