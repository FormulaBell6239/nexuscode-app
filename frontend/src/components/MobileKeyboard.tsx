'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import styles from './MobileKeyboard.module.css';

interface Props {
  getView: () => EditorView | null;
}

const LETTERS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const SYMBOLS = ['1234567890', '[];:-_+*&', '!?~`\\|^%$#@'];
const CODE_KEYS = ['<', '>', '/', '"', "'", '=', '(', ')', '{', '}'];

export default function MobileKeyboard({ getView }: Props) {
  const [shift, setShift] = useState(false);
  const [symbols, setSymbols] = useState(false);
  // Start hidden on very short screens (landscape) where the keyboard would cover the editor
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerHeight < 480);
  const repeatRef = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});

  const stopRepeat = () => {
    clearTimeout(repeatRef.current.t);
    clearInterval(repeatRef.current.i);
  };
  useEffect(() => stopRepeat, []);

  const buzz = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(6); };

  const reveal = (view: EditorView) =>
    view.dispatch({ effects: EditorView.scrollIntoView(view.state.selection.main.head, { y: 'nearest' }) });

  // Route through the editor's input handlers so auto-closing brackets, quotes and tags behave like a real keyboard
  const insert = (text: string) => {
    const view = getView();
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const fallback = () => view.state.update({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
      userEvent: 'input.type',
    });
    const handled = view.state.facet(EditorView.inputHandler).some(h => h(view, from, to, text, fallback));
    if (!handled) view.dispatch(fallback());
    reveal(view);
    view.focus();
  };

  const backspace = () => {
    const view = getView();
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const start = from === to ? Math.max(0, from - 1) : from;
    if (start === to) return;
    view.dispatch({
      changes: { from: start, to },
      selection: { anchor: start },
      userEvent: 'delete.backward',
    });
    reveal(view);
    view.focus();
  };

  const enter = () => {
    const view = getView();
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const before = line.text.slice(0, from - line.from);
    const indent = /^\s*/.exec(line.text)?.[0] ?? '';
    const opens = /[{(\[:]$/.test(before.trimEnd()) || /<(?!\/)[a-zA-Z][^<>]*(?<!\/)>$/.test(before.trimEnd());
    insert('\n' + indent + (opens ? '  ' : ''));
  };

  const move = (dir: 'left' | 'right' | 'up' | 'down') => {
    const view = getView();
    if (!view) return;
    const sel = view.state.selection.main;
    let head = sel.head;
    if (dir === 'left') head = Math.max(0, sel.head - 1);
    else if (dir === 'right') head = Math.min(view.state.doc.length, sel.head + 1);
    else head = view.moveVertically(view.state.selection.main, dir === 'down').head;
    view.dispatch({ selection: { anchor: head } });
    reveal(view);
    view.focus();
  };

  // Keep focus in the editor so the caret never disappears when a key is pressed
  const hold = (e: React.PointerEvent | React.MouseEvent) => e.preventDefault();

  const key = (label: React.ReactNode, onPress: () => void, extra = '', aria?: string, repeat = false) => {
    const press = () => { buzz(); onPress(); };
    return (
      <button
        type="button"
        key={typeof label === 'string' ? label + extra : aria}
        className={`${styles.key} ${extra}`}
        aria-label={aria}
        onPointerDown={e => {
          e.preventDefault();
          if (!repeat) return;
          press();
          stopRepeat();
          repeatRef.current.t = setTimeout(() => {
            repeatRef.current.i = setInterval(press, 55);
          }, 380);
        }}
        onPointerUp={repeat ? stopRepeat : undefined}
        onPointerLeave={repeat ? stopRepeat : undefined}
        onPointerCancel={repeat ? stopRepeat : undefined}
        onMouseDown={e => e.preventDefault()}
        onClick={repeat ? undefined : press}
        onContextMenu={e => e.preventDefault()}
      >
        {label}
      </button>
    );
  };

  if (collapsed) {
    return (
      <div data-mobile-keyboard className={styles.collapsedBar}>
        <button type="button" className={styles.openBtn} onClick={() => setCollapsed(false)}>⌨ Keyboard</button>
      </div>
    );
  }

  const rows = symbols ? SYMBOLS : LETTERS;
  const fmt = (c: string) => (shift && !symbols ? c.toUpperCase() : c);

  return (
    <div data-mobile-keyboard className={styles.keyboard} onPointerDown={hold} role="group" aria-label="Code keyboard">
      <div className={styles.codeRow}>
        {CODE_KEYS.map(k => key(k, () => insert(k)))}
        {key('⇥', () => insert('  '), '', 'Tab')}
      </div>
      {rows.map((row, i) => (
        <div key={i} className={styles.row} style={{ paddingInline: i === 1 ? '4%' : 0 }}>
          {i === 2 && key('⇧', () => setShift(s => !s), `${styles.wide} ${shift ? styles.active : ''}`, 'Shift')}
          {row.split('').map(c => key(fmt(c), () => { insert(fmt(c)); if (shift) setShift(false); }))}
          {i === 2 && key('⌫', backspace, styles.wide, 'Backspace', true)}
        </div>
      ))}
      <div className={styles.row}>
        {key(symbols ? 'ABC' : '123', () => setSymbols(s => !s), styles.wide)}
        {key('.', () => insert('.'))}
        {key('←', () => move('left'), '', 'Left', true)}
        {key('space', () => insert(' '), styles.space, 'Space')}
        {key('→', () => move('right'), '', 'Right', true)}
        {key(',', () => insert(','))}
        {key('↵', enter, `${styles.wide} ${styles.enter}`, 'Enter')}
        {key('▾', () => setCollapsed(true), '', 'Hide keyboard')}
      </div>
    </div>
  );
}
