import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ── Editor chrome ─────────────────────────────────────────────────────────────
const nexusEditorTheme = EditorView.theme(
  {
    '&': {
      color: '#e2e8f0',
      backgroundColor: '#080d17',
      height: '100%',
      fontFamily: "'Fira Code', 'Fira Mono', 'Menlo', 'Monaco', monospace",
      fontSize: '0.875rem',
    },
    '.cm-content': {
      caretColor: '#6366f1',
      padding: '12px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#6366f1',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(99, 102, 241, 0.28)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      color: '#6366f1',
    },
    '.cm-gutters': {
      backgroundColor: '#050810',
      color: '#1e293b',
      border: 'none',
      borderRight: '1px solid #0d1424',
      minWidth: '48px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 12px 0 8px',
      minWidth: '32px',
    },
    '.cm-foldGutter .cm-gutterElement': {
      color: '#1e293b',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(6, 182, 212, 0.18)',
      outline: '1px solid rgba(6, 182, 212, 0.4)',
      borderRadius: '2px',
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'rgba(239, 68, 68, 0.18)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      outline: '1px solid rgba(245, 158, 11, 0.4)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(245, 158, 11, 0.35)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
    },
    '.cm-tooltip': {
      backgroundColor: '#0d1424',
      border: '1px solid #1e293b',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        color: '#a5b4fc',
      },
    },
    '.cm-panels': {
      backgroundColor: '#050810',
      color: '#4b5563',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid #111827',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '1px solid #111827',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  },
  { dark: true }
);

// ── Syntax highlighting ───────────────────────────────────────────────────────
const nexusHighlightStyle = HighlightStyle.define([
  { tag: t.keyword,                  color: '#818cf8', fontWeight: '500' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#a5b4fc' },
  { tag: [t.function(t.variableName), t.labelName], color: '#06b6d4' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#f59e0b' },
  { tag: [t.definition(t.name), t.separator], color: '#e2e8f0' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#06b6d4' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#a5b4fc' },
  { tag: [t.meta, t.comment], color: '#2d3748', fontStyle: 'italic' },
  { tag: t.strong,   fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#06b6d4', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#818cf8' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#f59e0b' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#34d399' },
  { tag: t.invalid, color: '#ef4444' },
  // HTML specific
  { tag: t.tagName,       color: '#818cf8' },
  { tag: t.attributeName, color: '#06b6d4' },
  { tag: [t.attributeValue, t.string], color: '#34d399' },
  { tag: t.angleBracket,  color: '#4b5563' },
  // CSS specific
  { tag: t.variableName, color: '#e2e8f0' },
  { tag: t.propertyName, color: '#a5b4fc' },
  { tag: t.unit,         color: '#f59e0b' },
]);

export const nexusTheme = [nexusEditorTheme, syntaxHighlighting(nexusHighlightStyle)];
