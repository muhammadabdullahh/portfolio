// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildWorld, sections, W, H } from '../world';
import { skills } from '../../data/profile';
import { isSolid } from '../blocks';

describe('world', () => {
  const w = buildWorld();

  it('places every skill exactly once as an ore', () => {
    expect(w.ores.length).toBe(skills.length);
    expect(new Set(w.ores.map((o) => o.skillId)).size).toBe(skills.length);
    expect(new Set(w.ores.map((o) => `${o.x},${o.y}`)).size).toBe(skills.length);
  });

  it('keeps ores inside the quarry section', () => {
    const q = sections.find((s) => s.id === 'quarry')!;
    for (const o of w.ores) expect(o.x >= q.from && o.x < q.to).toBe(true);
  });

  it('has a reachable spawn point in every section', () => {
    for (const s of sections) {
      let ground = -1;
      for (let y = 0; y < H; y++)
        if (isSolid(w.fg[y * W + s.spawnX])) {
          ground = y;
          break;
        }
      expect(ground).toBeGreaterThan(5);
      // two blocks of headroom for the player
      expect(isSolid(w.fg[(ground - 1) * W + s.spawnX])).toBe(false);
      expect(isSolid(w.fg[(ground - 2) * W + s.spawnX])).toBe(false);
    }
  });

  it('has no unclimbable walls on the walking path (max 1-block steps)', () => {
    const top = (x: number) => {
      for (let y = 0; y < H; y++) if (isSolid(w.fg[y * W + x])) return y;
      return H;
    };
    for (let x = 2; x < W - 2; x++) expect(Math.abs(top(x) - top(x - 1))).toBeLessThanOrEqual(1);
  });

  it('gives every interactable a matching section', () => {
    for (const i of w.interactables) expect(i.x >= 0 && i.x + i.w <= W).toBe(true);
  });
});

describe('mining safety', () => {
  it('never changes the walkable surface when every ore is mined', () => {
    const w = buildWorld();
    const top = (x: number) => {
      for (let y = 0; y < H; y++) if (isSolid(w.fg[y * W + x])) return y;
      return H;
    };
    const before = Array.from({ length: W }, (_, x) => top(x));
    for (const o of w.ores) w.fg[o.y * W + o.x] = 0;
    const after = Array.from({ length: W }, (_, x) => top(x));
    expect(after).toEqual(before);
  });
});
