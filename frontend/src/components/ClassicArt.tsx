import React from 'react';

const F = { fill: 'currentColor', fillOpacity: 0.14 } as const;

const teeth = (n: number, r1: number, r2: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return <path key={i} d={`M${(12 + c * r1).toFixed(2)} ${(12 + s * r1).toFixed(2)}L${(12 + c * r2).toFixed(2)} ${(12 + s * r2).toFixed(2)}`} strokeWidth="2.4" />;
  });

const skull = (
  <>
    <path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3.2 5.4V19a1 1 0 0 0 1 1h6.6a1 1 0 0 0 1-1v-3.1c1.9-1 3.2-2.8 3.2-5.4A7.5 7.5 0 0 0 12 3Z" {...F} />
    <circle cx="8.8" cy="10.5" r="1.7" />
    <circle cx="15.2" cy="10.5" r="1.7" />
    <path d="M12 13.2v1.6M10 17v3M14 17v3" />
  </>
);

// Static line-art for the non-animated emblems, in the same style as the store icons.
const ART: Record<string, React.ReactNode> = {
  'emblem-cybernetics-servo': (
    <>
      <circle cx="12" cy="12" r="6.2" {...F} />
      <circle cx="12" cy="12" r="2.4" />
      {teeth(8, 6.2, 9.4)}
    </>
  ),
  'emblem-cybernetics-circuit': (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" {...F} />
      <path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21" />
      <path d="M9.5 12h2.2l1.3-2h1.5" />
      <circle cx="14.5" cy="10" r="0.6" fill="currentColor" />
    </>
  ),
  'emblem-cybernetics-neurallink': (
    <>
      <path d="M12 12 5 6.5M12 12l7-5.5M12 12v8M5 6.5 3.5 12M19 6.5 20.5 12" />
      <circle cx="12" cy="12" r="3" {...F} />
      <circle cx="5" cy="6.5" r="1.8" fill="currentColor" fillOpacity="0.35" />
      <circle cx="19" cy="6.5" r="1.8" fill="currentColor" fillOpacity="0.35" />
      <circle cx="12" cy="20" r="1.8" fill="currentColor" fillOpacity="0.35" />
    </>
  ),
  'emblem-cybernetics-chromecore': (
    <>
      <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z" {...F} />
      <path d="M4 7.4 12 12l8-4.6M12 12v9.2" />
      <path d="M12 8.4 15 10.2" strokeOpacity="0.6" />
    </>
  ),
  'emblem-cybernetics-overclock': (
    <>
      <path d="M4.5 16.5a8 8 0 1 1 15 0" {...F} />
      <path d="M12 13.5 16.5 8" strokeWidth="2.2" />
      <circle cx="12" cy="14" r="1.6" fill="currentColor" />
      <path d="M6 12.2 7.2 12.7M12 6.2v1.4M18 12.2l-1.2.5" />
      <path d="M8 19.5h8" />
    </>
  ),
  'emblem-voided-skulls-hollow': skull,
  'emblem-voided-skulls-plague': (
    <>
      <circle cx="12" cy="12" r="9.2" {...F} />
      <circle cx="12" cy="7.2" r="3" />
      <circle cx="7.8" cy="14.6" r="3" />
      <circle cx="16.2" cy="14.6" r="3" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  'emblem-voided-skulls-bonewalker': (
    <>
      <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" strokeWidth="2.2" />
      <circle cx="5" cy="5" r="1.6" /><circle cx="19" cy="5" r="1.6" />
      <circle cx="5" cy="19" r="1.6" /><circle cx="19" cy="19" r="1.6" />
      <circle cx="12" cy="12" r="3.6" {...F} />
      <path d="M10.6 11.2h.01M13.4 11.2h.01" strokeWidth="2" />
    </>
  ),
  'emblem-voided-skulls-voidgrin': (
    <>
      <circle cx="12" cy="12" r="9" {...F} />
      <path d="M7 8.5l3.2 1.8M17 8.5l-3.2 1.8" strokeWidth="2.2" />
      <path d="M6.8 14.2l1.6 2.2 1.6-2.2 2 2.2 2-2.2 1.6 2.2 1.6-2.2" />
    </>
  ),
  'emblem-voided-skulls-lichking': (
    <>
      <path d="M4.5 9.5 3.8 4.5l4.2 3 4-4.6 4 4.6 4.2-3-.7 5Z" {...F} />
      <path d="M7 12.5a5 5 0 0 0 10 0Z" {...F} />
      <path d="M9.8 15.2h.01M14.2 15.2h.01M12 17.5v3M9.5 20.5h5" strokeWidth="1.8" />
    </>
  ),
  'emblem-abstract-sigils-emberrune': (
    <>
      <path d="M12 2.8 18 9l-6 6-6-6Z" {...F} />
      <path d="M8.5 21 12 15l3.5 6M12 2.8V15" />
    </>
  ),
  'emblem-abstract-sigils-tiderune': (
    <>
      <path d="M7 3v18M17 3v18" />
      <path d="M7 3l5 6.5L17 3M7 21l5-6.5 5 6.5" {...F} />
      <path d="M7 3l10 18M17 3 7 21" strokeOpacity="0.5" />
    </>
  ),
  'emblem-abstract-sigils-thornrune': (
    <>
      <path d="M8 2.8v18.4" strokeWidth="2.2" />
      <path d="M8 8.5 17 4M8 14l9-4.5" />
      <circle cx="17" cy="4" r="0.9" fill="currentColor" />
      <circle cx="17" cy="9.5" r="0.9" fill="currentColor" />
    </>
  ),
  'emblem-abstract-sigils-wardenrune': (
    <>
      <path d="M12 3v18" strokeWidth="2.2" />
      <path d="M12 12 5 4.5M12 12l7-7.5" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.35" {...F} />
    </>
  ),
  'emblem-abstract-sigils-eclipserune': (
    <>
      <path d="M12 2.8 20.5 12 12 21.2 3.5 12Z" {...F} />
      <circle cx="12" cy="12" r="4.2" fill="#000" fillOpacity="0.45" />
      <circle cx="12" cy="12" r="6.4" strokeOpacity="0.45" strokeDasharray="2 3" />
    </>
  ),
  'emblem-fractals-mandel': (
    <>
      <circle cx="10.5" cy="12" r="6.5" {...F} />
      <circle cx="19" cy="12" r="2.6" />
      <circle cx="5.2" cy="12" r="1.6" />
      <circle cx="22" cy="12" r="0.8" fill="currentColor" />
      <path d="M10.5 5.5 12 7M10.5 18.5 12 17" strokeOpacity="0.5" />
    </>
  ),
  'emblem-fractals-fern': (
    <>
      <path d="M12 21.5C11.5 15 12.5 9 14 2.8" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${12 - i * 0.12} ${18.5 - i * 4}Q${6.5 + i * 0.8} ${17 - i * 4} ${5 + i * 1.2} ${14.5 - i * 4}M${12 - i * 0.12} ${18.5 - i * 4}Q${17.5 - i * 0.8} ${17 - i * 4} ${19 - i * 1.2} ${14.5 - i * 4}`} />
      ))}
    </>
  ),
  'emblem-fractals-koch': (
    <>
      <path d="M12 3 20 17H4Z" {...F} />
      <path d="M12 21 4 7h16Z" />
      <path d="M12 8.2 15 13.4H9Z" strokeOpacity="0.55" />
    </>
  ),
  'emblem-fractals-julia': (
    <>
      <path d="M12 12a1.4 1.4 0 0 1 2.8 0 2.9 2.9 0 0 1-5.8 0 4.4 4.4 0 0 1 8.8 0 5.9 5.9 0 0 1-11.8 0 7.4 7.4 0 0 1 14.8 0" />
      <circle cx="12.7" cy="12" r="0.7" fill="currentColor" />
    </>
  ),
  'emblem-fractals-infinitebloom': (
    <>
      {[0, 60, 120].map((a) => (
        <ellipse key={a} cx="12" cy="12" rx="3.2" ry="9" transform={`rotate(${a} 12 12)`} {...F} />
      ))}
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </>
  ),
  'avatar-cipher': (
    <>
      <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" {...F} />
    </>
  ),
  'avatar-unbroken': (
    <>
      <path d="m12 3 9 9-9 9-9-9 9-9Z" {...F} />
      <path d="m12 8 4 4-4 4-4-4 4-4Z" />
    </>
  ),
};

export const hasClassicArt = (id: string) => id in ART;

export default function ClassicArt({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="68%"
      height="68%"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ overflow: 'visible', filter: 'drop-shadow(0 0 3px currentColor)' }}
    >
      {ART[id]}
    </svg>
  );
}
