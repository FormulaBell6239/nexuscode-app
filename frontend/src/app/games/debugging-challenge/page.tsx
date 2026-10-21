'use client';
import { useState } from 'react';
import Link from 'next/link';
import { submitXp, addLocalCredits, getLocalCredits, GAME_CREDITS } from '@/lib/api';

const XP_PER_FIX = 30;
const DIFFICULTY = 'Medium' as const;

const challenges = [
  {
    title: 'Fix the add function',
    desc: 'This function should add two numbers, but it subtracts instead.',
    buggy: `function add(a, b) {\n  return a - b;\n}`,
    test: (code: string) => /return\s+a\s*\+\s*b/.test(code),
  },
  {
    title: 'Fix the loop bounds',
    desc: 'This loop runs one iteration too many and causes an out-of-bounds access.',
    buggy: `const arr = [1, 2, 3];\nfor (let i = 0; i <= arr.length; i++) {\n  console.log(arr[i]);\n}`,
    test: (code: string) => /i\s*<\s*arr\.length/.test(code) && !/i\s*<=\s*arr\.length/.test(code),
  },
  {
    title: 'Fix the typo in variable name',
    desc: 'A typo in the variable name causes a ReferenceError.',
    buggy: `function greet(name) {\n  return "Hello, " + nam;\n}`,
    test: (code: string) => /return\s+"Hello,\s*"\s*\+\s*name/.test(code),
  },
  {
    title: 'Fix the assignment vs. comparison',
    desc: 'The condition always evaluates to true because it assigns instead of comparing.',
    buggy: `function isAdult(age) {\n  if (age = 18) {\n    return true;\n  }\n  return false;\n}`,
    test: (code: string) => /if\s*\(\s*age\s*[=!]=+\s*18/.test(code) && !/if\s*\(\s*age\s*=[^=]/.test(code),
  },
  {
    title: 'Fix the missing return',
    desc: 'The function runs but always returns undefined because the result is not returned.',
    buggy: `function double(n) {\n  n * 2;\n}`,
    test: (code: string) => /return\s+n\s*\*\s*2/.test(code),
  },
  {
    title: 'Fix the wrong array method',
    desc: 'The code should add an item to the end of the array but uses the wrong method.',
    buggy: `const items = [];\nfunction addItem(item) {\n  items.pop(item);\n}`,
    test: (code: string) => /items\.push\(item\)/.test(code),
  },
];

type Phase = 'playing' | 'result';
interface Reward { xp: number; credits: number; isPerfect: boolean; totalCredits: number; fixed: number; }

export default function DebuggingChallenge() {
  const [current, setCurrent]   = useState(0);
  const [userCode, setUserCode] = useState(challenges[0].buggy);
  const [feedback, setFeedback] = useState('');
  const [fixed, setFixed]       = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase]       = useState<Phase>('playing');
  const [reward, setReward]     = useState<Reward | null>(null);
  const [checking, setChecking] = useState(false);

  const total = challenges.length;
  const c = challenges[current];

  const handleCheck = async () => {
    if (checking) return;
    if (c.test(userCode)) {
      const newFixed = fixed + 1;
      setFixed(newFixed);
      setFeedback('✅ Bug squashed! Nice work.');
      setChecking(true);
      setTimeout(async () => {
        if (current + 1 < total) {
          setCurrent(idx => idx + 1);
          setUserCode(challenges[current + 1].buggy);
          setFeedback('');
          setChecking(false);
        } else {
          const xpEarned = newFixed * XP_PER_FIX;
          submitXp(xpEarned, undefined, undefined, true).catch(() => null);
          const isPerfect = mistakes === 0 && newFixed === total;
          const credits = isPerfect ? GAME_CREDITS[DIFFICULTY] : 0;
          if (credits > 0) addLocalCredits(credits);
          setReward({ xp: xpEarned, credits, isPerfect, totalCredits: getLocalCredits(), fixed: newFixed });
          setPhase('result');
        }
      }, 1300);
    } else {
      setMistakes(m => m + 1);
      setFeedback('❌ Not quite. Check the code carefully.');
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setUserCode(challenges[0].buggy);
    setFeedback('');
    setFixed(0);
    setMistakes(0);
    setPhase('playing');
    setReward(null);
    setChecking(false);
  };

  // ── Result ─────────────────────────────────────────────────────────────
  if (phase === 'result' && reward) {
    const pct   = Math.round((reward.fixed / total) * 100);
    const stars = pct >= 90 ? '★★★' : pct >= 60 ? '★★☆' : '★☆☆';
    const msg   = pct >= 90 ? 'Flawless debugging! 🐛' : pct >= 60 ? 'Solid bug hunter!' : 'Keep at it!';

    return (
      <main style={{ maxWidth: 560, margin: '2.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#0d1424', border: '1px solid #1e3a5f', borderRadius: 20, padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 40px rgba(6,182,212,0.12)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🐞</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg,#e0e7ff,#818cf8,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 0.35rem' }}>
            All Bugs Fixed!
          </h2>
          <div style={{ fontSize: '1.5rem', color: '#ffd700', marginBottom: '0.2rem' }}>{stars}</div>
          {reward.isPerfect && (
            <div style={{ display: 'inline-block', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '0.3rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
              ✦ PERFECT RUN — no wrong submissions!
            </div>
          )}
          <div style={{ color: '#94a3b8', marginBottom: '1.75rem' }}>{msg}</div>

          <div style={{ background: '#111827', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Bugs Fixed</span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{reward.fixed} / {total} &nbsp;({pct}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>XP Earned</span>
              <span style={{ fontWeight: 700, color: '#818cf8' }}>+{reward.xp} XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Credits</span>
              <span style={{ fontWeight: 700, color: reward.credits > 0 ? '#f59e0b' : '#475569' }}>
                {reward.credits > 0 ? `+${reward.credits} ◈` : '—'}
                {reward.credits === 0 && <span style={{ fontSize: '0.65rem', color: '#475569', marginLeft: 6 }}>perfect run = +{GAME_CREDITS[DIFFICULTY]} ◈</span>}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
              <span style={{ color: '#64748b' }}>Total Credits</span>
              <span style={{ fontWeight: 800, color: '#f59e0b' }}>{reward.totalCredits} ◈</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={handleRestart} style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Play Again
            </button>
            <Link href="/games" style={{ background: '#1e293b', color: '#94a3b8', borderRadius: 10, padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              ← All Games
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Playing screen ──────────────────────────────────────────────────────
  const progressPct = Math.round((current / total) * 100);

  return (
    <main style={{ maxWidth: 620, margin: '2.5rem auto', padding: '0 1rem' }}>
      <div style={{ background: '#0d1424', border: '1px solid #1e3a5f', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 40px rgba(6,182,212,0.10)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href="/games" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>← Games</Link>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: '0.3rem 0.9rem', fontSize: '0.9rem', color: '#4ade80', fontWeight: 700 }}>
            🐛 {fixed} fixed
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#1e293b', borderRadius: 4, marginBottom: '1.25rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: 4, transition: 'width 0.35s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ background: '#16a34a22', color: '#4ade80', borderRadius: 6, padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>Debug</span>
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>Challenge {current + 1} / {total}</span>
        </div>

        {/* Challenge info */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 0.4rem' }}>{c.title}</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>{c.desc}</p>

        {/* Code editor */}
        <textarea
          value={userCode}
          onChange={e => setUserCode(e.target.value)}
          rows={6}
          spellCheck={false}
          style={{ width: '100%', fontFamily: "'Fira Code', 'Fira Mono', monospace", fontSize: '0.9rem', background: '#0a0f1e', color: '#e2e8f0', border: '1.5px solid #1e3a5f', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
        />

        <button
          onClick={handleCheck}
          disabled={checking}
          style={{ background: checking ? '#1e293b' : 'linear-gradient(135deg,#16a34a,#4ade80)', color: checking ? '#64748b' : '#0a0f1e', border: 'none', borderRadius: 10, padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: checking ? 'default' : 'pointer', marginBottom: '0.75rem' }}
        >
          Check Fix
        </button>

        {feedback && (
          <div style={{ marginTop: '0.5rem', fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#fbbf24', fontSize: '0.95rem' }}>
            {feedback}
          </div>
        )}

        {feedback.startsWith('✅') && (
          <div style={{ marginTop: '0.35rem', color: '#818cf8', fontWeight: 700, fontSize: '1rem' }}>
            +{XP_PER_FIX} XP ✨
          </div>
        )}
      </div>
    </main>
  );
}