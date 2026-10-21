'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MOBILE_LESSONS, MobileStep } from '../lib/mobileLessons';
import styles from './MobileLessonView.module.css';

interface MobileLessonViewProps {
  lessonKey: string;
  onPass: () => void;
  onFail: () => void;
  onSubmit: () => void;
  hasSubmitted: boolean;
  onNext: () => void;
  hasNext: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export default function MobileLessonView({
  lessonKey,
  onPass,
  onFail,
  onSubmit,
  hasSubmitted,
  onNext,
  hasNext,
}: MobileLessonViewProps) {
  const lesson = MOBILE_LESSONS[lessonKey] ?? null;
  const steps: MobileStep[] = lesson?.steps ?? [];
  const totalSteps = steps.length;

  // ── Step engine state ─────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [passed, setPassed] = useState(false);

  // ── MCQ state ─────────────────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [mcqCorrect, setMcqCorrect] = useState(false);

  // ── Fill-blank state ──────────────────────────────────────────────────────
  const [inputVal, setInputVal] = useState('');
  const [fillState, setFillState] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fail guard: only fire onFail once per step ────────────────────────────
  const hasFiredFail = useRef(false);

  const step = steps[currentStep];

  // Auto-focus fill-blank input when it's the active step
  useEffect(() => {
    if (step?.type === 'fillblank') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [currentStep, step?.type]);

  // ── Advance to next step or complete lesson ───────────────────────────────
  const advance = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      setPassed(true);
      onPass();
      onSubmit();
    } else {
      setTimeout(() => {
        setCurrentStep((p) => p + 1);
        hasFiredFail.current = false;
        setSelectedIndex(null);
        setWrongIndex(null);
        setMcqCorrect(false);
        setFillState('idle');
        setInputVal('');
      }, 600);
    }
  }, [currentStep, totalSteps, onPass, onSubmit]);

  // ── MCQ handler ──────────────────────────────────────────────────────────
  const handleOptionTap = useCallback(
    (index: number) => {
      if (mcqCorrect || passed) return;
      if (step?.type !== 'mcq') return;

      setSelectedIndex(index);

      if (index === step.correct) {
        setMcqCorrect(true);
        setWrongIndex(null);
        advance();
      } else {
        setWrongIndex(index);
        if (!hasFiredFail.current) {
          hasFiredFail.current = true;
          onFail();
        }
        setTimeout(() => {
          setWrongIndex(null);
          setSelectedIndex(null);
        }, 600);
      }
    },
    [step, mcqCorrect, passed, onFail, advance],
  );

  // ── Fill-blank submit ────────────────────────────────────────────────────
  const handleFillSubmit = useCallback(() => {
    if (fillState === 'correct' || passed) return;
    if (step?.type !== 'fillblank') return;

    const trimmed = inputVal.trim().toLowerCase();
    const expected = step.answer.trim().toLowerCase();

    if (trimmed === expected) {
      setFillState('correct');
      advance();
    } else {
      setFillState('wrong');
      if (!hasFiredFail.current) {
        hasFiredFail.current = true;
        onFail();
      }
      setTimeout(() => {
        setFillState('idle');
        setInputVal('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 700);
    }
  }, [fillState, passed, step, inputVal, onFail, advance]);

  const handleFillKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleFillSubmit();
      }
    },
    [handleFillSubmit],
  );

  // ── Fallback (unmapped lesson key) ─────────────────────────────────────────
  if (!lesson || totalSteps === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.fallbackCard}>
          <p className={styles.fallbackText}>
            Complete this lesson by reading the instructions above, then tap below to continue.
          </p>
          {passed || hasSubmitted ? (
            <SuccessCard onNext={onNext} hasNext={hasNext} />
          ) : (
            <button
              className={styles.checkBtn}
              onClick={() => {
                setPassed(true);
                onPass();
                onSubmit();
              }}
            >
              Mark as Complete ✓
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Progress bar fill ────────────────────────────────────────────────────
  const progressPct = passed ? 100 : (currentStep / totalSteps) * 100;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>
      <p className={styles.stepLabel}>
        Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
      </p>

      {/* Success screen */}
      {passed ? (
        <SuccessCard onNext={onNext} hasNext={hasNext} />
      ) : step?.type === 'explain' ? (
        /* ── Explain step ──────────────────────────────────────────────── */
        <div className={styles.explainCard}>
          <p className={styles.explainText}>{step.text}</p>
          {step.code && (
            <pre className={styles.explainCode}>{step.code}</pre>
          )}
          <button className={styles.gotItBtn} onClick={advance}>
            Got it →
          </button>
        </div>
      ) : step?.type === 'mcq' ? (
        /* ── MCQ step ──────────────────────────────────────────────────── */
        <>
          <div className={styles.questionCard}>
            <p className={styles.questionLabel}>Choose the correct answer</p>
            <p className={styles.questionText}>{step.question}</p>
          </div>
          <div className={styles.options}>
            {step.options.map((opt, i) => {
              const isWrong = wrongIndex === i;
              const isCorrect = mcqCorrect && i === step.correct;
              return (
                <button
                  key={i}
                  className={[
                    styles.option,
                    isWrong ? styles.optionWrong : '',
                    isCorrect ? styles.optionCorrect : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleOptionTap(i)}
                  disabled={mcqCorrect}
                >
                  <span className={styles.optionLetter}>{LETTERS[i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      ) : step?.type === 'fillblank' ? (
        /* ── Fill-blank step ───────────────────────────────────────────── */
        <>
          <div className={styles.questionCard}>
            <p className={styles.questionLabel}>Fill in the blank</p>
            <div className={styles.codeBlock}>
              {step.template.split('___').map((part, i, arr) => (
                <React.Fragment key={i}>
                  <span>{part}</span>
                  {i < arr.length - 1 && (
                    <input
                      ref={inputRef}
                      className={[
                        styles.blankInput,
                        fillState === 'correct' ? styles.blankInputCorrect : '',
                        fillState === 'wrong' ? styles.blankInputWrong : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="text"
                      value={inputVal}
                      placeholder="___"
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={fillState === 'correct'}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={handleFillKeyDown}
                      size={Math.max(3, inputVal.length + 1)}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            {step.hint && <p className={styles.hint}>Hint: {step.hint}</p>}
          </div>
          <button
            className={styles.checkBtn}
            onClick={handleFillSubmit}
            disabled={inputVal.trim().length === 0 || fillState === 'correct'}
          >
            Check →
          </button>
        </>
      ) : null}
    </div>
  );
}

// ── Success card sub-component ────────────────────────────────────────────

function SuccessCard({
  onNext,
  hasNext,
}: {
  onNext: () => void;
  hasNext: boolean;
}) {
  return (
    <>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>⚡</div>
        <p className={styles.successTitle}>Lesson Complete!</p>
        <p className={styles.xpBadge}>+50 XP</p>
      </div>
      {hasNext && (
        <button className={styles.nextBtn} onClick={onNext}>
          Next Lesson →
        </button>
      )}
    </>
  );
}
