"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql as sqlLang } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import { nexusTheme } from "../../lib/nexusTheme";
import styles from "./Curriculum.module.css";
import RewardPopup from "../../components/RewardPopup";
import MobileLessonView from "../../components/MobileLessonView";

// Module-level guard: prevents Pyodide from being loaded twice in StrictMode
let _pyodideInjected = false;
import { submitXp, getHearts, deductHeart, getProfile, addLocalCredits, addLocalCompletedLesson, LOCAL_CREDIT_RATES } from "../../lib/api";

// ---------------------------------------------
// Learning Track Definitions
// ---------------------------------------------
const tracks = [
  {
    id: "web",
    label: "Web Fundamentals",
    icon: "🌐",
    tagline: "Build real websites from scratch with HTML, CSS & JavaScript.",
    langs: ["html", "css", "javascript"],
    gradient: "135deg, #6366f1 0%, #06b6d4 100%",
    glow: "rgba(99,102,241,0.25)",
  },
  {
    id: "python",
    label: "Python",
    icon: "🐍",
    tagline: "Variables, loops, functions — Python from zero to practical.",
    langs: ["python"],
    gradient: "135deg, #10b981 0%, #3b82f6 100%",
    glow: "rgba(16,185,129,0.25)",
  },
  {
    id: "sql",
    label: "SQL",
    icon: "🗄️",
    tagline: "Query, filter, join and transform data stored in relational databases.",
    langs: ["sql"],
    gradient: "135deg, #f59e0b 0%, #ef4444 100%",
    glow: "rgba(245,158,11,0.25)",
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: "🔷",
    tagline: "Make JavaScript safer with expressive, practical types.",
    langs: ["typescript"],
    gradient: "135deg, #3178c6 0%, #22d3ee 100%",
    glow: "rgba(49,120,198,0.25)",
  },
];

const SQL_DATA_TABLES = [
  {
    id: 'users',
    title: 'users',
    relation: 'id is the primary key',
    columns: ['id', 'name', 'email', 'age', 'city', 'country', 'score', 'is_pro', 'code', 'last_login'],
    rows: [
      ['1', 'Alice', 'alice@example.com', '25', 'NYC', 'US', '95', 'true', 'N1XABC', '2026-10-09'],
      ['2', 'Ben', 'ben@gmail.com', '31', 'Austin', 'US', '82', 'false', 'B7ZQWE', '2026-10-08'],
      ['3', 'Mina', 'mina@gmail.com', '25', 'Toronto', 'CA', '91', 'true', 'M2XDEF', '2026-10-10'],
      ['4', 'Omar', 'omar@example.com', '19', 'NYC', 'US', '74', 'false', 'O3KLMN', '2026-10-01'],
    ],
  },
  {
    id: 'products',
    title: 'products',
    relation: 'id is the primary key · price is in USD',
    columns: ['id', 'name', 'category', 'price'],
    rows: [
      ['101', 'Studio Monitor', 'Electronics', '899.00'],
      ['102', 'Wireless Mouse', 'Electronics', '49.00'],
      ['103', 'Desk Lamp', 'Home', '38.00'],
      ['104', 'Notebook', 'Stationery', '5.00'],
      ['105', 'USB-C Hub', 'Electronics', '79.00'],
      ['105', 'USB-C Hub', 'Electronics', '79.00'],
    ],
  },
  {
    id: 'orders',
    title: 'orders',
    relation: 'user_id → users.id · product_id → products.id',
    columns: ['id', 'user_id', 'product_id', 'total'],
    rows: [
      ['5001', '1', '102', '49.00'],
      ['5002', '2', '101', '899.00'],
      ['5003', '1', '103', '38.00'],
      ['5004', '1', '104', '5.00'],
      ['5005', '1', '102', '49.00'],
    ],
  },
] as const;
type SqlDataTableId = typeof SQL_DATA_TABLES[number]['id'];

const checkers: {
  [key: string]: (code: string) => boolean;
} = {
  "html-headings":    (c) => /<h1>[^<]*Welcome to NexusCode[^<]*<\/h1>/i.test(c),
  "html-paragraphs":  (c) => /<p>\s*\S[\s\S]*?\s*<\/p>/i.test(c),
  "html-links":       (c) => /<a\s[^>]*href\s*=/i.test(c),
  "html-images":      (c) => /<img\s[^>]*src\s*=[^>]*alt\s*=/i.test(c),
  "html-lists":       (c) => /<(ul|ol)[\s>][\s\S]*?<li/i.test(c),
  "html-forms":       (c) => /<form[\s>][\s\S]*?<input/i.test(c),
  "css-selectors":    (c) => /h1\s*{[^}]*color\s*:\s*blue\s*;?[^}]*}/i.test(c),
  "css-background":   (c) => /body\s*{[^}]*background(-color)?\s*:\s*lightgr[ae]y\s*;?[^}]*}/i.test(c),
  "css-font-size":    (c) => /p\s*{[^}]*font-size\s*:\s*20px\s*;?[^}]*}/i.test(c),
  "css-text-align":   (c) => /h1\s*{[^}]*text-align\s*:\s*center\s*;?[^}]*}/i.test(c),
  "css-padding":      (c) => /div\s*{[^}]*padding\s*:\s*20px\s*;?[^}]*}/i.test(c),
  "css-flexbox":      (c) => /\.container\s*{[^}]*display\s*:\s*flex\s*;?[^}]*}/i.test(c),
  "js-variables":     (c) => /(let|const|var)\s+name\s*=/.test(c),
  "js-console":       (c) => /console\.log\s*\(/.test(c),
  "js-functions":     (c) => /function\s+greet\s*\(/.test(c),
  "js-conditionals":  (c) => /if\s*\(/.test(c),
  "js-arrays":        (c) => /(let|const|var)\s+colors\s*=\s*\[/.test(c),
  "js-loops":         (c) => /for\s*\(/.test(c),
  "py-print":        (c) => /print\s*\(\s*['"]Hello,\s*NexusCode!['"]\s*\)/.test(c),
  "py-variables":    (c) => /^\s*name\s*=/m.test(c) && /print\s*\(\s*name\s*\)/.test(c),
  "py-conditionals": (c) => /if\s+age\s*>=\s*18\s*:/.test(c),
  "py-loops":        (c) => /for\s+\w+\s+in\s+range\s*\(/.test(c),
  "py-functions":    (c) => /def\s+greet\s*\(/.test(c),
  "py-lists":        (c) => /^\s*fruits\s*=\s*\[/m.test(c) && /print\s*\(\s*fruits\s*\)/.test(c),
  // ── HTML extras ──────────────────────────────────────────────────────────
  "html-divs":           (c) => /<div[\s>]/i.test(c),
  "html-tables":         (c) => /<table[\s>][\s\S]*?<tr/i.test(c),
  "html-semantic":       (c) => /<(header|main|footer|nav|section|article)[\s>]/i.test(c),
  "html-buttons":        (c) => /<button[\s>]/i.test(c),
  "html-textarea":       (c) => /<textarea[\s>]/i.test(c),
  "html-select":         (c) => /<select[\s>][\s\S]*?<option/i.test(c),
  "html-comments":       (c) => /<!--[\s\S]*?-->/.test(c),
  "html-classes":        (c) => /class\s*=\s*["'][^"']+["']/i.test(c),
  "html-anchor-target":  (c) => /<a\s[^>]*target\s*=\s*["']_blank["']/i.test(c),
  "html-ordered-list":   (c) => /<ol[\s>][\s\S]*?<li/i.test(c),
  "html-input-types":    (c) => /<input\s[^>]*type\s*=\s*["'](email|password|number)["']/i.test(c),
  "html-meta":           (c) => /<meta\s[^>]*name\s*=\s*["']description["']/i.test(c),
  // ── CSS extras ───────────────────────────────────────────────────────────
  "css-colors":          (c) => /color\s*:\s*#[0-9a-f]{3,6}/i.test(c),
  "css-font-weight":     (c) => /font-weight\s*:\s*(bold|[0-9]+)/i.test(c),
  "css-border":          (c) => /border\s*:\s*\S/i.test(c),
  "css-margin":          (c) => /margin\s*:\s*\S/i.test(c),
  "css-width-height":    (c) => /width\s*:\s*\d+/i.test(c),
  "css-border-radius":   (c) => /border-radius\s*:\s*\S/i.test(c),
  "css-box-shadow":      (c) => /box-shadow\s*:\s*\S/i.test(c),
  "css-hover":           (c) => /:\s*hover\s*\{/i.test(c),
  "css-variables":       (c) => /--[\w-]+\s*:/.test(c),
  "css-media-query":     (c) => /@media\s/i.test(c),
  "css-grid":            (c) => /display\s*:\s*grid/i.test(c),
  "css-transition":      (c) => /transition\s*:\s*\S/i.test(c),
  // ── JS extras ────────────────────────────────────────────────────────────
  "js-strings":          (c) => /\.(toUpperCase|toLowerCase|trim|split|replace)\s*\(/.test(c),
  "js-numbers":          (c) => /Math\.\w+\s*\(/.test(c),
  "js-objects":          (c) => /(let|const|var)\s+\w+\s*=\s*\{/.test(c),
  "js-template-literals":(c) => /`[^`]*\$\{/.test(c),
  "js-arrow-functions":  (c) => /const\s+\w+\s*=\s*(\([^)]*\)|\w+)\s*=>/.test(c),
  "js-array-push":       (c) => /\.\s*push\s*\(/.test(c),
  "js-array-map":        (c) => /\.\s*map\s*\(/.test(c),
  "js-array-filter":     (c) => /\.\s*filter\s*\(/.test(c),
  "js-dom-select":       (c) => /document\s*\.\s*querySelector\s*\(/.test(c),
  "js-events":           (c) => /\.addEventListener\s*\(/.test(c),
  "js-ternary":          (c) => /\?\s*['"\w].*\s*:\s*['"\w]/.test(c),
  "js-spread":           (c) => /\.\.\.\w+/.test(c),
  // ── Python extras ────────────────────────────────────────────────────────
  "py-strings":          (c) => /\.(upper|lower|strip|split|replace)\s*\(/.test(c),
  "py-numbers":          (c) => /^\s*result\s*=\s*[\d\s+\-*\/().**%]+/m.test(c),
  "py-fstrings":         (c) => /f['"][^'"]*\{/.test(c),
  "py-while":            (c) => /while\s+\S.*:/.test(c),
  "py-dict":             (c) => /^\s*\w+\s*=\s*\{[^}]*:\s*/m.test(c),
  "py-tuples":           (c) => /^\s*\w+\s*=\s*\([^)]+,[^)]+\)/m.test(c),
  "py-list-comp":        (c) => /\[\s*\S+\s+for\s+\w+\s+in\s+/.test(c),
  "py-classes":          (c) => /class\s+\w+\s*[:(]/.test(c),
  "py-try-except":       (c) => /try\s*:[\s\S]*?except/.test(c),
  "py-import":           (c) => /^import\s+\w+|^from\s+\w+\s+import/m.test(c),
  "py-string-format":    (c) => /f['"][^'"]*\{|['"][^'"]*\{\}[^'"]*['"]\s*\.\s*format\s*\(/.test(c),
  "py-range-step":       (c) => /range\s*\(\s*\d+\s*,\s*\d+\s*,\s*-?\d+\s*\)/.test(c),
  // ── SQL ──────────────────────────────────────────────────────────────────
  "sql-select-all":     (c) => /SELECT\s+\*\s+FROM\s+users/i.test(c),
  "sql-select-columns": (c) => /SELECT\s+name\s*,\s*email\s+FROM\s+users/i.test(c),
  "sql-where":          (c) => /SELECT\s+\*\s+FROM\s+users\s+WHERE\s+age\s*=\s*25/i.test(c),
  "sql-where-string":   (c) => /SELECT\s+\*\s+FROM\s+products\s+WHERE\s+category\s*=\s*'Electronics'/i.test(c),
  "sql-order-by":       (c) => /ORDER\s+BY\s+price\s+DESC/i.test(c),
  "sql-limit":          (c) => /ORDER\s+BY\s+price\s+DESC\s+LIMIT\s+5/i.test(c),
  "sql-distinct":       (c) => /SELECT\s+DISTINCT\s+category\s+FROM\s+products/i.test(c),
  "sql-and-or":         (c) => /WHERE\s+category\s*=\s*'Electronics'\s+AND\s+price\s*<\s*500/i.test(c),
  "sql-like":           (c) => /LIKE\s+'%@gmail\.com'/i.test(c),
  "sql-insert":         (c) => /INSERT\s+INTO\s+users\s*\(\s*name\s*,\s*email\s*\)\s*VALUES\s*\(\s*'Dana'\s*,\s*'dana@example\.com'\s*\)/i.test(c),
  "sql-update":         (c) => /UPDATE\s+users\s+SET\s+email\s*=\s*'[^']+'/i.test(c) && /WHERE\s+name\s*=\s*'Alice'/i.test(c),
  "sql-delete":         (c) => /DELETE\s+FROM\s+users\s+WHERE/i.test(c),
  "sql-create-table":   (c) => /CREATE\s+TABLE\s+reading_lists/i.test(c) && /VARCHAR\s*\(\s*100\s*\)/i.test(c),
  "sql-primary-key":    (c) => /CREATE\s+TABLE\s+teams/i.test(c) && /id\s+INT\s+PRIMARY\s+KEY/i.test(c),
  "sql-count":          (c) => /SELECT\s+COUNT\s*\(\s*\*\s*\)\s+FROM\s+orders/i.test(c),
  "sql-group-by":       (c) => /SELECT\s+user_id\s*,\s*COUNT\s*\(\s*\*\s*\)\s+FROM\s+orders\s+GROUP\s+BY\s+user_id/i.test(c),
  "sql-having":         (c) => /HAVING\s+COUNT\s*\(\s*\*\s*\)\s*>\s*3/i.test(c),
  "sql-inner-join":     (c) => /INNER\s+JOIN\s+users\s+ON\s+orders\.user_id\s*=\s*users\.id/i.test(c),
  "ts-type-annotations": (c) => /const\s+memberName\s*:\s*string\s*=\s*["']Ada["']/.test(c) && /let\s+lessonsDone\s*:\s*number\s*=\s*2/.test(c),
  "ts-function-types": (c) => /function\s+addScores\s*\(\s*first\s*:\s*number\s*,\s*second\s*:\s*number\s*\)\s*:\s*number\s*\{/.test(c),
};

// ---------------------------------------------
// Instruction Renderer
// Splits raw newline-delimited instruction text into typed visual blocks:
//   intro (first line)  |  context (prose)  |  mission (👉)  |
//   bullet (• -)        |  code block (<...>)  |  example (Example: ...)
// ---------------------------------------------
function renderInstructions(raw: string, css: Record<string, string>): React.ReactNode[] {
  const lines = raw.split('\n');
  const result: React.ReactNode[] = [];
  const codeBuffer: string[] = [];
  let introSeen = false;

  const flushCode = (key: string) => {
    if (!codeBuffer.length) return;
    result.push(
      <pre key={key} className={css.codeBlock}>
        {codeBuffer.join('\n')}
      </pre>
    );
    codeBuffer.length = 0;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // ── Mission line (👉) ────────────────────────────
    if (trimmed.startsWith('👉')) {
      flushCode(`c${i}`);
      const text = trimmed.replace(/^👉\s*(Your mission:\s*)?/i, '');
      result.push(
        <div key={i} className={css.missionBox}>
          <span className={css.missionBadge}>Your task</span>
          <span className={css.missionText}>{text}</span>
        </div>
      );
      return;
    }

    // ── Example / Structure label line ───────────────
    if (/^(Example|Structure|It should look like)\s*:/i.test(trimmed)) {
      flushCode(`c${i}`);
      const colon = trimmed.indexOf(':');
      const label = trimmed.slice(0, colon);
      const code  = trimmed.slice(colon + 1).trim();
      result.push(
        <div key={i} className={css.exampleRow}>
          <span className={css.exampleLabel}>{label}:</span>
          {code && <code className={css.inlineCode}>{code}</code>}
        </div>
      );
      return;
    }

    // ── Bullet points (• or -  prefix) ───────────────
    if (/^[•\-]\s/.test(trimmed)) {
      flushCode(`c${i}`);
      result.push(
        <div key={i} className={css.bulletItem}>
          <span className={css.bulletDot}>•</span>
          <span>{trimmed.replace(/^[•\-]\s+/, '')}</span>
        </div>
      );
      return;
    }

    // ── Pure code lines: starts with < and ends with > ─
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      codeBuffer.push(line);
      return;
    }
    // Indented code continuations inside a code block
    if (codeBuffer.length > 0 && /^\s+</.test(line) && trimmed.endsWith('>')) {
      codeBuffer.push(line);
      return;
    }

    flushCode(`c${i}`);

    // ── First non-special line = intro ───────────────
    if (!introSeen) {
      introSeen = true;
      result.push(<p key={i} className={css.introLine}>{trimmed}</p>);
      return;
    }

    // ── Everything else = context prose ─────────────
    result.push(<p key={i} className={css.contextLine}>{trimmed}</p>);
  });

  flushCode('end');
  return result;
}

const CALLING_CARDS: { value: string; gradient: string }[] = [
  { value: 'indigo', gradient: 'linear-gradient(135deg,#4338ca 0%,#6366f1 50%,#06b6d4 100%)' },
  { value: 'cyber',  gradient: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' },
  { value: 'ocean',  gradient: 'linear-gradient(135deg,#0e7490 0%,#06b6d4 100%)' },
  { value: 'neon',   gradient: 'linear-gradient(135deg,#064e3b 0%,#10b981 100%)' },
  { value: 'night',  gradient: 'linear-gradient(135deg,#1e293b 0%,#475569 100%)' },
  { value: 'jade', gradient: 'linear-gradient(135deg,#021412 0%,#064e3b 52%,#10b981 100%)' },
  { value: 'rose', gradient: 'linear-gradient(135deg,#190008 0%,#881337 52%,#fb7185 100%)' },
  { value: 'volt', gradient: 'linear-gradient(135deg,#0a1400 0%,#3f6212 50%,#a3e635 100%)' },
  { value: 'chrome', gradient: 'linear-gradient(135deg,#0d0d0f 0%,#1e293b 50%,#64748b 100%)' },
  { value: 'fuchsia', gradient: 'linear-gradient(135deg,#1a0028 0%,#7c3aed 48%,#e879f9 100%)' },
  { value: 'aurora', gradient: 'linear-gradient(135deg,#042f2e 0%,#0f766e 48%,#a3e635 100%)' },
  { value: 'glacier', gradient: 'linear-gradient(135deg,#082f49 0%,#0284c7 52%,#bae6fd 100%)' },
  { value: 'crimson', gradient: 'linear-gradient(135deg,#2b0909 0%,#b91c1c 52%,#fb7185 100%)' },
  { value: 'citron', gradient: 'linear-gradient(135deg,#17230a 0%,#65a30d 52%,#fde047 100%)' },
  { value: 'tidal', gradient: 'linear-gradient(135deg,#082f49 0%,#0e7490 52%,#2dd4bf 100%)' },
  { value: 'flare', gradient: 'linear-gradient(135deg,#431407 0%,#ea580c 48%,#facc15 100%)' },
  { value: 'orchid', gradient: 'linear-gradient(135deg,#2e1065 0%,#a21caf 52%,#f0abfc 100%)' },
  { value: 'arctic', gradient: 'linear-gradient(135deg,#172554 0%,#475569 52%,#67e8f9 100%)' },
  { value: 'inferno', gradient: 'linear-gradient(135deg,#1c1917 0%,#9a3412 48%,#dc2626 100%)' },
  { value: 'iris', gradient: 'linear-gradient(135deg,#1e1b4b 0%,#4f46e5 50%,#f472b6 100%)' },
];

function getCallingCardGradient(value: string): string | null {
  const preset = CALLING_CARDS.find(card => card.value === value);
  if (preset) return preset.gradient;
  const custom = /^custom-([0-9a-fA-F]{6})-([0-9a-fA-F]{6})$/.exec(value);
  return custom ? `linear-gradient(135deg, #${custom[1]}, #${custom[2]})` : null;
}

export default function CurriculumPage() {
  const DEFAULT_LEFT_PANE_WIDTH = 420;

  // ---------------------------------------------
  // State Variables
  // ---------------------------------------------
  const [curriculum, setCurriculum] = useState<any>(null);
  const [category, setCategory] = useState("html");
  const [activeSqlTableId, setActiveSqlTableId] = useState<SqlDataTableId>('users');
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "py" | "sql" | "ts" | "browser">("html");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [pyCode, setPyCode] = useState("");
  const [sqlCode, setSqlCode] = useState("");
  const [tsCode, setTsCode] = useState("");
  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("nexus_completed");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [pyOutput, setPyOutput] = useState('');
  const [pyRunning, setPyRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [xpEarned, setXpEarned] = useState(50);
  const hasAttemptedRef = useRef<boolean>(false);

  // Hearts system
  const [hearts, setHearts] = useState<number>(10);
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [callingCard, setCallingCard] = useState<string>('indigo');

  // Mobile pane switcher
  const [mobilePane, setMobilePane] = useState<'instructions' | 'editor'>('instructions');

  // Mobile device detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Level list collapse toggle
  const [levelListCollapsed, setLevelListCollapsed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Tracks whether the user has clicked Submit for the current lesson
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [leftPaneWidth, setLeftPaneWidth] = useState(DEFAULT_LEFT_PANE_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // ---------------------------------------------
  // Refs for Split Layout and Divider
  // ---------------------------------------------
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(DEFAULT_LEFT_PANE_WIDTH);
  const pyodideRef = useRef<any>(null);
  const levelListRef = useRef<HTMLDivElement>(null);
  const introAnimRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('curriculum_left_pane_width');
    if (!raw) return;
    const width = Number(raw);
    if (!Number.isFinite(width)) return;
    setLeftPaneWidth(Math.max(300, Math.min(width, 860)));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('curriculum_left_pane_width', String(Math.round(leftPaneWidth)));
  }, [leftPaneWidth]);

  const clampLeftPaneWidth = useCallback((candidate: number) => {
    const containerWidth = splitContainerRef.current?.clientWidth ?? 1200;
    const minWidth = 300;
    const maxWidth = Math.max(460, Math.floor(containerWidth * 0.72));
    return Math.max(minWidth, Math.min(candidate, maxWidth));
  }, []);

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return;
    isResizingRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = leftPaneWidth;
    setIsResizing(true);
  };

  const resetSplit = () => setLeftPaneWidth(DEFAULT_LEFT_PANE_WIDTH);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      setLeftPaneWidth(prev => clampLeftPaneWidth(prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampLeftPaneWidth, isMobile]);

  const applySplitPreset = (leftRatio: number) => {
    if (isMobile) return;
    const containerWidth = splitContainerRef.current?.clientWidth ?? 1200;
    const targetWidth = Math.round(containerWidth * leftRatio);
    setLeftPaneWidth(clampLeftPaneWidth(targetWidth));
  };

  // Scroll quest list to active item (only after intro animation has run)
  useEffect(() => {
    if (!levelListRef.current || !introAnimRef.current) return;
    const active = levelListRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [sectionIndex]);

  // Lottery-machine intro animation: spins through quests and lands on the active one
  useEffect(() => {
    if (!curriculum) return;
    if (isMobile) return; // no lottery wheel on mobile
    let cancelled = false;
    let rafId: number | null = null;

    const timerId = setTimeout(() => {
      if (cancelled) return;
      const list = levelListRef.current as HTMLDivElement;
      if (!list) return;
      const activeBtn = list.querySelector('[data-active="true"]') as HTMLElement | null;
      if (!activeBtn) return;

      const itemH = activeBtn.offsetHeight || 44;
      const listH = list.clientHeight;
      const target = Math.max(0, activeBtn.offsetTop - listH / 2 + itemH / 2);
      const maxScroll = list.scrollHeight - listH;
      const overshoot = Math.min(maxScroll, target + itemH * 5);

      list.scrollTop = 0;
      setLevelListCollapsed(false);
      introAnimRef.current = false;
      setIsSpinning(true);

      const spinMs = 1400;
      const settleMs = 550;
      let t0: number | null = null;

      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      function frame(now: number) {
        if (cancelled) return;
        if (!t0) t0 = now;
        const elapsed = now - t0;

        if (elapsed < spinMs) {
          list.scrollTop = easeInOut(Math.min(elapsed / spinMs, 1)) * overshoot;
          rafId = requestAnimationFrame(frame);
        } else if (elapsed < spinMs + settleMs) {
          const p = easeOutCubic((elapsed - spinMs) / settleMs);
          list.scrollTop = overshoot + (target - overshoot) * p;
          rafId = requestAnimationFrame(frame);
        } else {
          list.scrollTop = target;
          setIsSpinning(false);
          introAnimRef.current = true;
          setTimeout(() => { if (!cancelled) setLevelListCollapsed(true); }, 700);
        }
      }
      rafId = requestAnimationFrame(frame);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      if (rafId !== null) cancelAnimationFrame(rafId);
      setIsSpinning(false);
    };
  }, [curriculum, category, isMobile]);

  // ---------------------------------------------
  // Persist completed lessons to localStorage
  // ---------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem("nexus_completed", JSON.stringify(Array.from(completedLessons)));
    } catch {}
  }, [completedLessons]);

  // ---------------------------------------------
  // Fetch hearts on mount (logged-in users only)
  // ---------------------------------------------
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) return;
    getHearts()
      .then(data => {
        setHearts(data.hearts);
        setIsPro(data.plan === 'pro');
      })
      .catch(() => {});
    getProfile()
      .then(p => setCallingCard(p.callingCard ?? 'indigo'))
      .catch(() => {});
  }, []);

  // ---------------------------------------------
  // Fetch Curriculum Data
  // ---------------------------------------------
  useEffect(() => {
    fetch("/curriculum.json")
      .then(res => res.json())
      .then(data => {
        setCurriculum(data);
        // If the user navigated here from Nexus Path, jump straight to the lesson
        try {
          const raw = localStorage.getItem('pending_lesson');
          if (raw) {
            const { trackId, lessonKey } = JSON.parse(raw) as { trackId: string; lessonKey: string };
            localStorage.removeItem('pending_lesson');
            // Derive category from lesson key prefix
            const cat = lessonKey.startsWith('html-') ? 'html'
              : lessonKey.startsWith('css-')  ? 'css'
              : lessonKey.startsWith('js-')   ? 'javascript'
              : lessonKey.startsWith('py-')   ? 'python'
              : lessonKey.startsWith('sql-')  ? 'sql'
              : lessonKey.startsWith('ts-')   ? 'typescript'
              : null;
            if (cat && data[cat]) {
              const idx = (data[cat] as any[]).findIndex((l: any) => l.key === lessonKey);
              setSelectedTrack(trackId);
              setCategory(cat);
              setSectionIndex(idx >= 0 ? idx : 0);
            }
          }
        } catch {}
      });
  }, []);

  // ---------------------------------------------
  // Reset Lesson State on Change
  // ---------------------------------------------
  useEffect(() => {
    if (curriculum) {
      const lessons = curriculum[category];
      const currentLesson = lessons[sectionIndex];
      if (currentLesson.language === 'sql') {
        const productLessons = ['sql-where-string', 'sql-order-by', 'sql-limit', 'sql-distinct', 'sql-and-or'];
        const orderLessons = ['sql-count', 'sql-group-by', 'sql-having', 'sql-inner-join'];
        setActiveSqlTableId(productLessons.includes(currentLesson.key) ? 'products' : orderLessons.includes(currentLesson.key) ? 'orders' : 'users');
      }
      if (currentLesson.language === "html") { setHtmlCode(currentLesson.lesson.starterCode || ""); setActiveTab("html"); }
      if (currentLesson.language === "css") { setCssCode(currentLesson.lesson.starterCode || ""); setActiveTab("css"); }
      if (currentLesson.language === "javascript") { setJsCode(currentLesson.lesson.starterCode || ""); setActiveTab("js"); }
      if (currentLesson.language === "python") { setPyCode(currentLesson.lesson.starterCode || ""); setActiveTab("py"); }
      if (currentLesson.language === "sql") { setSqlCode(currentLesson.lesson.starterCode || ""); setActiveTab("sql"); }
      if (currentLesson.language === "typescript") { setTsCode(currentLesson.lesson.starterCode || ""); setActiveTab("ts"); }
      setOutput("");
      setPyOutput('');
      setFeedback(null);
      setShowHint(false);
      setShowReward(false);
      setHasSubmitted(false);
      hasAttemptedRef.current = false;
    }
  }, [curriculum, category, sectionIndex]);

  // ---------------------------------------------
  // Load Pyodide when Python track is selected
  // ---------------------------------------------
  useEffect(() => {
    if (selectedTrack !== 'python') return;
    if (pyodideRef.current || pyodideReady) return;
    let cancelled = false;

    const initPyodide = async () => {
      if (cancelled) return;
      const py = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/',
      });
      if (cancelled) return;
      pyodideRef.current = py;
      setPyodideReady(true);
    };

    // If the script was already injected (e.g. after a navigation), window.loadPyodide
    // is already defined — just call it directly without re-appending the script tag.
    if (_pyodideInjected) {
      if ((window as any).loadPyodide) {
        initPyodide();
      }
      return () => { cancelled = true; };
    }

    _pyodideInjected = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js';
    script.onload = () => initPyodide();
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [selectedTrack, pyodideReady]);

  // ---------------------------------------------
  // Run Python code via Pyodide
  // ---------------------------------------------
  const handleRunPython = async () => {
    if (!pyodideRef.current || pyRunning) return;
    setPyRunning(true);
    setPyOutput('');
    setFeedback(null);
    try {
      let captured = '';
      pyodideRef.current.setStdout({ batched: (s: string) => { captured += s + '\n'; } });
      pyodideRef.current.setStderr({ batched: (s: string) => { captured += s + '\n'; } });
      await pyodideRef.current.runPythonAsync(pyCode);
      setPyOutput(captured || '(no output)');
      // Check the answer after a successful run
      runCheck(pyCode, currentLesson.key);
    } catch (e: any) {
      setPyOutput(e.message ?? String(e));
      setFeedback('wrong');
    } finally {
      setPyRunning(false);
    }
  };

  // ---------------------------------------------
  // Split Pane Drag Logic (desktop)
  // ---------------------------------------------
  useEffect(() => {
    if (!isResizing) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!isResizingRef.current || isMobile) return;
      const delta = e.clientX - resizeStartXRef.current;
      const nextWidth = clampLeftPaneWidth(resizeStartWidthRef.current + delta);
      setLeftPaneWidth(nextWidth);
    };

    const onPointerUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [clampLeftPaneWidth, isMobile, isResizing]);

  // ---------------------------------------------
  // Lesson Checker (shared) — must be before early return
  // ---------------------------------------------
  const runCheck = useCallback((code: string, checkerKey: string, showWrongOnFail = true) => {
    const isCorrect = checkers[checkerKey]?.(code);
    if (isCorrect) {
      setCompletedLessons(prev => new Set(prev).add(checkerKey));
      if (showWrongOnFail) setFeedback("correct");
    } else if (showWrongOnFail) {
      hasAttemptedRef.current = true;
      setFeedback("wrong");
      // Deduct a heart for all users (API for logged-in, local state for guests)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && !isPro) {
        deductHeart()
          .then(data => {
            if (data.hearts !== null) {
              setHearts(data.hearts);
              if (data.hearts === 0) setShowPaywall(true);
            }
          })
          .catch(() => {});
      } else if (!token) {
        setHearts(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) setShowPaywall(true);
          return next;
        });
      }
    }
  }, [isPro]);

  // ---------------------------------------------
  // Mobile lesson handlers (mirror desktop logic)
  // ---------------------------------------------
  const handleMobilePass = useCallback(() => {
    const lesson = curriculum?.[category]?.[sectionIndex];
    if (!lesson) return;
    setCompletedLessons(prev => new Set(prev).add(lesson.key));
    setFeedback('correct');
  }, [curriculum, category, sectionIndex]);

  const handleMobileFail = useCallback(() => {
    hasAttemptedRef.current = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !isPro) {
      deductHeart()
        .then(data => {
          if (data.hearts !== null) {
            setHearts(data.hearts);
            if (data.hearts === 0) setShowPaywall(true);
          }
        })
        .catch(() => {});
    } else if (!token) {
      setHearts(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) setShowPaywall(true);
        return next;
      });
    }
  }, [isPro]);

  const handleMobileSubmit = useCallback(() => {
    if (hasSubmitted) return;
    const lesson = curriculum?.[category]?.[sectionIndex];
    if (!lesson) return;
    setHasSubmitted(true);
    const firstTry = !hasAttemptedRef.current;
    const earned = 50;
    setXpEarned(earned);
    setShowReward(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      submitXp(earned, lesson.key, firstTry).catch(() => {});
    } else {
      const isNew = addLocalCompletedLesson(lesson.key);
      if (isNew) addLocalCredits(LOCAL_CREDIT_RATES.newLesson + (firstTry ? LOCAL_CREDIT_RATES.firstTryBonus : 0));
    }
  }, [hasSubmitted, curriculum, category, sectionIndex]);

  // ---------------------------------------------
  // Live Auto-Check (debounced 600ms) — must be before early return
  // ---------------------------------------------
  useEffect(() => {
    if (!curriculum) return;
    const lessons = curriculum[category];
    const lesson = lessons[sectionIndex];
    let code = "";
    if (lesson.language === "html") code = htmlCode;
    if (lesson.language === "css") code = cssCode;
    if (lesson.language === "javascript") code = jsCode;
    if (lesson.language === "python") code = pyCode;
    if (lesson.language === "typescript") code = tsCode;
    if (code.trim() === (lesson.lesson.starterCode || "").trim()) return;
    // Live check: silently rewards correct answer, never shows wrong banner while typing
    // Live check: silently marks completed in the set, never shows any banner
    const timer = setTimeout(() => runCheck(code, lesson.key, false), 600);
    return () => clearTimeout(timer);
  }, [htmlCode, cssCode, jsCode, pyCode, tsCode, category, sectionIndex, curriculum, runCheck]);

  // ---------------------------------------------
  // Loading State
  // ---------------------------------------------
  if (!curriculum) {
    return <div>Loading curriculum...</div>;
  }

  // ---------------------------------------------
  // Path Selection Landing
  // ---------------------------------------------
  if (!selectedTrack) {
    return (
      <main key="paths" className={`${styles.main} ${styles.mainPaths}`}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.dotGrid} />
        <div className={styles.pathsContainer}>
          <header className={styles.pathsHeader}>
            <div className={styles.pathsBadge}>Curriculum</div>
            <h1 className={styles.pathsTitle}>
              <span className={styles.titleGradient}>Choose Your Path</span>
            </h1>
            <p className={styles.pathsSubtitle}>
              Pick a learning track to begin. More paths coming soon.
            </p>
          </header>
          <div className={styles.tracksGrid}>
            {tracks.map((track) => {
              const totalLessons = track.langs.reduce(
                (sum, l) => sum + (curriculum[l]?.length ?? 0), 0
              );
              const completedCount = track.langs.reduce(
                (sum, l) => sum + (curriculum[l]?.filter((s: any) => completedLessons.has(s.key)).length ?? 0), 0
              );
              return (
                <button
                  key={track.id}
                  className={styles.trackCard}
                  style={{ "--glow": track.glow, "--gradient": `linear-gradient(${track.gradient})` } as React.CSSProperties}
                  onClick={() => {
                    setSelectedTrack(track.id);
                    setCategory(track.langs[0]);
                    setSectionIndex(0);
                    setFeedback(null);
                    setShowReward(false);
                    setShowHint(false);
                  }}
                >
                  <div className={styles.trackAccentBar} />
                  <div className={styles.trackIconWrap}>
                    <span className={styles.trackIcon}>{track.icon}</span>
                  </div>
                  <div className={styles.trackBody}>
                    <h2 className={styles.trackLabel}>{track.label}</h2>
                    <p className={styles.trackTagline}>{track.tagline}</p>
                    <div className={styles.trackLangPills}>
                      {track.langs.map(l => (
                        <span key={l} className={styles.langPill}>{l.toUpperCase()}</span>
                      ))}
                    </div>
                    <div className={styles.trackProgressBar}>
                      <div className={styles.trackProgressFill} style={{ width: `${totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0}%`, background: `linear-gradient(${track.gradient})` }} />
                    </div>
                    <span className={styles.trackProgressLabel}>{completedCount}/{totalLessons} done · {totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0}%</span>
                  </div>
                  <div className={styles.trackMeta}>
                    <span className={styles.trackArrow}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------
  // Lesson Data
  // ---------------------------------------------
  const lessons = curriculum[category];
  const currentLesson = lessons[sectionIndex];
  const activeSqlTable = SQL_DATA_TABLES.find(table => table.id === activeSqlTableId) ?? SQL_DATA_TABLES[0];

  // ---------------------------------------------
  // Editor Handlers
  // ---------------------------------------------
  const handleRun = () => {
    const html = htmlCode;
    const css = `<style>${cssCode}</style>`;
    const js = `<script>${jsCode}</script>`;
    setOutput(`${css}${html}${js}`);
  };

  const handleTabClick = (tab: "html" | "css" | "js" | "py" | "sql" | "ts" | "browser") => {
    if (tab === "browser") {
      handleRun();
    }
    setActiveTab(tab);
  };

  const handleCheckAnswer = () => {
    let code = "";
    if (currentLesson.language === "html") code = htmlCode;
    if (currentLesson.language === "css") code = cssCode;
    if (currentLesson.language === "javascript") code = jsCode;
    if (currentLesson.language === "python") code = pyCode;
    if (currentLesson.language === "sql") code = sqlCode;
    if (currentLesson.language === "typescript") code = tsCode;
    runCheck(code, currentLesson.key);
  };

  // ---------------------------------------------
  // Main Render
  // ---------------------------------------------
  return (
    <main key="lesson" className={styles.main}>
      {/* ── Paywall overlay (hearts = 0) ── */}
      {showPaywall && (
        <div className={styles.paywallOverlay}>
          <div className={styles.paywallCard}>
            <div className={styles.paywallIcon}>�</div>
            <h2 className={styles.paywallTitle}>Out of energy!</h2>
            <p className={styles.paywallBody}>
              You&apos;ve used all 10 energy for today. It recharges at midnight — or upgrade to Pro for unlimited practice.
            </p>
            <button
              type="button"
              className={styles.upgradeBtn}
              onClick={() => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                if (token) {
                  import('../../lib/api').then(({ api }) =>
                    api.post<{ url: string }>('/api/billing/checkout').then(d => { window.location.href = d.url; }).catch(() => {})
                  );
                } else {
                  window.location.href = '/auth/login?redirect=/pricing';
                }
              }}
            >
              Upgrade to Pro ✦
            </button>
            <button
              type="button"
              className={styles.paywallDismiss}
              onClick={() => setShowPaywall(false)}
            >
              Come back tomorrow
            </button>
          </div>
        </div>
      )}
      {/* ── Reward popup (correct answer) ── */}
      <RewardPopup
        open={showReward}
        eyebrow={hasAttemptedRef.current ? 'Progress made' : 'First try'}
        title="Lesson complete"
        reward={`+${xpEarned} XP`}
        tone={category === 'typescript' ? 'typescript' : category === 'python' ? 'python' : category === 'sql' ? 'sql' : 'web'}
        description={sectionIndex + 1 < lessons.length ? 'You just strengthened your coding skills. Ready for the next lesson?' : 'You finished this section. Take a moment to enjoy how far you have come.'}
        icon={category === 'typescript' ? '✦' : '⭐'}
        closeBtnLabel={sectionIndex + 1 < lessons.length ? "Next Lesson →" : "Done!"}
        onClose={() => {
          setShowReward(false);
          if (sectionIndex < lessons.length - 1) setSectionIndex(sectionIndex + 1);
        }}
      />
      {/* Split Layout Container */}
      <div
        className={`${styles.splitContainer} ${isResizing ? styles.splitContainerResizing : ''}`}
        ref={splitContainerRef}
      >

        {/* ── Mobile pane switcher (hidden on desktop) ── */}
        <div className={styles.mobilePaneBar}>
          <button
            type="button"
            className={`${styles.mobilePaneBtn} ${mobilePane === 'instructions' ? styles.mobilePaneBtnActive : ''}`}
            onClick={() => setMobilePane('instructions')}
          >
            📖 Instructions
          </button>
          <button
            type="button"
            className={`${styles.mobilePaneBtn} ${mobilePane === 'editor' ? styles.mobilePaneBtnActive : ''}`}
            onClick={() => setMobilePane('editor')}
          >
            💻 Editor (Playground)
          </button>
          {/* Emblem + energy — visible on mobile only (CSS hides on desktop) */}
          {mounted && (
            <div className={styles.mobileUserHud}>
              {localStorage.getItem('token') && (() => {
                const cardGradient = getCallingCardGradient(callingCard);
                return cardGradient ? (
                  <span
                    className={styles.emblem}
                    style={{ background: cardGradient }}
                    title="Your emblem"
                  />
                ) : null;
              })()}
              {isPro && localStorage.getItem('token') ? (
                <span className={styles.mobileEnergyLabel}>✦∞</span>
              ) : (
                <span className={styles.mobileEnergyLabel}>⚡{hearts}/10</span>
              )}
            </div>
          )}
        </div>

        {/* ------------------ Left Pane: Lessons ------------------ */}
        <section
          className={`${styles.leftPane} ${mobilePane === 'editor' ? styles.mobileHidden : ''}`}
          ref={leftPaneRef}
          style={!isMobile ? { flexBasis: `${leftPaneWidth}px` } : undefined}
        >
          {/* Category Navigation */}
          <div className={styles.topNavCard}>
            <button
              className={styles.backButton}
              onClick={() => setSelectedTrack(null)}
            >
              ← Paths
            </button>
            <nav className={styles.sectionToggleCard}>
              {tracks.find(t => t.id === selectedTrack)!.langs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setSectionIndex(0);
                  }}
                  className={
                    category === cat
                      ? `${styles.toggleButton} ${styles.toggleButtonActive}`
                      : styles.toggleButton
                  }
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </nav>
            {!isMobile && (
              <div className={styles.splitPresets} aria-label="Quick layout presets">
                <button
                  type="button"
                  className={styles.splitPresetBtn}
                  onClick={() => applySplitPreset(0.4)}
                  title="40% lesson / 60% editor"
                >
                  40/60
                </button>
                <button
                  type="button"
                  className={styles.splitPresetBtn}
                  onClick={() => applySplitPreset(0.5)}
                  title="50% lesson / 50% editor"
                >
                  50/50
                </button>
                <button
                  type="button"
                  className={styles.splitPresetBtn}
                  onClick={() => applySplitPreset(0.6)}
                  title="60% lesson / 40% editor"
                >
                  60/40
                </button>
              </div>
            )}
            {/* Energy / Pro badge + lesson action buttons */}
            {mounted && (
              <div className={styles.heartsBar}>
                {/* Calling card emblem — only visible when logged in */}
                {localStorage.getItem('token') && (() => {
                  const cardGradient = getCallingCardGradient(callingCard);
                  return cardGradient ? (
                    <span
                      className={styles.emblem}
                      style={{ background: cardGradient }}
                      title="Your emblem"
                    />
                  ) : null;
                })()}
                {isPro && localStorage.getItem('token') ? (
                  <span className={styles.proBadge}>✦ Pro · ∞</span>
                ) : (
                  <div className={styles.energyBar}>
                    <span className={styles.energyLabel}>⚡</span>
                    <div className={styles.energyTrack}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <div key={n} className={`${styles.energyCell} ${n <= hearts ? styles.energyCellFull : styles.energyCellEmpty}`} />
                      ))}
                    </div>
                    <span className={styles.energyCount}>{hearts}/10</span>
                  </div>
                )}
                <div className={styles.heartsActions}>
                  {currentLesson && !isMobile && currentLesson.language !== 'python' && feedback !== 'correct' && (
                    <button type="button" onClick={handleCheckAnswer} className={styles.checkButtonInline}>
                      ✓ Check
                    </button>
                  )}
                  {currentLesson && !isMobile && feedback === 'correct' && !hasSubmitted && (
                    <button
                      type="button"
                      className={styles.submitButtonInline}
                      onClick={async () => {
                        setHasSubmitted(true);
                        const firstTry = !hasAttemptedRef.current;
                        const earned = 50;
                        setXpEarned(earned);
                        setShowReward(true);
                        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                        if (token) {
                          submitXp(earned, currentLesson.key, firstTry).catch(() => {});
                        } else {
                          const isNew = addLocalCompletedLesson(currentLesson.key);
                          if (isNew) addLocalCredits(LOCAL_CREDIT_RATES.newLesson + (firstTry ? LOCAL_CREDIT_RATES.firstTryBonus : 0));
                        }
                      }}
                    >
                      Submit ✓
                    </button>
                  )}
                  {currentLesson && !isMobile && hasSubmitted && sectionIndex < (curriculum?.[category]?.length ?? 0) - 1 && (
                    <button
                      type="button"
                      className={styles.nextButtonInline}
                      onClick={() => setSectionIndex(sectionIndex + 1)}
                    >
                      Next →
                    </button>
                  )}
                  <button type="button" onClick={() => setShowHint(v => !v)} className={styles.hintButtonInline}>
                    💡 Hint
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Level Navigation */}
          <div className={`${styles.levelListWrapper} ${isSpinning ? styles.levelListSpinning : ''} ${isMobile ? styles.mobileHidden : ''}`}>
            <button
              className={styles.levelScrollBtn}
              onClick={() => setLevelListCollapsed(v => !v)}
              aria-label={levelListCollapsed ? 'Expand levels' : 'Collapse levels'}
            >{levelListCollapsed ? '▾' : '▴'}</button>
            <div className={`${styles.levelList} ${levelListCollapsed ? styles.levelListCollapsed : ''}`} ref={levelListRef}>
              {lessons.map((s: any, i: number) => {
                const isActive = sectionIndex === i;
                const isCompleted = completedLessons.has(s.key);
                const isLocked = i > 0 && !completedLessons.has(lessons[i - 1].key);
                return (
                  <button
                    key={s.key}
                    data-active={isActive ? 'true' : undefined}
                    onClick={() => !isLocked && setSectionIndex(i)}
                    className={`${styles.levelItem} ${isActive ? styles.levelItemActive : ""} ${isCompleted ? styles.levelItemCompleted : ""} ${isLocked ? styles.levelItemLocked : ""}`}
                  >
                    <span className={styles.levelNumber}>Lesson {i + 1}</span>
                    <span className={styles.levelLabel}>{s.label}</span>
                    <span className={styles.levelStatus}>
                      {isCompleted ? "✓" : isLocked ? "🔒" : isActive ? "→" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              className={styles.levelScrollBtn}
              onClick={() => setLevelListCollapsed(v => !v)}
              aria-label={levelListCollapsed ? 'Expand levels' : 'Collapse levels'}
            >{levelListCollapsed ? '▴' : '▾'}</button>
          </div>

          {/* Lesson Content Card */}
          <div className={styles.learningCard}>
            {/* Feedback banners */}
            {!isMobile && feedback === "wrong" && (
              <div className={styles.wrongBanner}>
                ❌ Not quite — keep trying or grab a hint!
              </div>
            )}
            {!isMobile && feedback === "correct" && (
              <div className={styles.correctBanner}>
                ✅ Correct! Press Submit to complete this lesson.
              </div>
            )}
            <h1 className={styles.title}>{currentLesson.lesson.title}</h1>
            <span className={styles.lessonNumber}>
              Lesson {sectionIndex + 1} of {lessons.length}
            </span>
            <div className={styles.instructionsBlock}>
              {renderInstructions(currentLesson.lesson.instructions, styles)}
            </div>
            {currentLesson.language === 'sql' && (
              <section className={styles.sqlDataSheet} aria-label="SQL practice database">
                <header className={styles.sqlDataHeader}>
                  <div>
                    <span className={styles.sqlDataEyebrow}>Reference database</span>
                    <h2 className={styles.sqlDataTitle}>{activeSqlTable.title}</h2>
                  </div>
                  <span className={styles.sqlDataReadOnly}>SAMPLE DATA</span>
                </header>
                <nav className={styles.sqlDataTabs} aria-label="Database tables">
                  {SQL_DATA_TABLES.map(table => (
                    <button
                      key={table.id}
                      type="button"
                      className={`${styles.sqlDataTab} ${activeSqlTableId === table.id ? styles.sqlDataTabActive : ''}`}
                      onClick={() => setActiveSqlTableId(table.id)}
                      aria-pressed={activeSqlTableId === table.id}
                    >
                      {table.title}
                    </button>
                  ))}
                </nav>
                <div className={styles.sqlDataViewport}>
                  <table className={styles.sqlDataTable}>
                    <caption className={styles.srOnly}>{activeSqlTable.title} sample rows</caption>
                    <thead>
                      <tr>{activeSqlTable.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr>
                    </thead>
                    <tbody>
                      {activeSqlTable.rows.map((row, rowIndex) => (
                        <tr key={`${activeSqlTable.id}-${rowIndex}`}>
                          {row.map((value, columnIndex) => <td key={`${activeSqlTable.id}-${rowIndex}-${columnIndex}`}>{value}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={styles.sqlDataRelation}>{activeSqlTable.relation}</p>
              </section>
            )}
            {/* Hint Section */}
            {showHint && currentLesson.lesson.hint && (
              <div className={styles.hintBox}>
                <strong>Hint:</strong> {currentLesson.lesson.hint}
              </div>
            )}
            {/* Lesson Actions — Python Run is in the right pane; Python submit lives here */}
            <div className={styles.actions}>
              {currentLesson.language === 'python' && !isMobile && feedback === 'correct' && !hasSubmitted && (
                <button
                  type="button"
                  onClick={async () => {
                    setHasSubmitted(true);
                    const firstTry = !hasAttemptedRef.current;
                    const earned = 50;
                    setXpEarned(earned);
                    setShowReward(true);
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                    if (token) {
                      submitXp(earned, currentLesson.key, firstTry).catch(() => {});
                    } else {
                      const isNew = addLocalCompletedLesson(currentLesson.key);
                      if (isNew) addLocalCredits(LOCAL_CREDIT_RATES.newLesson + (firstTry ? LOCAL_CREDIT_RATES.firstTryBonus : 0));
                    }
                  }}
                  className={styles.submitButton}
                >
                  Submit ✓
                </button>
              )}
              {currentLesson.language === 'python' && !isMobile && hasSubmitted && sectionIndex < lessons.length - 1 && (
                <button
                  type="button"
                  onClick={() => setSectionIndex(sectionIndex + 1)}
                  className={styles.nextButton}
                >
                  Next Level →
                </button>
              )}
            </div>
          </div>
          {isMobile && (
            <MobileLessonView
              key={currentLesson.key}
              lessonKey={currentLesson.key}
              onPass={handleMobilePass}
              onFail={handleMobileFail}
              onSubmit={handleMobileSubmit}
              hasSubmitted={hasSubmitted}
              onNext={() => setSectionIndex(sectionIndex + 1)}
              hasNext={sectionIndex < (curriculum?.[category]?.length ?? 0) - 1}
            />
          )}
        </section>

        {/* ------------------ Divider (Draggable) ------------------ */}
        <div
          className={`${styles.divider} ${isMobile ? styles.mobileHidden : ''}`}
          id="drag-divider"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize curriculum and editor panels"
          onPointerDown={startResize}
          onDoubleClick={resetSplit}
          title="Drag to resize panels. Double-click to reset."
        >
          <span className={styles.dividerGrip} aria-hidden="true">⋮⋮</span>
        </div>

        {/* ------------------ Right Pane: Editor ------------------ */}
        <section className={`${styles.rightPane} ${mobilePane === 'instructions' ? styles.mobileHidden : ''}`}>
          {/* Editor Tabs */}
          <div className={styles.editorTabs}>
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("html") && (
              <button
                className={activeTab === "html" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("html")}
              >HTML</button>
            )}
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("css") && (
              <button
                className={activeTab === "css" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("css")}
              >CSS</button>
            )}
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("javascript") && (
              <button
                className={activeTab === "js" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("js")}
              >JavaScript</button>
            )}
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("python") && (
              <button
                className={activeTab === "py" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("py")}
              >Python</button>
            )}
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("sql") && (
              <button
                className={activeTab === "sql" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("sql")}
              >SQL</button>
            )}
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("typescript") && (
              <button
                className={activeTab === "ts" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("ts")}
              >TypeScript</button>
            )}
            {tracks.find(t => t.id === selectedTrack)?.langs.includes("html") && (
              <button
                className={activeTab === "browser" ? styles.activeTab : styles.tab}
                onClick={() => handleTabClick("browser")}
              >Browser</button>
            )}
          </div>
          {/* Editor/Browser Preview */}
          <div className={styles.editorContainer}>
            {activeTab === "html" && (
              <CodeMirror
                key={`html-${category}-${sectionIndex}`}
                value={htmlCode}
                height="100%"
                className={styles.codeEditor}
                theme={nexusTheme}
                extensions={[html(), EditorView.lineWrapping]}
                onChange={value => setHtmlCode(value)}
              />
            )}
            {activeTab === "css" && (
              <CodeMirror
                key={`css-${category}-${sectionIndex}`}
                value={cssCode}
                height="100%"
                className={styles.codeEditor}
                theme={nexusTheme}
                extensions={[css(), EditorView.lineWrapping]}
                onChange={value => setCssCode(value)}
              />
            )}
            {activeTab === "js" && (
              <CodeMirror
                key={`js-${category}-${sectionIndex}`}
                value={jsCode}
                height="100%"
                className={styles.codeEditor}
                theme={nexusTheme}
                extensions={[EditorView.lineWrapping]}
                onChange={value => setJsCode(value)}
              />
            )}
            {activeTab === "py" && (
              <div className={styles.pyPane}>
                <div className={styles.pyToolbar}>
                  <button
                    className={styles.runButton}
                    onClick={handleRunPython}
                    disabled={!pyodideReady || pyRunning}
                  >
                    {!pyodideReady ? '⏳ Loading Python…' : pyRunning ? '⏳ Running…' : '▶ Run'}
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <CodeMirror
                    key={`py-${category}-${sectionIndex}`}
                    value={pyCode}
                    height="100%"
                    className={styles.codeEditor}
                    theme={nexusTheme}
                    extensions={[python(), EditorView.lineWrapping]}
                    onChange={value => setPyCode(value)}
                  />
                </div>
                <div className={styles.pyTerminal}>
                  <div className={styles.pyTerminalHeader}>● Output</div>
                  <pre className={styles.pyTerminalOutput}>{pyOutput}</pre>
                  {feedback === 'correct' && (
                    <div className={styles.pyFeedbackCorrect}>✅ Correct! Press Submit to complete this lesson.</div>
                  )}
                  {feedback === 'wrong' && pyOutput && pyOutput !== '(no output)' && (
                    <div className={styles.pyFeedbackWrong}>❌ Output doesn&apos;t match — check your code and run again.</div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "sql" && (
              <CodeMirror
                key={`sql-${category}-${sectionIndex}`}
                value={sqlCode}
                height="100%"
                className={styles.codeEditor}
                theme={nexusTheme}
                extensions={[sqlLang(), EditorView.lineWrapping]}
                onChange={value => setSqlCode(value)}
              />
            )}
            {activeTab === "ts" && (
              <CodeMirror
                key={`ts-${category}-${sectionIndex}`}
                value={tsCode}
                height="100%"
                className={styles.codeEditor}
                theme={nexusTheme}
                extensions={[javascript({ typescript: true }), EditorView.lineWrapping]}
                onChange={value => setTsCode(value)}
              />
            )}
            {activeTab === "browser" && (
              <iframe
                title="output"
                style={{
                  width: "100%",
                  minHeight: "400px",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  background: "#080d17",
                  colorScheme: "dark"
                }}
                srcDoc={output}
                ref={iframeRef}
              />
            )}
          </div>
          {/* Sample Output (Hint) */}
          {showHint && currentLesson.lesson.sampleOutput && (
            <div className={styles.sampleOutput}>
              <strong>Sample Output:</strong>
              <div>{currentLesson.lesson.sampleOutput}</div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}