'use client';

import styles from './CheatSheet.module.css';

type Group = { title: string; color: string; rows: [string, string][] };

const GROUPS: Group[] = [
  { title: 'Document Structure', color: '#60a5fa', rows: [['<!DOCTYPE html>', 'Defines HTML5'], ['<html>', 'Root element'], ['<head>', 'Contains meta info'], ['<title>', 'Page title'], ['<body>', 'Page content']] },
  { title: 'Text & Content', color: '#fb923c', rows: [['<h1>', 'Heading 1 (largest)'], ['<h2>–<h5>', 'Headings 2 to 5'], ['<h6>', 'Heading 6 (smallest)'], ['<p>', 'Paragraph'], ['<span>', 'Inline text container'], ['<br>', 'Line break'], ['<hr>', 'Horizontal line']] },
  { title: 'Links & Media', color: '#34d399', rows: [['<a>', 'Hyperlink'], ['<img>', 'Image'], ['<video>', 'Video content'], ['<audio>', 'Audio content'], ['<source>', 'Media source'], ['<track>', 'Text tracks for media'], ['<figure>', 'Self-contained content'], ['<figcaption>', 'Caption for figure']] },
  { title: 'Text Formatting', color: '#f472b6', rows: [['<strong>', 'Important text'], ['<b>', 'Bold text'], ['<em>', 'Emphasized text'], ['<i>', 'Italic text'], ['<u>', 'Underlined text'], ['<mark>', 'Highlighted text'], ['<small>', 'Smaller text'], ['<del>', 'Strikethrough'], ['<ins>', 'Inserted text'], ['<sub>', 'Subscript'], ['<sup>', 'Superscript']] },
  { title: 'Lists', color: '#a78bfa', rows: [['<ul>', 'Unordered list'], ['<ol>', 'Ordered list'], ['<li>', 'List item'], ['<dl>', 'Description list'], ['<dt>', 'Term (name)'], ['<dd>', 'Description (value)']] },
  { title: 'Tables', color: '#fbbf24', rows: [['<table>', 'Table container'], ['<thead>', 'Table header'], ['<tbody>', 'Table body'], ['<tfoot>', 'Table footer'], ['<tr>', 'Table row'], ['<th>', 'Heading cell'], ['<td>', 'Data cell'], ['<caption>', 'Table title']] },
  { title: 'Forms & Input', color: '#38bdf8', rows: [['<form>', 'Form container'], ['<input>', 'Input field'], ['<label>', 'Label for input'], ['<textarea>', 'Multi-line input'], ['<button>', 'Clickable button'], ['<select>', 'Dropdown list'], ['<option>', 'Dropdown option'], ['<optgroup>', 'Group of options'], ['<fieldset>', 'Group related fields'], ['<legend>', 'Title for fieldset']] },
  { title: 'Semantic Elements', color: '#2dd4bf', rows: [['<header>', 'Header section'], ['<nav>', 'Navigation links'], ['<main>', 'Main content'], ['<section>', 'Section in page'], ['<article>', 'Independent content'], ['<aside>', 'Sidebar content'], ['<footer>', 'Footer section'], ['<address>', 'Contact information']] },
  { title: 'Layout & Grouping', color: '#c084fc', rows: [['<div>', 'Block-level container'], ['<span>', 'Inline container'], ['<section>', 'Section in page'], ['<article>', 'Independent content']] },
  { title: 'Embedding', color: '#f87171', rows: [['<iframe>', 'Inline frame'], ['<embed>', 'Embed external content'], ['<object>', 'Embedded object'], ['<picture>', 'Responsive images'], ['<canvas>', 'Graphics with JavaScript'], ['<svg>', 'Scalable vector graphics']] },
  { title: 'Other Useful Tags', color: '#facc15', rows: [['<meta>', 'Metadata (in head)'], ['<link>', 'Link external resources'], ['<style>', 'Internal CSS'], ['<script>', 'JavaScript'], ['<noscript>', 'Fallback content'], ['<template>', 'HTML template'], ['<details>', 'Collapsible content'], ['<summary>', 'Summary for details'], ['<code>', 'Inline code'], ['<pre>', 'Preformatted text']] },
];

export default function HtmlCheatSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="HTML tags cheat sheet" onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.head}>
          <div>
            <span className={styles.kicker}>HTML TAGS</span>
            <h2 className={styles.title}>Cheat <span>Sheet</span></h2>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close cheat sheet">✕</button>
        </div>
        <div className={styles.grid}>
          {GROUPS.map(g => (
            <section key={g.title} className={styles.card} style={{ ['--c' as string]: g.color }}>
              <h3 className={styles.cardTitle}>{g.title}</h3>
              {g.rows.map(([tag, desc]) => (
                <div key={tag + desc} className={styles.row}>
                  <code className={styles.tag}>{tag}</code>
                  <span className={styles.desc}>{desc}</span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
