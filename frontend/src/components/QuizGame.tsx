'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { submitXp, addLocalCredits, getLocalCredits, GAME_CREDITS } from '@/lib/api';

export interface QuizQuestion { q: string; opts: string[]; a: number; cat?: string }

interface QuizGameProps {
  questions: QuizQuestion[];
  xpPerCorrect: number;
  difficulty: keyof typeof GAME_CREDITS;
  feedbackDelayMs: number;
  maxWidth: number;
  questionFontSize: string;
  resultIcon: ReactNode;
  resultTitle: string;
  messages: { high: string; mid: string; low: string };
  defaultBadge?: string;
  categoryColors?: Record<string, string>;
}

type Phase = 'question' | 'feedback' | 'result';
interface Reward { xp: number; credits: number; isPerfect: boolean; totalCredits: number; finalScore: number; }

export default function QuizGame({
  questions, xpPerCorrect, difficulty, feedbackDelayMs, maxWidth, questionFontSize,
  resultIcon, resultTitle, messages, defaultBadge, categoryColors = {},
}: QuizGameProps) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [selected, setSelected] = useState<number | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);

  const total = questions.length;
  const q = questions[current];

  const handleAnswer = (idx: number) => {
    if (phase !== 'question') return;
    const correct = idx === q.a;
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);
    setSelected(idx);
    setPhase('feedback');

    setTimeout(async () => {
      if (current + 1 < total) {
        setCurrent(c => c + 1);
        setSelected(null);
        setPhase('question');
      } else {
        const xpEarned = newScore * xpPerCorrect;
        submitXp(xpEarned, undefined, undefined, true).catch(() => null);
        const isPerfect = newScore === total;
        const credits = isPerfect ? GAME_CREDITS[difficulty] : 0;
        if (credits > 0) addLocalCredits(credits);
        setReward({ xp: xpEarned, credits, isPerfect, totalCredits: getLocalCredits(), finalScore: newScore });
        setPhase('result');
      }
    }, feedbackDelayMs);
  };

  const handleRestart = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setPhase('question');
    setReward(null);
  };

  if (phase === 'result' && reward) {
    const pct = Math.round((reward.finalScore / total) * 100);
    const stars = pct >= 90 ? '★★★' : pct >= 60 ? '★★☆' : '★☆☆';
    const msg = pct >= 90 ? messages.high : pct >= 60 ? messages.mid : messages.low;

    return (
      <main style={{ maxWidth, margin: '2.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#0d1424', border: '1px solid #1e3a5f', borderRadius: 20, padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 40px rgba(6,182,212,0.12)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{resultIcon}</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg,#e0e7ff,#818cf8,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 0.35rem' }}>
            {resultTitle}
          </h2>
          <div style={{ fontSize: '1.5rem', color: '#ffd700', marginBottom: '0.2rem' }}>{stars}</div>
          {reward.isPerfect && (
            <div style={{ display: 'inline-block', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '0.3rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
              ✦ PERFECT RUN — no mistakes!
            </div>
          )}
          <div style={{ color: '#94a3b8', marginBottom: '1.75rem' }}>{msg}</div>

          <div style={{ background: '#111827', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Score</span>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{reward.finalScore} / {total} &nbsp;({pct}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>XP Earned</span>
              <span style={{ fontWeight: 700, color: '#818cf8' }}>+{reward.xp} XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Credits</span>
              <span style={{ fontWeight: 700, color: reward.credits > 0 ? '#f59e0b' : '#475569' }}>
                {reward.credits > 0 ? `+${reward.credits} ◈` : '—'}
                {reward.credits === 0 && <span style={{ fontSize: '0.65rem', color: '#475569', marginLeft: 6 }}>perfect run = +{GAME_CREDITS[difficulty]} ◈</span>}
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

  const progressPct = Math.round((current / total) * 100);
  const badge = q.cat ?? defaultBadge ?? '';
  const badgeColor = categoryColors[badge] ?? '#6366f1';

  return (
    <main style={{ maxWidth, margin: '2.5rem auto', padding: '0 1rem' }}>
      <div style={{ background: '#0d1424', border: '1px solid #1e3a5f', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 40px rgba(6,182,212,0.10)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Link href="/games" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>← Games</Link>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: '0.3rem 0.9rem', fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700 }}>
            ★ {score}
          </div>
        </div>

        <div style={{ height: 6, background: '#1e293b', borderRadius: 4, marginBottom: '1.25rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#6366f1,#06b6d4)', borderRadius: 4, transition: 'width 0.35s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ background: badgeColor + '22', color: badgeColor, borderRadius: 6, padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em' }}>
            {badge}
          </span>
          <span style={{ color: '#475569', fontSize: '0.875rem' }}>{current + 1} / {total}</span>
        </div>

        <div style={{ fontSize: questionFontSize, fontWeight: 700, color: '#e2e8f0', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {q.q}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {q.opts.map((opt, idx) => {
            const isCorrect  = idx === q.a;
            const isSelected = selected === idx;
            let bg     = '#1e293b';
            let border = '1.5px solid #334155';
            let color  = '#cbd5e1';
            if (phase === 'feedback') {
              if (isCorrect)       { bg = '#052e16'; border = '1.5px solid #16a34a'; color = '#4ade80'; }
              else if (isSelected) { bg = '#2d1515'; border = '1.5px solid #ef4444'; color = '#f87171'; }
            }
            const labelBg = phase === 'feedback' && isCorrect ? '#16a34a' : phase === 'feedback' && isSelected ? '#ef4444' : '#334155';

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={phase === 'feedback'}
                style={{ background: bg, border, color, borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.95rem', fontWeight: 600, cursor: phase === 'question' ? 'pointer' : 'default', textAlign: 'left', transition: 'all 0.15s', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                onMouseEnter={e => { if (phase === 'question') e.currentTarget.style.borderColor = '#6366f1'; }}
                onMouseLeave={e => { if (phase === 'question') e.currentTarget.style.borderColor = '#334155'; }}
              >
                <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, background: labelBg, color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {['A', 'B', 'C', 'D'][idx]}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {phase === 'feedback' && isCorrect  && <span style={{ color: '#4ade80', fontWeight: 800 }}>✓</span>}
                {phase === 'feedback' && isSelected && !isCorrect && <span style={{ color: '#f87171', fontWeight: 800 }}>✗</span>}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && selected === q.a && (
          <div style={{ textAlign: 'center', marginTop: '1.1rem', color: '#4ade80', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em' }}>
            +{xpPerCorrect} XP ✨
          </div>
        )}
      </div>
    </main>
  );
}
