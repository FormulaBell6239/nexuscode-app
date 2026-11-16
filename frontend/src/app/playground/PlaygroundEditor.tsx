"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { cursorCharLeft, cursorCharRight, deleteCharBackward, indentMore, insertNewlineAndIndent, undo, redo } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { nexusTheme } from "../../lib/nexusTheme";
import { ghostTextExtension, acceptGhost, getGhostText } from "../../lib/ghostText";
import { htmlSnippetCompletions, cssSnippetCompletions, jsSnippetCompletions, pySnippetCompletions } from "../../lib/localCompletions";
import styles from "./MobileKeyBar.module.css";
import { keyPressFeedback } from "./keyFeedback";
import { keyboardFont } from "./keyboardFont";

type Language = "html" | "css" | "js" | "python";

interface Props {
  value: string;
  onChange: (v: string) => void;
  language: Language;
  ghostTextEnabled: boolean;
  className?: string;
}

// Stops iOS/Android from "fixing" code (capital letters, smart quotes, red squiggles)
const codeInputAttrs = EditorView.contentAttributes.of({
  autocorrect: "off",
  autocapitalize: "off",
  spellcheck: "false",
  "data-gramm": "false",
});

function getExtensions(language: Language, ghostTextEnabled: boolean) {
  const base = [codeInputAttrs, EditorView.lineWrapping, EditorView.theme({ '.cm-content': { paddingBottom: '64px' } })];
  const ghost = ghostTextEnabled ? ghostTextExtension(language) : [];
  switch (language) {
    case "html":   return [...base, html(), htmlSnippetCompletions(), ...ghost];
    case "css":    return [...base, css(), cssSnippetCompletions(), ...ghost];
    case "js":     return [...base, javascript(), jsSnippetCompletions(), ...ghost];
    case "python": return [...base, python(), pySnippetCompletions(), ...ghost];
  }
}

// [label, text inserted, cursor offset inside the text]
type Key = [string, string, number?];
type KeyboardLighting = "blue" | "purple" | "green" | "pink" | "rgb";
type PastePosition = { x: number; y: number; editorPos: number | null; doc: EditorView["state"]["doc"] };
const LIGHTING_MODES: KeyboardLighting[] = ["blue", "purple", "green", "pink", "rgb"];
const LIGHTING_LABELS: Record<KeyboardLighting, string> = {
  blue: "Cyan blue",
  purple: "Purple",
  green: "Green",
  pink: "Pink",
  rgb: "Rainbow",
};
const KEYS: Record<Language, Key[]> = {
  html:   [["<", "<"], [">", ">"], ["/", "/"], ["=", "="], ['""', '""', 1], ["</>", "</>", 2], ["{}", "{}", 1], ["( )", "()", 1], [";", ";"]],
  css:    [["{}", "{}", 1], [":", ":"], [";", ";"], ["#", "#"], [".", "."], ["()", "()", 1], ["%", "%"], ['""', '""', 1], ["-", "-"]],
  js:     [["{}", "{}", 1], ["( )", "()", 1], ["[]", "[]", 1], ['""', '""', 1], ["'", "'"], ["=>", "=>"], ["=", "="], [";", ";"], [".", "."]],
  python: [[":", ":"], ["( )", "()", 1], ["[]", "[]", 1], ['""', '""', 1], ["'", "'"], ["=", "="], ["#", "#"], ["_", "_"], ["{}", "{}", 1]],
};

export default function PlaygroundEditor({ value, onChange, language, ghostTextEnabled, className }: Props) {
  const [view, setView] = useState<EditorView | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [touch, setTouch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [symbols, setSymbols] = useState(false);
  const [shift, setShift] = useState(false);
  const [keyboardLighting, setKeyboardLighting] = useState<KeyboardLighting>("blue");
  const [ghost, setGhost] = useState<string | null>(null);
  const [pasteFallback, setPasteFallback] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [pastePosition, setPastePosition] = useState<PastePosition | null>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const pasteMenuRef = useRef<HTMLDivElement>(null);
  const pasteOverlayRef = useRef<HTMLDivElement>(null);
  const pasteDialogRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef(language);
  languageRef.current = language;
  const keyGlows = useRef(new WeakMap<HTMLButtonElement, Animation>());

  useEffect(() => {
    setPasteFallback(false);
    setPasteText("");
    setPasteMessage("");
    setPastePosition(null);
  }, [language]);

  useEffect(() => {
    if (pasteFallback) pasteDialogRef.current?.focus();
  }, [pasteFallback]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("playgroundKeyboardLighting");
      const lighting = LIGHTING_MODES.find((mode) => mode === saved);
      if (lighting) {
        setKeyboardLighting(lighting);
      }
    } catch (error) {
      console.warn("Could not load the keyboard lighting preference.", error);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setTouch(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!view || !touch) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let start: { x: number; y: number; id: number } | null = null;
    const cancel = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      start = null;
    };
    const showMenu = (x: number, y: number) => {
      setPasteMessage("");
      setPastePosition({
        x: Math.max(8, Math.min(x - 35, window.innerWidth - 90)),
        y: Math.max(8, Math.min(y + 24, window.innerHeight - 60)),
        editorPos: view.posAtCoords({ x, y }),
        doc: view.state.doc,
      });
    };
    const onStart = (event: TouchEvent) => {
      cancel();
      if (event.touches.length !== 1) return;
      const finger = event.touches[0];
      start = { x: finger.clientX, y: finger.clientY, id: finger.identifier };
      timer = setTimeout(() => {
        if (start) showMenu(start.x, start.y);
        timer = undefined;
      }, 450);
    };
    const onMove = (event: TouchEvent) => {
      const finger = Array.from(event.touches).find((item) => item.identifier === start?.id);
      if (!start || !finger || Math.hypot(finger.clientX - start.x, finger.clientY - start.y) > 10) cancel();
    };
    const onContextMenu = (event: MouseEvent) => showMenu(event.clientX, event.clientY);
    view.contentDOM.addEventListener("touchstart", onStart, { passive: true });
    view.contentDOM.addEventListener("touchmove", onMove, { passive: true });
    view.contentDOM.addEventListener("touchend", cancel);
    view.contentDOM.addEventListener("touchcancel", cancel);
    view.contentDOM.addEventListener("contextmenu", onContextMenu);
    return () => {
      cancel();
      view.contentDOM.removeEventListener("touchstart", onStart);
      view.contentDOM.removeEventListener("touchmove", onMove);
      view.contentDOM.removeEventListener("touchend", cancel);
      view.contentDOM.removeEventListener("touchcancel", cancel);
      view.contentDOM.removeEventListener("contextmenu", onContextMenu);
    };
  }, [view, touch]);

  const extensions = useMemo(
    () => [
      ...getExtensions(language, ghostTextEnabled),
      EditorView.editable.of(!touch),
      ...(touch ? [
        EditorView.contentAttributes.of({ tabindex: "0" }),
        EditorView.domEventHandlers({
          click: (event, editor) => {
            const pos = editor.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos !== null) editor.dispatch({ selection: { anchor: pos } });
            editor.focus();
            setKeyboardOpen(true);
            return false;
          },
        }),
      ] : []),
      EditorView.updateListener.of((u) => {
        setGhost(getGhostText(u.view));
      }),
    ],
    [language, ghostTextEnabled, touch],
  );

  const insert = (text: string, back = 0) => {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length - back },
      userEvent: "input.type",
      scrollIntoView: true,
    });
  };

  const insertPaste = (editor: EditorView, text: string) => {
    editor.dispatch(editor.state.replaceSelection(editor.state.toText(text)), {
      userEvent: "input.paste",
      scrollIntoView: true,
    });
    editor.focus();
  };

  const pasteFromClipboard = async () => {
    if (!view || !pastePosition) return;
    setPasteMessage("");
    if (!view.state.doc.eq(pastePosition.doc)) {
      setPasteMessage("The editor changed. Touch and hold again to paste.");
      return;
    }
    if (view.state.selection.main.empty && pastePosition.editorPos !== null) {
      view.dispatch({ selection: { anchor: pastePosition.editorPos } });
    }
    const initialState = view.state;
    try {
      if (!navigator.clipboard?.readText) {
        setPastePosition(null);
        setPasteFallback(true);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!view.dom.isConnected || languageRef.current !== language) return;
      if (view.state !== initialState) {
        setPasteMessage("The editor changed while reading the clipboard. Please try again.");
      } else if (!text) {
        setPasteMessage("The clipboard does not contain any text.");
      } else {
        insertPaste(view, text);
        setPastePosition(null);
      }
    } catch {
      if (!view.dom.isConnected || languageRef.current !== language) return;
      if (view.state !== initialState) {
        setPasteMessage("The editor changed while reading the clipboard. Please try again.");
      } else {
        setPastePosition(null);
        setPasteFallback(true);
      }
    }
  };

  const keep = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (e.pointerType === "touch") {
      const key = e.currentTarget;
      keyPressFeedback(key, `${styles.keyPreview} ${keyboardFont.variable}`, key.classList.contains(styles.key));
      const animateGlow = keyboardLighting === "rgb" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (animateGlow) {
        keyGlows.current.get(key)?.cancel();
      }
      const keyStyle = animateGlow ? getComputedStyle(key) : null;
      const glow = keyStyle?.getPropertyValue("--keyboard-accent-glow").trim();
      const restingShadow = keyStyle?.boxShadow;
      key.dataset.pressedPointer = String(e.pointerId);
      key.setPointerCapture(e.pointerId);
      if (glow && restingShadow) {
        keyGlows.current.set(key, key.animate(
          [
            { boxShadow: `0 0 14px ${glow}, inset 0 0 10px ${glow}` },
            { boxShadow: restingShadow },
          ],
          { duration: 350, easing: "ease-out" },
        ));
      }
    }
  };
  const clearTouchFeedback = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLButtonElement &&
        e.target.dataset.pressedPointer === String(e.pointerId)) {
      delete e.target.dataset.pressedPointer;
    }
  };
  const cycleKeyboardLighting = () => {
    const lighting = LIGHTING_MODES[(LIGHTING_MODES.indexOf(keyboardLighting) + 1) % LIGHTING_MODES.length];
    setKeyboardLighting(lighting);
    try {
      localStorage.setItem("playgroundKeyboardLighting", lighting);
    } catch (error) {
      console.warn("Could not save the keyboard lighting preference.", error);
    }
  };

  useEffect(() => {
    if (!view || !touch) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !pasteMenuRef.current?.contains(target) && !pasteOverlayRef.current?.contains(target)) {
        setPastePosition(null);
        setPasteMessage("");
        if (!view.dom.contains(target) && !keyboardRef.current?.contains(target)) setKeyboardOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [view, touch]);

  const rows = symbols
    ? ["1234567890", "!@#$%^&*()", "-_=+[]{}\\|", ";:'\",.<>/?`~"]
    : ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  return (
    <>
      <CodeMirror
        value={value}
        height="100%"
        theme={nexusTheme}
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={(v) => setView(v)}
        className={className}
        basicSetup={{
          lineNumbers: true,
        }}
      />
      {touch && keyboardOpen && view && (
        <div ref={keyboardRef} className={`${styles.keyboard} ${keyboardFont.variable}`} data-lighting={keyboardLighting} role="group" aria-label="Code editor keyboard" onPointerUpCapture={clearTouchFeedback} onPointerCancelCapture={clearTouchFeedback} onLostPointerCapture={clearTouchFeedback}>
        <div className={styles.bar} role="toolbar" aria-label="Code shortcuts">
          {ghostTextEnabled && ghost ? (
            <button className={styles.accept} onPointerDown={keep} onClick={() => acceptGhost(view)} aria-label="Accept suggestion">
              <span className={styles.acceptKey}>⇥</span>
              <span className={styles.acceptText}>{ghost.trim().split("\n")[0].slice(0, 40) || "↵"}</span>
            </button>
          ) : (
            <button className={styles.accent} onPointerDown={keep} onClick={() => indentMore(view)} aria-label="Indent">
              ⇥
            </button>
          )}
          <button onPointerDown={keep} onClick={() => undo(view)} aria-label="Undo" className={styles.action}>↶</button>
          <button onPointerDown={keep} onClick={() => redo(view)} aria-label="Redo" className={styles.action}>↷</button>
          <button
            type="button"
            className={styles.lightingButton}
            onPointerDown={keep}
            onClick={cycleKeyboardLighting}
            aria-label={`Keyboard lighting: ${LIGHTING_LABELS[keyboardLighting]}. Tap to change lighting`}
            title={`Lighting: ${LIGHTING_LABELS[keyboardLighting]}`}
          >
            <span className={styles.lightingIndicator} aria-hidden="true" />
            <span>LED</span>
          </button>
          <div className={styles.divider} />
          {KEYS[language].map(([label, text, inside]) => (
            <button
              key={label}
              onPointerDown={keep}
              onClick={() => insert(text, inside ? text.length - inside : 0)}
              title={label}
              className={styles.keyButton}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.rows}>
          {rows.map((row, rowIndex) => {
            const lastLetterRow = !symbols && rowIndex === rows.length - 1;
            return (
              <div className={styles.row} key={row} style={{ "--key-cols": Math.max(10, row.length) } as React.CSSProperties}>
                {lastLetterRow && <button type="button" className={styles.shiftKey} onPointerDown={keep} onClick={() => setShift(!shift)} aria-label="Shift" aria-pressed={shift}>⇧</button>}
                {Array.from(row).map((character) => {
                  const text = !symbols && shift ? character.toUpperCase() : character;
                  return (
                    <button type="button" className={styles.key} key={character} onPointerDown={keep} onClick={() => {
                      insert(text);
                      if (shift) setShift(false);
                    }}>{text}</button>
                  );
                })}
                {lastLetterRow && <button type="button" className={styles.edgeKey} onPointerDown={keep} onClick={() => deleteCharBackward(view)} aria-label="Backspace">⌫</button>}
              </div>
            );
          })}
          <div className={styles.row}>
            <button type="button" className={styles.wide} onPointerDown={keep} onClick={() => setSymbols(!symbols)} aria-label={symbols ? "Show letters" : "Show symbols"}>{symbols ? "ABC" : "123"}</button>
            <button type="button" onPointerDown={keep} onClick={() => cursorCharLeft(view)} aria-label="Move cursor left">←</button>
            <button type="button" className={styles.space} onPointerDown={keep} onClick={() => insert(" ")} aria-label="Space">space</button>
            <button type="button" onPointerDown={keep} onClick={() => cursorCharRight(view)} aria-label="Move cursor right">→</button>
            {symbols && <button type="button" onPointerDown={keep} onClick={() => deleteCharBackward(view)} aria-label="Backspace">⌫</button>}
            <button type="button" className={styles.wide} onPointerDown={keep} onClick={() => insertNewlineAndIndent(view)} aria-label="Enter">↵</button>
          </div>
        </div>
        </div>
      )}
      {touch && view && pastePosition && !pasteFallback && (
        <div ref={pasteMenuRef} className={styles.pasteMenu} style={{ left: pastePosition.x, top: pastePosition.y }}>
          <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => void pasteFromClipboard()}>Paste</button>
          {pasteMessage && <div role="status">{pasteMessage}</div>}
        </div>
      )}
      {touch && view && pasteFallback && (
        <div ref={pasteOverlayRef} className={styles.pasteOverlay}>
          <div
            ref={pasteDialogRef}
            className={styles.pasteDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="playground-paste-title"
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setPasteFallback(false);
                setPasteText("");
                view.focus();
              }
            }}
          >
            <h2 id="playground-paste-title">Paste code</h2>
            <p>Clipboard access is unavailable. Paste your code below, then tap Insert. Your device keyboard may appear here.</p>
            <textarea
              aria-label="Code to paste"
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <div className={styles.pasteActions}>
              <button type="button" onClick={() => { setPasteFallback(false); setPasteText(""); view.focus(); }}>Cancel</button>
              <button type="button" disabled={!pasteText} onClick={() => {
                insertPaste(view, pasteText);
                setPasteFallback(false);
                setPasteText("");
              }}>Insert</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
