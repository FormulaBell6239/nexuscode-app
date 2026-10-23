'use client';
import { useState, useRef } from 'react';
import StatIcon from "@/components/StatIcon";
import Link from 'next/link';
import { submitXp, addLocalCredits, getLocalCredits, GAME_CREDITS } from '@/lib/api';

const BASE_XP   = 50;  // per solved challenge
const BONUS_XP  = 25;  // bonus when you beat the par time
const DIFFICULTY = 'Hard' as const;

// Each challenge uses a test function that evaluates the user's code safely
const challenges = [
  {
    prompt: 'Write a function square(n) that returns n squared.',
    placeholder: 'function square(n) {\n  \n}',
    par: 30,  // seconds — beat this to earn the bonus
    test: (code: string) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`${code}; return typeof square !== 'undefined' ? square : undefined;`)() as ((n: number) => number) | undefined;
        return typeof fn === 'function' && fn(3) === 9 && fn(0) === 0 && fn(-4) === 16;
      } catch { return false; }
    },
  },
  {
    prompt: 'Write a function isEven(n) that returns true if n is even, false otherwise.',
    placeholder: 'function isEven(n) {\n  \n}',
    par: 25,
    test: (code: string) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`${code}; return typeof isEven !== 'undefined' ? isEven : undefined;`)() as ((n: number) => boolean) | undefined;
        return typeof fn === 'function' && fn(4) === true && fn(7) === false && fn(0) === true;
      } catch { return false; }
    },
  },
  {
    prompt: 'Write a function sum(a, b) that returns the sum of a and b.',
    placeholder: 'function sum(a, b) {\n  \n}',
    par: 20,
    test: (code: string) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`${code}; return typeof sum !== 'undefined' ? sum : undefined;`)() as ((a: number, b: number) => number) | undefined;
        return typeof fn === 'function' && fn(2, 3) === 5 && fn(-1, 1) === 0 && fn(0, 0) === 0;
      } catch { return false; }
    },
  },
  {
    prompt: 'Write a function max(a, b) that returns the larger of two numbers.',
    placeholder: 'function max(a, b) {\n  \n}',
    par: 30,
    test: (code: string) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`${code}; return typeof max !== 'undefined' ? max : undefined;`)() as ((a: number, b: number) => number) | undefined;
        return typeof fn === 'function' && fn(3, 7) === 7 && fn(9, 2) === 9 && fn(5, 5) === 5;
      } catch { return false; }
    },
  },
  {
    prompt: "Write a function reverseString(s) that returns the string reversed.\nExample: reverseString('hello') → 'olleh'",
    placeholder: 'function reverseString(s) {\n  \n}',
    par: 40,
    test: (code: string) => {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`${code}; return typeof reverseString !== 'undefined' ? reverseString : undefined;`)() as ((s: string) => string) | undefined;
        return typeof fn === 'function' && fn('hello') === 'olleh' && fn('ab') === 'ba' && fn('') === '';
      } catch { return false; }
    },
  },
];

type Phase = 'idle' | 'running' | 'feedback' | 'result';
interface Reward { xp: number; credits: number; isPerfect: boolean; totalCredits: number; solved: number; totalSecs: number; }

export default function SpeedCoding() {
  const [current, setCurrent]   = useState(0);
  const [userCode, setUserCode] = useState('');
  const [phase, setPhase]       = useState<Phase>('idle');
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved]     = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [bonusCount, setBonusCount] = useState(0);
  const [reward, setReward]     = useState<Reward | null>(null);
  const startRef  = useRef<number | null>(null);  // challenge start time
  const totalRef  = useRef<number>(0);            // cumulative seconds
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const total = challenges.length;
  const c = challenges[current];

  const elapsed = () => startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;

  const handleStart = () => {
    setUserCode(c.placeholder);
    startRef.current = Date.now();
    setPhase('running');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCheck = async () => {
    if (phase !== 'running') return;
    const secs = elapsed();
    if (!c.test(userCode)) {
      setMistakes(m => m + 1);
      setFeedback('❌ Tests failed — check your logic and try again.');
      return;
    }

    const beatPar = secs <= c.par;
    const newSolved = solved + 1;
    setSolved(newSolved);
    if (beatPar) setBonusCount(b => b + 1);
    totalRef.current += secs;
    setFeedback(`✅ Correct!${beatPar ? '  ⚡ Speed bonus!' : ''}  (${secs}s)`);
    setPhase('feedback');

    setTimeout(async () => {
      if (current + 1 < total) {
        setCurrent(i => i + 1);
        setUserCode('');
        setFeedback('');
        setPhase('idle');
      } else {
        const xpEarned = newSolved * BASE_XP + (beatPar ? bonusCount + 1 : bonusCount) * BONUS_XP;
        submitXp(Math.min(xpEarned, 500), undefined, undefined, true).catch(() => null);
        const isPerfect = mistakes === 0 && newSolved === total;
        const credits = isPerfect ? GAME_CREDITS[DIFFICULTY] : 0;
        if (credits > 0) addLocalCredits(credits);
        setReward({ xp: Math.min(xpEarned, 500), credits, isPerfect, totalCredits: getLocalCredits(), solved: newSolved, totalSecs: totalRef.current });
        setPhase('result');
      }
    }, 1400);
  };

  const handleRestart = () => {
    setCurrent(0);
    setUserCode('');
    setFeedback('');
    setSolved(0);
    setMistakes(0);
    setBonusCount(0);
    setReward(null);
    startRef.current = null;
    totalRef.current = 0;
    setPhase('idle');
  };

  // ── Result ──────────────────────────────────────────────────────────────
  if (phase === 'result' && reward) {
    const pct   = Math.round((reward.solved / total) * 100);
    const stars = pct >= 90 ? '★★★' : pct >= 60 ? '★★☆' : '★☆☆';
    const msg   = pct >= 90 ? 'Lightning coder! ⚡' : pct >= 60 ? 'Solid speed!' : 'Nice run!';

    return (
      <main style={{ maxWidth: 560, margin: '2.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#0d1424', border: '1px solid #1e3a5f', borderRadius: 20, padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 40px rgba(6,182,212,0.12)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}><StatIcon name="energy" size={56} /></div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg,#e0e7ff,#818cf8,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 0.35rem' }}>
            Speed Run Complete!
          </h2>
          <div style={{ fontSize: '1.5rem', color: '#ffd700', marginBottom: '0.2rem' }}>{stars}</div>
          {reward.isPerfect && (
            <div style={{ display: 'inline-block', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '0.3rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
              ✦ PERFECT RUN — first attempt on every challenge!
            </div>
          )}
          <div style={{ color: '#94a3b8', marginBottom: '1.75rem' }}>{msg}</div>

          <div style={{ background: '#111827', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Solved</span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{reward.solved} / {total} &nbsp;({pct}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Total Time</span>
              <span style={{ fontWeight: 700, color: '#06b6d4' }}>{reward.totalSecs}s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Speed Bonuses</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{bonusCount} ⚡</span>
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

  // ── Playing screen ───────────────────────────────────────────────────────
  const progressPct = Math.round((current / total) * 100);

  return (
    <main style={{ maxWidth: 640, margin: '2.5rem auto', padding: '0 1rem' }}>
      <div style={{ background: '#0d1424', border: '1px solid #1e3a5f', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 40px rgba(6,182,212,0.10)' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href="/games" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>← Games</Link>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: '0.3rem 0.9rem', fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700 }}>
            ✓ {solved}/{total}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#1e293b', borderRadius: 4, marginBottom: '1.25rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 4, transition: 'width 0.35s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ background: '#f59e0b22', color: '#f59e0b', borderRadius: 6, padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
            Speed  · Par {c.par}s
          </span>
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>Challenge {current + 1} / {total}</span>
        </div>

        {/* Prompt */}
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1.25rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {c.prompt}
        </div>

        {/* Code editor */}
        <textarea
          ref={inputRef}
          value={userCode}
          onChange={e => setUserCode(e.target.value)}
          rows={7}
          spellCheck={false}
          disabled={phase === 'idle' || phase === 'feedback'}
          style={{ width: '100%', fontFamily: "'Fira Code', 'Fira Mono', monospace", fontSize: '0.9rem', background: phase === 'idle' ? '#0a0f1e80' : '#0a0f1e', color: '#e2e8f0', border: `1.5px solid ${phase === 'running' ? '#f59e0b' : '#1e3a5f'}`, borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, opacity: phase === 'idle' ? 0.5 : 1, transition: 'border-color 0.2s, opacity 0.2s' }}
        />

        {/* Buttons */}
        {phase === 'idle' ? (
          <button
            onClick={handleStart}
            style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#0a0f1e', border: 'none', borderRadius: 10, padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Start Challenge ▶
          </button>
        ) : phase === 'running' ? (
          <button
            onClick={handleCheck}
            style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#0a0f1e', border: 'none', borderRadius: 10, padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Submit
          </button>
        ) : null}

        {feedback && (
          <div style={{ marginTop: '0.75rem', fontWeight: 700, color: feedback.startsWith('✅') ? '#4ade80' : '#fbbf24', fontSize: '0.95rem' }}>
            {feedback}
          </div>
        )}
        {feedback.startsWith('✅') && (
          <div style={{ marginTop: '0.35rem', color: '#818cf8', fontWeight: 700 }}>
            +{BASE_XP}{feedback.includes('Speed bonus') ? ` +${BONUS_XP} bonus` : ''} XP ✨
          </div>
        )}
      </div>
    </main>
  );
}