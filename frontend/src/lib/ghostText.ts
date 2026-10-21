import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
  ViewUpdate,
  keymap,
} from '@codemirror/view';
import { StateEffect, StateField, Extension } from '@codemirror/state';

// ── Language type ─────────────────────────────────────────────────────────────
export type GhostLanguage = 'html' | 'css' | 'js' | 'python';

// ── Local chain maps: trimmed-previous-line → next-line ghost text ────────────
const HTML_CHAINS: Record<string, string> = {
  '<!DOCTYPE html>':   '<html lang="en">',
  '<html lang="en">':  '<head>',
  '<html>':            '<head>',
  '<head>':            '  <meta charset="UTF-8">',
  '<meta charset="UTF-8">': '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">': '  <title>Document</title>',
  '<title>Document</title>': '</head>',
  '</head>':           '<body>',
  '<body>':            '  <h1></h1>',
  '</body>':           '</html>',
  '<ul>':              '  <li></li>',
  '<ol>':              '  <li></li>',
  '<table>':           '  <tr>',
  '<tr>':              '    <td></td>',
  '<form>':            '  <label for="name">Name:</label>',
  '<header>':          '  <h1></h1>',
  '<nav>':             '  <a href="/">Home</a>',
  '<main>':            '  <section>',
  '<section>':         '  <h2></h2>',
  '<footer>':          '  <p>&copy; 2024</p>',
};

const CSS_CHAINS: Record<string, string> = {
  'body {':                     '  margin: 0;',
  '  margin: 0;':               '  padding: 0;',
  '  padding: 0;':              '  box-sizing: border-box;',
  '  box-sizing: border-box;':  '  font-family: sans-serif;',
  '  display: flex;':           '  align-items: center;',
  '  align-items: center;':     '  justify-content: center;',
};

const JS_CHAINS: Record<string, string> = {
  "document.addEventListener('DOMContentLoaded', () => {": '  ',
  'function init() {': '  ',
};

type Suggestion = { pos: number; text: string; cursor?: number };

const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const COMMON_TAGS = [
  'div','span','section','header','footer','nav','main','article','aside','h1','h2','h3','h4','h5','h6','p','a','ul','ol','li',
  'button','form','label','input','img','table','thead','tbody','tr','td','th','textarea','select','option','script','style',
  'title','head','body','html','link','meta','br','hr','strong','em','canvas','video','audio','iframe',
];
const BOILERPLATE = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="UTF-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '  <title>Document</title>',
  '</head>',
  '<body>',
  '  ',
  '</body>',
  '</html>',
].join('\n');

// Returns still-open tags before `end`, with the offset of each opening tag
function openTagStack(text: string): { name: string; from: number }[] {
  const blank = (m: string) => m.replace(/[^\n]/g, ' ');
  const clean = text
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, blank);
  const stack: { name: string; from: number }[] = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)[^<>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const name = m[2].toLowerCase();
    if (m[1]) {
      const i = stack.map(t => t.name).lastIndexOf(name);
      if (i >= 0) stack.length = i;
    } else if (!m[3] && !VOID_TAGS.has(name)) {
      stack.push({ name, from: m.index });
    }
  }
  return stack;
}

function getHtmlSuggestion(view: EditorView, typed: boolean): Suggestion | null {
  const sel = view.state.selection.main;
  if (!sel.empty) return null;
  const pos = sel.head;
  const doc = view.state.doc;
  const line = doc.lineAt(pos);
  if (pos !== line.to) return null;
  const before = line.text.trim();

  if (typed) {
    // "<!do" → "<!DOCTYPE html>"
    if (/^<!/.test(before) && before.length < 15 && '<!doctype html>'.startsWith(before.toLowerCase())) {
      const atStart = doc.sliceString(0, line.from).trim() === '' && doc.sliceString(pos).trim() === '';
      return { pos, text: (atStart ? BOILERPLATE : '<!DOCTYPE html>').slice(before.length) };
    }
    // Just typed an opening tag → ghost its closing tag, cursor stays between
    const open = /<([a-zA-Z][\w-]*)(\s[^<>]*)?>$/.exec(line.text);
    if (open && !VOID_TAGS.has(open[1].toLowerCase()) && !/\/>$/.test(line.text)) {
      const name = open[1];
      const rest = doc.sliceString(pos, Math.min(doc.length, pos + name.length + 4));
      if (!rest.startsWith(`</${name}`)) return { pos, text: `</${name}>`, cursor: 0 };
    }
    // Partial tag name → complete it
    const partial = /<([a-zA-Z][\w-]*)$/.exec(line.text);
    if (partial) {
      const hit = COMMON_TAGS.find(t => t.startsWith(partial[1].toLowerCase()) && t !== partial[1].toLowerCase());
      if (hit) return { pos, text: hit.slice(partial[1].length) + '>' };
    }
    return null;
  }

  // Blank line: known chain first, then close the innermost open tag
  if (before !== '') return null;
  const prevText = line.number > 1 ? doc.line(line.number - 1).text.trim() : '';
  const chain = HTML_CHAINS[prevText];
  if (chain) return { pos, text: chain };
  const stack = openTagStack(doc.sliceString(0, line.from));
  const top = stack[stack.length - 1];
  if (!top) return null;
  const opener = doc.lineAt(top.from);
  const indent = opener.text.length - opener.text.trimStart().length;
  const need = Math.max(0, indent - line.text.length);
  return { pos, text: ' '.repeat(need) + `</${top.name}>` };
}

function getLocalChainSuggestion(
  view: EditorView,
  language: GhostLanguage,
): Suggestion | null {
  const pos  = view.state.selection.main.head;
  const doc  = view.state.doc;
  const line = doc.lineAt(pos);
  // Only fire when cursor is at end of a blank line
  if (line.text.trim() !== '' || pos !== line.to) return null;
  if (line.number < 2) return null;
  const prevLine = doc.line(line.number - 1);
  const prevText = prevLine.text.trim();
  if (!prevText) return null;
  const map =
    language === 'css' ? CSS_CHAINS :
    language === 'js'  ? JS_CHAINS  :
    HTML_CHAINS;
  const suggestion = map[prevText];
  return suggestion ? { pos, text: suggestion } : null;
}

// ── Effects ──────────────────────────────────────────────────────────────────
const setSuggestion = StateEffect.define<Suggestion>();
const clearSuggestion = StateEffect.define<null>();

// ── State field ──────────────────────────────────────────────────────────────
const ghostField = StateField.define<Suggestion | null>({
  create: () => null,
  update(val, tr) {
    if (tr.docChanged) return null;
    for (const e of tr.effects) {
      if (e.is(setSuggestion)) return e.value;
      if (e.is(clearSuggestion)) return null;
    }
    return val;
  },
});

// ── Ghost text widget ─────────────────────────────────────────────────────────
class GhostWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.cssText =
      'color:#4b5563;opacity:0.7;pointer-events:none;font-style:italic;white-space:pre;';
    span.textContent = this.text;
    return span;
  }
  ignoreEvent() { return true; }
}

// ── Decorations from state ───────────────────────────────────────────────────
const ghostDecorations = EditorView.decorations.from(ghostField, (s) => {
  if (!s) return Decoration.none;
  return Decoration.set([
    Decoration.widget({ widget: new GhostWidget(s.text), side: 1 }).range(s.pos),
  ]);
});

// ── Language-aware fetch plugin factory ─────────────────────────────────────
function makeGhostFetchPlugin(language: GhostLanguage) {
  return ViewPlugin.fromClass(
    class {
      private timer: ReturnType<typeof setTimeout> | null = null;

      update(update: ViewUpdate) {
        if (!update.docChanged) return;
        if (this.timer) clearTimeout(this.timer);
        const view = update.view;
        const deleting = update.transactions.some(t => t.isUserEvent('delete'));
        requestAnimationFrame(() => {
          // 1. Try local suggestions first — instant, no API call
          const local = language === 'html'
            ? (getHtmlSuggestion(view, !deleting) ?? (deleting ? null : getHtmlSuggestion(view, false)))
            : getLocalChainSuggestion(view, language);
          if (local) {
            view.dispatch({ effects: [clearSuggestion.of(null), setSuggestion.of(local)] });
            return;
          }
          // 2. No local match — clear then start AI debounce
          view.dispatch({ effects: clearSuggestion.of(null) });
          this.timer = setTimeout(() => this.fetch(view), 500);
        });
      }

      async fetch(view: EditorView) {
        const pos    = view.state.selection.main.head;
        const prefix = view.state.doc.sliceString(0, pos);
        const suffix = view.state.doc.sliceString(pos);
        if (prefix.trim().length < 3) return;

        try {
          const res = await fetch('/api/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, suffix }),
          });
          if (!res.ok) return;
          const { completion } = (await res.json()) as { completion: string };
          // Don't show if cursor moved, or a local suggestion is already visible
          if (!completion) return;
          if (view.state.selection.main.head !== pos) return;
          if (view.state.field(ghostField)) return;
          view.dispatch({ effects: setSuggestion.of({ pos, text: completion }) });
        } catch {
          // Ollama not running — silent fail
        }
      }

      destroy() {
        if (this.timer) clearTimeout(this.timer);
      }
    }
  );
}

// ── Keymap: Tab to accept, Escape to dismiss ─────────────────────────────────
const ghostKeymap = keymap.of([
  {
    key: 'Tab',
    run(view) {
      const s = view.state.field(ghostField);
      if (!s) return false;
      view.dispatch({
        changes: { from: s.pos, insert: s.text },
        effects: clearSuggestion.of(null),
        selection: { anchor: s.pos + (s.cursor ?? s.text.length) },
      });
      return true;
    },
  },
  {
    key: 'Escape',
    run(view) {
      const s = view.state.field(ghostField);
      if (!s) return false;
      view.dispatch({ effects: clearSuggestion.of(null) });
      return true;
    },
  },
]);

// ── Public export ─────────────────────────────────────────────────────────────
export function ghostTextExtension(language: GhostLanguage = 'html'): Extension[] {
  return [ghostField, ghostDecorations, makeGhostFetchPlugin(language), ghostKeymap];
}
