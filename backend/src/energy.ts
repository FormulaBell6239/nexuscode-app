import { UserProgress } from './entities/UserProgress';

export const ENERGY_MAX = 10;
export const ENERGY_REGEN_MS = 30 * 60 * 1000; // 1 energy per 30 minutes

/** Applies any energy earned while waiting. Returns true if the record changed. */
export function applyEnergyRegen(progress: UserProgress, now = new Date()): boolean {
  let changed = false;
  if ((progress.maxEnergy ?? 0) < ENERGY_MAX) {
    progress.maxEnergy = ENERGY_MAX;
    changed = true;
  }
  const max = progress.maxEnergy;

  if (progress.energy >= max) {
    if (!progress.energyLastRegen || progress.energyLastRegen.getTime() !== now.getTime()) {
      progress.energyLastRegen = now;
      changed = true;
    }
    return changed;
  }

  const last = progress.energyLastRegen ? progress.energyLastRegen.getTime() : now.getTime();
  const gained = Math.floor((now.getTime() - last) / ENERGY_REGEN_MS);
  if (gained > 0) {
    progress.energy = Math.min(max, progress.energy + gained);
    progress.energyLastRegen = progress.energy >= max ? now : new Date(last + gained * ENERGY_REGEN_MS);
    changed = true;
  } else if (!progress.energyLastRegen) {
    progress.energyLastRegen = now;
    changed = true;
  }
  return changed;
}

export function secondsUntilNextEnergy(progress: UserProgress, now = new Date()): number | null {
  const max = progress.maxEnergy ?? ENERGY_MAX;
  if (progress.energy >= max || !progress.energyLastRegen) return null;
  const left = progress.energyLastRegen.getTime() + ENERGY_REGEN_MS - now.getTime();
  return Math.max(0, Math.ceil(left / 1000));
}
