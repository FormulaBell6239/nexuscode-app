import React from 'react';

type Icon = { color: string; art: React.ReactNode };

const F = { fill: 'currentColor', fillOpacity: 0.14 } as const;
const D = { fill: 'currentColor', stroke: 'none' } as const;

const pixels = (rows: string[], cell = 1.6, ox = 3.2, oy = 5.6) =>
  rows.flatMap((row, y) =>
    [...row].map((ch, x) =>
      ch === '#' ? <rect key={`${x}-${y}`} x={ox + x * cell} y={oy + y * cell} width={cell + 0.05} height={cell + 0.05} {...D} /> : null,
    ),
  );

// Names are matched to the avatar list by position (see AVATAR_ORDER in ClassicAvatars).
export const ICONS: Record<string, Icon> = {
  invader: {
    color: '#a78bfa',
    art: pixels(['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...']),
  },
  robot: {
    color: '#67e8f9',
    art: (
      <>
        <rect x="5" y="8" width="14" height="11" rx="2.4" {...F} />
        <path d="M12 8V4.5" /><circle cx="12" cy="3.6" r="1.1" {...D} />
        <circle cx="9.2" cy="12.5" r="1.5" {...D} /><circle cx="14.8" cy="12.5" r="1.5" {...D} />
        <path d="M9 16.5h6M3 12.5v3M21 12.5v3" />
      </>
    ),
  },
  mecharm: {
    color: '#94a3b8',
    art: (
      <>
        <rect x="3" y="17.5" width="7" height="3.5" rx="1" {...F} />
        <path d="M6.5 17.5 10 11l5 2.5" strokeWidth="2.2" />
        <circle cx="10" cy="11" r="1.7" {...F} /><circle cx="15" cy="13.5" r="1.4" {...F} />
        <path d="M15 13.5 19.5 9.5M15 13.5l5.5 1.2M19.5 9.5l1.2 3" />
      </>
    ),
  },
  skull: {
    color: '#e2e8f0',
    art: (
      <>
        <path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3.2 5.4V19a1 1 0 0 0 1 1h6.6a1 1 0 0 0 1-1v-3.1c1.9-1 3.2-2.8 3.2-5.4A7.5 7.5 0 0 0 12 3Z" {...F} />
        <path d="M8 9.2 11 11.2 8.4 12.8ZM16 9.2 13 11.2 15.6 12.8Z" {...D} />
        <path d="M12 13.4v1.6M10.2 17v3M13.8 17v3" />
      </>
    ),
  },
  bolt: {
    color: '#fde047',
    art: <path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11.5h-6Z" {...F} />,
  },
  orb: {
    color: '#c084fc',
    art: (
      <>
        <circle cx="12" cy="10.5" r="7" {...F} />
        <path d="M8.2 8a4.2 4.2 0 0 1 3-2.2" strokeWidth="1.4" />
        <path d="M7.5 20.5h9M9 17.8h6" />
      </>
    ),
  },
  planet: {
    color: '#fb923c',
    art: (
      <>
        <circle cx="12" cy="12" r="5.2" {...F} />
        <ellipse cx="12" cy="12" rx="10" ry="3.2" transform="rotate(-24 12 12)" />
        <path d="M8.2 10.6a4 4 0 0 1 2.6-1.8" strokeWidth="1.2" />
      </>
    ),
  },
  controller: {
    color: '#818cf8',
    art: (
      <>
        <path d="M7.5 7h9a4.6 4.6 0 0 1 4.5 3.9l.8 5a2.6 2.6 0 0 1-4.5 2.1L15.5 16h-7L6.7 18a2.6 2.6 0 0 1-4.5-2.1l.8-5A4.6 4.6 0 0 1 7.5 7Z" {...F} />
        <path d="M8 10v3.4M6.3 11.7h3.4" strokeWidth="1.5" />
        <circle cx="15.6" cy="10.8" r="0.9" {...D} /><circle cx="17.8" cy="12.6" r="0.9" {...D} />
      </>
    ),
  },
  alien: {
    color: '#4ade80',
    art: (
      <>
        <path d="M12 3.5c4.6 0 7.8 3 7.8 7 0 3.6-2.6 7.2-7.8 10-5.2-2.8-7.8-6.4-7.8-10 0-4 3.2-7 7.8-7Z" {...F} />
        <path d="M5.8 9.6 10.4 12.8 7.4 14ZM18.2 9.6 13.6 12.8 16.6 14Z" {...D} />
      </>
    ),
  },
  ghost: {
    color: '#cbd5e1',
    art: (
      <>
        <path d="M5 20V10.5a7 7 0 0 1 14 0V20l-2.4-2-2.3 2-2.3-2-2.3 2-2.3-2Z" {...F} />
        <circle cx="9.5" cy="10.5" r="1.3" {...D} /><circle cx="14.5" cy="10.5" r="1.3" {...D} />
      </>
    ),
  },
  fox: {
    color: '#fb923c',
    art: (
      <>
        <path d="M3.5 3.5 9 7.2h6L20.5 3.5 20 12.5 12 21 4 12.5Z" {...F} />
        <path d="M8.5 12.2 10.4 13.4 9.2 14.6ZM15.5 12.2 13.6 13.4 14.8 14.6Z" {...D} />
        <path d="M10.5 18h3l-1.5 1.8Z" {...D} />
      </>
    ),
  },
  octopus: {
    color: '#f472b6',
    art: (
      <>
        <path d="M5 12a7 7 0 0 1 14 0v2H5Z" {...F} />
        <path d="M6 14c0 3-1.4 4-2.5 4.5M9.5 14c0 3.4-.6 5-1.5 6M14.5 14c0 3.4.6 5 1.5 6M18 14c0 3 1.4 4 2.5 4.5" />
        <circle cx="9.5" cy="11" r="1.1" {...D} /><circle cx="14.5" cy="11" r="1.1" {...D} />
      </>
    ),
  },
  shark: {
    color: '#38bdf8',
    art: (
      <>
        <path d="M5 16.5C7 9 11.5 5 16 3.5c-.3 3-.2 6.5 1 10.5Z" {...F} />
        <path d="M2.5 17.5q2.4-1.6 4.8 0t4.8 0 4.8 0 4.8 0M2.5 21q2.4-1.6 4.8 0t4.8 0 4.8 0 4.8 0" strokeOpacity="0.8" />
      </>
    ),
  },
  owl: {
    color: '#fbbf24',
    art: (
      <>
        <path d="M5 4.5 8.5 6.7h7L19 4.5V14c0 4.2-3 7-7 7s-7-2.8-7-7Z" {...F} />
        <circle cx="9" cy="11" r="2.8" /><circle cx="15" cy="11" r="2.8" />
        <circle cx="9" cy="11" r="0.9" {...D} /><circle cx="15" cy="11" r="0.9" {...D} />
        <path d="M10.8 14.5 12 16.6 13.2 14.5Z" {...D} />
      </>
    ),
  },
  dragon: {
    color: '#f87171',
    art: (
      <>
        <path d="M4 4c3 .2 5 1.6 6 3.5h5.5L21 11l-2 3.2-3.5-.4L12 20.5 7.5 14C5 12.5 3.6 8.5 4 4Z" {...F} />
        <path d="M9 3c.6 1.4 1.6 2.3 3 2.8" />
        <path d="M8.6 10.4 11.4 11.2 9 12.4Z" {...D} />
        <path d="M17.3 11.6h.01" strokeWidth="2" />
      </>
    ),
  },
  wolf: {
    color: '#94a3b8',
    art: (
      <>
        <path d="M4.5 3.5 9 8h6l4.5-4.5L20 11l-3 4-3.5 5.5h-3L7 15l-3-4Z" {...F} />
        <path d="M8 11.4 10.6 12.6 8.6 13.6ZM16 11.4 13.4 12.6 15.4 13.6Z" {...D} />
        <path d="M10.8 17.2h2.4l-1.2 1.4Z" {...D} />
      </>
    ),
  },
  cat: {
    color: '#fda4af',
    art: (
      <>
        <path d="M4.5 3.5 9 7h6l4.5-3.5V12c0 4.6-3.2 8-7.5 8s-7.5-3.4-7.5-8Z" {...F} />
        <path d="M8.8 11.2h.01M15.2 11.2h.01" strokeWidth="2.4" />
        <path d="M11 14.5h2l-1 1.2ZM2.5 13.5 7 14M2.8 16.5 7 15.4M21.5 13.5 17 14M21.2 16.5 17 15.4" strokeWidth="1.2" />
      </>
    ),
  },
  frog: {
    color: '#86efac',
    art: (
      <>
        <path d="M3.5 13.5a8.5 6 0 0 1 17 0c0 3.8-3.8 6.5-8.5 6.5s-8.5-2.7-8.5-6.5Z" {...F} />
        <circle cx="7.5" cy="8.5" r="2.7" {...F} /><circle cx="16.5" cy="8.5" r="2.7" {...F} />
        <circle cx="7.5" cy="8.5" r="0.9" {...D} /><circle cx="16.5" cy="8.5" r="0.9" {...D} />
        <path d="M7.5 15.5q4.5 2.4 9 0" />
      </>
    ),
  },
  unicorn: {
    color: '#e879f9',
    art: (
      <>
        <path d="M12 2.2 14 9H10Z" {...F} /><path d="M10.6 6.2h2.8M10.2 8h3.6" strokeWidth="1.1" />
        <path d="M7 9.5 5 6.8 4.6 13c0 4.2 3.2 7.5 7.4 7.5s7.4-3.3 7.4-7.5L19 6.8 17 9.5Z" {...F} />
        <path d="M9 13.6h.01M15 13.6h.01" strokeWidth="2.4" />
        <path d="M11 17.4h2" />
      </>
    ),
  },
  panda: {
    color: '#e2e8f0',
    art: (
      <>
        <circle cx="5.8" cy="6" r="2.6" {...D} fillOpacity="0.55" /><circle cx="18.2" cy="6" r="2.6" {...D} fillOpacity="0.55" />
        <circle cx="12" cy="12.5" r="8" {...F} />
        <ellipse cx="8.6" cy="11.5" rx="2" ry="2.6" transform="rotate(20 8.6 11.5)" {...D} fillOpacity="0.55" />
        <ellipse cx="15.4" cy="11.5" rx="2" ry="2.6" transform="rotate(-20 15.4 11.5)" {...D} fillOpacity="0.55" />
        <path d="M11 15.4h2l-1 1.2Z" {...D} />
      </>
    ),
  },
  penguin: {
    color: '#7dd3fc',
    art: (
      <>
        <path d="M12 2.8c-3.4 0-5.5 2.6-5.5 6.2 0 2-1.3 3.4-2.5 5.4C5.6 17.4 8.5 20 12 20s6.4-2.6 8-5.6c-1.2-2-2.5-3.4-2.5-5.4 0-3.6-2.1-6.2-5.5-6.2Z" {...F} />
        <path d="M12 9.5c-2.2 0-3.5 1.8-3.5 4s1.4 4.5 3.5 4.5 3.5-2.3 3.5-4.5-1.3-4-3.5-4Z" strokeOpacity="0.7" />
        <circle cx="10.4" cy="7.4" r="0.7" {...D} /><circle cx="13.6" cy="7.4" r="0.7" {...D} />
        <path d="M11 8.8h2l-1 1.4ZM8 20.5h2.5M13.5 20.5H16" />
      </>
    ),
  },
  butterfly: {
    color: '#60a5fa',
    art: (
      <>
        <path d="M12 12C9 5 3.5 4 3.5 8.5c0 3 3 4.6 8.5 3.5ZM12 12c3-7 8.5-8 8.5-3.5 0 3-3 4.6-8.5 3.5Z" {...F} />
        <path d="M12 12c-4.5 0-8 2-6.8 5.5C6.3 20 10 17 12 12ZM12 12c4.5 0 8 2 6.8 5.5C17.7 20 14 17 12 12Z" {...F} />
        <path d="M12 7v11M10.5 4.5 12 7l1.5-2.5" />
      </>
    ),
  },
  trex: {
    color: '#4ade80',
    art: (
      <>
        <path d="M3 10.5C3 6.5 7 4 12.5 4 17 4 21 6.8 21 10.2V13H11l-1.5 3H6.8L8 13H5.5C4 13 3 12 3 10.5Z" {...F} />
        <path d="M10 13l1 2 1.5-2 1.5 2 1.5-2 1.5 2 1.5-2" strokeWidth="1.3" />
        <circle cx="13.5" cy="8" r="1.1" {...D} />
        <path d="M19.5 10.2h.01" strokeWidth="2" />
      </>
    ),
  },
  ninja: {
    color: '#f87171',
    art: (
      <>
        <circle cx="12" cy="12" r="8.2" {...F} />
        <path d="M3.8 10.5h16.4v3.6H3.8Z" fill="#000" fillOpacity="0.35" />
        <path d="M7.6 12.2 10.8 12.7 7.8 13.4ZM16.4 12.2 13.2 12.7 16.2 13.4Z" {...D} />
        <path d="M20 8.5l2.2-1.5M20 9.5l2.6.4" strokeWidth="1.4" />
      </>
    ),
  },
  astronaut: {
    color: '#38bdf8',
    art: (
      <>
        <circle cx="12" cy="11" r="8" {...F} />
        <rect x="6.4" y="7.8" width="11.2" height="6.8" rx="3.4" fill="#000" fillOpacity="0.4" />
        <path d="M8.5 9.6q1.6-1 3-.6" strokeWidth="1.2" strokeOpacity="0.8" />
        <path d="M8 19h8M12 19v2.4" />
      </>
    ),
  },
  wizard: {
    color: '#a78bfa',
    art: (
      <>
        <path d="M12 2.5 17.2 17H6.8Z" {...F} />
        <path d="M3.5 18.5q8.5 3 17 0" strokeWidth="2" />
        <path d="m12 7.6.8 1.7 1.8.2-1.4 1.2.4 1.8-1.6-1-1.6 1 .4-1.8-1.4-1.2 1.8-.2Z" {...D} />
      </>
    ),
  },
  bat: {
    color: '#c084fc',
    art: (
      <>
        <path d="M12 8.5 9.8 5 9 8.8C6.2 8.2 3.8 9 2 11.2c1.6-.2 3 .4 3.6 1.6 1-.9 2.4-1 3.6-.3.7 1.6 1.4 3.2 2.8 5.5 1.4-2.3 2.1-3.9 2.8-5.5 1.2-.7 2.6-.6 3.6.3.6-1.2 2-1.8 3.6-1.6C20.2 9 17.8 8.2 15 8.8L14.2 5Z" {...F} />
        <path d="M10.6 11.2h.01M13.4 11.2h.01" strokeWidth="2" />
      </>
    ),
  },
  scorpion: {
    color: '#fb7185',
    art: (
      <>
        <ellipse cx="9.5" cy="15.5" rx="4.2" ry="3.2" {...F} />
        <path d="M13.5 15.5c4.5 0 7-2 6.5-6-.4-2.5-2.2-3.8-4.2-3.4" strokeWidth="1.8" />
        <path d="M15.8 6.1 14 4.2M15.8 6.1l2.4-.6" />
        <path d="M6 13.5 3.4 11.4M5.4 15.5H2.5M6 17.5l-2.6 2M13 13.4l1.2-2.6" strokeWidth="1.3" />
      </>
    ),
  },
  moon: {
    color: '#fde68a',
    art: (
      <>
        <path d="M19.5 14.5A8.5 8.5 0 0 1 9.5 4.5a8.5 8.5 0 1 0 10 10Z" {...F} />
        <path d="m17.5 4.2.6 1.4 1.5.2-1.1 1 .3 1.5-1.3-.8-1.3.8.3-1.5-1.1-1 1.5-.2Z" {...D} />
      </>
    ),
  },
  gem: {
    color: '#22d3ee',
    art: (
      <>
        <path d="M6.5 4h11l4 5.5L12 21 2.5 9.5Z" {...F} />
        <path d="M2.5 9.5h19M9 4l-2 5.5L12 21l5-11.5L15 4M9 4l3 5.5L15 4" strokeWidth="1.3" />
      </>
    ),
  },
};

// Same order as the avatar list in the profile page and backend STARTER_AVATARS.
const NAMES = [
  'invader', 'robot', 'mecharm', 'skull', 'bolt', 'orb', 'planet', 'controller', 'alien', 'ghost',
  'fox', 'octopus', 'shark', 'owl', 'dragon', 'wolf', 'cat', 'frog', 'unicorn', 'panda',
  'penguin', 'butterfly', 'trex', 'ninja', 'astronaut', 'wizard', 'bat', 'scorpion', 'moon', 'gem',
];

const EMOJI = ["👾", "🤖", "🦾", "💀", "⚡", "🔮", "🪐", "🎮", "👽", "👻", "🦊", "🐙", "🦈", "🦉", "🐉", "🐺", "🐱", "🐸", "🦄", "🐼", "🐧", "🦋", "🦖", "🥷", "🧑‍🚀", "🧙", "🦇", "🦂", "🌙", "💎"];

const BY_EMOJI: Record<string, Icon> = Object.fromEntries(EMOJI.map((e, i) => [e, ICONS[NAMES[i]]]));

export const classicIcon = (value: string): Icon | undefined => BY_EMOJI[value];

export default function ClassicAvatarArt({ value }: { value: string }) {
  const icon = BY_EMOJI[value];
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width="66%"
      height="66%"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ overflow: 'visible', filter: 'drop-shadow(0 0 3px currentColor)' }}
    >
      {icon.art}
    </svg>
  );
}
