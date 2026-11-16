/**
 * EnhancedMobileKeyboard
 *
 * Optional advanced keyboard with:
 * - Quick access to special characters
 * - Language-specific quick actions
 * - Collapsible/expandable layouts for compact mode
 * - Haptic feedback support
 * - Gesture support (long-press for more options)
 *
 * Import this in PlaygroundEditor if you want more advanced features
 */

import { useEffect, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import styles from "./EnhancedKeyboard.module.css";

interface QuickKey {
  label: string;
  insert: string;
  cursorOffset?: number;
  category?: string;
}

const QUICK_KEYS: Record<string, QuickKey[]> = {
  html: [
    { label: "<div>", insert: "<div></div>", cursorOffset: 5 },
    { label: "<p>", insert: "<p></p>", cursorOffset: 3 },
    { label: "<span>", insert: "<span></span>", cursorOffset: 6 },
    { label: "attr", insert: 'class=""', cursorOffset: 6 },
    { label: "id=", insert: 'id=""', cursorOffset: 3 },
    { label: "data-", insert: 'data-=""', cursorOffset: 2 },
  ],
  css: [
    { label: "display", insert: "display: block;" },
    { label: "flex", insert: "display: flex;" },
    { label: "grid", insert: "display: grid;" },
    { label: "padding", insert: "padding: 0;" },
    { label: "margin", insert: "margin: 0;" },
    { label: "@media", insert: "@media () {\n  \n}" },
  ],
  js: [
    { label: "const ", insert: "const  = ", cursorOffset: 3 },
    { label: "function", insert: "function name() {\n  \n}" },
    { label: "=>", insert: "() => {}" },
    { label: ".map()", insert: ".map((item) => item)" },
    { label: ".filter()", insert: ".filter((item) => )" },
    { label: "console.log", insert: "console.log();" },
  ],
  python: [
    { label: "def ", insert: "def name():\n    pass" },
    { label: "class", insert: "class Name:\n    pass" },
    { label: "if", insert: "if condition:\n    " },
    { label: "for", insert: "for item in items:\n    " },
    { label: "import", insert: "import " },
    { label: "try:", insert: "try:\n    pass\nexcept:\n    pass" },
  ],
};

interface Props {
  view: EditorView;
  language: string;
  enabled?: boolean;
}

export function EnhancedMobileKeyboard({ view, language, enabled = true }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [longPressTarget, setLongPressTarget] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [supportsHaptics, setSupportsHaptics] = useState(false);

  useEffect(() => {
    // Check for haptic feedback support
    setSupportsHaptics("vibrate" in navigator);
  }, []);

  useEffect(() => () => {
    if (longPressTimerRef.current !== null) clearTimeout(longPressTimerRef.current);
  }, []);

  const hapticFeedback = (pattern: "tap" | "success" | "warning" = "tap") => {
    if (!supportsHaptics) return;

    const patterns: Record<string, number[]> = {
      tap: [10],
      success: [10, 20, 10],
      warning: [20, 30, 20],
    };

    navigator.vibrate?.(patterns[pattern] || [10]);
  };

  const handleInsert = (text: string, offset = 0) => {
    hapticFeedback("tap");
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length - offset },
      userEvent: "input.type",
      scrollIntoView: true,
    });
  };

  const handleLongPress = (key: string) => {
    hapticFeedback("success");
    setLongPressTarget(key);
  };

  const handlePointerDown = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    if (longPressTimerRef.current !== null) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(
      () => handleLongPress(key),
      500
    );
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const quickKeys = QUICK_KEYS[language as keyof typeof QUICK_KEYS] || [];

  if (!enabled || !quickKeys.length) return null;

  return (
    <div className={styles.container}>
      <button
        className={`${styles.toggleBtn} ${expanded ? styles.active : ""}`}
        onPointerDown={(e) => {
          e.preventDefault();
          setExpanded(!expanded);
          hapticFeedback("tap");
        }}
        aria-label="Toggle quick actions"
        aria-expanded={expanded}
      >
        ⚡
      </button>

      {expanded && (
        <div className={styles.quickKeys}>
          {quickKeys.map((key) => (
            <button
              key={key.label}
              className={`${styles.quickKey} ${
                longPressTarget === key.label ? styles.active : ""
              }`}
              onPointerDown={(e) => handlePointerDown(e, key.label)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => {
                handleInsert(key.insert, key.cursorOffset || 0);
                setLongPressTarget(null);
              }}
              title={key.label}
            >
              {key.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
