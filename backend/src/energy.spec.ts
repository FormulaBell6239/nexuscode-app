import { applyEnergyRegen, ENERGY_MAX, ENERGY_REGEN_MS, secondsUntilNextEnergy } from './energy';

const make = (energy: number, last: Date | null) => ({ energy, maxEnergy: ENERGY_MAX, energyLastRegen: last } as any);

describe('energy regen', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('grants one energy per interval', () => {
    const p = make(3, new Date(now.getTime() - 2 * ENERGY_REGEN_MS));
    expect(applyEnergyRegen(p, now)).toBe(true);
    expect(p.energy).toBe(5);
  });

  it('never exceeds the max', () => {
    const p = make(9, new Date(now.getTime() - 20 * ENERGY_REGEN_MS));
    applyEnergyRegen(p, now);
    expect(p.energy).toBe(ENERGY_MAX);
  });

  it('reports time until the next point', () => {
    const p = make(2, new Date(now.getTime() - ENERGY_REGEN_MS / 2));
    expect(secondsUntilNextEnergy(p, now)).toBe(ENERGY_REGEN_MS / 2000);
  });

  it('returns null when full', () => {
    expect(secondsUntilNextEnergy(make(ENERGY_MAX, now), now)).toBeNull();
  });
});
