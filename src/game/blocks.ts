import { mulberry32 } from './rng';

export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  PLANKS: 5,
  LOG: 6,
  LEAVES: 7,
  GLASS: 8,
  BRICK: 9,
  BOOKSHELF: 10,
  SAND: 11,
  WATER: 12,
  BEDROCK: 13,
  OBSIDIAN: 14,
  STONEBRICK: 15,
  QUARTZ: 16,
  LAMP: 17,
  WOOL_BLUE: 18,
  IRON: 19,
  CONCRETE: 20,
  GOLD_BLOCK: 21,
  WOOL_YELLOW: 22,
  GRAVEL: 23,
  DARK_PLANKS: 24,
  WOOL_RED: 25,
  SNOW: 26,
  FLOWER_RED: 40,
  FLOWER_YELLOW: 41,
  TALL_GRASS: 42,
  TORCH: 43,
  ORE_DIAMOND: 60,
  ORE_EMERALD: 61,
  ORE_GOLD: 62,
  ORE_LAPIS: 63,
  ORE_REDSTONE: 64,
} as const;

export const isOre = (b: number) => b >= 60 && b <= 64;
export const isSolid = (b: number) => (b > 0 && b < 40 && b !== B.WATER) || isOre(b);
export const isEmissive = (b: number) => b === B.LAMP || b === B.TORCH;

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function tex(seed: number, fn: (x: number, y: number, r: () => number) => RGB | null): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(16, 16);
  const r = mulberry32(seed);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const col = fn(x, y, r);
      const i = (y * 16 + x) * 4;
      if (!col) {
        img.data[i + 3] = 0;
        continue;
      }
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return c;
}

const pick = (r: () => number, cols: string[]) => hex(cols[Math.floor(r() * cols.length)]);

const STONE = ['#7f7f7f', '#888888', '#747474', '#8f8f8f', '#6e6e6e'];
const DIRT = ['#79553a', '#86603f', '#6c4a31', '#5e4029', '#8b6443'];

function oreTex(seed: number, gem: string[]) {
  const r2 = mulberry32(seed * 7);
  const spots = new Set<number>();
  const centers = [
    [3, 4],
    [10, 3],
    [6, 10],
    [12, 11],
  ];
  for (const [cx, cy] of centers) {
    const n = 3 + Math.floor(r2() * 3);
    for (let k = 0; k < n; k++) {
      const dx = Math.floor(r2() * 3) - 1;
      const dy = Math.floor(r2() * 3) - 1;
      spots.add((cy + dy) * 16 + cx + dx);
      spots.add((cy + dy) * 16 + cx + dx + 1);
    }
  }
  return tex(seed, (x, y, r) => (spots.has(y * 16 + x) ? pick(r, gem) : pick(r, STONE)));
}

export function makeTextures(): Record<number, HTMLCanvasElement> {
  const t: Record<number, HTMLCanvasElement> = {};
  t[B.STONE] = tex(1, (_x, _y, r) => pick(r, STONE));
  t[B.DIRT] = tex(2, (_x, _y, r) => pick(r, DIRT));
  t[B.GRASS] = tex(3, (x, y, r) => {
    const edge = 3 + ((x * 7) % 3 === 0 ? 1 : 0) + (x % 5 === 0 ? 1 : 0);
    if (y < edge) return pick(r, ['#5d9b37', '#6aab3f', '#558f31', '#4f8a2c']);
    return pick(r, DIRT);
  });
  t[B.COBBLE] = tex(4, (x, y, r) => {
    const cell = ((Math.floor((x + (y >> 2) * 3) / 4) + (y >> 2)) % 3) as number;
    const border = x % 4 === 0 || y % 4 === 0;
    if (border) return pick(r, ['#525252', '#5a5a5a']);
    return pick(r, cell === 0 ? ['#9a9a9a', '#8a8a8a'] : ['#7a7a7a', '#858585', '#6f6f6f']);
  });
  t[B.PLANKS] = tex(5, (x, y, r) => {
    if (y % 4 === 3) return hex('#6b4f2a');
    if ((x + (y >> 2) * 5) % 16 === 0) return hex('#73552d');
    return pick(r, ['#a07d4a', '#9c7746', '#b08b55', '#94703f']);
  });
  t[B.DARK_PLANKS] = tex(25, (x, y, r) => {
    if (y % 4 === 3) return hex('#2c1d0e');
    if ((x + (y >> 2) * 5) % 16 === 0) return hex('#35230f');
    return pick(r, ['#4a3218', '#43301a', '#523a1f']);
  });
  t[B.LOG] = tex(6, (x, _y, r) => {
    if (x === 0 || x === 15) return hex('#3b2b19');
    return x % 4 === 1 ? hex('#4a3820') : pick(r, ['#6b5130', '#5f4729', '#735735']);
  });
  t[B.LEAVES] = tex(7, (_x, _y, r) => (r() < 0.12 ? null : pick(r, ['#3f7a26', '#4a8c2e', '#356b20', '#2f5f1c', '#58a03a'])));
  t[B.GLASS] = tex(8, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return hex('#cfe6ee');
    if ((x === 3 && y > 2 && y < 6) || (x === 4 && y > 3 && y < 7) || (x === 11 && y === 10)) return hex('#ffffff');
    return null;
  });
  t[B.BRICK] = tex(9, (x, y, r) => {
    const row = y >> 2;
    const off = row % 2 ? 4 : 0;
    if (y % 4 === 3 || (x + off) % 8 === 0) return pick(r, ['#bdb2a8', '#a59a90']);
    return pick(r, ['#96503a', '#8a4632', '#a35a42', '#7f3f2c']);
  });
  t[B.BOOKSHELF] = tex(10, (x, y, r) => {
    if (y < 2 || y > 13 || y === 7 || y === 8) return pick(r, ['#a07d4a', '#94703f']);
    const book = Math.floor(x / 2);
    const cols = ['#8b2a2a', '#2a4a8b', '#2a7a3a', '#7a5a1a', '#5a2a7a', '#8b6a2a', '#1a5a6a', '#6a1a3a'];
    if (x % 2 === 1 && r() < 0.3) return hex('#2b1d0e');
    return hex(cols[(book + (y > 7 ? 3 : 0)) % cols.length]);
  });
  t[B.SAND] = tex(11, (_x, _y, r) => pick(r, ['#dbcf8e', '#d4c684', '#e2d79a', '#cfc27e']));
  t[B.WATER] = tex(12, (_x, y, r) => pick(r, y < 2 ? ['#4a7ef0', '#5a8cf5'] : ['#2f5fd0', '#3466d8', '#2a57c2']));
  t[B.BEDROCK] = tex(13, (_x, _y, r) => pick(r, ['#2b2b2b', '#4a4a4a', '#1a1a1a', '#5c5c5c']));
  t[B.OBSIDIAN] = tex(14, (_x, _y, r) => pick(r, ['#14101e', '#1d1730', '#100c18', '#2a2040', '#3b2d5a']));
  t[B.STONEBRICK] = tex(15, (x, y, r) => {
    const off = (y >> 3) % 2 ? 8 : 0;
    if (y % 8 === 7 || (x + off) % 16 === 15) return hex('#4f4f4f');
    if (y % 8 === 0 || (x + off) % 16 === 0) return hex('#9b9b9b');
    return pick(r, ['#7b7b7b', '#828282', '#767676']);
  });
  t[B.QUARTZ] = tex(16, (x, y, r) => {
    if (x === 0 || y === 0) return hex('#fbf8f2');
    if (x === 15 || y === 15) return hex('#cfc9be');
    return pick(r, ['#ebe5dc', '#e7e1d6', '#efe9e1']);
  });
  t[B.LAMP] = tex(17, (x, y, r) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return hex('#6b4423');
    return pick(r, ['#ffd27a', '#ffc95a', '#f5b041', '#ffe39a']);
  });
  t[B.WOOL_BLUE] = tex(18, (_x, _y, r) => pick(r, ['#2e5aa8', '#3462b4', '#2a529a']));
  t[B.WOOL_YELLOW] = tex(22, (_x, _y, r) => pick(r, ['#e8c32f', '#f0cc3a', '#dcb627']));
  t[B.WOOL_RED] = tex(26, (_x, _y, r) => pick(r, ['#a12722', '#ad2d27', '#94221d']));
  t[B.IRON] = tex(19, (x, y, r) => {
    if (x === 0 || y === 0) return hex('#f2f2f2');
    if (x === 15 || y === 15) return hex('#9a9a9a');
    if (y % 5 === 4) return hex('#bdbdbd');
    return pick(r, ['#dcdcdc', '#d6d6d6', '#e2e2e2']);
  });
  t[B.CONCRETE] = tex(20, (_x, _y, r) => pick(r, ['#5e6266', '#62666a', '#5a5e62']));
  t[B.GOLD_BLOCK] = tex(21, (x, y, r) => {
    if (x === 0 || y === 0) return hex('#fff7a0');
    if (x === 15 || y === 15) return hex('#c88a12');
    return pick(r, ['#f8d43c', '#f2c92e', '#fbe05a']);
  });
  t[B.GRAVEL] = tex(23, (_x, _y, r) => pick(r, ['#837d7a', '#6e6765', '#948e8b', '#5d5654']));
  t[B.SNOW] = tex(27, (_x, _y, r) => pick(r, ['#f4fbff', '#e9f3f8']));
  t[B.FLOWER_RED] = tex(40, (x, y) => {
    if (x === 7 && y > 7) return hex('#3f8a28');
    if (x === 6 && y === 11) return hex('#4a9a2e');
    if (y >= 4 && y <= 7 && x >= 5 && x <= 9 && !((x === 5 || x === 9) && (y === 4 || y === 7))) return x === 7 && y === 5 ? hex('#ffd23a') : hex('#d8241c');
    return null;
  });
  t[B.FLOWER_YELLOW] = tex(41, (x, y) => {
    if (x === 8 && y > 8) return hex('#3f8a28');
    if (y >= 6 && y <= 8 && x >= 7 && x <= 9) return x === 8 && y === 7 ? hex('#c77d12') : hex('#f7e13a');
    return null;
  });
  t[B.TALL_GRASS] = tex(42, (x, y, r) => {
    const blades = [2, 5, 7, 10, 13];
    const hts = [8, 5, 10, 6, 9];
    const i = blades.indexOf(x);
    if (i >= 0 && y >= 16 - hts[i]) return pick(r, ['#5d9b37', '#4f8a2c', '#6aab3f']);
    if (i < 0 && blades.includes(x - 1) && y > 12) return hex('#4f8a2c');
    return null;
  });
  t[B.TORCH] = tex(43, (x, y) => {
    if (x >= 7 && x <= 8 && y >= 6) return hex('#6b4f2a');
    if (x >= 7 && x <= 8 && y >= 4 && y < 6) return hex('#ffd84a');
    if (x >= 7 && x <= 8 && y === 3) return hex('#fff3b0');
    return null;
  });
  t[B.ORE_DIAMOND] = oreTex(60, ['#5decf5', '#a6fff7', '#2bc7c4']);
  t[B.ORE_EMERALD] = oreTex(61, ['#17dd62', '#7dffa8', '#0b9a3f']);
  t[B.ORE_GOLD] = oreTex(62, ['#fcee4b', '#ffffb5', '#d9a60e']);
  t[B.ORE_LAPIS] = oreTex(63, ['#1d47c4', '#3a6be8', '#123194']);
  t[B.ORE_REDSTONE] = oreTex(64, ['#e01313', '#ff5a5a', '#9e0b0b']);
  return t;
}

export const oreBlock: Record<string, number> = {
  diamond: B.ORE_DIAMOND,
  emerald: B.ORE_EMERALD,
  gold: B.ORE_GOLD,
  lapis: B.ORE_LAPIS,
  redstone: B.ORE_REDSTONE,
};

export const oreColor: Record<string, string> = {
  diamond: '#5decf5',
  emerald: '#17dd62',
  gold: '#fcee4b',
  lapis: '#3a6be8',
  redstone: '#ff4040',
};
