"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LivePreview.module.css";

const PULL_THRESHOLD = 10;
const TOP_SAFE = 64;
const BOTTOM_SAFE = 76;
const MIN_W = 240;
const MIN_H = 160;

export type PreviewMode = "dark" | "light";
const MODE_KEY = "nexus-preview-mode";

// :where() keeps specificity at zero so any CSS the learner writes still wins
export function previewBaseStyle(mode: PreviewMode) {
  return mode === "dark"
    ? "<style>:where(html){color-scheme:dark;background:#0b1220;color:#e2e8f0}:where(a){color:#7aa2ff}</style>"
    : "<style>:where(html){color-scheme:light;background:#e9e6df;color:#2b2b2b}</style>";
}

export function usePreviewMode() {
  const [mode, setMode] = useState<PreviewMode>("dark");
  useEffect(() => {
    try {
      if (localStorage.getItem(MODE_KEY) === "light") setMode("light");
    } catch { /* storage unavailable */ }
  }, []);
  const toggle = useCallback(() => {
    setMode(m => {
      const next = m === "dark" ? "light" : "dark";
      try { localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { mode, toggle };
}

export function PreviewModeToggle({ mode, onToggle, className }: { mode: PreviewMode; onToggle: () => void; className?: string }) {
  const toDark = mode === "light";
  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-label={toDark ? "Switch preview to dark mode" : "Switch preview to light mode"}
      title={toDark ? "Dark preview" : "Light preview"}
    >
      {toDark ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      )}
    </button>
  );
}

type Rect = { x: number; y: number; w: number; h: number };
type Preset = "left" | "right" | "tl" | "tr" | "bl" | "br";

function buildDoc(html: string, css: string, js: string, mode: PreviewMode) {
  const style = `${previewBaseStyle(mode)}<style>${css.replace(/<\/style>/gi, "<\\/style>")}</style>`;
  const script = `<script>${js.replace(/<\/script>/gi, "<\\/script>")}<\/script>`;
  let doc = html;
  if (/<\/head>/i.test(doc)) doc = doc.replace(/<\/head>/i, () => `${style}</head>`);
  else if (/<body[\s>]/i.test(doc)) doc = doc.replace(/<body[\s>]/i, m => `${style}${m}`);
  else doc = `<!DOCTYPE html><html><head><meta charset="UTF-8">${style}</head><body>${doc}</body></html>`;
  return /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, () => `${script}</body>`) : doc + script;
}

// Press the Browser tab and drag down to pull a live preview window out of it. A plain click still opens the tab.
export function usePullPreview() {
  const [open, setOpen] = useState(false);
  const [grab, setGrab] = useState<{ x: number; y: number } | null>(null);
  const justPulled = useRef(false);

  const tabProps = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0 || open) return;
      const sy = e.clientY;
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", cleanup);
        window.removeEventListener("pointercancel", cleanup);
      };
      const onMove = (ev: PointerEvent) => {
        if (ev.clientY - sy < PULL_THRESHOLD) return;
        cleanup();
        justPulled.current = true;
        setTimeout(() => { justPulled.current = false; }, 0);
        setGrab({ x: ev.clientX, y: ev.clientY });
        setOpen(true);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", cleanup);
      window.addEventListener("pointercancel", cleanup);
    },
    // Swallow the click that follows a pull so the tab doesn't also switch
    onClickCapture: (e: React.MouseEvent) => {
      if (justPulled.current) { e.stopPropagation(); e.preventDefault(); }
    },
    style: { touchAction: "pan-x" } as React.CSSProperties,
  };

  const close = useCallback(() => { setOpen(false); setGrab(null); }, []);
  return { open, grab, tabProps, close };
}

const PRESET_LABEL: Record<Preset, string> = {
  left: "Left half",
  right: "Right half",
  tl: "Top left",
  tr: "Top right",
  bl: "Bottom left",
  br: "Bottom right",
};

// Highlighted region of a tiny 20x14 screen icon for each layout
const PRESET_ICON: Record<Preset, [number, number, number, number]> = {
  left: [1, 1, 9, 12],
  right: [10, 1, 9, 12],
  tl: [1, 1, 7, 5],
  tr: [12, 1, 7, 5],
  bl: [1, 8, 7, 5],
  br: [12, 8, 7, 5],
};

function presetRect(p: Preset): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = 14;
  const usableH = vh - TOP_SAFE - BOTTOM_SAFE;
  const w = Math.min(380, vw - m * 2);
  const h = Math.min(280, usableH);
  switch (p) {
    case "left": return { x: 0, y: TOP_SAFE, w: Math.round(vw / 2), h: usableH };
    case "right": return { x: Math.round(vw / 2), y: TOP_SAFE, w: Math.round(vw / 2), h: usableH };
    case "tl": return { x: m, y: TOP_SAFE + m, w, h };
    case "tr": return { x: vw - w - m, y: TOP_SAFE + m, w, h };
    case "bl": return { x: m, y: vh - BOTTOM_SAFE - h - m, w, h };
    case "br": return { x: vw - w - m, y: vh - BOTTOM_SAFE - h - m, w, h };
  }
}

interface Props {
  html: string;
  css: string;
  js: string;
  grab: { x: number; y: number } | null;
  mode: PreviewMode;
  onToggleMode: () => void;
  onClose: () => void;
}

export default function LivePreview({ html, css, js, grab, mode, onToggleMode, onClose }: Props) {
  const [doc, setDoc] = useState(() => buildDoc(html, css, js, mode));
  const [rect, setRect] = useState<Rect>(() => {
    const w = 380;
    const h = 280;
    return grab
      ? { x: grab.x - w / 2, y: grab.y - 16, w, h }
      : presetRect("br");
  });
  const [interacting, setInteracting] = useState<"move" | "resize" | null>(grab ? "move" : null);
  const [menu, setMenu] = useState(false);
  const rectRef = useRef(rect);
  rectRef.current = rect;

  useEffect(() => {
    const t = setTimeout(() => setDoc(buildDoc(html, css, js, mode)), 250);
    return () => clearTimeout(t);
  }, [html, css, js, mode]);

  const track = useCallback((mode: "move" | "resize", px: number, py: number) => {
    const start = rectRef.current;
    setInteracting(mode);
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (mode === "move") {
        setRect({
          ...start,
          x: Math.min(vw - 90, Math.max(90 - start.w, start.x + dx)),
          y: Math.min(vh - BOTTOM_SAFE - 30, Math.max(0, start.y + dy)),
        });
      } else {
        setRect({
          ...start,
          w: Math.min(vw - start.x, Math.max(MIN_W, start.w + dx)),
          h: Math.min(vh - start.y, Math.max(MIN_H, start.h + dy)),
        });
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setInteracting(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }, []);

  // When pulled straight out of the tab, keep following the pointer until it is released
  useEffect(() => {
    if (grab) track("move", grab.x, grab.y);
  }, [grab, track]);

  const apply = (p: Preset) => {
    setRect(presetRect(p));
    setMenu(false);
  };

  return (
    <div
      className={`${styles.window} ${interacting ? styles.interacting : ""}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      role="dialog"
      aria-label="Live preview"
    >
      <div
        className={styles.header}
        onPointerDown={e => {
          if ((e.target as HTMLElement).closest("button")) return;
          e.preventDefault();
          track("move", e.clientX, e.clientY);
        }}
      >
        <span className={styles.grip} aria-hidden="true" />
        <span className={styles.title}>Live preview</span>
        <div className={styles.menuWrap} onMouseLeave={() => setMenu(false)}>
          <button
            className={styles.iconBtn}
            onClick={() => setMenu(m => !m)}
            onMouseEnter={() => setMenu(true)}
            aria-label="Window layout"
            title="Window layout"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></svg>
          </button>
          {menu && (
            <div className={styles.menu}>
              {(Object.keys(PRESET_LABEL) as Preset[]).map(p => (
                <button key={p} className={styles.menuItem} onClick={() => apply(p)}>
                  <svg width="20" height="14" viewBox="0 0 20 14">
                    <rect x="0.5" y="0.5" width="19" height="13" rx="2" fill="none" stroke="currentColor" opacity="0.5" />
                    <rect x={PRESET_ICON[p][0]} y={PRESET_ICON[p][1]} width={PRESET_ICON[p][2]} height={PRESET_ICON[p][3]} rx="1" fill="currentColor" />
                  </svg>
                  <span>{PRESET_LABEL[p]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <PreviewModeToggle mode={mode} onToggle={onToggleMode} className={styles.iconBtn} />
        <button className={styles.iconBtn} onClick={onClose} aria-label="Close live preview">✕</button>
      </div>
      <div className={styles.body}>
        <iframe title="Live preview" className={styles.frame} style={mode === "light" ? { filter: "brightness(0.85) contrast(0.95)" } : undefined} srcDoc={doc} sandbox="allow-scripts" />
        {interacting && <div className={styles.shield} />}
      </div>
      <div
        className={styles.resize}
        onPointerDown={e => { e.preventDefault(); e.stopPropagation(); track("resize", e.clientX, e.clientY); }}
        aria-hidden="true"
      />
    </div>
  );
}
