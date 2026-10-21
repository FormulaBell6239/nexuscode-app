"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./StructureGuide.module.css";

interface Template { name: string; note: string; code: string; }

type Guide = { id: string; label: string; templates: Template[] }[];
export type GuideLanguage = "html" | "css" | "js";

const HTML_TABS: Guide = [
  {
    id: "beginner",
    label: "Beginner",
    templates: [
      {
        name: "Basic page",
        note: "The minimum every HTML page needs.",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <h1>Hello, world!</h1>
  <p>My first paragraph.</p>
</body>
</html>`,
      },
      {
        name: "Header, main, footer",
        note: "Split a page into its three main parts.",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <header>
    <h1>My Website</h1>
  </header>

  <main>
    <p>Main content goes here.</p>
  </main>

  <footer>
    <p>&copy; 2025 My Website</p>
  </footer>
</body>
</html>`,
      },
      {
        name: "List & link",
        note: "Lists, links and an image.",
        code: `<body>
  <h2>My Favourites</h2>
  <ul>
    <li>Coding</li>
    <li>Music</li>
  </ul>
  <a href="https://example.com">Visit a website</a>
  <img src="photo.jpg" alt="A description">
</body>`,
      },
    ],
  },
  {
    id: "intermediate",
    label: "Intermediate",
    templates: [
      {
        name: "Linked CSS & JS",
        note: "Connect your stylesheet and script.",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <nav>
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <section id="home">
      <h1>Welcome</h1>
      <p>Intro text.</p>
    </section>
  </main>

  <footer>
    <p>&copy; 2025</p>
  </footer>

  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: "Contact form",
        note: "Labels, inputs and a submit button.",
        code: `<form action="#" method="post">
  <label for="name">Name</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email</label>
  <input type="email" id="email" name="email" required>

  <label for="msg">Message</label>
  <textarea id="msg" name="message" rows="4"></textarea>

  <button type="submit">Send</button>
</form>`,
      },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    templates: [
      {
        name: "Landing page",
        note: "Classed wrappers ready for CSS Grid/Flexbox.",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Short page description">
  <title>Landing Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a class="logo" href="/">Brand</a>
      <nav class="nav" aria-label="Main">
        <ul class="nav-list">
          <li><a class="nav-link" href="#features">Features</a></li>
          <li><a class="nav-link" href="#pricing">Pricing</a></li>
          <li><a class="btn btn-primary" href="#signup">Sign up</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container hero-inner">
        <h1 class="hero-title">Big headline</h1>
        <p class="hero-text">Supporting text.</p>
        <a class="btn btn-primary" href="#signup">Get started</a>
      </div>
    </section>

    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title">Features</h2>
        <div class="card-grid">
          <article class="card">
            <h3 class="card-title">One</h3>
            <p class="card-text">Description.</p>
          </article>
          <article class="card">
            <h3 class="card-title">Two</h3>
            <p class="card-text">Description.</p>
          </article>
          <article class="card">
            <h3 class="card-title">Three</h3>
            <p class="card-text">Description.</p>
          </article>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; 2025 Brand</p>
    </div>
  </footer>

  <script src="app.js" defer></script>
</body>
</html>`,
      },
      {
        name: "Dashboard layout",
        note: "Sidebar + content area.",
        code: `<div class="app">
  <aside class="sidebar">
    <h2 class="sidebar-title">Menu</h2>
    <nav class="sidebar-nav">
      <a class="sidebar-link active" href="#">Overview</a>
      <a class="sidebar-link" href="#">Reports</a>
      <a class="sidebar-link" href="#">Settings</a>
    </nav>
  </aside>

  <div class="content">
    <header class="topbar">
      <input class="search" type="search" placeholder="Search…">
      <button class="btn">Profile</button>
    </header>

    <main class="panel-grid">
      <section class="panel"><h3>Stat</h3><p class="stat">42</p></section>
      <section class="panel"><h3>Stat</h3><p class="stat">7</p></section>
      <section class="panel panel-wide"><h3>Table</h3></section>
    </main>
  </div>
</div>`,
      },
    ],
  },
];

const CSS_TABS: Guide = [
  {
    id: "beginner", label: "Beginner",
    templates: [
      { name: "Selectors", note: "Pick what to style: tag, class or id.",
        code: `/* tag selector: every <p> */
p {
  color: #333;
}

/* class selector: class="card" */
.card {
  background: white;
}

/* id selector: id="title" */
#title {
  font-size: 2rem;
}` },
      { name: "Text", note: "The most common text properties.",
        code: `body {
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #222;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.02em;
}

a {
  color: royalblue;
  text-decoration: none;
}` },
      { name: "Box model", note: "Every element is a box: content, padding, border, margin.",
        code: `* {
  box-sizing: border-box; /* width includes padding + border */
}

.box {
  width: 300px;
  padding: 20px;          /* space inside */
  border: 2px solid #333; /* the edge */
  margin: 16px auto;      /* space outside; auto centers */
  background: #f4f4f4;
  border-radius: 8px;
}` },
    ],
  },
  {
    id: "intermediate", label: "Intermediate",
    templates: [
      { name: "Flexbox", note: "Line things up in a row or column.",
        code: `.container {
  display: flex;
  flex-direction: row;          /* or column */
  justify-content: space-between; /* main axis */
  align-items: center;          /* cross axis */
  gap: 1rem;
  flex-wrap: wrap;
}

.container > .item {
  flex: 1;  /* share space equally */
}` },
      { name: "Center anything", note: "The classic: center a box on the page.",
        code: `body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  margin: 0;
}` },
      { name: "Grid", note: "Rows and columns in two dimensions.",
        code: `.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.grid .wide {
  grid-column: span 2;
}` },
      { name: "Button + hover", note: "Style states with pseudo-classes.",
        code: `.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: white;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

.btn:active {
  transform: translateY(0);
}` },
    ],
  },
  {
    id: "advanced", label: "Advanced",
    templates: [
      { name: "Variables", note: "Define colors once, reuse everywhere.",
        code: `:root {
  --bg: #0f172a;
  --text: #e2e8f0;
  --accent: #6366f1;
  --radius: 12px;
  --space: 1rem;
}

body {
  background: var(--bg);
  color: var(--text);
}

.card {
  padding: var(--space);
  border-radius: var(--radius);
  border: 1px solid var(--accent);
}` },
      { name: "Responsive", note: "Change layout on smaller screens.",
        code: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

@media (max-width: 600px) {
  .nav-list {
    flex-direction: column;
  }
  .hero-title {
    font-size: 1.8rem;
  }
}` },
      { name: "Card + animation", note: "Shadows, transitions and keyframes.",
        code: `.card {
  background: #1e293b;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: fadeUp 0.5s ease both;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.45);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}` },
      { name: "Sticky header", note: "Positioning and layering.",
        code: `.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
}` },
    ],
  },
];

const JS_TABS: Guide = [
  {
    id: "beginner", label: "Beginner",
    templates: [
      { name: "Variables", note: "Store values and print them.",
        code: `const name = "Sam";      // can't be reassigned
let score = 0;           // can change
score = score + 10;

console.log("Hi " + name);
console.log(\`Score: \${score}\`);` },
      { name: "Functions", note: "Reusable blocks of code.",
        code: `function greet(name) {
  return "Hello, " + name + "!";
}

const double = (n) => n * 2;

console.log(greet("Sam"));
console.log(double(4));` },
      { name: "If / else", note: "Make decisions.",
        code: `const age = 17;

if (age >= 18) {
  console.log("Adult");
} else if (age >= 13) {
  console.log("Teen");
} else {
  console.log("Child");
}` },
    ],
  },
  {
    id: "intermediate", label: "Intermediate",
    templates: [
      { name: "DOM click", note: "Select an element and react to clicks.",
        code: `const btn = document.querySelector("button");
const out = document.querySelector("#output");

btn.addEventListener("click", () => {
  out.textContent = "Clicked!";
  out.classList.toggle("active");
});` },
      { name: "Arrays & loops", note: "Work with lists of data.",
        code: `const nums = [1, 2, 3, 4, 5];

for (const n of nums) {
  console.log(n);
}

const doubled = nums.map(n => n * 2);
const evens   = nums.filter(n => n % 2 === 0);
const total   = nums.reduce((sum, n) => sum + n, 0);` },
      { name: "Form input", note: "Read what the user typed.",
        code: `const form = document.querySelector("form");

form.addEventListener("submit", (e) => {
  e.preventDefault();           // stop page reload
  const value = form.elements.name.value.trim();
  if (!value) return;
  console.log("Submitted:", value);
});` },
    ],
  },
  {
    id: "advanced", label: "Advanced",
    templates: [
      { name: "Fetch API", note: "Load data with async/await.",
        code: `async function loadUsers() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!res.ok) throw new Error("Request failed");
    const users = await res.json();
    console.log(users);
  } catch (err) {
    console.error(err.message);
  }
}

loadUsers();` },
      { name: "Class", note: "Blueprint for objects.",
        code: `class Player {
  constructor(name) {
    this.name = name;
    this.score = 0;
  }

  addPoints(n) {
    this.score += n;
    return this;
  }
}

const p = new Player("Sam");
p.addPoints(10).addPoints(5);` },
      { name: "localStorage", note: "Save data in the browser.",
        code: `const KEY = "todos";

function load() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

const todos = load();
todos.push({ text: "Learn JS", done: false });
save(todos);` },
    ],
  },
];

const GUIDES: Record<GuideLanguage, Guide> = { html: HTML_TABS, css: CSS_TABS, js: JS_TABS };
const TITLES: Record<GuideLanguage, string> = { html: "HTML Structures", css: "CSS Properties", js: "JS Patterns" };

interface Props {
  onClose: () => void;
  onInsert: (code: string) => void;
  language: GuideLanguage;
}

const W = 320;
const MARGIN = 16;

export default function StructureGuide({ onClose, onInsert, language }: Props) {
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState(0);
  const [copied, setCopied] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setTab(0); setSel(0); setCopied(false); }, [language]);

  const TABS = GUIDES[language];
  const current = TABS[tab];
  const tpl = current.templates[sel] ?? current.templates[0];

  const place = () => {
    const h = ref.current?.offsetHeight ?? 400;
    return { x: window.innerWidth - W - MARGIN, y: Math.max(MARGIN, window.innerHeight - h - MARGIN - 40) };
  };
  const current_pos = pos ?? place();

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const start = pos ?? place();
    setPos(start);
    drag.current = { dx: e.clientX - start.x, dy: e.clientY - start.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    // Snap to the nearest screen corner, like a picture-in-picture window
    const h = ref.current?.offsetHeight ?? 0;
    const p = pos ?? place();
    const right = p.x + W / 2 > window.innerWidth / 2;
    const bottom = p.y + h / 2 > window.innerHeight / 2;
    setPos({
      x: right ? window.innerWidth - W - MARGIN : MARGIN,
      y: bottom ? Math.max(MARGIN, window.innerHeight - h - MARGIN) : MARGIN + 48,
    });
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(tpl.code); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
  };

  return (
    <div
      ref={ref}
      className={`${styles.window} ${dragging ? styles.dragging : ''}`}
      style={{ left: current_pos.x, top: current_pos.y, width: W }}
      role="dialog"
      aria-label={`${TITLES[language]} guide`}
    >
      <div
        className={styles.header}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className={styles.grip} aria-hidden="true" />
        <span className={styles.title}>{TITLES[language]}</span>
        <button className={styles.iconBtn} onClick={() => setMinimized(m => !m)} aria-label={minimized ? "Expand" : "Minimize"}>
          {minimized ? "▢" : "–"}
        </button>
        <button className={styles.iconBtn} onClick={onClose} aria-label="Close">✕</button>
      </div>

      {!minimized && (
        <>
          <div className={styles.tabs} style={{ ['--i' as string]: tab }}>
            <span className={styles.thumb} />
            {TABS.map((t, i) => (
              <button key={t.id} className={tab === i ? styles.tabActive : styles.tab} onClick={() => { setTab(i); setSel(0); }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className={styles.picker}>
            {current.templates.map((t, i) => (
              <button key={t.name} className={i === sel ? styles.chipActive : styles.chip} onClick={() => setSel(i)}>{t.name}</button>
            ))}
          </div>
          <p className={styles.note}>{tpl.note}</p>
          <pre className={styles.code}><code>{tpl.code}</code></pre>
          <div className={styles.actions}>
            <button className={styles.btn} onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
            <button className={styles.btnPrimary} onClick={() => onInsert(tpl.code)}>Insert</button>
          </div>
        </>
      )}
    </div>
  );
}
