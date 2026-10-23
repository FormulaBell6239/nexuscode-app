import React from "react";

const P: Record<string, { c: string; d: React.ReactNode }> = {
  "code-quiz": { c: "#818cf8", d: <><path d="M9 9.5a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.8" /><path d="M12 17.5h.01" /><circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" /></> },
  "syntax-showdown": { c: "#a78bfa", d: <><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" fill="currentColor" fillOpacity="0.12" /><path d="M7.5 15h9" /></> },
  "cs-theory": { c: "#22d3ee", d: <><path d="M3 20h18M5 20 14 4l1.5 2.8M5 20h8" /><path d="m14 4 6 16" fill="currentColor" fillOpacity="0.12" /></> },
  "debugging-challenge": { c: "#4ade80", d: <><rect x="7" y="8" width="10" height="12" rx="5" fill="currentColor" fillOpacity="0.15" /><path d="M12 8V4M9 5l1.5 2M15 5l-1.5 2M3 12h4M17 12h4M4 18l3-2M20 18l-3-2M12 12v8" /></> },
  "error-hunt": { c: "#f87171", d: <><circle cx="10.5" cy="10.5" r="6.5" fill="currentColor" fillOpacity="0.12" /><path d="m15.5 15.5 5 5M10.5 8v3M10.5 13.5h.01" /></> },
  "stack-trace": { c: "#38bdf8", d: <><path d="m12 3 9 5-9 5-9-5 9-5Z" fill="currentColor" fillOpacity="0.15" /><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5" /></> },
  "speed-coding": { c: "#22d3ee", d: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" fillOpacity="0.2" /> },
  "type-race": { c: "#fb923c", d: <><rect x="2.5" y="6.5" width="19" height="11" rx="2.5" fill="currentColor" fillOpacity="0.12" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></> },
  "chain-blitz": { c: "#fb923c", d: <path d="M12 2.5c.6 3.2-2.5 4.8-4 7.2-1.5 2.4-1 5.3.8 7 1.4 1.3 3.1 1.8 4.7 1.8 3.2 0 5.5-2.4 5.5-5.4 0-2.2-1.2-3.8-2.4-5-.2 1.4-.9 2.2-1.7 2.6.4-3-.1-6.2-2.9-8.2Z" fill="currentColor" fillOpacity="0.2" /> },
  "logic-puzzles": { c: "#818cf8", d: <path d="M9 3h4v3a2 2 0 1 0 0 4v3h-3a2 2 0 1 1-4 0H3V9h3a2 2 0 1 0 0-4V3h3Zm4 10h4v3a2 2 0 1 1 0 4h-4v-3a2 2 0 1 0 0-4Z" fill="currentColor" fillOpacity="0.15" /> },
  "algorithm-arena": { c: "#a78bfa", d: <><circle cx="12" cy="5" r="2.5" fill="currentColor" fillOpacity="0.2" /><circle cx="5.5" cy="18" r="2.5" fill="currentColor" fillOpacity="0.2" /><circle cx="18.5" cy="18" r="2.5" fill="currentColor" fillOpacity="0.2" /><path d="M11 7.3 6.5 15.8M13 7.3l4.5 8.5M8 18h8" /></> },
  "graph-navigator": { c: "#22d3ee", d: <><circle cx="5" cy="6" r="2.2" fill="currentColor" fillOpacity="0.2" /><circle cx="19" cy="7" r="2.2" fill="currentColor" fillOpacity="0.2" /><circle cx="12" cy="13" r="2.2" fill="currentColor" fillOpacity="0.2" /><circle cx="6" cy="19" r="2.2" fill="currentColor" fillOpacity="0.2" /><circle cx="18" cy="19" r="2.2" fill="currentColor" fillOpacity="0.2" /><path d="M7 7l3.5 4.5M17 8.5l-3.5 3M10.5 14.5 7.5 17.5M13.5 14.5l3 3" /></> },
  "css-battle": { c: "#f472b6", d: <><rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.12" /><path d="m9 9-3 3 3 3M15 9l3 3-3 3" /></> },
  "html-blitz": { c: "#22d3ee", d: <><circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z" /></> },
  "mini-builder": { c: "#fbbf24", d: <><rect x="3" y="4" width="18" height="16" rx="2.5" fill="currentColor" fillOpacity="0.12" /><path d="M3 9h18M9 9v11" /></> },
  "code-duel": { c: "#f87171", d: <path d="m4 4 7 7M20 4l-7 7M4 20l3-3M20 20l-3-3M9 15l-3 3M15 15l3 3M9.5 9.5l5 5" /> },
  "pair-mode": { c: "#4ade80", d: <><circle cx="8.5" cy="8" r="3" fill="currentColor" fillOpacity="0.15" /><circle cx="16" cy="9" r="2.5" fill="currentColor" fillOpacity="0.15" /><path d="M3 19c0-3 2.5-5 5.5-5S14 16 14 19M15 14.2c2.8-.2 5 1.6 5 4.8" /></> },
  xp_boost_24h: { c: "#22d3ee", d: <><path d="m12 3 8 5v8l-8 5-8-5V8l8-5Z" fill="currentColor" fillOpacity="0.15" /><path d="M13 7.5 9.5 13h3l-1 3.5 3.5-5.5h-3l1-3.5Z" fill="currentColor" fillOpacity="0.5" strokeWidth="1.2" /></> },
  energy_refill: { c: "#4ade80", d: <><rect x="3" y="7" width="16" height="10" rx="2.5" fill="currentColor" fillOpacity="0.15" /><path d="M21 10.5v3M11.5 9.5 9.5 12h3l-2 2.5" /></> },
  streak_shield: { c: "#fb923c", d: <><path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z" fill="currentColor" fillOpacity="0.15" /><path d="M12 9c.4 2-1.6 2.8-1.6 4.6a1.7 1.7 0 0 0 3.4 0c0-.9-.4-1.5-.9-2 0 .6-.3.9-.6 1 .1-1.2-.1-2.2-.3-3.6Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.2" /></> },
  "cyber-neon": { c: "#00ff88", d: <><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" fill="currentColor" fillOpacity="0.12" /><path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9" opacity="0.6" /></> },
  "matrix-green": { c: "#4ade80", d: <><rect x="3" y="4" width="18" height="16" rx="2.5" fill="currentColor" fillOpacity="0.12" /><path d="M8 8v3M8 14v2M12 7v5M12 15v2M16 8v2M16 13v3" /></> },
  "minimal-dark": { c: "#94a3b8", d: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor" fillOpacity="0.15" /> },
  ember: { c: "#fb923c", d: <path d="M12 2.5c.6 3.2-2.5 4.8-4 7.2-1.5 2.4-1 5.3.8 7 1.4 1.3 3.1 1.8 4.7 1.8 3.2 0 5.5-2.4 5.5-5.4 0-2.2-1.2-3.8-2.4-5-.2 1.4-.9 2.2-1.7 2.6.4-3-.1-6.2-2.9-8.2Z" fill="currentColor" fillOpacity="0.2" /> },
  solar: { c: "#fbbf24", d: <><circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></> },
  elite: { c: "#22d3ee", d: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="currentColor" fillOpacity="0.12" /><path d="M13 8.5 9 13.5h3l-1 3 4-5h-3l1-3Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.2" /></> },
  inferno: { c: "#fb923c", d: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="currentColor" fillOpacity="0.12" /><path d="M12 8c.4 2-1.8 2.8-1.8 4.8a1.9 1.9 0 0 0 3.8 0c0-1-.5-1.7-1-2.2 0 .7-.3 1-.7 1.1.1-1.3 0-2.3-.3-3.7Z" fill="currentColor" fillOpacity="0.4" strokeWidth="1.2" /></> },
  "avatar-cipher": { c: "#a78bfa", d: <><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" fill="currentColor" fillOpacity="0.12" /></> },
  "avatar-unbroken": { c: "#818cf8", d: <><path d="m12 3 9 9-9 9-9-9 9-9Z" fill="currentColor" fillOpacity="0.15" /><path d="m12 8 4 4-4 4-4-4 4-4Z" /></> },
  tournament: { c: "#fbbf24", d: <><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill="currentColor" fillOpacity="0.15" /><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8.5 21h7M10 18h4" /></> },
};

export const slugifyGame = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function GameIcon({ slug, fallback, size = 22 }: { slug: string | null | undefined; fallback?: string; size?: number }) {
  const g = slug ? P[slug] : undefined;
  if (slug === "cyber-neon") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 0 3px #ff2bd666) drop-shadow(0 0 6px #00e5ff88)" }}
      >
        <defs>
          <linearGradient id="cyberNeonStroke" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00f0ff" />
            <stop offset="0.5" stopColor="#ff2bd6" />
            <stop offset="1" stopColor="#fcee0a" />
          </linearGradient>
          <linearGradient id="cyberNeonFill" x1="21" y1="3" x2="3" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fcee0a" stopOpacity="0.35" />
            <stop offset="0.5" stopColor="#ff2bd6" stopOpacity="0.3" />
            <stop offset="1" stopColor="#00f0ff" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" fill="url(#cyberNeonFill)" stroke="url(#cyberNeonStroke)" />
        <path d="M13.5 6.5 8.5 13h3.2l-1.2 4.5 5-6.5h-3.2l1.2-4.5Z" fill="url(#cyberNeonStroke)" stroke="none" />
        <path d="M4 7l4 2.3M20 7l-4 2.3" stroke="#00f0ff" opacity="0.7" />
      </svg>
    );
  }
  if (!g) return <>{fallback ?? null}</>;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={g.c}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: g.c, filter: `drop-shadow(0 0 4px ${g.c}55)` }}
    >
      {g.d}
    </svg>
  );
}

export const stripLeadingEmoji = (n: string) => n.replace(/^[^\p{L}\p{N}]+/u, "");
