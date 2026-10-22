"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import styles from "./Roadmap.module.css";

// ── Custom line icons (replace emoji) ────────────────────────────────────────
const ip = { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const TRACK_ICONS: Record<string, React.ReactElement> = {
  web: <svg {...ip}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.8 2.6 4.2 5.6 4.2 9S14.800 18.400 12 21c-2.800-2.600-4.200-5.600-4.200-9S9.200 5.600 12 3z" /></svg>,
  python: <svg {...ip}><path d="M12 3c-3.500 0-4 1.500-4 3v2h4.500a1.500 1.500 0 011.500 1.500v1" /><path d="M8 8H6.500A2.500 2.500 0 004 10.500v1A2.500 2.500 0 006.500 14H8v-2.500A2.500 2.500 0 0110.500 9H14V6c0-1.500-.500-3-2-3z" /><path d="M12 21c3.500 0 4-1.500 4-3v-2h-4.500A1.500 1.500 0 0110 14.500v-1" /><path d="M16 16h1.500a2.500 2.500 0 002.500-2.500v-1a2.500 2.500 0 00-2.500-2.500H16" /><circle cx="10" cy="5.500" r=".7" fill="currentColor" /><circle cx="14" cy="18.500" r=".7" fill="currentColor" /></svg>,
  sql: <svg {...ip}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.700 3.100 3 7 3s7-1.300 7-3V6" /><path d="M5 12c0 1.700 3.100 3 7 3s7-1.300 7-3" /></svg>,
  typescript: <svg {...ip}><rect x="3.500" y="3.500" width="17" height="17" rx="3" /><path d="M8 10h6M11 10v7" /><path d="M16.500 10.500c-.500-.500-1.200-.700-2-.500s-1 1.200 0 1.700l1.200.600c1 .500.800 1.700 0 1.900-.800.200-1.700 0-2.200-.600" transform="translate(1 .5)" /></svg>,
  react: <svg {...ip}><circle cx="12" cy="12" r="1.600" fill="currentColor" /><ellipse cx="12" cy="12" rx="9" ry="3.600" /><ellipse cx="12" cy="12" rx="9" ry="3.600" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.600" transform="rotate(120 12 12)" /></svg>,
  lock: <svg {...ip}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>,
};

// ── Must match tracks + curriculum.json ──────────────────────────────────────
const TRACKS = [
  {
    id: "web",
    label: "Web Fundamentals",
    icon: "🌐",
    mark: "WEB",
    gradient: "linear-gradient(135deg,#f97316,#ef4444)",
    glow: "#f97316",
    sections: [
      {
        lang: "HTML",
        color: "#f97316",
        lessons: [
          { key: "html-headings",      label: "Headings"          },
          { key: "html-paragraphs",    label: "Paragraphs"        },
          { key: "html-links",         label: "Links"             },
          { key: "html-images",        label: "Images"            },
          { key: "html-lists",         label: "Lists"             },
          { key: "html-forms",         label: "Forms"             },
          { key: "html-divs",          label: "Divs"              },
          { key: "html-tables",        label: "Tables"            },
          { key: "html-semantic",      label: "Semantic Elements" },
          { key: "html-buttons",       label: "Buttons"           },
          { key: "html-textarea",      label: "Textarea"          },
          { key: "html-select",        label: "Select"            },
          { key: "html-comments",      label: "Comments"          },
          { key: "html-classes",       label: "Classes"           },
          { key: "html-anchor-target", label: "Anchor Target"     },
          { key: "html-ordered-list",  label: "Ordered List"      },
          { key: "html-input-types",   label: "Input Types"       },
          { key: "html-meta",          label: "Meta Tags"         },
        ],
      },
      {
        lang: "CSS",
        color: "#06b6d4",
        lessons: [
          { key: "css-selectors",     label: "Selectors"     },
          { key: "css-background",    label: "Background"    },
          { key: "css-font-size",     label: "Font Size"     },
          { key: "css-text-align",    label: "Text Align"    },
          { key: "css-padding",       label: "Padding"       },
          { key: "css-flexbox",       label: "Flexbox"       },
          { key: "css-colors",        label: "Colors"        },
          { key: "css-font-weight",   label: "Font Weight"   },
          { key: "css-border",        label: "Border"        },
          { key: "css-margin",        label: "Margin"        },
          { key: "css-width-height",  label: "Width & Height" },
          { key: "css-border-radius", label: "Border Radius" },
          { key: "css-box-shadow",    label: "Box Shadow"    },
          { key: "css-hover",         label: "Hover States"  },
          { key: "css-variables",     label: "CSS Variables" },
          { key: "css-media-query",   label: "Media Queries" },
          { key: "css-grid",          label: "CSS Grid"      },
          { key: "css-transition",    label: "Transitions"   },
        ],
      },
      {
        lang: "JavaScript",
        color: "#f59e0b",
        lessons: [
          { key: "js-variables",         label: "Variables"         },
          { key: "js-console",           label: "Console"           },
          { key: "js-functions",         label: "Functions"         },
          { key: "js-conditionals",      label: "Conditionals"      },
          { key: "js-arrays",            label: "Arrays"            },
          { key: "js-loops",             label: "Loops"             },
          { key: "js-strings",           label: "Strings"           },
          { key: "js-numbers",           label: "Numbers"           },
          { key: "js-objects",           label: "Objects"           },
          { key: "js-template-literals", label: "Template Literals" },
          { key: "js-arrow-functions",   label: "Arrow Functions"   },
          { key: "js-array-push",        label: "Array push()"      },
          { key: "js-array-map",         label: "Array map()"       },
          { key: "js-array-filter",      label: "Array filter()"    },
          { key: "js-dom-select",        label: "DOM Select"        },
          { key: "js-events",            label: "Events"            },
          { key: "js-ternary",           label: "Ternary"           },
          { key: "js-spread",            label: "Spread"            },
        ],
      },
    ],
  },
  {
    id: "python",
    label: "Python",
    icon: "🐍",
    mark: "PYTHON",
    gradient: "linear-gradient(135deg,#10b981,#3b82f6)",
    glow: "#10b981",
    sections: [
      {
        lang: "Python",
        color: "#10b981",
        lessons: [
          { key: "py-print",        label: "print()"            },
          { key: "py-variables",    label: "Variables"          },
          { key: "py-conditionals", label: "If / Else"          },
          { key: "py-loops",        label: "For Loops"          },
          { key: "py-functions",    label: "Functions"          },
          { key: "py-lists",        label: "Lists"              },
          { key: "py-strings",      label: "Strings"            },
          { key: "py-numbers",      label: "Numbers"            },
          { key: "py-fstrings",     label: "f-Strings"          },
          { key: "py-while",        label: "While Loops"        },
          { key: "py-dict",         label: "Dictionaries"       },
          { key: "py-tuples",       label: "Tuples"             },
          { key: "py-list-comp",    label: "List Comprehension" },
          { key: "py-classes",      label: "Classes"            },
          { key: "py-try-except",   label: "Try / Except"       },
          { key: "py-import",       label: "Imports"            },
          { key: "py-range-step",   label: "Range & Step"       },
        ],
      },
    ],
  },
  {
    id: "sql",
    label: "SQL",
    icon: "🗄️",
    mark: "SQL",
    gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)",
    glow: "#3b82f6",
    sections: [
      {
        lang: "SQL",
        color: "#3b82f6",
        lessons: [
          { key: "sql-select-all",     label: "SELECT *"          },
          { key: "sql-select-columns", label: "Select Columns"    },
          { key: "sql-where",          label: "WHERE Clause"      },
          { key: "sql-where-string",   label: "WHERE + Strings"   },
          { key: "sql-order-by",       label: "ORDER BY"          },
          { key: "sql-limit",          label: "LIMIT"             },
          { key: "sql-distinct",       label: "DISTINCT"          },
          { key: "sql-and-or",         label: "AND / OR"          },
          { key: "sql-like",           label: "LIKE"              },
          { key: "sql-insert",         label: "INSERT INTO"       },
          { key: "sql-update",         label: "UPDATE"            },
          { key: "sql-delete",         label: "DELETE"            },
          { key: "sql-create-table",   label: "CREATE TABLE"      },
          { key: "sql-primary-key",    label: "PRIMARY KEY"       },
          { key: "sql-count",          label: "COUNT()"           },
          { key: "sql-group-by",       label: "GROUP BY"          },
          { key: "sql-having",         label: "HAVING"            },
          { key: "sql-inner-join",     label: "INNER JOIN"        },
        ],
      },
    ],
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: "🔷",
    mark: "TS",
    gradient: "linear-gradient(135deg,#60a5fa,#bae6fd)",
    glow: "#60a5fa",
    sections: [
      {
        lang: "TypeScript",
        color: "#60a5fa",
        lessons: [
          { key: "ts-type-annotations", label: "Type Annotations" },
          { key: "ts-function-types", label: "Typed Functions" },
        ],
      },
    ],
  },
];

type SelectedSection = { trackId: string; lang: string } | null;

// ── Zig-zag path types + layout constants ───────────────────────────────────
type PathNode = {
  id: string; label: string; kind: 'chapter' | 'section' | 'lesson';
  color: string; gradient?: string; icon?: string;
  trackId: string; lang: string;
  done: boolean; locked: boolean; isCurrent: boolean;
  lessonIdx: number;
};
const STEP = 88, PAD_TOP = 64, L_FRAC = 0.28, R_FRAC = 0.72;
const CH_R = 26, SEC_R = 18, LES_R = 14;
function pR(kind: PathNode['kind'], cur: boolean) {
  return kind === 'chapter' ? CH_R : kind === 'section' ? SEC_R : cur ? LES_R + 2 : LES_R;
}

const FUTURE_TRACKS = [
  { id: 'react',      label: 'React',      icon: '⚛️', desc: 'Build interactive UIs.'         },
];

export default function RoadmapPage() {
  const [completed, setCompleted]       = useState<Set<string>>(new Set());
  const [selectedTrack,  setSelectedTrack]   = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<SelectedSection>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(360);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexus_completed");
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedTrack) return;          // only observe when zig-zag is visible
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCw(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedTrack]);

  // Only build path nodes for the active track
  const pathNodes = useMemo<PathNode[]>(() => {
    if (!selectedTrack) return [];
    const track = TRACKS.find(t => t.id === selectedTrack);
    if (!track) return [];
    const nodes: PathNode[] = [];
    let lessonIdx = 0;
    let currentFound = false;
    track.sections.forEach(section => {
      nodes.push({ id: `sec-${track.id}-${section.lang}`, label: section.lang, kind: 'section', color: section.color, trackId: track.id, lang: section.lang, done: false, locked: false, isCurrent: false, lessonIdx: -1 });
      section.lessons.forEach((lesson, li) => {
        const isDone = completed.has(lesson.key);
        const prevKey = li > 0 ? section.lessons[li - 1].key : null;
        const isUnlocked = li === 0 ? true : completed.has(prevKey!);
        const isCurrent = !isDone && isUnlocked && !currentFound;
        if (isCurrent) currentFound = true;
        nodes.push({ id: lesson.key, label: lesson.label, kind: 'lesson', color: section.color, trackId: track.id, lang: section.lang, done: isDone, locked: !isDone && !isUnlocked, isCurrent, lessonIdx: lessonIdx++ });
      });
    });
    return nodes;
  }, [completed, selectedTrack]);

  const totalH = PAD_TOP + pathNodes.length * STEP + 120;
  const nx = (n: PathNode) => n.kind !== 'lesson' ? cw / 2 : n.lessonIdx % 2 === 0 ? cw * L_FRAC : cw * R_FRAC;
  const ny = (i: number) => PAD_TOP + i * STEP;

  // ── VIEW 1: Section detail ───────────────────────────────────────────────
  if (selectedSection) {
    const track = TRACKS.find(t => t.id === selectedSection.trackId)!;
    const si = track.sections.findIndex(s => s.lang === selectedSection.lang);
    const section = track.sections[si];
    const sectionKeys = section.lessons.map(l => l.key);
    const firstIncomplete = sectionKeys.findIndex(k => !completed.has(k));
    const doneCount = sectionKeys.filter(k => completed.has(k)).length;
    const prevSectionLastKey =
      si > 0 ? track.sections[si - 1].lessons[track.sections[si - 1].lessons.length - 1].key : null;

    return (
      <main className={styles.main}>
        <PageShell />
        <div className={styles.container}>
          <button type="button" className={styles.detailBack} onClick={() => setSelectedSection(null)}>
            ← {track.label}
          </button>

          <header className={styles.detailHeader}>
            <div className={styles.detailLangBadge} style={{ color: section.color, borderColor: section.color + "44", background: section.color + "11" }}>
              {track.label}
            </div>
            <h1 className={styles.detailTitle} style={{ color: section.color }}>{section.lang}</h1>
            <p className={styles.detailMeta}>{doneCount} / {sectionKeys.length} lessons complete</p>
          </header>

          <div className={styles.path}>
            <div className={styles.pathLine} style={{ background: section.color + "33" }} />
            {section.lessons.map((lesson, li) => {
              const isDone = completed.has(lesson.key);
              const prevKey = li > 0 ? section.lessons[li - 1].key : null;
              const isUnlocked = li === 0 ? (si === 0 || completed.has(prevSectionLastKey!)) : completed.has(prevKey!);
              const isCurrent = !isDone && isUnlocked && firstIncomplete === li;
              return (
                <div key={lesson.key} className={`${styles.node} ${isDone ? styles.nodeDone : ""} ${isCurrent ? styles.nodeCurrent : ""} ${!isUnlocked && !isDone ? styles.nodeLocked : ""}`}>
                  <div className={styles.nodeDot} style={isDone ? { background: section.color, boxShadow: `0 0 10px ${section.color}88` } : isCurrent ? { borderColor: section.color, boxShadow: `0 0 14px ${section.color}66` } : {}}>
                    {isDone ? "✓" : isCurrent ? "▶" : !isUnlocked ? TRACK_ICONS.lock : String(li + 1)}
                  </div>
                  <div className={styles.nodeContent}>
                    <span className={styles.nodeLabel}>{lesson.label}</span>
                    {isCurrent && <span className={styles.nodeTag} style={{ color: section.color }}>← You are here</span>}
                    {isDone && <span className={styles.nodeTagDone}>completed</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.detailFooter}>
            <Link href="/curriculum" className={styles.continueBtn}>
              {doneCount === sectionKeys.length ? "Review in Curriculum ✓" : doneCount > 0 ? "Continue in Curriculum →" : "Start in Curriculum →"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── VIEW 2: Per-track zig-zag ────────────────────────────────────────────
  if (selectedTrack !== null) {
    const track = TRACKS.find(t => t.id === selectedTrack)!;
    const allKeys = track.sections.flatMap(s => s.lessons.map(l => l.key));
    const doneCount = allKeys.filter(k => completed.has(k)).length;
    const pct = Math.round((doneCount / allKeys.length) * 100);
    const trackCopy = track.id === 'web'
      ? 'Foundations for layouts, interactions, and how the browser actually behaves.'
      : track.id === 'python'
        ? 'Logic, data flow, and problem solving with a clean progression.'
        : track.id === 'sql'
          ? 'Query thinking and data shaping from first principles.'
          : 'A focused learning path built for steady progression.';

    const heroMark = track.id === 'web' ? 'HTML' : track.mark;

    return (
      <main className={styles.main}>
        <PageShell />
        <div className={styles.pathPage}>
          <div className={styles.trackViewHeader}>
            <div className={styles.trackViewCrumbRow}>
              <button type="button" className={styles.trackBackBtn} onClick={() => setSelectedTrack(null)} aria-label="Nexus Path">
                <svg className={styles.backArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
                <span>Nexus Path</span>
              </button>
              <p className={styles.pathHint}>scroll to explore · tap a section to drill in</p>
            </div>
            <header className={styles.trackHeroHeader} style={{ '--tc': track.glow, '--tg': track.gradient } as React.CSSProperties}>
              <span className={styles.trackHeroWatermark} style={{ '--n': heroMark.length } as React.CSSProperties} aria-hidden="true">{heroMark}</span>
              <div className={styles.trackHeroCopy}>
                <div className={styles.trackHeroEyebrow}>◈ Learning Path</div>
                <h1 className={styles.trackHeroTitle}>
                  <span className={styles.trackHeroIcon} aria-hidden="true">{TRACK_ICONS[track.id] ?? track.icon}</span>
                  {track.label}
                </h1>
                <p className={styles.trackHeroBlurb}>{trackCopy}</p>
                <div className={styles.trackHeroLangs}>
                  {track.sections.map(s => (
                    <span
                      key={s.lang}
                      className={styles.trackHeroLangPill}
                      style={{ color: s.color, borderColor: s.color + '33', background: s.color + '0d' }}
                    >
                      {s.lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.trackHeroRail}>
                <div className={styles.trackHeroStatStack}>
                  <span className={styles.trackHeroStatDone}>{doneCount} done</span>
                  <span className={styles.trackHeroStatLeft}>{allKeys.length - doneCount} left</span>
                  <span className={styles.trackHeroStatPct}>{pct}%</span>
                </div>
                <div className={styles.trackHeroBarWrap}>
                  <div className={styles.trackHeroBarFill} style={{ width: `${pct}%`, background: track.gradient }} />
                </div>
              </div>
            </header>
          </div>

          <div ref={containerRef} className={styles.pathCanvas} style={{ height: totalH }}>
            <svg className={styles.pathSvg} width={cw} height={totalH} aria-hidden="true">
              {pathNodes.map((node, i) => {
                if (i === 0) return null;
                const prev = pathNodes[i - 1];
                const x1 = nx(prev), y1 = ny(i - 1);
                const x2 = nx(node), y2 = ny(i);
                const mid = (y1 + y2) / 2;
                const donePath = prev.done && node.done;
                return (
                  <path key={`l${i}`} d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                    stroke={node.color} strokeWidth={donePath ? 1.8 : 1.2}
                    strokeOpacity={donePath ? 0.55 : node.locked ? 0.07 : 0.18}
                    fill="none" strokeLinecap="round" />
                );
              })}
              {pathNodes.map((node, i) => {
                if (!node.done && !node.isCurrent) return null;
                const r = pR(node.kind, node.isCurrent);
                return <circle key={`g${i}`} cx={nx(node)} cy={ny(i)} r={r + (node.isCurrent ? 7 : 5)} fill={node.color} fillOpacity={node.isCurrent ? 0.16 : 0.1} />;
              })}
            </svg>

            {pathNodes.map((node, i) => {
              const x = nx(node), y = ny(i), r = pR(node.kind, node.isCurrent);
              const isLeft  = node.kind === 'lesson' && node.lessonIdx % 2 === 0;
              const isRight = node.kind === 'lesson' && node.lessonIdx % 2 !== 0;
              const inner = node.kind === 'chapter' ? (node.icon ?? '◎') : node.done ? '✓' : node.isCurrent ? '▶' : node.locked ? TRACK_ICONS.lock : node.kind === 'section' ? '◈' : '·';
              return (
                <div key={node.id}
                  className={[styles.pNode, node.kind === 'chapter' ? styles.pNodeChapter : '', node.kind === 'section' ? styles.pNodeSection : '', node.done ? styles.pNodeDone : '', node.isCurrent ? styles.pNodeCurrent : '', node.locked ? styles.pNodeLocked : ''].filter(Boolean).join(' ')}
                  style={{ left: x - r, top: y - r, width: r * 2, height: r * 2, '--nc': node.color, '--ng': node.gradient ?? node.color, cursor: node.locked ? 'default' : 'pointer' } as React.CSSProperties}
                  onClick={() => {
                    if (node.locked) return;
                    if (node.kind === 'section') {
                      const track = TRACKS.find(t => t.id === node.trackId);
                      const section = track?.sections.find(s => s.lang === node.lang);
                      if (section) {
                        const target = section.lessons.find(l => !completed.has(l.key)) ?? section.lessons[0];
                        try { localStorage.setItem('pending_lesson', JSON.stringify({ trackId: node.trackId, lessonKey: target.key })); } catch {}
                        router.push('/curriculum');
                      }
                    } else if (node.kind === 'lesson') {
                      try { localStorage.setItem('pending_lesson', JSON.stringify({ trackId: node.trackId, lessonKey: node.id })); } catch {}
                      router.push('/curriculum');
                    }
                  }}
                  role={node.locked ? undefined : 'button'}
                  tabIndex={node.locked ? -1 : 0}
                  aria-label={node.label}
                >
                  <span className={styles.pNodeInner}>{inner}</span>
                  <span className={[styles.pLabel, isLeft ? styles.pLabelRight : '', isRight ? styles.pLabelLeft : '', !isLeft && !isRight ? styles.pLabelBelow : ''].filter(Boolean).join(' ')}>
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ── VIEW 3: Track selection cards (default) ──────────────────────────────
  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.trackSelectPage}>
        <header className={styles.trackSelectHeader}>
          <div className={styles.badge}>Signal · Your Journey</div>
          <h1 className={styles.title}><span className={styles.titleGradient}>Nexus Path</span></h1>
          <p className={styles.subtitle}>Choose a track to start your journey.</p>
        </header>

        <div className={styles.trackSelectList}>
          {TRACKS.map((track, ti) => {
            const allKeys = track.sections.flatMap(s => s.lessons.map(l => l.key));
            const done = allKeys.filter(k => completed.has(k)).length;
            const pct = Math.round((done / allKeys.length) * 100);
            const totalSections = track.sections.length;
            const status = done === 0 ? 'Start' : done === allKeys.length ? 'Complete ✓' : 'Continue';
            return (
              <button
                key={track.id}
                className={styles.trackSelectCard}
                style={{ '--tc': track.glow, '--tg': track.gradient, animationDelay: `${ti * 80}ms` } as React.CSSProperties}
                onClick={() => setSelectedTrack(track.id)}
              >
                <div className={styles.trackSelectCardAccent} style={{ background: track.gradient }} />
                <span className={styles.trackSelectCardMark} aria-hidden="true">{track.mark}</span>
                <div className={styles.trackSelectCardBody}>
                  <div className={styles.trackSelectCardTop}>
                    <div className={styles.trackSelectCardInfo}>
                      <span className={styles.trackSelectCardLabel}>{track.label}</span>
                      <span className={styles.trackSelectCardMeta}>{totalSections} section{totalSections !== 1 ? 's' : ''} · {allKeys.length} lessons</span>
                    </div>
                    <span className={styles.trackSelectCardCta}>{status} →</span>
                  </div>
                  <div className={styles.trackSelectCardBarWrap}>
                    <div className={styles.trackSelectCardBarFill} style={{ width: `${pct}%`, background: track.gradient }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Coming soon */}
        <div className={styles.trackSelectSoonLabel}>More tracks coming soon</div>
        <div className={styles.trackSelectSoonGrid}>
          {FUTURE_TRACKS.map(ft => (
            <div key={ft.id} className={styles.trackSelectSoonCard}>
              <span className={styles.trackSelectSoonIcon}>{TRACK_ICONS[ft.id] ?? ft.icon}</span>
              <span className={styles.trackSelectSoonName}>{ft.label}</span>
              <p className={styles.trackSelectSoonDesc}>{ft.desc}</p>
              <span className={styles.trackSelectSoonBadge}>soon</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
