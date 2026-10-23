import DatamoshArt from './DatamoshArt';
import { EMBLEMS } from '@/lib/emblems';

// Single place that knows how to draw an avatar value (emblem id or plain emoji).
export default function EmblemAvatar({ value, className }: { value: string; className?: string }) {
  const e = EMBLEMS[value];
  if (!e) return <>{value}</>;
  return (
    <span
      className={className}
      style={{ background: e.background, color: e.color, borderColor: e.border, textShadow: e.textShadow }}
      title={`${e.name} · ${e.rarity}`}
      aria-label={`${e.rarity} ${e.name}`}
    >
      {value === 'emblem-glitched-datamosh' ? <DatamoshArt /> : e.mark}
    </span>
  );
}
