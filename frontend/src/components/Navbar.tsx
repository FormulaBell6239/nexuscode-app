"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import StreakTracker from './StreakTracker';
import StatIcon from './StatIcon';
import { api, CREDITS_CHANGED_EVENT } from '@/lib/api';
import { endSession } from '@/lib/session';

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

  const pathname = usePathname();

  useEffect(() => {
    const load = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      api.get<ProfileSnap>('/api/profile')
        .then(d => setStats({ energy: d.energy, maxEnergy: d.maxEnergy, credits: d.credits, level: d.level, xp: d.xp, streak: d.streak }))
        .catch(() => {});
    };
    load();
    window.addEventListener(CREDITS_CHANGED_EVENT, load);
    return () => window.removeEventListener(CREDITS_CHANGED_EVENT, load);
  }, [pathname]);

  if (!stats) return null;

  return (
    <>
      <div className={styles.statPills}>
        <span className={styles.statPill} title="Energy"><StatIcon name="energy" /> {stats.energy}<span className={styles.statMax}>/{stats.maxEnergy}</span></span>
        <span className={styles.statPill} title="Credits"><StatIcon name="credits" /> {stats.credits}</span>
        <span className={styles.statPill} title={`${stats.xp} XP`}><StatIcon name="level" /> Lv.{stats.level}</span>
      </div>
      <StreakTracker streak={stats.streak} />
    </>
  );
}

type NavItem = { href: string; icon: string; label: string };
type NavGroup = { id: string; icon: string; label: string; items: NavItem[] };

const BOTTOM_GROUPS: NavGroup[] = [
  {
    id: 'home',
    icon: '⌂',
    label: 'dashboard',
    items: [
      { href: '/', icon: '⌂', label: 'dashboard' },
    ],
  },
  {
    id: 'ai',
    icon: '✧',
    label: 'nexus-ai',
    items: [
      { href: '/ai/', icon: '✧', label: 'nexus-ai' },
    ],
  },
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
    id: 'community',
    icon: '❖',
    label: 'community',
    items: [
      { href: '/community', icon: '❖', label: 'community' },
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
      { href: '/achievements', icon: '✧',  label: 'achievements' },
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
    label: 'home',
    items: [
      { href: '/', icon: '⌂', label: 'dashboard' },
    ],
  },
  {
    label: 'intelligence',
    items: [
      { href: '/ai/', icon: '✧', label: 'nexus-ai' },
    ],
  },
  {
    label: 'learn',
    items: [
      { href: '/roadmap',     icon: '⬡', label: 'nexus-path'  },
      { href: '/assignments', icon: '◎', label: 'assignments'  },
      { href: '/upgrade',     icon: '✦', label: 'upgrade'     },
    ],
  },
  {
    label: 'community',
    items: [
      { href: '/community', icon: '❖', label: 'community' },
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
      { href: '/achievements', icon: '✧',  label: 'achievements' },
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
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const toggleSection = (label: string) =>
    setCollapsed((cur) => (cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label]));
  const [loggedIn, setLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  // Home is the dashboard for signed-in users and guests, so it gets the menu too.
  const noSidebar =
    (pathname === '/' && !loggedIn && !isGuest) || pathname === '/auth' || pathname === '/onboarding';

  // Sync login state on every route change
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
    setIsGuest(!!localStorage.getItem('nexus_guest'));
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
    group.items.some(item => isActive(item.href));
  useEffect(() => {
    document
      .querySelector<HTMLElement>(`.${styles.mobileGroupBtnActive}`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [pathname]);
  const openGroupData = BOTTOM_GROUPS.find(g => g.id === openGroup) ?? null;

  const handleLogout = () => {
    endSession();
    setLoggedIn(false);
    router.push('/auth');
  };

  return (
    <>
      {/* ── Top header ── */}
      <header className={styles.topHeader}>
        {/* Directory chevron — desktop only, hidden on home/auth/onboarding */}
        {!noSidebar && (
          <button
            className={styles.toggle}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <svg className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5.5 2.5L11 8l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
                  <button
                    type='button'
                    className={styles.dirFolder}
                    onClick={() => toggleSection(section.label)}
                    aria-expanded={!collapsed.includes(section.label)}
                  >
                    <span className={styles.dirCaret}>{collapsed.includes(section.label) ? '▸' : '▾'}</span>
                    {section.label}/
                  </button>
                  <div className={styles.dirItems} hidden={collapsed.includes(section.label)}>
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
