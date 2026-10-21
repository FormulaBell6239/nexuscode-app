'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/PageShell';
import styles from './Upgrade.module.css';

const FREE_FEATURES = [
  { icon: '⚡', text: '10 energy per day' },
  { icon: '◎', text: '4 tracks: HTML, CSS, JS, Python' },
  { icon: '◆', text: 'Leaderboards & achievements' },
  { icon: '⬡', text: 'Nexus Path progress tracking' },
  { icon: '◈', text: 'Mini-games & playground' },
  { icon: '↻', text: 'Energy refills every midnight' },
  { icon: '▭', text: 'Ad-supported — helps keep the free tier free' },
];

const PRO_FEATURES = [
  { icon: '∞', text: 'Unlimited energy — no interruptions', highlight: true },
  { icon: '✕', text: 'No ads — completely distraction-free', highlight: true },
  { icon: '◎', text: '4 tracks: HTML, CSS, JS, Python' },
  { icon: '◆', text: 'Leaderboards & achievements' },
  { icon: '⬡', text: 'Nexus Path progress tracking' },
  { icon: '◈', text: 'Mini-games & playground' },
  { icon: '✦', text: 'Nexus Pro badge on profile & leaderboard', highlight: true },
  { icon: '⚡', text: 'Priority access to new features', highlight: true },
  { icon: '❤', text: 'Directly supports NexusCode', highlight: true },
];

const QUANTUM_FEATURES = [
  { icon: '∞', text: 'Unlimited energy — no interruptions', highlight: true },
  { icon: '✕', text: 'No ads — completely distraction-free', highlight: true },
  { icon: '◎', text: '4 tracks: HTML, CSS, JS, Python' },
  { icon: '◆', text: 'Leaderboards & achievements' },
  { icon: '⬡', text: 'Nexus Path progress tracking' },
  { icon: '◈', text: 'Mini-games & playground' },
  { icon: '✦', text: 'Nexus Quantum badge + exclusive profile glow', highlight: true },
  { icon: '⚡', text: 'AI-powered coding hints', highlight: true },
  { icon: '◉', text: 'Early access to every new track & course', highlight: true },
  { icon: '▣', text: 'Advanced learning analytics dashboard', highlight: true },
  { icon: '❤', text: 'Directly supports NexusCode', highlight: true },
];

const PLANS = [
  { id: 'core',    label: 'Nexus Core',    price: '$0',     per: '/mo', desc: 'Everything you need to start coding.',   features: FREE_FEATURES,    cardClass: '',          badge: null,                      badgeClass: '' },
  { id: 'pro',     label: 'Nexus Pro',     price: '$7',     per: '/mo', desc: 'Unlimited access. Zero interruptions.',  features: PRO_FEATURES,     cardClass: 'cardPro',   badge: '✦ NEXUS PRO',             badgeClass: 'proBadgeCorner' },
  { id: 'quantum', label: 'Nexus Quantum', price: '$10.99', per: '/mo', desc: 'The full Nexus experience. AI-powered.', features: QUANTUM_FEATURES, cardClass: 'cardQuantum', badge: '⬡ NEXUS QUANTUM',        badgeClass: 'quantumBadgeCorner' },
];

export default function UpgradePage() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(1); // start on Pro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingQ, setLoadingQ] = useState(false);
  const [errorQ, setErrorQ] = useState('');

  async function handleUpgrade(plan: 'pro' | 'quantum' = 'pro') {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth?redirect=/upgrade');
      return;
    }
    if (plan === 'quantum') { setLoadingQ(true); setErrorQ(''); }
    else { setLoading(true); setError(''); }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Could not start checkout');
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      if (plan === 'quantum') { setErrorQ('Something went wrong. Please try again.'); setLoadingQ(false); }
      else { setError('Something went wrong. Please try again.'); setLoading(false); }
    }
  }

  return (
    <div className="appContent">
      <PageShell />
      <div className={styles.page}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <span className={styles.eyebrow}>Pricing</span>
          <h1 className={styles.title}>
            Learn without limits
          </h1>
          <p className={styles.subtitle}>
            Free to start. Upgrade when you&apos;re ready to go all-in.
          </p>
        </header>

        {/* ── Carousel ── */}
        <div className={styles.carousel}>
          <button
            className={styles.carouselArrow}
            onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            aria-label="Previous plan"
          >‹</button>

          <div className={styles.carouselTrack}>
            {PLANS.map((plan, idx) => {
              const offset = idx - activeIdx;
              let pos: 'active' | 'left' | 'right' | 'hidden' = 'hidden';
              if (offset === 0) pos = 'active';
              else if (offset === -1) pos = 'left';
              else if (offset === 1) pos = 'right';

              const isLoading = plan.id === 'pro' ? loading : loadingQ;
              const planError = plan.id === 'pro' ? error : errorQ;

              return (
                <div
                  key={plan.id}
                  className={`${styles.card} ${plan.cardClass ? styles[plan.cardClass as keyof typeof styles] : ''} ${styles[`card_${pos}`]}`}
                  data-pos={pos}
                  onClick={() => pos !== 'active' && setActiveIdx(idx)}
                  aria-hidden={pos === 'hidden'}
                >
                  {plan.badge && (
                    <div className={styles[plan.badgeClass as keyof typeof styles]}>{plan.badge}</div>
                  )}
                  <div className={styles.cardTop}>
                    <div className={styles.planLabel}>{plan.label}</div>
                    <div className={styles.price}>
                      <span className={styles.priceAmount}>{plan.price}</span>
                      <span className={styles.pricePer}>{plan.per}</span>
                    </div>
                    <p className={styles.planDesc}>{plan.desc}</p>
                  </div>

                  <ul className={styles.featureList}>
                    {plan.features.map((f) => (
                      <li key={f.text} className={`${styles.feature} ${'highlight' in f && f.highlight ? styles.featureHighlight : ''}`}>
                        <span className={styles.featureIcon}>{f.icon}</span>
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.cardCta}>
                    {plan.id === 'core' && (
                      <button className={styles.freeBtn} disabled>Current plan</button>
                    )}
                    {plan.id === 'pro' && (
                      <>
                        {error && <p className={styles.ctaError}>{error}</p>}
                        <button className={styles.upgradeBtn} onClick={() => handleUpgrade('pro')} disabled={loading}>
                          {loading ? 'Redirecting…' : 'Get Nexus Pro — $7/mo'}
                        </button>
                        <p className={styles.ctaNote}>Cancel anytime. No hidden fees.</p>
                      </>
                    )}
                    {plan.id === 'quantum' && (
                      <>
                        {errorQ && <p className={styles.ctaError}>{errorQ}</p>}
                        <button className={styles.quantumBtn} onClick={() => handleUpgrade('quantum')} disabled={loadingQ}>
                          {loadingQ ? 'Redirecting…' : 'Get Nexus Quantum — $10.99/mo'}
                        </button>
                        <p className={styles.ctaNote}>Cancel anytime. No hidden fees.</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className={styles.carouselArrow}
            onClick={() => setActiveIdx(i => Math.min(PLANS.length - 1, i + 1))}
            disabled={activeIdx === PLANS.length - 1}
            aria-label="Next plan"
          >›</button>
        </div>

        {/* ── Dot indicators ── */}
        <div className={styles.carouselDots}>
          {PLANS.map((plan, idx) => (
            <button
              key={plan.id}
              className={`${styles.dot} ${idx === activeIdx ? styles.dotActive : ''}`}
              onClick={() => setActiveIdx(idx)}
              aria-label={`View ${plan.label}`}
            />
          ))}
        </div>

        {/* ── FAQ ── */}
        <section className={styles.faq}>
          <h2 className={styles.faqTitle}>Common questions</h2>
          <div className={styles.faqGrid}>
            {[
              {
                q: 'What happens to my progress if I cancel?',
                a: "All your XP, completed lessons, and achievements are yours forever — cancelling just returns you to the 10-energy/day limit.",
              },
              {
                q: 'What is energy?',
                a: 'Energy powers your lessons. Each wrong answer costs energy. Nexus Core users get 10 energy that refills at midnight UTC. Nexus Pro and Quantum users have unlimited energy.',
              },
              {
                q: 'Can I switch from monthly to annual?',
                a: 'Annual billing is coming soon. You can manage your subscription at any time via the Settings → Plan section.',
              },
              {
                q: 'Is there a student discount?',
                a: 'Reach out via the Contact page and we will sort you out.',
              },
              {
                q: 'Why are there ads on the free tier?',
                a: 'Ads help cover server costs and keep NexusCode free for everyone. Pro removes all ads so you can focus entirely on learning.',
              },
            ].map(({ q, a }) => (
              <div key={q} className={styles.faqItem}>
                <p className={styles.faqQ}>{q}</p>
                <p className={styles.faqA}>{a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
