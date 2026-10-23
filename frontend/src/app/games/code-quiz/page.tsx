'use client';
import StatIcon from "@/components/StatIcon";
import QuizGame from '@/components/QuizGame';

const CATEGORY_COLORS: Record<string, string> = {
  HTML: '#f97316', CSS: '#06b6d4', JS: '#f59e0b', Python: '#10b981',
};

const questions = [
  // ── HTML ────────────────────────────────────────────────────────────────
  { cat: 'HTML', q: 'What does HTML stand for?', opts: ['HyperText Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'High-Tech Module Language'], a: 0 },
  { cat: 'HTML', q: 'Which HTML tag creates a hyperlink?', opts: ['<link>', '<a>', '<href>', '<url>'], a: 1 },
  { cat: 'HTML', q: 'Which tag creates the LARGEST heading?', opts: ['<heading>', '<h6>', '<h1>', '<title>'], a: 2 },
  { cat: 'HTML', q: 'What does the alt attribute on <img> provide?', opts: ['The image file format', 'Image dimensions', 'Alternative text if the image fails to load', 'A tooltip on hover'], a: 2 },
  { cat: 'HTML', q: 'Which tag wraps all visible page content?', opts: ['<html>', '<meta>', '<head>', '<body>'], a: 3 },
  { cat: 'HTML', q: 'Which tag creates an ordered (numbered) list?', opts: ['<ul>', '<li>', '<ol>', '<list>'], a: 2 },
  // ── CSS ─────────────────────────────────────────────────────────────────
  { cat: 'CSS', q: 'Which CSS property changes text color?', opts: ['font-color', 'text-color', 'color', 'fg-color'], a: 2 },
  { cat: 'CSS', q: "Which property adds space INSIDE an element's border?", opts: ['margin', 'padding', 'border-spacing', 'gap'], a: 1 },
  { cat: 'CSS', q: 'Which display value creates a flex container?', opts: ['block', 'grid', 'inline', 'flex'], a: 3 },
  { cat: 'CSS', q: 'Which CSS selector targets elements by class name?', opts: ['#name', '.name', 'name', '@name'], a: 1 },
  // ── JavaScript ──────────────────────────────────────────────────────────
  { cat: 'JS', q: 'Which symbol starts a single-line comment in JavaScript?', opts: ['#', '/* */', '//', '--'], a: 2 },
  { cat: 'JS', q: 'Which keyword declares a block-scoped constant?', opts: ['var', 'let', 'const', 'static'], a: 2 },
  { cat: 'JS', q: 'What does typeof [] return?', opts: ["'array'", "'list'", "'null'", "'object'"], a: 3 },
  // ── Python ──────────────────────────────────────────────────────────────
  { cat: 'Python', q: "How do you print 'Hello' in Python?", opts: ["echo 'Hello'", "console.log('Hello')", "print('Hello')", "printf('Hello')"], a: 2 },
  { cat: 'Python', q: 'Which operator checks equality in Python?', opts: ['=', '=>', '===', '=='], a: 3 },
];

export default function CodeQuiz() {
  return (
    <QuizGame
      questions={questions}
      xpPerCorrect={20}
      difficulty="Easy"
      feedbackDelayMs={1300}
      maxWidth={520}
      questionFontSize="1.15rem"
      resultIcon={<StatIcon name="spark" size={56} />}
      resultTitle="Quiz Complete!"
      messages={{ high: 'Perfect score!', mid: 'Well done!', low: 'Keep practicing!' }}
      categoryColors={CATEGORY_COLORS}
    />
  );
}
