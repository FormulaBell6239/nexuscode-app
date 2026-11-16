import type { EditorView } from '@codemirror/view';

export type LocalSuggestion = { pos: number; text: string; cursor?: number; from?: number };
type Lang = 'css' | 'js' | 'python';

// ── Project context: lets each editor learn from the other tabs ───────────────
type Ctx = { html: string; css: string; js: string };
let projectCtx: Ctx = { html: '', css: '', js: '' };
export function setProjectContext(c: Ctx) { projectCtx = c; }

function ctxFor(view: EditorView, lang: 'html' | 'css' | 'js'): Ctx {
  return { ...projectCtx, [lang]: view.state.doc.toString() };
}
const uniq = <T,>(a: T[]) => [...new Set(a)];
const stripCss = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '').replace(/(["'])(?:(?!\1).)*\1/g, '');
const htmlClasses = (html: string) =>
  uniq([...html.matchAll(/class\s*=\s*"([^"]*)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean));
const htmlIds = (html: string) => uniq([...html.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map(m => m[1]));
const htmlTags = (html: string) => uniq([...html.matchAll(/<([a-z][a-z0-9]*)/g)].map(m => m[1]));
const cssClasses = (css: string) => uniq([...stripCss(css).matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m => m[1]));
const cssIds = (css: string) => uniq([...stripCss(css).matchAll(/#([a-zA-Z_][\w-]*)\s*[,{:.>+~\[ ]/g)].map(m => m[1]));
const cssVars = (css: string) => uniq([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));

// property → values you already used, most recent first (this is the "theme memory")
function learnedValues(doc: string, skipFrom: number, skipTo: number): Record<string, string[]> {
  const text = doc.slice(0, skipFrom) + ' '.repeat(skipTo - skipFrom) + doc.slice(skipTo);
  const out: Record<string, string[]> = {};
  for (const m of text.matchAll(/([a-z-]+)\s*:\s*([^;{}\n]+);/g)) {
    const prop = m[1], val = m[2].trim();
    if (!CSS_PROPS[prop] && !prop.startsWith('--')) continue;
    out[prop] = [val, ...(out[prop] ?? []).filter(v => v !== val)];
  }
  return out;
}
const COLOR_PROPS = new Set(['color', 'background', 'background-color', 'border-color', 'outline-color']);

// ── CSS knowledge ─────────────────────────────────────────────────────────────
// property → likely values (first is the default suggestion)
const CSS_PROPS: Record<string, string[]> = {
  display: ['flex', 'block', 'grid', 'inline-block', 'none', 'inline'],
  color: ['#333333', 'white', 'black', 'red', 'blue'],
  background: ['#f5f5f5', 'white', 'linear-gradient(135deg, #667eea, #764ba2)'],
  'background-color': ['#f5f5f5', 'white', 'black', 'transparent'],
  margin: ['0', '0 auto', '1rem', '10px'],
  'margin-top': ['1rem', '0', '10px'],
  'margin-bottom': ['1rem', '0', '10px'],
  'margin-left': ['auto', '1rem', '0'],
  'margin-right': ['auto', '1rem', '0'],
  padding: ['1rem', '0', '10px', '20px'],
  'padding-top': ['1rem', '0', '10px'],
  'padding-bottom': ['1rem', '0', '10px'],
  'padding-left': ['1rem', '0', '10px'],
  'padding-right': ['1rem', '0', '10px'],
  border: ['1px solid #ccc', 'none', '2px solid black'],
  'border-radius': ['8px', '50%', '4px', '0'],
  'border-color': ['#ccc', 'black'],
  'box-shadow': ['0 2px 8px rgba(0, 0, 0, 0.15)', 'none'],
  'box-sizing': ['border-box', 'content-box'],
  width: ['100%', 'auto', '200px', '50%', '100vw'],
  height: ['100%', 'auto', '200px', '100vh'],
  'max-width': ['100%', '600px', '1200px'],
  'min-height': ['100vh', '100px'],
  'min-width': ['0', '100px'],
  'font-family': ['sans-serif', 'Arial, sans-serif', 'monospace', 'Georgia, serif'],
  'font-size': ['16px', '1rem', '1.5rem', '14px'],
  'font-weight': ['bold', 'normal', '600'],
  'font-style': ['italic', 'normal'],
  'line-height': ['1.5', '1.6', '1'],
  'letter-spacing': ['1px', 'normal'],
  'text-align': ['center', 'left', 'right', 'justify'],
  'text-decoration': ['none', 'underline'],
  'text-transform': ['uppercase', 'capitalize', 'lowercase', 'none'],
  'align-items': ['center', 'flex-start', 'flex-end', 'stretch'],
  'align-content': ['center', 'flex-start', 'space-between'],
  'justify-content': ['center', 'space-between', 'space-around', 'flex-start', 'flex-end'],
  'flex-direction': ['column', 'row'],
  'flex-wrap': ['wrap', 'nowrap'],
  flex: ['1', '1 1 auto'],
  gap: ['1rem', '10px', '20px'],
  'grid-template-columns': ['repeat(3, 1fr)', '1fr 1fr', 'repeat(auto-fit, minmax(200px, 1fr))'],
  'grid-template-rows': ['auto', 'repeat(2, 1fr)'],
  position: ['relative', 'absolute', 'fixed', 'sticky'],
  top: ['0', '10px'],
  right: ['0', '10px'],
  bottom: ['0', '10px'],
  left: ['0', '10px'],
  'z-index': ['10', '1', '999'],
  overflow: ['hidden', 'auto', 'scroll', 'visible'],
  opacity: ['0.5', '1', '0'],
  cursor: ['pointer', 'default', 'not-allowed'],
  transition: ['all 0.3s ease', 'color 0.2s ease'],
  transform: ['scale(1.05)', 'translateY(-2px)', 'rotate(45deg)'],
  animation: ['fadeIn 1s ease'],
  'object-fit': ['cover', 'contain'],
  'list-style': ['none', 'disc'],
  'white-space': ['nowrap', 'normal'],
  'vertical-align': ['middle', 'top'],
  outline: ['none', '2px solid blue'],
  content: ['""'],
  visibility: ['hidden', 'visible'],
  float: ['left', 'right', 'none'],
  'background-image': ['url("")', 'linear-gradient(to right, #667eea, #764ba2)'],
  'background-size': ['cover', 'contain'],
  'background-position': ['center', 'top'],
  'background-repeat': ['no-repeat', 'repeat'],
};
const CSS_PROP_NAMES = Object.keys(CSS_PROPS);

// what usually comes after a property
const CSS_NEXT: Record<string, string> = {
  display: 'align-items', 'align-items': 'justify-content', 'justify-content': 'gap', 'flex-direction': 'gap',
  position: 'top', top: 'left', left: 'width', width: 'height', height: 'background',
  margin: 'padding', padding: 'border', border: 'border-radius', 'border-radius': 'box-shadow',
  'font-family': 'font-size', 'font-size': 'color', color: 'background-color', 'background-color': 'padding',
  background: 'padding', 'font-weight': 'line-height', 'line-height': 'text-align', 'text-align': 'color',
  transition: 'cursor', cursor: 'transition', 'box-sizing': 'font-family', 'grid-template-columns': 'gap',
  'max-width': 'margin', overflow: 'position', 'z-index': 'overflow', opacity: 'transition',
};

function cssDepth(text: string): number {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  let d = 0;
  for (const ch of clean) { if (ch === '{') d++; else if (ch === '}') d = Math.max(0, d - 1); }
  return d;
}

function indentOf(s: string) { return s.length - s.trimStart().length; }

function cssTyped(view: EditorView): LocalSuggestion | null {
  const pos = view.state.selection.main.head;
  const doc = view.state.doc;
  const line = doc.lineAt(pos);
  if (pos !== line.to) return null;
  const t = line.text.trim();
  if (!t) return null;
  const ctx = ctxFor(view, 'css');
  const depth = cssDepth(doc.sliceString(0, line.from));
  const ind = ' '.repeat(indentOf(line.text));

  if (depth === 0) {
    const block = (lead: string) => ({ text: `${lead}{\n${ind}  \n${ind}}`, cursor: lead.length + 2 + ind.length + 2 });
    // .cl → a class from your HTML that has no rule yet; #id likewise
    const sel = /^([.#])([\w-]*)$/.exec(t);
    if (sel) {
      const styled = sel[1] === '.' ? cssClasses(doc.sliceString(0, line.from)) : cssIds(doc.sliceString(0, line.from));
      const pool = sel[1] === '.' ? htmlClasses(ctx.html) : htmlIds(ctx.html);
      const hit = pool.find(n => n.startsWith(sel[2]) && !styled.includes(n));
      if (hit) return { pos, ...(() => { const b = block(' '); return { text: hit.slice(sel[2].length) + b.text, cursor: hit.length - sel[2].length + b.cursor }; })() };
      return null;
    }
    // bu → button (tags you actually used in your HTML)
    if (/^[a-z][a-z0-9]*$/.test(t) && t.length >= 2) {
      const styled = new Set([...stripCss(doc.sliceString(0, line.from)).matchAll(/(?:^|[}\s,])([a-z][a-z0-9]*)\s*[{,]/g)].map(m => m[1]));
      const hit = htmlTags(ctx.html).find(n => n.startsWith(t) && n !== t && !styled.has(n));
      if (hit) { const b = block(' '); return { pos, text: hit.slice(t.length) + b.text, cursor: hit.length - t.length + b.cursor }; }
    }
    if (/[{},;:]$/.test(t) || t.startsWith('@') || t.startsWith('/*') || t.includes('{')) return null;
    if (!/^[.#]?[a-zA-Z*][\w\-.#:>+~*\[\]="' ]*$/.test(t) || t.length < 2) return null;
    const lead = line.text.endsWith(' ') ? '' : ' ';
    const text = `${lead}{\n${ind}  \n${ind}}`;
    return { pos, text, cursor: lead.length + 2 + ind.length + 2 };
  }

  // value being typed: "display: fl" / "display:"
  const v = /^([a-z-]+)\s*:\s*([^;:]*)$/.exec(t);
  if (v) {
    const learned = learnedValues(doc.toString(), line.from, line.to);
    const allColors = [...COLOR_PROPS].flatMap(p => learned[p] ?? []).filter(x => /^(#|rgb|hsl)/.test(x));
    const vars = cssVars(ctx.css).map(n => `var(${n})`);
    const useVars = COLOR_PROPS.has(v[1]) ? vars : [];
    const values = uniq([
      ...(learned[v[1]] ?? []),
      ...useVars,
      ...(COLOR_PROPS.has(v[1]) ? uniq(allColors) : []),
      ...(CSS_PROPS[v[1]] ?? []),
    ]);
    if (!CSS_PROPS[v[1]] || values.length === 0) return null;
    const typed = v[2].trim();
    const gap = /:$/.test(t) ? ' ' : '';
    if (typed === '') return { pos, text: `${gap}${values[0]};` };
    const hit = values.find(x => x.startsWith(typed) && x !== typed);
    if (hit) return { pos, text: hit.slice(typed.length) + ';' };
    if (values.includes(typed)) return { pos, text: ';' };
    return null;
  }

  // property name being typed
  if (/^[a-z-]+$/.test(t) && t.length >= 2) {
    const hit = CSS_PROP_NAMES.find(p => p.startsWith(t));
    if (hit) return { pos, text: `${hit.slice(t.length)}: ${CSS_PROPS[hit][0]};` };
  }
  return null;
}

function cssNextProperty(view: EditorView): LocalSuggestion | null {
  const pos = view.state.selection.main.head;
  const doc = view.state.doc;
  const line = doc.lineAt(pos);
  if (line.text.trim() !== '' || pos !== line.to || line.number < 2) return null;
  if (cssDepth(doc.sliceString(0, line.from)) === 0) return null;
  const prev = doc.line(line.number - 1);
  const m = /^\s*([a-z-]+)\s*:\s*(.+?);?\s*$/.exec(prev.text);
  if (!m) return null;
  let next = CSS_NEXT[m[1]];
  if (m[1] === 'display' && m[2] !== 'flex' && m[2] !== 'grid') next = 'margin';
  if (!next) return null;
  const want = indentOf(prev.text);
  const body = `${next}: ${CSS_PROPS[next]?.[0] ?? ''};`;
  if (line.text.length > want) return { pos, from: line.from + want, text: body };
  return { pos, text: ' '.repeat(want - line.text.length) + body };
}

// ── Snippet triggers (JS + Python) ────────────────────────────────────────────
// "|" marks where the cursor lands. Continuation lines get the current indent.
const JS_SNIPPETS = [
  'const |name| = ;',
  'let |name| = ;',
  'function |name|() {\n  \n}',
  'const |name| = () => {\n  \n};',
  'console.log(|);',
  'if (|condition|) {\n  \n}',
  'else {\n  \n}',
  'else if (|condition|) {\n  \n}',
  'for (let i = 0; i < |array|.length; i++) {\n  \n}',
  'for (const |item| of |items|) {\n  \n}',
  'while (|condition|) {\n  \n}',
  'return |;',
  'document.querySelector(\'|\')',
  'document.querySelectorAll(\'|\')',
  'document.getElementById(\'|\')',
  'document.createElement(\'|div\')',
  'addEventListener(\'click\', () => {\n  \n});',
  'setTimeout(() => {\n  \n}, 1000);',
  'setInterval(() => {\n  \n}, 1000);',
  'try {\n  \n} catch (error) {\n  console.error(error);\n}',
  'switch (|value|) {\n  case 1:\n    break;\n  default:\n    break;\n}',
  'async function |name|() {\n  \n}',
  'await fetch(\'|\')',
  'localStorage.setItem(\'|key|\', value);',
  'localStorage.getItem(\'|key|\')',
  'JSON.stringify(|)',
  'JSON.parse(|)',
  'Math.floor(Math.random() * |10|)',
  'class |Name| {\n  constructor() {\n    \n  }\n}',
  'alert(\'|\');',
  'parseInt(|)',
  'innerHTML = \'|\';',
  'textContent = \'|\';',
  'classList.add(\'|\');',
  'classList.toggle(\'|\');',
  'style.|display| = \'none\';',
];

const PY_SNIPPETS = [
  'print(|)',
  'def |name|():\n    ',
  'def |name|(|self|):\n    ',
  'class |Name|:\n    def __init__(self):\n        ',
  'if |condition|:\n    ',
  'elif |condition|:\n    ',
  'else:\n    ',
  'for |i| in range(|10|):\n    ',
  'for |item| in |items|:\n    ',
  'while |condition|:\n    ',
  'try:\n    \nexcept Exception as e:\n    print(e)',
  'with open(\'|file.txt|\') as f:\n    ',
  'import |random|',
  'from |random| import |randint|',
  'return |',
  'input(\'|\')',
  'len(|)',
  'range(|)',
  'int(input(\'|\'))',
  'name = input(\'|What is your name? |\')',
  'random.randint(1, |10|)',
  'lambda |x|: |x|',
  'while True:\n    ',
  'import random',
  'import math',
  'import time',
];

function expandSnippet(snippet: string, ind: string): { text: string; cursor: number } {
  // a generic first placeholder collapses so the cursor sits where you type the name
  snippet = snippet.replace(/\|(name|Name|condition)\|/, '|');
  const placeholder = snippet.indexOf('|');
  const plain = snippet.replace(/\|/g, '');
  const lines = plain.split('\n').map((l, i) => (i === 0 ? l : ind + l));
  const text = lines.join('\n');
  if (placeholder < 0) return { text, cursor: text.length };
  // cursor = position of first "|" in the indented text
  const before = snippet.slice(0, placeholder).split('\n');
  const cursor = before.reduce((n, l, i) => n + l.length + (i === 0 ? 0 : ind.length + 1), 0);
  return { text, cursor };
}

function snippetTyped(view: EditorView, list: string[]): LocalSuggestion | null {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  if (pos !== line.to) return null;
  const t = line.text.trim();
  if (t.length < 2) return null;
  const ind = line.text.slice(0, indentOf(line.text));
  const lastWord = /[\w.$]+$/.exec(t)?.[0] ?? '';
  for (const raw of list) {
    const plain = raw.replace(/\|/g, '');
    // whole line is the start of the snippet…
    let typedLen = plain.startsWith(t) && plain !== t ? t.length : -1;
    // …or the trailing word is (e.g. `x = doc` → `ument.querySelector`)
    if (typedLen < 0 && lastWord.length >= 3 && t !== lastWord) {
      const tail = plain.startsWith(lastWord) && plain !== lastWord ? lastWord.length : -1;
      if (tail >= 0) typedLen = tail;
    }
    if (typedLen < 0) continue;
    const full = expandSnippet(raw, ind);
    // ind is already on the first line; only the remainder after the typed part is inserted
    const firstLineOffset = typedLen;
    return { pos, text: full.text.slice(firstLineOffset), cursor: Math.max(0, full.cursor - firstLineOffset) };
  }
  return null;
}

export function getLocalTypedSuggestion(view: EditorView, language: Lang): LocalSuggestion | null {
  if (!view.state.selection.main.empty) return null;
  if (language === 'css') return cssTyped(view);
  if (language === 'js') return getJsSelectorSuggestion(view) ?? snippetTyped(view, JS_SNIPPETS);
  return snippetTyped(view, PY_SNIPPETS);
}

export function getLocalNextLine(view: EditorView, language: Lang): LocalSuggestion | null {
  return language === 'css' ? cssNextProperty(view) : null;
}

// ── HTML: attributes and class/id names learned from your CSS ─────────────────
const TAG_ATTRS: Record<string, string[]> = {
  a: ['href=""', 'target="_blank"', 'class=""'],
  img: ['src=""', 'alt=""', 'class=""'],
  input: ['type="text"', 'name=""', 'placeholder=""', 'id=""'],
  button: ['type="button"', 'class=""', 'id=""'],
  link: ['rel="stylesheet"', 'href="style.css"'],
  script: ['src="script.js"'],
  form: ['action=""', 'method="post"'],
  label: ['for=""'],
  textarea: ['name=""', 'rows="4"', 'placeholder=""'],
  select: ['name=""', 'id=""'],
  option: ['value=""'],
  meta: ['name=""', 'content=""'],
  video: ['src=""', 'controls'],
  audio: ['src=""', 'controls'],
  iframe: ['src=""', 'title=""'],
};
const DEFAULT_ATTRS = ['class=""', 'id=""'];

export function getHtmlAttrSuggestion(view: EditorView): LocalSuggestion | null {
  const sel = view.state.selection.main;
  if (!sel.empty) return null;
  const pos = sel.head;
  const line = view.state.doc.lineAt(pos);
  const before = line.text.slice(0, pos - line.from);
  const after = line.text.slice(pos - line.from);
  const ctx = ctxFor(view, 'html');

  // class="…|" / id="…|" — suggest names from your CSS (then from this HTML)
  const q = /\b(class|id)\s*=\s*"([^"]*)$/.exec(before);
  if (q && after.startsWith('"')) {
    const isClass = q[1] === 'class';
    const words = q[2].split(/\s+/);
    const partial = words[words.length - 1];
    const used = isClass ? words.slice(0, -1) : [];
    const pool = isClass
      ? uniq([...cssClasses(ctx.css), ...htmlClasses(ctx.html)])
      : uniq([...cssIds(ctx.css), ...htmlIds(ctx.html)]);
    const hit = pool.find(n => n.startsWith(partial) && !used.includes(n) && (partial !== '' || !isClass || true) && n !== partial);
    return hit ? { pos, text: hit.slice(partial.length) } : null;
  }

  // <tag |  → next likely attribute
  if (pos !== line.to) return null;
  const open = /<([a-zA-Z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s$/.exec(before);
  if (!open) return null;
  const tag = open[1].toLowerCase();
  const present = new Set([...open[2].matchAll(/([\w-]+)(?:=|\s|$)/g)].map(m => m[1]));
  const next = (TAG_ATTRS[tag] ?? DEFAULT_ATTRS).find(a => !present.has(a.split('=')[0]));
  if (!next) return null;
  return { pos, text: next, cursor: next.endsWith('"') ? next.length - 1 : next.length };
}

// ── JS: selectors learned from your HTML / CSS ────────────────────────────────
export function getJsSelectorSuggestion(view: EditorView): LocalSuggestion | null {
  const sel = view.state.selection.main;
  if (!sel.empty) return null;
  const pos = sel.head;
  const line = view.state.doc.lineAt(pos);
  const before = line.text.slice(0, pos - line.from);
  const ctx = ctxFor(view, 'js');
  const complete = (pool: string[], partial: string, prefix = '') => {
    const hit = pool.find(n => n.startsWith(partial) && n !== partial);
    return hit ? { pos, text: prefix + hit.slice(partial.length) } : null;
  };
  const allClasses = uniq([...htmlClasses(ctx.html), ...cssClasses(ctx.css)]);
  const allIds = uniq([...htmlIds(ctx.html), ...cssIds(ctx.css)]);

  let m = /getElementById\(\s*['"]([\w-]*)$/.exec(before);
  if (m) return complete(allIds, m[1]);
  m = /getElementsByClassName\(\s*['"]([\w-]*)$/.exec(before) ?? /classList\.(?:add|remove|toggle|contains)\(\s*['"]([\w-]*)$/.exec(before);
  if (m) return complete(allClasses, m[1]);
  m = /querySelector(?:All)?\(\s*['"]([.#]?)([\w-]*)$/.exec(before);
  if (m) {
    if (m[1] === '.') return complete(allClasses, m[2]);
    if (m[1] === '#') return complete(allIds, m[2]);
    if (m[2] === '') {
      const first = allIds[0] ? `#${allIds[0]}` : allClasses[0] ? `.${allClasses[0]}` : '';
      return first ? { pos, text: first } : null;
    }
    return complete(htmlTags(ctx.html), m[2]);
  }
  return null;
}
