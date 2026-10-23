'use client';
import { useState, useEffect } from 'react';
import GameIcon, { stripLeadingEmoji } from "@/components/GameIcon";
import StatIcon from "@/components/StatIcon";
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import {
  api, getOwnedItems,
  getLocalCredits, addLocalCredits, spendLocalCredits,
  getLocalOwnedIds, addLocalOwnedId,
} from '@/lib/api';
import styles from './Store.module.css';

interface StoreItemData {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  creditCost: number;
  gameSlug: string | null;
  cosmeticType: string | null;
  applyValue: string | null;
  oneTimePurchase: boolean;
  owned: boolean;
  isPrize: boolean;
}

interface CatalogResponse {
  credits: number;
  items: StoreItemData[];
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  game:     { label: 'Games',      icon: '◈' },
  powerup:  { label: 'Power-Ups',  icon: '⟁' },
  cosmetic: { label: 'Cosmetics',  icon: '◎' },
};

const SECTION_META: Record<string, { label: string; icon: string }> = {
  game:     { label: 'Games',            icon: '◈' },
  powerup:  { label: 'Power-Ups',        icon: '⟁' },
  theme:    { label: 'Themes',           icon: '◐' },
  emblem:   { label: 'Emblems',          icon: '✦' },
  cosmetic: { label: 'Other Cosmetics',  icon: '◎' },
};
const SECTION_ORDER = ['game', 'powerup', 'theme', 'emblem', 'cosmetic'];

const TABS = ['game', 'powerup', 'cosmetic', 'all'] as const;
type Tab = typeof TABS[number];

export default function StorePage() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [ownedGameSlugs, setOwnedGameSlugs] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const localIds = new Set(getLocalOwnedIds());

    // Catalog works with or without auth — always load it
    const catalogLoad = api.get<CatalogResponse>('/api/store')
      .then(cat => {
        // Logged-in: use server credits. Offline: use localStorage credits.
        const credits = token ? cat.credits : getLocalCredits();
        // Merge server-owned flags with locally-owned ids
        const items = cat.items.map(i => ({ ...i, owned: i.owned || localIds.has(i.id) }));
        setCatalog({ ...cat, credits, items });
      })
      .catch(() => setError('Could not connect to store. Try refreshing.'));

    // Owned items from server (requires valid auth — failure is non-fatal)
    const ownedLoad = token
      ? getOwnedItems()
          .then(owned => {
            const slugs = new Set(owned.flatMap(o => o.gameSlug ? [o.gameSlug] : []));
            setOwnedGameSlugs(slugs);
          })
          .catch(() => { /* token expired — catalog still loaded, owned list from localStorage */ })
      : Promise.resolve();

    Promise.all([catalogLoad, ownedLoad]).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleBuy(item: StoreItemData) {
    if (!catalog) return;
    setPurchasing(item.id);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      // Offline purchase — use localStorage credits
      const ok = spendLocalCredits(item.creditCost);
      if (!ok) {
        showToast('Not enough credits', 'error');
        setPurchasing(null);
        return;
      }
      addLocalOwnedId(item.id);
      const newCredits = getLocalCredits();
      setCatalog(prev => {
        if (!prev) return prev;
        const newItems = prev.items.map(i => i.id === item.id ? { ...i, owned: true } : i);
        return { ...prev, credits: newCredits, items: newItems };
      });
      if (item.gameSlug) setOwnedGameSlugs(prev => new Set([...prev, item.gameSlug!]));
      showToast(`${stripLeadingEmoji(item.name)} unlocked!`, 'success');
      setPurchasing(null);
      return;
    }

    // Online purchase
    try {
      const res = await api.post<{ success: boolean; credits: number }>(`/api/store/buy/${item.id}`);
      setCatalog(prev => {
        if (!prev) return prev;
        const newItems = prev.items.map(i => i.id === item.id ? { ...i, owned: true } : i);
        return { credits: res.credits, items: newItems };
      });
      if (item.gameSlug) {
        setOwnedGameSlugs(prev => new Set([...prev, item.gameSlug!]));
      }
      showToast(`${stripLeadingEmoji(item.name)} unlocked!`, 'success');
    } catch (e: any) {
      showToast(e?.message ?? 'Purchase failed', 'error');
    } finally {
      setPurchasing(null);
    }
  }

  const [rotIdx, setRotIdx] = useState(0);

  // Build rotating spotlight: one unowned item per category (powerup, cosmetic, game)
  const spotlightItems = (() => {
    if (!catalog) return [];
    const cats: Array<'powerup' | 'cosmetic' | 'game'> = ['powerup', 'cosmetic', 'game'];
    return cats.flatMap(cat => {
      const item = catalog.items.find(i => i.category === cat && !i.owned);
      return item ? [item] : [];
    });
  })();

  useEffect(() => {
    if (spotlightItems.length < 2) return;
    const id = setInterval(() => setRotIdx(i => (i + 1) % spotlightItems.length), 8000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlightItems.length]);

  const spotlightItem = spotlightItems[rotIdx] ?? null;
  const displayed = catalog?.items.filter(i => tab === 'all' || i.category === tab) ?? [];
  const sectionOf = (i: StoreItemData) =>
    i.category !== 'cosmetic' ? i.category
      : i.cosmeticType === 'theme' ? 'theme'
      : i.cosmeticType === 'avatar' ? 'emblem'
      : 'cosmetic';
  const sections = SECTION_ORDER
    .map(key => ({ key, items: displayed.filter(i => sectionOf(i) === key) }))
    .filter(sec => sec.items.length > 0);
  const credits = catalog?.credits ?? 0;

  const spotlightCanAfford = spotlightItem ? credits >= spotlightItem.creditCost : false;
  const spotlightPurchasing = spotlightItem ? purchasing === spotlightItem.id : false;
  const spotlightCatMeta = spotlightItem
    ? (CATEGORY_META[spotlightItem.category] ?? { icon: '◈', label: spotlightItem.category })
    : null;

  return (
    <main className={styles.main}>
      <PageShell />

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`}>
          {toast.msg}
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>Credits Store</div>
          <h1 className={styles.title}>
            <span className={styles.titleGradient}>Spend Your Credits</span>
          </h1>
          <p className={styles.subtitle}>
            Unlock games, power up your learning, and personalise your profile.
          </p>
          <div className={styles.balancePill}>
            <span className={styles.balanceIcon}>⬡</span>
            <span className={styles.balanceAmount}>{loading ? '—' : credits}</span>
            <span className={styles.balanceLabel}>Credits</span>
          </div>
        </header>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* ── Rotating Spotlight ── */}
        {!loading && spotlightItem && spotlightCatMeta && (
          <section className={styles.featuredSection}>
            <div className={styles.featuredHeader}>
              <h2 className={styles.featuredTitle}><StatIcon name="energy" size={16} /> Spotlight</h2>
              <span className={styles.spotlightDots}>
                {spotlightItems.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.spotlightDot} ${i === rotIdx ? styles.spotlightDotActive : ''}`}
                    onClick={() => setRotIdx(i)}
                    aria-label={`Show item ${i + 1}`}
                  />
                ))}
              </span>
            </div>
            <div className={styles.spotlightCard}>
              <span className={styles.spotlightBadge}>{spotlightCatMeta.icon} {spotlightCatMeta.label}</span>
              <span className={styles.spotlightIcon}><GameIcon slug={spotlightItem.gameSlug ?? spotlightItem.applyValue} fallback={spotlightItem.icon} size={34} /></span>
              <div className={styles.spotlightInfo}>
                <span className={styles.spotlightName}>{stripLeadingEmoji(spotlightItem.name)}</span>
                <span className={styles.spotlightDesc}>{spotlightItem.description}</span>
              </div>
              <button
                className={`${styles.buyBtn} ${!spotlightCanAfford ? styles.buyBtnDisabled : ''}`}
                onClick={() => spotlightCanAfford && handleBuy(spotlightItem)}
                disabled={!spotlightCanAfford || spotlightPurchasing}
              >
                {spotlightPurchasing ? '...' : <><span className={styles.buyBtnIcon}>⬡</span> {spotlightItem.creditCost}</>}
              </button>
            </div>
          </section>
        )}

        <nav className={styles.tabRow}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'all' ? '⊞ All' : `${CATEGORY_META[t].icon} ${CATEGORY_META[t].label}`}
            </button>
          ))}
        </nav>

        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}
        {!loading && sections.map(sec => (
          <section key={sec.key} className={styles.storeSection}>
            <h2 className={styles.sectionTitle}>
              {SECTION_META[sec.key].icon} {SECTION_META[sec.key].label}
              <span className={styles.sectionCount}>{sec.items.length}</span>
            </h2>
            <div className={styles.grid}>
              {sec.items.map(item => {
                const isGameOwned = item.category === 'game' && item.gameSlug
                  ? ownedGameSlugs.has(item.gameSlug) || item.owned
                  : item.owned;
                const canAfford = credits >= item.creditCost;
                const isPurchasing = purchasing === item.id;
                return (
                  <div
                    key={item.id}
                    className={`${styles.card} ${isGameOwned ? styles.cardOwned : ''} ${!canAfford && !isGameOwned ? styles.cardAffordable : ''}`}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.itemIcon}><GameIcon slug={item.gameSlug ?? item.applyValue} fallback={item.icon} size={26} /></span>
                      <span className={`${styles.categoryChip} ${styles[`cat_${item.category}`]}`}>
                        {CATEGORY_META[item.category]?.label ?? item.category}
                      </span>
                      {item.category === 'game' && !isGameOwned && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}><StatIcon name="lock" size={12} /></span>
                      )}
                    </div>
                    <h3 className={styles.itemName}>{stripLeadingEmoji(item.name)}</h3>
                    <p className={styles.itemDesc}>{item.description}</p>
                    <div className={styles.cardFooter}>
                      {isGameOwned ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                          {item.isPrize ? (
                            <span className={styles.ownedBadge}><StatIcon name="medal" size={12} /> Earned as Prize</span>
                          ) : (
                            <span className={styles.ownedBadge}>✶ Owned</span>
                          )}
                          {item.category === 'game' && item.gameSlug && (
                            <Link
                              href={`/games/${item.gameSlug}`}
                              className={styles.playLink}
                            >
                              ▶ Play
                            </Link>
                          )}
                        </div>
                      ) : (
                        <button
                          className={`${styles.buyBtn} ${!canAfford ? styles.buyBtnDisabled : ''}`}
                          onClick={() => canAfford && handleBuy(item)}
                          disabled={!canAfford || isPurchasing}
                        >
                          {isPurchasing ? '...' : (
                            <><span className={styles.buyBtnIcon}>⬡</span> {item.creditCost}</>
                          )}
                        </button>
                      )}
                      {!isGameOwned && !canAfford && (
                        <span className={styles.needMore}>
                          Need {item.creditCost - credits} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
