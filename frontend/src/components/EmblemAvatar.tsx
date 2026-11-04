import DatamoshArt from './DatamoshArt';
import GlitchedArt from './GlitchedArt';
import SingularityArt from './SingularityArt';
import ClassicArt, { hasClassicArt } from './ClassicArt';
import ClassicAvatarArt, { classicIcon } from './ClassicAvatars';
import { EMBLEMS } from '@/lib/emblems';

const GLITCH_KINDS = {
  'emblem-glitched-static': 'static',
  'emblem-glitched-scanline': 'scanline',
  'emblem-glitched-corrupt': 'corrupt',
  'emblem-glitched-null': 'null',
} as const;

const SINGULARITY_KINDS = {
  'emblem-singularity-pinpoint': 'pinpoint',
  'emblem-singularity-accretion': 'accretion',
  'emblem-singularity-gravitywell': 'gravitywell',
  'emblem-singularity-eventhorizon': 'eventhorizon',
  'emblem-singularity-singularitycore': 'core',
} as const;

// Single place that knows how to draw an avatar value (emblem id or plain emoji).
export default function EmblemAvatar({ value, className }: { value: string; className?: string }) {
  const e = EMBLEMS[value];
  if (!e) {
    const icon = classicIcon(value);
    if (!icon) return <>{value}</>;
    // Starter avatars get the same badge treatment as emblems, tinted by their own color.
    return (
      <span
        className={className}
        style={{
          color: icon.color,
          background: `linear-gradient(145deg, color-mix(in srgb, ${icon.color} 20%, #0b0f1a), #05070d)`,
          borderColor: `color-mix(in srgb, ${icon.color} 65%, transparent)`,
        }}
        aria-hidden="true"
      >
        <ClassicAvatarArt value={value} />
      </span>
    );
  }
  return (
    <span
      className={className}
      style={{ background: e.background, color: e.color, borderColor: e.border, textShadow: e.textShadow }}
      title={`${e.name} · ${e.rarity}`}
      aria-label={`${e.rarity} ${e.name}`}
    >
      {value === 'emblem-glitched-datamosh' ? (
        <DatamoshArt />
      ) : value in GLITCH_KINDS ? (
        <GlitchedArt kind={GLITCH_KINDS[value as keyof typeof GLITCH_KINDS]} />
      ) : value in SINGULARITY_KINDS ? (
        <SingularityArt kind={SINGULARITY_KINDS[value as keyof typeof SINGULARITY_KINDS]} />
      ) : hasClassicArt(value) ? (
        <ClassicArt id={value} />
      ) : (
        e.mark
      )}
    </span>
  );
}
