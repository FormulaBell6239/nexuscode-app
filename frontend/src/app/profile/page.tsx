'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import styles from './Profile.module.css';
import { api, getOwnedItems, getLocalCredits } from '@/lib/api';

const AVATARS = ["👾", "🤖", "🦾", "💀", "⚡", "🔮", "🪐", "🎮", "👽", "👻", "🦊", "🐙", "🦈", "🦉", "🐉", "🐺", "🐱", "🐸", "🦄", "🐼", "🐧", "🦋", "🦖", "🥷", "🧑‍🚀", "🧙", "🦇", "🦂", "🌙", "💎"];
const AVATAR_EMBLEMS: Record<string, { name: string; mark: string; rarity: string; background: string; color: string; border: string }> = {
  'avatar-cipher': { name: 'Cipher Sigil', mark: '⌘', rarity: 'Rare', background: 'linear-gradient(145deg,#102c3b,#07131e)', color: '#67e8f9', border: '#0891b2' },
  'avatar-unbroken': { name: 'Unbroken Sigil', mark: '◈', rarity: 'Legendary', background: 'linear-gradient(145deg,#38240a,#12100b)', color: '#fcd34d', border: '#f59e0b' },
};

function AvatarVisual({ value }: { value: string }) {
  const emblem = AVATAR_EMBLEMS[value];
  if (!emblem) return <>{value}</>;
  return (
    <span
      className={styles.avatarArt}
      style={{ background: emblem.background, color: emblem.color, borderColor: emblem.border }}
      title={`${emblem.name} · ${emblem.rarity}`}
      aria-label={`${emblem.rarity} ${emblem.name}`}
    >
      {emblem.mark}
    </span>
  );
}

const CALLING_CARDS = [
  // ── Pack 1 ──
  { name: "Nexus",     value: "indigo",  gradient: "linear-gradient(135deg,#1e1b4b 0%,#4338ca 52%,#0891b2 100%)" },
  { name: "Phantom",   value: "cyber",   gradient: "linear-gradient(135deg,#2e1065 0%,#7c3aed 48%,#db2777 100%)" },
  { name: "Abyss",     value: "ocean",   gradient: "linear-gradient(135deg,#0c1a3a 0%,#1d4ed8 52%,#0e7490 100%)" },
  { name: "Ember",     value: "neon",    gradient: "linear-gradient(135deg,#1c0900 0%,#92400e 50%,#c2410c 100%)" },
  { name: "Nightfall", value: "night",   gradient: "linear-gradient(135deg,#111318 0%,#1c2333 48%,#2c3444 100%)" },
  // ── Pack 2 ──
  { name: "Jade",      value: "jade",    gradient: "linear-gradient(135deg,#021412 0%,#064e3b 52%,#10b981 100%)" },
  { name: "Rose",      value: "rose",    gradient: "linear-gradient(135deg,#190008 0%,#881337 52%,#fb7185 100%)" },
  { name: "Volt",      value: "volt",    gradient: "linear-gradient(135deg,#0a1400 0%,#3f6212 50%,#a3e635 100%)" },
  { name: "Chrome",    value: "chrome",  gradient: "linear-gradient(135deg,#0d0d0f 0%,#1e293b 50%,#64748b 100%)" },
  { name: "Fuchsia",   value: "fuchsia", gradient: "linear-gradient(135deg,#1a0028 0%,#7c3aed 48%,#e879f9 100%)" },
  { name: "Aurora",    value: "aurora",  gradient: "linear-gradient(135deg,#042f2e 0%,#0f766e 48%,#a3e635 100%)" },
  { name: "Glacier",   value: "glacier", gradient: "linear-gradient(135deg,#082f49 0%,#0284c7 52%,#bae6fd 100%)" },
  { name: "Crimson",   value: "crimson", gradient: "linear-gradient(135deg,#2b0909 0%,#b91c1c 52%,#fb7185 100%)" },
  { name: "Citron",    value: "citron",  gradient: "linear-gradient(135deg,#17230a 0%,#65a30d 52%,#fde047 100%)" },
  { name: "Tidal",     value: "tidal",   gradient: "linear-gradient(135deg,#082f49 0%,#0e7490 52%,#2dd4bf 100%)" },
  { name: "Solar Flare", value: "flare", gradient: "linear-gradient(135deg,#431407 0%,#ea580c 48%,#facc15 100%)" },
  { name: "Orchid",    value: "orchid",  gradient: "linear-gradient(135deg,#2e1065 0%,#a21caf 52%,#f0abfc 100%)" },
  { name: "Arctic",    value: "arctic",  gradient: "linear-gradient(135deg,#172554 0%,#475569 52%,#67e8f9 100%)" },
  { name: "Inferno",   value: "inferno", gradient: "linear-gradient(135deg,#1c1917 0%,#9a3412 48%,#dc2626 100%)" },
  { name: "Iris",      value: "iris",    gradient: "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 50%,#f472b6 100%)" },
];
const CARD_PACK_SIZE = 5;
const CARD_PACK_COUNT = Math.ceil(CALLING_CARDS.length / CARD_PACK_SIZE);

interface TextureDef { id: string; name: string; icon: string; backgroundImage: string; backgroundSize: string; }
const BANNER_TEXTURES: TextureDef[] = [
  { id: 'none', name: 'None', icon: '—', backgroundImage: 'none', backgroundSize: '' },
  {
    id: 'hex', name: 'Hex', icon: '⬡',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.49L26 15v14l-13.02 7.5L0 29V15z' fill='none' stroke='rgba(129,140,248,0.22)' stroke-width='1'/%3E%3C/svg%3E\")",
    backgroundSize: '28px 49px',
  },
  {
    id: 'circuit', name: 'Circuit', icon: '⊕',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Cline x1='0' y1='18' x2='52' y2='18' stroke='rgba(34,211,238,0.22)' stroke-width='1.2'/%3E%3Cline x1='52' y1='0' x2='52' y2='52' stroke='rgba(34,211,238,0.22)' stroke-width='1.2'/%3E%3Ccircle cx='52' cy='18' r='3.5' fill='rgba(34,211,238,0.45)'/%3E%3Cline x1='18' y1='52' x2='18' y2='70' stroke='rgba(129,140,248,0.22)' stroke-width='1.2'/%3E%3Cline x1='0' y1='52' x2='52' y2='52' stroke='rgba(129,140,248,0.22)' stroke-width='1.2'/%3E%3Ccircle cx='18' cy='52' r='3.5' fill='rgba(129,140,248,0.45)'/%3E%3Crect x='34' y='34' width='8' height='8' rx='1' fill='none' stroke='rgba(99,102,241,0.25)' stroke-width='0.8'/%3E%3C/svg%3E\")",
    backgroundSize: '70px 70px',
  },
  {
    id: 'chevron', name: 'Chevron', icon: '⌃',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='22'%3E%3Cpolyline points='0,22 22,2 44,22' fill='none' stroke='rgba(99,102,241,0.26)' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundSize: '44px 22px',
  },
  {
    id: 'neural', name: 'Neural', icon: '◈',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cline x1='22' y1='0' x2='22' y2='44' stroke='rgba(99,102,241,0.13)' stroke-width='0.8'/%3E%3Cline x1='0' y1='22' x2='44' y2='22' stroke='rgba(99,102,241,0.13)' stroke-width='0.8'/%3E%3Cline x1='0' y1='0' x2='44' y2='44' stroke='rgba(129,140,248,0.08)' stroke-width='0.6'/%3E%3Cline x1='44' y1='0' x2='0' y2='44' stroke='rgba(129,140,248,0.08)' stroke-width='0.6'/%3E%3Ccircle cx='22' cy='22' r='2.8' fill='rgba(129,140,248,0.38)'/%3E%3Ccircle cx='0' cy='0' r='1.6' fill='rgba(99,102,241,0.28)'/%3E%3Ccircle cx='44' cy='0' r='1.6' fill='rgba(99,102,241,0.28)'/%3E%3Ccircle cx='0' cy='44' r='1.6' fill='rgba(99,102,241,0.28)'/%3E%3Ccircle cx='44' cy='44' r='1.6' fill='rgba(99,102,241,0.28)'/%3E%3C/svg%3E\")",
    backgroundSize: '44px 44px',
  },
  { id: 'grid', name: 'Grid', icon: '▦', backgroundImage: 'linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)', backgroundSize: '28px 28px' },
  { id: 'slashes', name: 'Slashes', icon: '╱', backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 10px, rgba(255,255,255,0.19) 10px 11px, transparent 11px 20px)', backgroundSize: '28px 28px' },
  { id: 'scanlines', name: 'Scanlines', icon: '≋', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,0.20) 5px 6px)', backgroundSize: '100% 12px' },
  { id: 'dots', name: 'Signal', icon: '⠿', backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 1.2px, transparent 1.4px)', backgroundSize: '18px 18px' },
  { id: 'diamonds', name: 'Facet', icon: '◇', backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 18px, rgba(255,255,255,0.16) 18px 19px, transparent 19px 36px), repeating-linear-gradient(-45deg, transparent 0 18px, rgba(255,255,255,0.10) 18px 19px, transparent 19px 36px)', backgroundSize: '36px 36px' },
  { id: 'rings', name: 'Orbit', icon: '◎', backgroundImage: 'radial-gradient(circle at center, transparent 0 10px, rgba(255,255,255,0.20) 10.5px 11.5px, transparent 12px 20px, rgba(255,255,255,0.13) 20.5px 21.5px, transparent 22px)', backgroundSize: '52px 52px' },
];

const ALL_LESSONS: Record<string, string> = {
  "html-headings":   "HTML · Headings",     "html-paragraphs": "HTML · Paragraphs",
  "html-links":      "HTML · Links",        "html-images":     "HTML · Images",
  "html-lists":      "HTML · Lists",        "html-forms":      "HTML · Forms",
  "css-selectors":   "CSS · Selectors",     "css-background":  "CSS · Background",
  "css-font-size":   "CSS · Font Size",     "css-text-align":  "CSS · Text Align",
  "css-padding":     "CSS · Padding",       "css-flexbox":     "CSS · Flexbox",
  "js-variables":    "JS · Variables",      "js-console":      "JS · Console",
  "js-functions":    "JS · Functions",      "js-conditionals": "JS · Conditionals",
  "js-arrays":       "JS · Arrays",         "js-loops":        "JS · Loops",
  "ts-type-annotations": "TypeScript · Type Annotations", "ts-function-types": "TypeScript · Typed Functions",
  "py-print":        "Python · print()",    "py-variables":    "Python · Variables",
  "py-conditionals": "Python · If / Else",  "py-loops":        "Python · For Loops",
  "py-functions":    "Python · Functions",  "py-lists":        "Python · Lists",
};

const TOTAL = Object.keys(ALL_LESSONS).length;
const XP_PER_LESSON = 50;
const XP_PER_LEVEL  = 300;
function levelFromXP(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function xpIntoLevel(xp: number) { return xp % XP_PER_LEVEL; }

const LANG_COLOR: Record<string, string> = {
  HTML: "#f97316", CSS: "#06b6d4", JS: "#f59e0b", Python: "#10b981", TypeScript: "#3178c6",
};

interface SkinDef {
  slug: string;
  name: string;
  label: string;
  icon: string;
  accent: string;
  accent2: string;
  bg: string;
  desc: string;
  free?: boolean;
}

const APPEARANCE_SKINS: SkinDef[] = [
  {
    slug: 'solar-light',
    name: 'Solar Light',
    label: 'Free',
    icon: '◐',
    accent: '#60a5fa',
    accent2: '#a78bfa',
    bg: '#091628',
    desc: 'Sapphire blue \u2014 sky & violet accents, lighter and airier',
    free: true,
  },
  {
    slug: 'ember',
    name: 'Ember',
    label: 'Bronze',
    icon: '🔥',
    accent: '#ea580c',
    accent2: '#fbbf24',
    bg: '#0d0705',
    desc: 'Warm orange-red fire palette',
  },
  {
    slug: 'matrix-green',
    name: 'Matrix',
    label: 'Silver',
    icon: '⌨️',
    accent: '#22c55e',
    accent2: '#4ade80',
    bg: '#000500',
    desc: 'Terminal green hacker aesthetic',
  },
  {
    slug: 'solar',
    name: 'Solara',
    label: 'Gold',
    icon: '☀️',
    accent: '#f59e0b',
    accent2: '#fde68a',
    bg: '#0d0a03',
    desc: 'Gold-amber cosmic spacey palette',
  },
];

interface ProfileData {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatar: string;
  callingCard: string;
  xp: number;
  level: number;
  streak: number;
}

type Tab = 'appearance' | 'progress' | 'activity';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'appearance', label: 'Appearance', icon: '◈' },
  { id: 'progress',   label: 'Progress',   icon: '⟁' },
  { id: 'activity',   label: 'Activity',   icon: '◎' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({ displayName: '', bio: '', avatar: AVATARS[0] });
  const [completed, setCompleted] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [ownedSkinSlugs, setOwnedSkinSlugs] = useState<Set<string>>(new Set());
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [credits,   setCredits]   = useState(0);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [showTexturePicker, setShowTexturePicker] = useState(false);
  const [bannerTexture, setBannerTexture] = useState('none');
  const [textureStrength, setTextureStrength] = useState(100);
  const [customColors, setCustomColors] = useState(['#14b8a6', '#a3e635']);
  const [localCard, setLocalCard] = useState('night');
  const [ringColor, setRingColor] = useState('#10b981');
  const [bannerPack, setBannerPack] = useState(0);
  const [activeMatrixNodeId, setActiveMatrixNodeId] = useState('core');

  useEffect(() => {
    try { const r = localStorage.getItem('nexus_completed'); if (r) setCompleted(JSON.parse(r)); } catch {}
    setCredits(getLocalCredits());
    setActiveTheme(localStorage.getItem('theme') ?? '');
    setBannerTexture(localStorage.getItem('bannerTexture') ?? 'none');
    setLocalCard(localStorage.getItem('bannerCard') ?? 'night');
    const savedStart = localStorage.getItem('bannerCustomStart');
    const savedEnd = localStorage.getItem('bannerCustomEnd');
    const validHex = (value: string | null): value is string => !!value && /^#[0-9a-fA-F]{6}$/.test(value);
    setCustomColors([
      validHex(savedStart) ? savedStart : '#14b8a6',
      validHex(savedEnd) ? savedEnd : '#a3e635',
    ]);
    const savedRing = localStorage.getItem('avatarRingColor');
    if (savedRing && /^#[0-9a-fA-F]{6}$/.test(savedRing)) setRingColor(savedRing);
    const savedStrength = Number(localStorage.getItem('bannerTextureStrength'));
    if (Number.isFinite(savedStrength) && savedStrength >= 20 && savedStrength <= 100) {
      setTextureStrength(savedStrength);
    }

    const token = localStorage.getItem('token');

    api.get<ProfileData>('/api/profile')
      .then((data) => {
        setProfile(data);
        const customMatch = /^custom-([0-9a-fA-F]{6})-([0-9a-fA-F]{6})$/.exec(data.callingCard ?? '');
        if (customMatch) setCustomColors([`#${customMatch[1]}`, `#${customMatch[2]}`]);
        setEditFields({
          displayName: data.displayName ?? '',
          bio: data.bio ?? '',
          avatar: data.avatar ?? AVATARS[0],
        });
      })
      .catch(() => setLoadError('Could not load profile — is the backend running?'));

    if (token) {
      getOwnedItems()
        .then(owned => {
          const slugs = new Set(
            owned.filter(o => o.category === 'cosmetic' && o.applyValue).map(o => o.applyValue as string)
          );
          setOwnedSkinSlugs(slugs);
          setOwnedAvatars(owned
            .filter(o => o.category === 'cosmetic' && o.cosmeticType === 'avatar' && o.applyValue && AVATAR_EMBLEMS[o.applyValue])
            .map(o => o.applyValue as string));
        })
        .catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await api.put<ProfileData>('/api/profile', editFields);
      setProfile(prev => prev ? { ...prev, ...updated } : prev);
      setIsEditing(false);
      setSaveMessage({ kind: 'success', text: 'Profile changes saved.' });
    } catch (error) {
      setSaveMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Immediately persist banner color change — works with or without backend
  const handleCallingCard = (value: string) => {
    setLocalCard(value);
    localStorage.setItem('bannerCard', value);
    setProfile(p => p ? { ...p, callingCard: value } : p);
    api.put('/api/profile', { callingCard: value }).catch(() => {});
  };

  function handleCustomColor(index: number, value: string) {
    const next = [...customColors];
    next[index] = value;
    setCustomColors(next);
    localStorage.setItem('bannerCustomStart', next[0]);
    localStorage.setItem('bannerCustomEnd', next[1]);
    handleCallingCard(`custom-${next[0].slice(1)}-${next[1].slice(1)}`);
  }

  function handleRingColor(value: string) {
    setRingColor(value);
    localStorage.setItem('avatarRingColor', value);
  }

  function handleTexture(id: string) {
    setBannerTexture(id);
    localStorage.setItem('bannerTexture', id);
  }

  function handleTextureStrength(value: number) {
    setTextureStrength(value);
    localStorage.setItem('bannerTextureStrength', String(value));
  }

  const handleEdit = () => {
    setSaveMessage(null);
    setIsEditing(true);
  };
  const handleCancel = () => {
    if (profile) {
      setEditFields({
        displayName: profile.displayName ?? '',
        bio: profile.bio ?? '',
        avatar: profile.avatar ?? AVATARS[0],
      });
    }
    setSaveMessage(null);
    setIsEditing(false);
  };

  function applySkin(slug: string) {
    if (!slug) {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem('theme');
      setActiveTheme('');
    } else {
      document.documentElement.dataset.theme = slug;
      localStorage.setItem('theme', slug);
      setActiveTheme(slug);
    }
  }

  const displayAvatar = isEditing ? editFields.avatar : (profile?.avatar ?? AVATARS[0]);
  const availableEmblems = [...new Set([...ownedAvatars, profile?.avatar ?? ''])]
    .filter(value => !!AVATAR_EMBLEMS[value]);
  const displayName   = isEditing
    ? editFields.displayName || profile?.username || ''
    : profile?.displayName ?? profile?.username ?? '';
  const displayCard   = profile?.callingCard ?? localCard;
  const customCardMatch = /^custom-([0-9a-fA-F]{6})-([0-9a-fA-F]{6})$/.exec(displayCard);
  const activeCard = CALLING_CARDS.find(c => c.value === displayCard) ?? {
    name: 'Custom',
    value: displayCard,
    gradient: customCardMatch
      ? `linear-gradient(135deg, #${customCardMatch[1]} 0%, #${customCardMatch[2]} 100%)`
      : CALLING_CARDS[0].gradient,
  };
  const activeTex     = bannerTexture !== 'none' ? (BANNER_TEXTURES.find(t => t.id === bannerTexture) ?? null) : null;

  const xp    = profile?.xp ?? (completed.length * XP_PER_LESSON);
  const level = profile?.level ?? levelFromXP(xp);
  const xpNow = xpIntoLevel(xp);
  const xpPct = Math.round((xpNow / XP_PER_LEVEL) * 100);
  const recentKeys = completed.slice(-5).reverse();

  const langCounts: Record<string, number> = {};
  completed.forEach(k => {
    const lang = k.startsWith('html') ? 'HTML' : k.startsWith('css') ? 'CSS' : k.startsWith('js-') ? 'JS' : k.startsWith('ts-') ? 'TypeScript' : k.startsWith('py-') ? 'Python' : 'SQL';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });

  const matrixNodes = [
    { id: 'core', label: 'Identity core', detail: `LEVEL ${level} · ${xp.toLocaleString()} XP`, x: 150, y: 100 },
    { id: 'level', label: 'Level signal', detail: `${xpNow} / ${XP_PER_LEVEL} XP TO LEVEL ${level + 1}`, x: 150, y: 22 },
    { id: 'learning', label: 'Learning node', detail: `${completed.length} LESSONS SYNCHRONIZED`, x: 62, y: 44 },
    { id: 'streak', label: 'Streak relay', detail: `${profile?.streak ?? 0} DAY LEARNING STREAK`, x: 238, y: 44 },
    { id: 'focus', label: 'Focus node', detail: `${Object.keys(langCounts).length} TRACKS ACTIVE`, x: 28, y: 112 },
    { id: 'credits', label: 'Credit relay', detail: `${credits} CREDITS AVAILABLE`, x: 272, y: 112 },
    { id: 'progress', label: 'Progress node', detail: `${completed.length} OF ${TOTAL} LESSONS COMPLETE`, x: 72, y: 170 },
    { id: 'milestones', label: 'Milestone node', detail: 'ACHIEVEMENT SIGNALS READY', x: 228, y: 170 },
  ];
  const activeMatrixNode = matrixNodes.find(node => node.id === activeMatrixNodeId) ?? matrixNodes[0];

  const handleMatrixPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty('--matrix-x', `${x}%`);
    event.currentTarget.style.setProperty('--matrix-y', `${y}%`);
  };

  const resetMatrixPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--matrix-x', '50%');
    event.currentTarget.style.setProperty('--matrix-y', '50%');
  };

  return (
    <main className={styles.main}>
      <PageShell />
      <Link href="/settings" className={styles.settingsGear} aria-label="Settings">⚙</Link>

      <div className={styles.container}>
        {loadError && <div className={styles.errorMsg}>{loadError}</div>}

        {/* ── Hero section ── */}
        <div className={styles.hero}>
          {/* Banner */}
          <div className={styles.heroBanner} style={{ background: activeCard.gradient }}>
            <div className={`${styles.coverGrid} ${bannerTexture !== 'none' ? styles.coverGridHidden : ''}`} />
            {activeTex && (
              <div
                className={styles.bannerTextureLayer}
                style={{ backgroundImage: activeTex.backgroundImage, opacity: textureStrength / 100, ...(activeTex.backgroundSize ? { backgroundSize: activeTex.backgroundSize } : {}) }}
              />
            )}
            <div className={styles.bannerActions}>
              {!isEditing && (
                <button className={styles.editBtn} onClick={handleEdit}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                    <path d="M7.5 1.5L9.5 3.5L3.5 9.5L1 10L1.5 7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
              )}
              <button
                className={`${styles.editBtn} ${showBannerPicker ? styles.editBtnActive : ''}`}
                onClick={() => { setShowBannerPicker(p => !p); setShowTexturePicker(false); }}
                aria-label="Change banner color"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                </svg>
                Color
              </button>
              <button
                className={`${styles.editBtn} ${showTexturePicker ? styles.editBtnActive : ''}`}
                onClick={() => { setShowTexturePicker(p => !p); setShowBannerPicker(false); }}
                aria-label="Change banner texture"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/>
                  <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/>
                  <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/>
                  <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/>
                </svg>
                Texture
              </button>
            </div>
            {showBannerPicker && (
              <div className={styles.bannerSwatchRow}>
                {CALLING_CARDS.slice(bannerPack * CARD_PACK_SIZE, (bannerPack + 1) * CARD_PACK_SIZE).map(c => (
                  <button
                    key={c.value}
                    className={`${styles.bannerDot} ${displayCard === c.value ? styles.bannerDotActive : ''}`}
                    style={{ background: c.gradient }}
                    title={c.name}
                    aria-label={`${c.name} banner`}
                    aria-pressed={displayCard === c.value}
                    onClick={() => handleCallingCard(c.value)}
                  />
                ))}
                <button
                  className={styles.packToggleBtn}
                  onClick={() => setBannerPack(p => (p + 1) % CARD_PACK_COUNT)}
                  title={`Color set ${bannerPack + 1} of ${CARD_PACK_COUNT}`}
                  aria-label={`Show next color set, ${bannerPack + 1} of ${CARD_PACK_COUNT}`}
                >
                  ›
                </button>
                <div className={styles.customColorControls}>
                  <label className={styles.customColorLabel}>
                    <input type="color" value={customColors[0]} onChange={e => handleCustomColor(0, e.target.value)} aria-label="First custom banner color" />
                    <span>Color 1</span>
                  </label>
                  <label className={styles.customColorLabel}>
                    <input type="color" value={customColors[1]} onChange={e => handleCustomColor(1, e.target.value)} aria-label="Second custom banner color" />
                    <span>Color 2</span>
                  </label>
                  <label className={styles.customColorLabel}>
                    <input type="color" value={ringColor} onChange={e => handleRingColor(e.target.value)} aria-label="Avatar ring color" />
                    <span>Ring</span>
                  </label>
                </div>
              </div>
            )}
            {showTexturePicker && (
              <div className={styles.bannerSwatchRow}>
                {BANNER_TEXTURES.map(t => (
                  <button
                    key={t.id}
                    className={`${styles.textureSwatch} ${bannerTexture === t.id ? styles.textureSwatchActive : ''}`}
                    onClick={() => handleTexture(t.id)}
                    title={t.name}
                    aria-pressed={bannerTexture === t.id}
                  >
                    <span className={styles.textureSwatchIcon}>{t.icon}</span>
                    <span className={styles.textureSwatchName}>{t.name}</span>
                  </button>
                ))}
                <label className={styles.textureStrengthControl}>
                  <span className={styles.textureStrengthLabel}>Strength <b>{textureStrength}%</b></span>
                  <input type="range" min="20" max="100" step="5" value={textureStrength} onChange={e => handleTextureStrength(Number(e.target.value))} aria-label="Texture strength" />
                </label>
              </div>
            )}
          </div>

          {/* Avatar + identity row */}
          <div className={styles.heroBody}>
            <div className={styles.avatarFloat} style={{ '--ring': ringColor } as React.CSSProperties}><AvatarVisual value={displayAvatar} /></div>
            <div className={styles.heroInfo}>
              {isEditing ? (
                <div className={styles.editPanel}>
                  <div className={styles.editIdentityPreview}>
                    <span className={styles.editPreviewAvatar}><AvatarVisual value={editFields.avatar} /></span>
                    <span className={styles.editPreviewCopy}>
                      <span className={styles.editPreviewLabel}>Profile preview</span>
                      <strong>{displayName || 'Your name'}</strong>
                    </span>
                  </div>
                    <div className={styles.editGrid}>
                    <div className={styles.field}>
                      <label className={styles.lbl}>Display Name</label>
                      <input
                        className={styles.input}
                        value={editFields.displayName}
                        onChange={e => setEditFields({ ...editFields, displayName: e.target.value })}
                        placeholder="Your name"
                          maxLength={50}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.lbl}>Avatar</label>
                        <div className={styles.avatarPicker} role="group" aria-label="Choose avatar">
                          {[...AVATARS, ...availableEmblems].map(a => (
                            <button
                              key={a}
                              type="button"
                              className={`${styles.avatarOption} ${editFields.avatar === a ? styles.avatarOptionActive : ''}`}
                              onClick={() => setEditFields({ ...editFields, avatar: a })}
                              aria-label={`Use ${a} avatar`}
                              aria-pressed={editFields.avatar === a}
                            >
                              <AvatarVisual value={a} />
                            </button>
                          ))}
                        </div>
                    </div>
                  </div>
                  <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                    <label className={styles.lbl}>Bio</label>
                    <textarea
                      className={styles.textarea}
                      value={editFields.bio}
                      onChange={e => setEditFields({ ...editFields, bio: e.target.value })}
                      placeholder="Write a short bio…"
                      rows={2}
                      maxLength={500}
                    />
                    <span className={styles.characterCount}>{editFields.bio.length}/500</span>
                  </div>
                  <div className={styles.actionRow}>
                    <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button className={styles.btnGhost} onClick={handleCancel} disabled={saving}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={styles.displayName}>{displayName || profile?.username || '…'}</span>
                  <span className={styles.atHandle}>@{profile?.username ?? '…'}</span>
                  <p className={styles.bioText}>
                    {profile?.bio || <span className={styles.muted}>No bio yet.</span>}
                  </p>
                  {/* XP bar — embedded in hero for immediate visibility */}
                  <div className={styles.heroXpBar}>
                    <div className={styles.heroXpRow}>
                      <div className={styles.heroXpLevelChip}>
                        <span className={styles.heroXpLevelNum}>{level}</span>
                        <span className={styles.heroXpLevelLbl}>Current</span>
                      </div>
                      <div className={styles.heroXpMiddle}>
                        <div className={styles.heroXpPctRow}>
                          <span className={styles.heroXpPct}>{xpPct}%</span>
                        </div>
                        <div className={styles.heroXpTrack}>
                          <div className={styles.heroXpFill} style={{ width: `${xpPct}%` }} />
                        </div>
                        <div className={styles.heroXpNumbers}>
                          <span className={styles.heroXpNow}>{xpNow.toLocaleString()} XP</span>
                          <span className={styles.heroXpGoal}>{XP_PER_LEVEL.toLocaleString()} XP needed</span>
                        </div>
                      </div>
                      <div className={`${styles.heroXpLevelChip} ${styles.heroXpLevelNext}`}>
                        <span className={styles.heroXpLevelNum}>{level + 1}</span>
                        <span className={styles.heroXpLevelLbl}>Next</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {saveMessage && (
                <p className={`${styles.saveMessage} ${saveMessage.kind === 'success' ? styles.saveMessageSuccess : styles.saveMessageError}`} role="status">
                  {saveMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardLevel}`}>
            <span className={styles.statCardIcon}>⟁</span>
            <span className={styles.statCardVal} style={{ background: 'linear-gradient(135deg,#818cf8,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Lv.{level}</span>
            <span className={styles.statCardKey}>Level</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardXP}`}>
            <span className={styles.statCardIcon}>⚡</span>
            <span className={styles.statCardVal}>{xp.toLocaleString()}</span>
            <span className={styles.statCardKey}>Total XP</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardCredits}`}>
            <span className={styles.statCardIcon}>◆</span>
            <span className={styles.statCardVal} style={{ color: '#f59e0b' }}>{credits}</span>
            <span className={styles.statCardKey}>Credits ◈</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardStreak}`}>
            <span className={styles.statCardIcon}>◎</span>
            <span className={styles.statCardVal}>{profile?.streak ?? 0}🔥</span>
            <span className={styles.statCardKey}>Day Streak</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabsCard}>
          <div className={styles.tabBar} role="tablist" aria-label="Profile sections">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.id)}
                role="tab"
                aria-selected={activeTab === t.id}
                aria-controls={`profile-panel-${t.id}`}
              >
                <span className={styles.tabIcon}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className={styles.tabPane} role="tabpanel" id="profile-panel-appearance">
                <section className={styles.matrixWidget} aria-label="Interactive profile neural matrix">
                  <header className={styles.matrixHeader}>
                    <div>
                      <p className={styles.matrixEyebrow}>Profile system</p>
                      <h2 className={styles.matrixTitle}>Neural matrix</h2>
                    </div>
                    <span className={styles.matrixOnline}><i /> Network online</span>
                  </header>
                  <div
                    className={styles.synapseScene}
                    onPointerMove={handleMatrixPointerMove}
                    onPointerLeave={resetMatrixPointer}
                    aria-label="Select a network node to inspect profile telemetry"
                  >
                  <svg viewBox="0 0 300 200" className={styles.synapseSvg} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="pf_glow" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="2.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <filter id="pf_coreGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="7" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <radialGradient id="pf_bg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.10"/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                      </radialGradient>
                    </defs>

                    {/* Ambient glow */}
                    <ellipse cx="150" cy="100" rx="115" ry="78" fill="url(#pf_bg)"/>

                    {/* Center-to-outer lines */}
                    <line x1="150" y1="100" x2="150" y2="22" stroke="rgba(129,140,248,0.30)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.30;0.60;0.30" dur="3.1s" repeatCount="indefinite"/>
                    </line>
                    <line x1="150" y1="100" x2="62" y2="44" stroke="rgba(99,102,241,0.30)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.30;0.55;0.30" dur="2.3s" repeatCount="indefinite"/>
                    </line>
                    <line x1="150" y1="100" x2="238" y2="44" stroke="rgba(6,182,212,0.30)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.30;0.58;0.30" dur="2.7s" repeatCount="indefinite"/>
                    </line>
                    <line x1="150" y1="100" x2="28" y2="112" stroke="rgba(99,102,241,0.25)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.25;0.50;0.25" dur="3.4s" repeatCount="indefinite"/>
                    </line>
                    <line x1="150" y1="100" x2="272" y2="112" stroke="rgba(6,182,212,0.25)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.25;0.52;0.25" dur="2.1s" repeatCount="indefinite"/>
                    </line>
                    <line x1="150" y1="100" x2="72" y2="170" stroke="rgba(99,102,241,0.30)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.30;0.55;0.30" dur="2.9s" repeatCount="indefinite"/>
                    </line>
                    <line x1="150" y1="100" x2="228" y2="170" stroke="rgba(6,182,212,0.30)" strokeWidth="0.8">
                      <animate attributeName="strokeOpacity" values="0.30;0.55;0.30" dur="3.6s" repeatCount="indefinite"/>
                    </line>

                    {/* Outer-to-outer lines */}
                    <line x1="62" y1="44" x2="238" y2="44" stroke="rgba(129,140,248,0.14)" strokeWidth="0.6" strokeDasharray="3 5"/>
                    <line x1="62" y1="44" x2="72" y2="170" stroke="rgba(99,102,241,0.12)" strokeWidth="0.6"/>
                    <line x1="238" y1="44" x2="228" y2="170" stroke="rgba(6,182,212,0.12)" strokeWidth="0.6"/>
                    <line x1="28" y1="112" x2="72" y2="170" stroke="rgba(99,102,241,0.10)" strokeWidth="0.5"/>
                    <line x1="272" y1="112" x2="228" y2="170" stroke="rgba(6,182,212,0.10)" strokeWidth="0.5"/>
                    <line x1="150" y1="22" x2="238" y2="44" stroke="rgba(129,140,248,0.10)" strokeWidth="0.5"/>
                    <line x1="150" y1="22" x2="62" y2="44" stroke="rgba(129,140,248,0.10)" strokeWidth="0.5"/>

                    {/* Traveling signal pulses */}
                    <circle r="2.2" fill="#a5b4fc" filter="url(#pf_glow)">
                      <animateMotion dur="1.8s" repeatCount="indefinite" begin="0s" path="M150,100 L150,22"/>
                    </circle>
                    <circle r="2.2" fill="#67e8f9" filter="url(#pf_glow)">
                      <animateMotion dur="2.2s" repeatCount="indefinite" begin="0.4s" path="M150,100 L238,44"/>
                    </circle>
                    <circle r="2.2" fill="#a5b4fc" filter="url(#pf_glow)">
                      <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.9s" path="M62,44 L150,100"/>
                    </circle>
                    <circle r="2.2" fill="#67e8f9" filter="url(#pf_glow)">
                      <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.3s" path="M150,100 L272,112"/>
                    </circle>
                    <circle r="2.0" fill="#818cf8" filter="url(#pf_glow)">
                      <animateMotion dur="2.0s" repeatCount="indefinite" begin="0.2s" path="M150,100 L72,170"/>
                    </circle>
                    <circle r="2.0" fill="#22d3ee" filter="url(#pf_glow)">
                      <animateMotion dur="1.9s" repeatCount="indefinite" begin="1.5s" path="M228,170 L150,100"/>
                    </circle>
                    <circle r="1.8" fill="#a5b4fc" filter="url(#pf_glow)">
                      <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.6s" path="M28,112 L150,100"/>
                    </circle>
                    <circle r="1.8" fill="#67e8f9" filter="url(#pf_glow)">
                      <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.0s" path="M62,44 L238,44"/>
                    </circle>
                    <circle r="1.8" fill="#a5b4fc" filter="url(#pf_glow)">
                      <animateMotion dur="2.6s" repeatCount="indefinite" begin="0.3s" path="M62,44 L72,170"/>
                    </circle>
                    <circle r="1.8" fill="#22d3ee" filter="url(#pf_glow)">
                      <animateMotion dur="2.4s" repeatCount="indefinite" begin="1.8s" path="M238,44 L228,170"/>
                    </circle>

                    {/* Outer nodes */}
                    <circle cx="150" cy="22" r="4" fill="#818cf8" filter="url(#pf_glow)">
                      <animate attributeName="r" values="3.5;5.5;3.5" dur="2.8s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="62" cy="44" r="4" fill="#6366f1" filter="url(#pf_glow)">
                      <animate attributeName="r" values="3;5.5;3" dur="2.1s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2.1s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="238" cy="44" r="4" fill="#06b6d4" filter="url(#pf_glow)">
                      <animate attributeName="r" values="3.5;5.5;3.5" dur="3.2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3.2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="28" cy="112" r="3.5" fill="#818cf8" filter="url(#pf_glow)">
                      <animate attributeName="r" values="2.5;4.5;2.5" dur="2.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.5;0.95;0.5" dur="2.5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="272" cy="112" r="3.5" fill="#22d3ee" filter="url(#pf_glow)">
                      <animate attributeName="r" values="2.5;4.5;2.5" dur="1.9s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.5;1;0.5" dur="1.9s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="72" cy="170" r="4" fill="#6366f1" filter="url(#pf_glow)">
                      <animate attributeName="r" values="3;5;3" dur="3.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="228" cy="170" r="4" fill="#06b6d4" filter="url(#pf_glow)">
                      <animate attributeName="r" values="3;5;3" dur="2.3s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2.3s" repeatCount="indefinite"/>
                    </circle>

                    {/* Core */}
                    <circle cx="150" cy="100" r="11" fill="#3730a3" filter="url(#pf_coreGlow)">
                      <animate attributeName="r" values="9;13;9" dur="2.4s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="150" cy="100" r="5.5" fill="#818cf8">
                      <animate attributeName="r" values="4.5;6.5;4.5" dur="2.4s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.85;1;0.85" dur="2.4s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="150" cy="100" r="2.5" fill="#e0e7ff">
                      <animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite"/>
                    </circle>
                    <circle
                      className={styles.matrixSelectionRing}
                      cx={activeMatrixNode.x}
                      cy={activeMatrixNode.y}
                      r="9"
                    />
                    {matrixNodes.map((node, index) => (
                      <g
                        key={node.id}
                        className={styles.matrixHitTarget}
                        role="button"
                        tabIndex={0}
                        aria-label={`Inspect ${node.label}: ${node.detail}`}
                        aria-pressed={activeMatrixNodeId === node.id}
                        onClick={() => setActiveMatrixNodeId(node.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setActiveMatrixNodeId(node.id);
                          }
                        }}
                      >
                        <circle cx={node.x} cy={node.y} r={index === 0 ? 14 : 12} />
                      </g>
                    ))}
                  </svg>
                  </div>
                  <div className={styles.matrixTelemetry} aria-live="polite">
                    <span className={styles.matrixNodeIndex}>NODE {String(matrixNodes.indexOf(activeMatrixNode) + 1).padStart(2, '0')} / {String(matrixNodes.length).padStart(2, '0')}</span>
                    <strong>{activeMatrixNode.label}</strong>
                    <span>{activeMatrixNode.detail}</span>
                  </div>
                  <footer className={styles.matrixFooter}>
                    <span><i /> 08 nodes active</span>
                    <span>{completed.length} learning signals</span>
                  </footer>
                </section>
                <p className={styles.subLabel} style={{ marginTop: '1.4rem' }}>Theme Skin</p>
                <div className={styles.skinsGrid}>
                  <button
                    className={`${styles.skinCard} ${activeTheme === '' ? styles.skinActive : ''}`}
                    onClick={() => applySkin('')}
                  >
                    <div className={styles.skinPreview} style={{ background: '#080d17', border: '1px solid #1e293b' }}>
                      <div className={styles.skinDot} style={{ background: '#6366f1' }} />
                      <div className={styles.skinDot} style={{ background: '#06b6d4', opacity: 0.6 }} />
                    </div>
                    <span className={styles.skinIcon}>◈</span>
                    <span className={styles.skinName}>Default</span>
                    <span className={styles.skinTier}>Always on</span>
                  </button>
                  {APPEARANCE_SKINS.map(skin => {
                    const isOwned  = skin.free || ownedSkinSlugs.has(skin.slug);
                    const isActive = activeTheme === skin.slug;
                    return (
                      <button
                        key={skin.slug}
                        className={`${styles.skinCard} ${isActive ? styles.skinActive : ''} ${!isOwned ? styles.skinLocked : ''}`}
                        onClick={() => isOwned && applySkin(skin.slug)}
                        disabled={!isOwned}
                        title={isOwned ? skin.desc : 'Earn via achievement milestones'}
                      >
                        <div className={styles.skinPreview} style={{ background: skin.bg, border: `1px solid ${skin.accent}44` }}>
                          <div className={styles.skinDot} style={{ background: skin.accent }} />
                          <div className={styles.skinDot} style={{ background: skin.accent2, opacity: 0.7 }} />
                          {!isOwned && <span className={styles.skinLockIcon}>🔒</span>}
                        </div>
                        <span className={styles.skinIcon}>{skin.icon}</span>
                        <span className={styles.skinName}>{skin.name}</span>
                        <span className={styles.skinTier}>{isOwned ? skin.label : 'Locked'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress */}
            {activeTab === 'progress' && (
              <div className={styles.tabPane} role="tabpanel" id="profile-panel-progress">
                <div className={styles.statRow}>
                  <div className={styles.statBox}>
                    <span className={styles.statVal}>{completed.length}</span>
                    <span className={styles.statKey}>Completed</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statVal}>{TOTAL - completed.length}</span>
                    <span className={styles.statKey}>Remaining</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statVal}>{profile?.streak ?? 0}<span style={{ fontSize: '0.85em' }}>🔥</span></span>
                    <span className={styles.statKey}>Day Streak</span>
                  </div>
                </div>
                {Object.keys(langCounts).length > 0 ? (
                  <>
                    <p className={styles.subLabel} style={{ marginTop: '1.25rem' }}>Signal Breakdown</p>
                    <div className={styles.langGrid}>
                      {Object.entries(langCounts).map(([lang, count]) => (
                        <div key={lang} className={styles.langItem}>
                          <div className={styles.langDot} style={{ background: LANG_COLOR[lang] }} />
                          <span className={styles.langName}>{lang}</span>
                          <div className={styles.langBar}>
                            <div
                              className={styles.langFill}
                              style={{ width: Math.round((count / 6) * 100) + '%', background: LANG_COLOR[lang] }}
                            />
                          </div>
                          <span className={styles.langCount}>{count}/6</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.emptyState} style={{ marginTop: '1rem' }}>
                    Complete lessons to see your signal breakdown.
                  </p>
                )}
              </div>
            )}

            {/* Activity */}
            {activeTab === 'activity' && (
              <div className={styles.tabPane} role="tabpanel" id="profile-panel-activity">
                <div className={styles.activityHeader}>
                  <span className={styles.subLabel}>Recent Lessons</span>
                  <Link href="/roadmap" className={styles.linkBtn}>Nexus Path →</Link>
                </div>
                {recentKeys.length === 0 ? (
                  <p className={styles.emptyState}>
                    No lessons yet —{' '}
                    <Link href="/curriculum" className={styles.inlineLink}>start learning</Link>.
                  </p>
                ) : (
                  <ul className={styles.activityList}>
                    {recentKeys.map(key => {
                      const label = ALL_LESSONS[key] ?? key;
                      const lang  = label.split(' · ')[0];
                      const color = LANG_COLOR[lang] ?? '#818cf8';
                      return (
                        <li key={key} className={styles.activityItem}>
                          <span className={styles.activityDot} style={{ background: color, boxShadow: '0 0 6px ' + color + '88' }} />
                          <span className={styles.activityLabel}>{label}</span>
                          <span className={styles.activityXp}>+{XP_PER_LESSON} XP</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

          </div>
        </div>{/* tabsCard */}
      </div>{/* container */}
    </main>
  );
}