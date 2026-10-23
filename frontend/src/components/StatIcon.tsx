import React from "react";

export type StatIconName = "energy" | "credits" | "level" | "streak" | "xp" | "lock" | "hint" | "check" | "cross" | "save" | "python" | "web" | "folder" | "eye" | "eyeOff" | "gear" | "medal" | "trophy" | "game" | "palette" | "spark";

const COLORS: Record<StatIconName, string> = {
  energy: "#22d3ee",
  credits: "#818cf8",
  level: "#fbbf24",
  streak: "#fb923c",
  xp: "#22d3ee",
  lock: "#94a3b8",
  hint: "#fbbf24",
  check: "#4ade80",
  cross: "#f87171",
  save: "#a5b4fc",
  python: "#60a5fa",
  web: "#22d3ee",
  folder: "#fbbf24",
  eye: "#94a3b8",
  eyeOff: "#94a3b8",
  gear: "#94a3b8",
  medal: "#fbbf24",
  trophy: "#fbbf24",
  game: "#818cf8",
  palette: "#f472b6",
  spark: "#fbbf24",
};

export default function StatIcon({ name, size = 13, muted = false }: { name: StatIconName; size?: number; muted?: boolean }) {
  const color = muted ? "#64748b" : COLORS[name];
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    style: { flex: "0 0 auto", verticalAlign: "-0.15em", filter: muted ? undefined : `drop-shadow(0 0 3px ${color}66)` },
  };
  switch (name) {
    case "xp":
      return <svg {...common}><path d="m12 3 8 5v8l-8 5-8-5V8l8-5Z" fill={color} fillOpacity="0.15" /><path d="M13 7.5 9.5 13h3l-1 3.5 3.5-5.5h-3l1-3.5Z" fill={color} fillOpacity="0.5" strokeWidth="1.2" /></svg>;
    case "lock":
      return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2.5" fill={color} fillOpacity="0.15" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "hint":
      return <svg {...common}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" fill={color} fillOpacity="0.15" /></svg>;
    case "check":
      return <svg {...common}><circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.15" /><path d="m8 12.5 3 3 5-6" /></svg>;
    case "cross":
      return <svg {...common}><circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.15" /><path d="m9 9 6 6M15 9l-6 6" /></svg>;
    case "save":
      return <svg {...common}><path d="M5 4h11l3 3v13H5V4Z" fill={color} fillOpacity="0.15" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></svg>;
    case "python":
      return <svg {...common}><path d="M12 3c-3.5 0-4 1.5-4 3v2h4.5v1H6.5C4.8 9 4 10.5 4 12.5S4.8 16 6.5 16H8v-2.2c0-1.5 1.2-2.8 2.8-2.8h3.4c1.3 0 2.3-1 2.3-2.3V6c0-1.5-1.5-3-4.5-3Z" fill={color} fillOpacity="0.2" /><path d="M12 21c3.5 0 4-1.5 4-3v-2h-4.5v-1h6C19.2 15 20 13.5 20 11.5S19.2 8 17.5 8H16v2.2c0 1.5-1.2 2.8-2.8 2.8H9.8c-1.3 0-2.3 1-2.3 2.3V18c0 1.5 1.5 3 4.5 3Z" fill={color} fillOpacity="0.2" /></svg>;
    case "web":
      return <svg {...common}><circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.12" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z" /></svg>;
    case "folder":
      return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" fill={color} fillOpacity="0.15" /></svg>;
    case "eye":
      return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "eyeOff":
      return <svg {...common}><path d="M2 12s3.5-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.5 7-10 7c-2 0-3.7-.7-5.1-1.6M4 4l16 16" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>;
    case "gear":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" /></svg>;
    case "medal":
      return <svg {...common}><circle cx="12" cy="14.5" r="5.5" fill={color} fillOpacity="0.15" /><path d="m8.5 10-2-7h4l1.5 4M15.5 10l2-7h-4L12 7" /></svg>;
    case "trophy":
      return <svg {...common}><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill={color} fillOpacity="0.15" /><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8.5 21h7M10 18h4" /></svg>;
    case "game":
      return <svg {...common}><rect x="2.5" y="7" width="19" height="11" rx="4" fill={color} fillOpacity="0.15" /><path d="M7 10.5v4M5 12.5h4M15.5 11.5h.01M18 13.5h.01" /></svg>;
    case "palette":
      return <svg {...common}><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.5-2-.6-1.2.2-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 7 17 3 12 3Z" fill={color} fillOpacity="0.15" /><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01" /></svg>;
    case "spark":
      return <svg {...common}><path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7Z" fill={color} fillOpacity="0.2" /></svg>;
    case "energy":
      return <svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill={color} fillOpacity="0.2" /></svg>;
    case "credits":
      return <svg {...common}><path d="M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9L12 2.5Z" fill={color} fillOpacity="0.2" /><path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4" strokeWidth="1.5" /></svg>;
    case "level":
      return <svg {...common}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" fill={color} fillOpacity="0.2" /></svg>;
    case "streak":
      return <svg {...common}><path d="M12 2.5c.6 3.2-2.5 4.8-4 7.2-1.5 2.4-1 5.3.8 7 1.4 1.3 3.1 1.8 4.7 1.8 3.2 0 5.5-2.4 5.5-5.4 0-2.2-1.2-3.8-2.4-5-.2 1.4-.9 2.2-1.7 2.6.4-3-.1-6.2-2.9-8.2Z" fill={color} fillOpacity="0.2" /></svg>;
  }
}
