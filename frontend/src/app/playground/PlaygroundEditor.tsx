"use client";
import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { indentMore, undo, redo } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { nexusTheme } from "../../lib/nexusTheme";
import { ghostTextExtension, acceptGhost, getGhostText } from "../../lib/ghostText";
import { htmlSnippetCompletions, cssSnippetCompletions, jsSnippetCompletions, pySnippetCompletions } from "../../lib/localCompletions";
import styles from "./MobileKeyBar.module.css";

type Language = "html" | "css" | "js" | "python";

interface Props {
  value: string;
  onChange: (v: string) => void;
  language: Language;
  className?: string;
}

// Stops iOS/Android from "fixing" code (capital letters, smart quotes, red squiggles)
const codeInputAttrs = EditorView.contentAttributes.of({
  autocorrect: "off",
  autocapitalize: "off",
  spellcheck: "false",
  "data-gramm": "false",
});

function getExtensions(language: Language) {
  const base = [codeInputAttrs, EditorView.lineWrapping, EditorView.theme({ '.cm-content': { paddingBottom: '64px' } })];
  switch (language) {
    case "html":   return [...base, html(), htmlSnippetCompletions(), ...ghostTextExtension("html")];
    case "css":    return [...base, css(), cssSnippetCompletions(), ...ghostTextExtension("css")];
    case "js":     return [...base, javascript(), jsSnippetCompletions(), ...ghostTextExtension("js")];
    case "python": return [...base, python(), pySnippetCompletions(), ...ghostTextExtension("python")];
  }
}

// [label, text inserted, cursor offset inside the text]
type Key = [string, string, number?];
const KEYS: Record<Language, Key[]> = {
  html:   [["<", "<"], [">", ">"], ["/", "/"], ["=", "="], ['""', '""', 1], ["</>", "</>", 2], ["{}", "{}", 1], ["( )", "()", 1], [";", ";"]],
  css:    [["{}", "{}", 1], [":", ":"], [";", ";"], ["#", "#"], [".", "."], ["()", "()", 1], ["%", "%"], ['""', '""', 1], ["-", "-"]],
  js:     [["{}", "{}", 1], ["( )", "()", 1], ["[]", "[]", 1], ['""', '""', 1], ["'", "'"], ["=>", "=>"], ["=", "="], [";", ";"], [".", "."]],
  python: [[":", ":"], ["( )", "()", 1], ["[]", "[]", 1], ['""', '""', 1], ["'", "'"], ["=", "="], ["#", "#"], ["_", "_"], ["{}", "{}", 1]],
};

export default function PlaygroundEditor({ value, onChange, language, className }: Props) {
  const [view, setView] = useState<EditorView | null>(null);
  const [focused, setFocused] = useState(false);
  const [touch, setTouch] = useState(false);
  const [ghost, setGhost] = useState<string | null>(null);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const extensions = useMemo(
    () => [
      ...getExtensions(language),
      EditorView.updateListener.of((u) => {
        if (u.focusChanged) setFocused(u.view.hasFocus);
        setGhost(getGhostText(u.view));
      }),
    ],
    [language],
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

  const keep = (e: React.PointerEvent) => e.preventDefault();

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
      />
      {touch && focused && view && (
        <div className={styles.bar} role="toolbar" aria-label="Code keys">
          {ghost ? (
            <button className={styles.accept} onPointerDown={keep} onClick={() => acceptGhost(view)} aria-label="Accept suggestion">
              <span className={styles.acceptKey}>Tab ⇥</span>
              <span className={styles.acceptText}>{ghost.trim().split("\n")[0].slice(0, 40) || "↵"}</span>
            </button>
          ) : (
            <button className={styles.accent} onPointerDown={keep} onClick={() => indentMore(view)}>
              Tab
            </button>
          )}
          <button onPointerDown={keep} onClick={() => undo(view)} aria-label="Undo">↶</button>
          <button onPointerDown={keep} onClick={() => redo(view)} aria-label="Redo">↷</button>
          {KEYS[language].map(([label, text, inside]) => (
            <button key={label} onPointerDown={keep} onClick={() => insert(text, inside ? text.length - inside : 0)}>
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
