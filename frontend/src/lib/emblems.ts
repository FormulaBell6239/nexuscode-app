export interface Emblem {
  id: string;          // stored as the user's avatar value and as the store item's applyValue
  name: string;
  mark: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  background: string;
  color: string;
  border: string;
  textShadow?: string;
  cost: number;        // credits; 0 = earn-only
  category: string;
  unlockedBy?: string; // achievement name that unlocks it for free
}

export interface EmblemCategory {
  id: string;
  name: string;
  blurb: string;
  emblems: Emblem[];
}

const glitch = (c1: string, c2: string) => `2px 0 ${c1}, -2px 0 ${c2}`;

export const EMBLEM_CATEGORIES: EmblemCategory[] = [
  {
    id: 'glitched',
    name: 'Glitched',
    blurb: 'Corrupted signals and broken pixels.',
    emblems: [
      { id: 'emblem-glitched-static',  name: 'Static',       mark: '░', rarity: 'Common',    background: 'linear-gradient(145deg,#1b1f2a,#0a0c12)', color: '#cbd5e1', border: '#64748b', textShadow: glitch('#f43f5e', '#22d3ee'), cost: 60,  category: 'glitched', unlockedBy: 'First Blood' },
      { id: 'emblem-glitched-scanline', name: 'Scanline',    mark: '▤', rarity: 'Common',    background: 'linear-gradient(145deg,#06231c,#04100d)', color: '#6ee7b7', border: '#10b981', textShadow: glitch('#22d3ee', '#a3e635'), cost: 90,  category: 'glitched', unlockedBy: 'Week Warrior' },
      { id: 'emblem-glitched-corrupt', name: 'Corrupt',      mark: '⌧', rarity: 'Rare',      background: 'linear-gradient(145deg,#2a0a1c,#0f0510)', color: '#f9a8d4', border: '#db2777', textShadow: glitch('#22d3ee', '#facc15'), cost: 130, category: 'glitched', unlockedBy: 'Perfectionist' },
      { id: 'emblem-glitched-datamosh', name: 'Datamosh',    mark: '◩', rarity: 'Epic',      background: 'linear-gradient(145deg,#1e1056,#0c0724)', color: '#c4b5fd', border: '#7c3aed', textShadow: glitch('#f43f5e', '#22d3ee'), cost: 180, category: 'glitched', unlockedBy: 'Level 10' },
      { id: 'emblem-glitched-null',    name: 'Null Pointer', mark: '∅', rarity: 'Legendary', background: 'linear-gradient(145deg,#2d1a05,#0d0803)', color: '#fde68a', border: '#f59e0b', textShadow: glitch('#ef4444', '#38bdf8'), cost: 260, category: 'glitched', unlockedBy: 'XP Legend' },
    ],
  },
  {
    id: 'singularity',
    name: 'Singularity',
    blurb: 'Matter collapsing into light.',
    emblems: [
      { id: 'emblem-singularity-pinpoint', name: 'Pinpoint', mark: '·', rarity: 'Common', background: 'linear-gradient(145deg,#14161d,#05060a)', color: '#e2e8f0', border: '#64748b', textShadow: '0 0 8px #94a3b8', cost: 60, category: 'singularity', unlockedBy: 'First Spark' },
      { id: 'emblem-singularity-accretion', name: 'Accretion', mark: '◍', rarity: 'Common', background: 'linear-gradient(145deg,#2a1204,#0c0502)', color: '#fdba74', border: '#ea580c', textShadow: '0 0 10px #f97316', cost: 90, category: 'singularity', unlockedBy: 'Level 5' },
      { id: 'emblem-singularity-gravitywell', name: 'Gravity Well', mark: '◉', rarity: 'Rare', background: 'linear-gradient(145deg,#1a1040,#07041a)', color: '#c4b5fd', border: '#7c3aed', textShadow: '0 0 12px #8b5cf6', cost: 130, category: 'singularity', unlockedBy: 'XP Climber' },
      { id: 'emblem-singularity-eventhorizon', name: 'Event Horizon', mark: '⊚', rarity: 'Epic', background: 'linear-gradient(145deg,#2a0a35,#0a020f)', color: '#f0abfc', border: '#c026d3', textShadow: '0 0 14px #e879f9, 0 0 24px #7c3aed', cost: 180, category: 'singularity', unlockedBy: 'XP Champion' },
      { id: 'emblem-singularity-singularitycore', name: 'Singularity Core', mark: '✺', rarity: 'Legendary', background: 'linear-gradient(145deg,#000000,#1a1204)', color: '#ffffff', border: '#facc15', textShadow: '0 0 12px #fde047, 0 0 26px #f59e0b', cost: 260, category: 'singularity' },
    ],
  },
  {
    id: 'cybernetics',
    name: 'Cybernetics',
    blurb: 'Chrome, circuits and wiring.',
    emblems: [
      { id: 'emblem-cybernetics-servo', name: 'Servo', mark: '⚙', rarity: 'Common', background: 'linear-gradient(145deg,#1c2430,#0a0e14)', color: '#cbd5e1', border: '#64748b', textShadow: '0 0 6px #94a3b8', cost: 60, category: 'cybernetics', unlockedBy: 'Game On' },
      { id: 'emblem-cybernetics-circuit', name: 'Circuit', mark: '⌬', rarity: 'Common', background: 'linear-gradient(145deg,#04221a,#020d0a)', color: '#6ee7b7', border: '#10b981', textShadow: '0 0 8px #34d399', cost: 90, category: 'cybernetics', unlockedBy: 'Speed Demon' },
      { id: 'emblem-cybernetics-neurallink', name: 'Neural Link', mark: '⎔', rarity: 'Rare', background: 'linear-gradient(145deg,#06242e,#020d12)', color: '#67e8f9', border: '#0891b2', textShadow: '0 0 10px #22d3ee', cost: 130, category: 'cybernetics', unlockedBy: 'Debug Legend' },
      { id: 'emblem-cybernetics-chromecore', name: 'Chrome Core', mark: '⏣', rarity: 'Epic', background: 'linear-gradient(145deg,#12263a,#050c14)', color: '#e0f2fe', border: '#38bdf8', textShadow: '0 0 12px #7dd3fc', cost: 180, category: 'cybernetics', unlockedBy: 'Arcade Legend' },
      { id: 'emblem-cybernetics-overclock', name: 'Overclock', mark: '⌖', rarity: 'Legendary', background: 'linear-gradient(145deg,#300808,#0f0202)', color: '#fecaca', border: '#ef4444', textShadow: '0 0 12px #ef4444, 0 0 22px #f97316', cost: 260, category: 'cybernetics' },
    ],
  },
  {
    id: 'voided-skulls',
    name: 'Voided Skulls',
    blurb: 'Faces left behind by the void.',
    emblems: [
      { id: 'emblem-voided-skulls-hollow', name: 'Hollow', mark: '☠', rarity: 'Common', background: 'linear-gradient(145deg,#16181d,#07080a)', color: '#d1d5db', border: '#6b7280', textShadow: '0 0 6px #9ca3af', cost: 60, category: 'voided-skulls', unlockedBy: 'Streak Starter' },
      { id: 'emblem-voided-skulls-plague', name: 'Plague', mark: '☣', rarity: 'Common', background: 'linear-gradient(145deg,#1a2605,#080d02)', color: '#bef264', border: '#65a30d', textShadow: '0 0 8px #a3e635', cost: 90, category: 'voided-skulls', unlockedBy: 'On A Roll' },
      { id: 'emblem-voided-skulls-bonewalker', name: 'Bonewalker', mark: '☬', rarity: 'Rare', background: 'linear-gradient(145deg,#1f1f24,#08080a)', color: '#e5e7eb', border: '#9ca3af', textShadow: '0 0 10px #f3f4f6', cost: 130, category: 'voided-skulls', unlockedBy: 'Unstoppable' },
      { id: 'emblem-voided-skulls-voidgrin', name: 'Void Grin', mark: '☥', rarity: 'Epic', background: 'linear-gradient(145deg,#150a2e,#05020f)', color: '#c4b5fd', border: '#6d28d9', textShadow: '0 0 12px #7c3aed', cost: 180, category: 'voided-skulls', unlockedBy: 'Century Coder' },
      { id: 'emblem-voided-skulls-lichking', name: 'Lich King', mark: '♆', rarity: 'Legendary', background: 'linear-gradient(145deg,#04201e,#010a09)', color: '#99f6e4', border: '#14b8a6', textShadow: '0 0 14px #2dd4bf, 0 0 24px #0d9488', cost: 260, category: 'voided-skulls' },
    ],
  },
  {
    id: 'abstract-sigils',
    name: 'Abstract Sigils',
    blurb: 'Runes of unknown origin.',
    emblems: [
      { id: 'emblem-abstract-sigils-emberrune', name: 'Ember Rune', mark: 'ᛟ', rarity: 'Common', background: 'linear-gradient(145deg,#2b1105,#0d0502)', color: '#fdba74', border: '#c2410c', textShadow: '0 0 8px #f97316', cost: 60, category: 'abstract-sigils' },
      { id: 'emblem-abstract-sigils-tiderune', name: 'Tide Rune', mark: 'ᛞ', rarity: 'Common', background: 'linear-gradient(145deg,#08183a,#030712)', color: '#93c5fd', border: '#2563eb', textShadow: '0 0 8px #60a5fa', cost: 90, category: 'abstract-sigils' },
      { id: 'emblem-abstract-sigils-thornrune', name: 'Thorn Rune', mark: 'ᚠ', rarity: 'Rare', background: 'linear-gradient(145deg,#06240f,#020d05)', color: '#86efac', border: '#16a34a', textShadow: '0 0 8px #4ade80', cost: 130, category: 'abstract-sigils', unlockedBy: 'Puzzle Solver' },
      { id: 'emblem-abstract-sigils-wardenrune', name: 'Warden Rune', mark: 'ᛉ', rarity: 'Epic', background: 'linear-gradient(145deg,#2b1c05,#0d0802)', color: '#fde68a', border: '#d97706', textShadow: '0 0 10px #fbbf24', cost: 180, category: 'abstract-sigils', unlockedBy: 'Gold Medal' },
      { id: 'emblem-abstract-sigils-eclipserune', name: 'Eclipse Rune', mark: 'ᛜ', rarity: 'Legendary', background: 'linear-gradient(145deg,#2a0505,#0a0101)', color: '#fca5a5', border: '#dc2626', textShadow: '0 0 12px #ef4444, 0 0 22px #7f1d1d', cost: 260, category: 'abstract-sigils' },
    ],
  },
  {
    id: 'fractals',
    name: 'Fractals',
    blurb: 'Patterns that never stop repeating.',
    emblems: [
      { id: 'emblem-fractals-mandel', name: 'Mandel', mark: '❋', rarity: 'Common', background: 'linear-gradient(145deg,#10123a,#04051a)', color: '#a5b4fc', border: '#4f46e5', textShadow: '0 0 8px #818cf8', cost: 60, category: 'fractals', unlockedBy: 'Recursion Rookie' },
      { id: 'emblem-fractals-fern', name: 'Fern', mark: '✿', rarity: 'Common', background: 'linear-gradient(145deg,#05210f,#020c05)', color: '#86efac', border: '#15803d', textShadow: '0 0 8px #4ade80', cost: 90, category: 'fractals', unlockedBy: 'Self-Similar' },
      { id: 'emblem-fractals-koch', name: 'Koch', mark: '❃', rarity: 'Rare', background: 'linear-gradient(145deg,#06233a,#020b14)', color: '#7dd3fc', border: '#0284c7', textShadow: '0 0 10px #38bdf8', cost: 130, category: 'fractals', unlockedBy: 'Branching Out' },
      { id: 'emblem-fractals-julia', name: 'Julia', mark: '✣', rarity: 'Epic', background: 'linear-gradient(145deg,#2f0a20,#0e0309)', color: '#f9a8d4', border: '#be185d', textShadow: '0 0 12px #f472b6', cost: 180, category: 'fractals', unlockedBy: 'Infinite Loop' },
      { id: 'emblem-fractals-infinitebloom', name: 'Infinite Bloom', mark: '❖', rarity: 'Legendary', background: 'linear-gradient(145deg,#2b2205,#0d0a02)', color: '#fef08a', border: '#eab308', textShadow: '0 0 14px #facc15, 0 0 24px #f97316', cost: 260, category: 'fractals', unlockedBy: 'Fractal Master' },
    ],
  },
];

// Older one-off emblems that already exist in the store
const LEGACY_EMBLEMS: Emblem[] = [
  { id: 'avatar-cipher',   name: 'Cipher Sigil',   mark: '⌘', rarity: 'Rare',      background: 'linear-gradient(145deg,#102c3b,#07131e)', color: '#67e8f9', border: '#0891b2', cost: 120, category: 'legacy' },
  { id: 'avatar-unbroken', name: 'Unbroken Sigil', mark: '◈', rarity: 'Legendary', background: 'linear-gradient(145deg,#38240a,#12100b)', color: '#fcd34d', border: '#f59e0b', cost: 0,   category: 'legacy' },
];

export const EMBLEMS: Record<string, Emblem> = Object.fromEntries(
  [...LEGACY_EMBLEMS, ...EMBLEM_CATEGORIES.flatMap(c => c.emblems)].map(e => [e.id, e]),
);
