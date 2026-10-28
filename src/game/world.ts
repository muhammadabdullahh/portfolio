import { B, oreBlock } from './blocks';
import { hash2 } from './rng';
import { skills, oreFor } from '../data/profile';

export const W = 300;
export const H = 56;
export const SURF = 32; // y index of the default ground surface (y grows downward)

export type Action =
  | 'about'
  | 'resume'
  | 'job:dayforce'
  | 'job:tmu'
  | 'job:opg'
  | 'project:stf'
  | 'project:nearmoi'
  | 'project:zenny'
  | 'repos'
  | 'education'
  | 'contact'
  | 'guestbook'
  | 'skills'
  | 'home';

export type Interactable = {
  id: string;
  action: Action;
  label: string;
  x: number; // left, blocks
  y: number; // top, blocks
  w: number;
  h: number;
};

export type PropKind = 'lectern' | 'chest' | 'enchant' | 'sign' | 'portal' | 'mailbox' | 'beacon';
export type Prop = { kind: PropKind; x: number; y: number; w: number; h: number; text?: string[] };

export type Label = { x: number; y: number; text: string; sub?: string };

export type Section = { id: string; name: string; from: number; to: number; slot: number; spawnX: number };

export const sections: Section[] = [
  { id: 'spawn', name: 'Spawn', from: 0, to: 46, slot: 0, spawnX: 22 },
  { id: 'village', name: 'Career Village', from: 46, to: 120, slot: 1, spawnX: 52 },
  { id: 'quarry', name: 'Skill Quarry', from: 120, to: 172, slot: 2, spawnX: 131 },
  { id: 'projects', name: 'Builds District', from: 172, to: 236, slot: 3, spawnX: 176 },
  { id: 'library', name: 'The Library', from: 236, to: 262, slot: 4, spawnX: 240 },
  { id: 'contact', name: 'Multiplayer Gate', from: 262, to: W, slot: 5, spawnX: 266 },
];

export const sectionAt = (x: number) => sections.find((s) => x >= s.from && x < s.to) ?? sections[0];

export type OrePlacement = { skillId: string; x: number; y: number; block: number };

export type World = {
  fg: Uint8Array;
  bg: Uint8Array;
  surface: Int16Array;
  interactables: Interactable[];
  props: Prop[];
  labels: Label[];
  ores: OrePlacement[];
  lights: { x: number; y: number; r: number }[];
  bugZones: { from: number; to: number }[];
};

export function buildWorld(): World {
  const fg = new Uint8Array(W * H);
  const bg = new Uint8Array(W * H);
  const idx = (x: number, y: number) => y * W + x;
  const inb = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H;
  const set = (x: number, y: number, b: number) => inb(x, y) && (fg[idx(x, y)] = b);
  const setBg = (x: number, y: number, b: number) => inb(x, y) && (bg[idx(x, y)] = b);
  const get = (x: number, y: number) => (inb(x, y) ? fg[idx(x, y)] : 0);

  // ---- terrain heightmap ----
  const surface = new Int16Array(W);
  const flat: [number, number][] = [
    [2, 34],
    [48, 116],
    [172, 260],
    [262, 298],
  ];
  for (let x = 0; x < W; x++) {
    let h = SURF + Math.round(Math.sin(x / 7.3) * 1.4 + Math.sin(x / 3.1 + 2) * 0.5);
    if (flat.some(([a, b]) => x >= a && x <= b)) h = SURF;
    surface[x] = h;
  }
  // quarry pit: terraces down to depth 9
  const Q0 = 124;
  const Q1 = 168;
  for (let x = Q0; x <= Q1; x++) {
    const fromL = x - Q0;
    const fromR = Q1 - x;
    const d = Math.min(9, Math.floor(Math.min(fromL, fromR) / 2.2));
    surface[x] = SURF + d;
  }
  // river with bridge between spawn and village
  const R0 = 39;
  const R1 = 45;
  // smooth: max 1 step between neighbours
  for (let pass = 0; pass < 4; pass++)
    for (let x = 1; x < W; x++) {
      if (surface[x] - surface[x - 1] > 1) surface[x] = surface[x - 1] + 1;
      if (surface[x - 1] - surface[x] > 1) surface[x - 1] = surface[x] + 1;
    }

  for (let x = 0; x < W; x++) {
    const top = surface[x];
    const quarry = x >= Q0 && x <= Q1;
    for (let y = top; y < H; y++) {
      const depth = y - top;
      let b: number = B.STONE;
      if (y >= H - 1 || (y >= H - 3 && hash2(x, y, 9) < 0.5)) b = B.BEDROCK;
      else if (quarry) b = depth === 0 && hash2(x, y, 4) < 0.35 ? B.GRAVEL : B.STONE;
      else if (depth === 0) b = B.GRASS;
      else if (depth < 4 + (hash2(x, 0, 3) < 0.5 ? 1 : 0)) b = B.DIRT;
      set(x, y, b);
      if (depth > 0) setBg(x, y, B.STONE);
    }
  }
  // river
  for (let x = R0; x <= R1; x++) {
    for (let y = SURF - 1; y < SURF + 3; y++) set(x, y, y >= SURF ? B.WATER : B.AIR);
    set(x, SURF + 3, B.SAND);
    surface[x] = SURF + 3;
  }
  for (let x = R0 - 1; x <= R1 + 1; x++) set(x, SURF - 1, B.PLANKS); // bridge deck
  for (let x = R0 - 1; x <= R1 + 1; x++) if (get(x, SURF) === B.GRASS && (x === R0 - 1 || x === R1 + 1)) set(x, SURF, B.DIRT);
  set(R0 - 2, SURF - 1, B.AIR);
  set(R1 + 2, SURF - 1, B.AIR);
  // bridge posts and lanterns
  setBg(R0 - 1, SURF - 2, B.LOG);
  setBg(R1 + 1, SURF - 2, B.LOG);
  setBg(R0 - 1, SURF - 3, B.TORCH);
  setBg(R1 + 1, SURF - 3, B.TORCH);
  for (let x = R0 - 1; x <= R1 + 1; x++) surface[x] = SURF - 1;

  const interactables: Interactable[] = [];
  const props: Prop[] = [];
  const labels: Label[] = [];
  const lights: { x: number; y: number; r: number }[] = [];

  const rect = (x0: number, y0: number, w: number, h: number, b: number, layer: 'bg' | 'fg' = 'bg') => {
    for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) (layer === 'bg' ? setBg : set)(x, y, b);
  };
  const lamp = (x: number, y: number, r = 5) => {
    setBg(x, y, B.LAMP);
    lights.push({ x: x + 0.5, y: y + 0.5, r });
  };
  const torch = (x: number, y: number) => {
    setBg(x, y, B.TORCH);
    lights.push({ x: x + 0.5, y: y + 0.3, r: 4 });
  };
  const tree = (x: number, kind = 0) => {
    const g = surface[x];
    if (get(x, g) !== B.GRASS) return;
    const h = 4 + (kind % 2);
    for (let y = g - h; y < g; y++) setBg(x, y, B.LOG);
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 1; dy++) {
        const y = g - h + dy;
        if (Math.abs(dx) === 2 && (dy === -2 || dy === 1)) continue;
        if (dy === -2 && Math.abs(dx) > 1) continue;
        if (!(dx === 0 && dy >= 0)) setBg(x + dx, y, B.LEAVES);
      }
  };
  const decorate = (x: number) => {
    const g = surface[x];
    if (get(x, g) !== B.GRASS || get(x, g - 1) !== B.AIR || bg[idx(x, g - 1)] !== B.AIR) return;
    const r = hash2(x, 7, 11);
    if (r < 0.28) setBg(x, g - 1, B.TALL_GRASS);
    else if (r < 0.34) setBg(x, g - 1, B.FLOWER_RED);
    else if (r < 0.4) setBg(x, g - 1, B.FLOWER_YELLOW);
  };

  // ================= SPAWN =================
  // starter house (home)
  {
    const x0 = 4;
    const g = SURF;
    rect(x0, g - 5, 9, 5, B.PLANKS);
    for (let y = g - 5; y < g; y++) {
      setBg(x0, y, B.LOG);
      setBg(x0 + 8, y, B.LOG);
    }
    rect(x0 + 2, g - 4, 2, 2, B.GLASS);
    rect(x0 + 6, g - 3, 1, 3, B.DARK_PLANKS); // door
    for (let i = 0; i < 6; i++) rect(x0 - 1 + i, g - 6 - i, 11 - i * 2, 1, B.BRICK);
    torch(x0 + 5, g - 3);
    labels.push({ x: x0 + 4.5, y: g - 12.5, text: 'Home', sub: 'Pickering, ON' });
    interactables.push({ id: 'home', action: 'home', label: 'Home & wardrobe', x: x0, y: g - 11, w: 9, h: 11 });
  }
  // lectern with the about book
  props.push({ kind: 'lectern', x: 19, y: SURF - 1, w: 1, h: 1 });
  interactables.push({ id: 'about', action: 'about', label: 'About me', x: 18.5, y: SURF - 2, w: 2, h: 2 });
  labels.push({ x: 19.5, y: SURF - 2.6, text: 'About me' });
  // welcome sign
  props.push({ kind: 'sign', x: 25, y: SURF - 2, w: 1, h: 2, text: ['Welcome!', 'Walk right', 'to explore', '→ → →'] });
  // resume chest
  props.push({ kind: 'chest', x: 31, y: SURF - 1, w: 1, h: 1 });
  interactables.push({ id: 'resume', action: 'resume', label: 'Resume', x: 30.5, y: SURF - 2, w: 2, h: 2 });
  labels.push({ x: 31.5, y: SURF - 2.6, text: 'Resume' });
  [2, 15, 35, 36].forEach((x, i) => tree(x, i));

  // ================= VILLAGE =================
  // Dayforce HQ: modern glass office
  {
    const x0 = 52;
    const w = 16;
    const h = 15;
    const g = SURF;
    rect(x0, g - h, w, h, B.QUARTZ);
    for (let fy = 0; fy < 3; fy++) {
      const yy = g - h + 2 + fy * 4;
      rect(x0 + 1, yy, w - 2, 2, B.GLASS);
      rect(x0, yy + 2, w, 1, B.WOOL_BLUE);
    }
    rect(x0 + 6, g - 3, 4, 3, B.GLASS);
    rect(x0 - 1, g - h - 1, w + 2, 1, B.IRON);
    lamp(x0 + 2, g - h - 2, 4);
    lamp(x0 + w - 3, g - h - 2, 4);
    lamp(x0 + 5, g - 4, 4);
    lamp(x0 + 10, g - 4, 4);
    labels.push({ x: x0 + w / 2, y: g - h - 3.5, text: 'Dayforce', sub: '2025 – present' });
    interactables.push({ id: 'dayforce', action: 'job:dayforce', label: 'Dayforce experience', x: x0, y: g - h - 2, w, h: h + 2 });
  }
  // TMU Architectural Science lab: brick + blue/gold banner
  {
    const x0 = 76;
    const w = 13;
    const h = 10;
    const g = SURF;
    rect(x0, g - h, w, h, B.BRICK);
    rect(x0 + 1, g - h + 2, 3, 3, B.BOOKSHELF);
    rect(x0 + w - 4, g - h + 2, 3, 3, B.BOOKSHELF);
    rect(x0 + 5, g - h + 2, 3, 2, B.GLASS);
    rect(x0 + 5, g - 3, 3, 3, B.DARK_PLANKS);
    for (let i = 0; i < 4; i++) rect(x0 - 1 + i, g - h - 1 - i, w + 2 - i * 2, 1, B.STONEBRICK);
    rect(x0 + 6, g - h - 7, 1, 3, B.WOOL_BLUE);
    rect(x0 + 6, g - h - 5, 1, 1, B.WOOL_YELLOW);
    torch(x0 + 4, g - 3);
    torch(x0 + 8, g - 3);
    labels.push({ x: x0 + w / 2, y: g - h - 8.5, text: 'TMU · Architectural Science', sub: '2024 – 2025' });
    interactables.push({ id: 'tmu', action: 'job:tmu', label: 'TMU experience', x: x0, y: g - h - 7, w, h: h + 7 });
  }
  // OPG power station with cooling tower
  {
    const x0 = 96;
    const g = SURF;
    rect(x0, g - 8, 11, 8, B.CONCRETE);
    rect(x0, g - 9, 11, 1, B.IRON);
    rect(x0 + 1, g - 6, 9, 1, B.LAMP);
    for (let i = 1; i < 10; i += 2) lights.push({ x: x0 + i + 0.5, y: g - 5.5, r: 3 });
    rect(x0 + 4, g - 3, 3, 3, B.IRON);
    // cooling tower (hyperbolic-ish)
    const tw = [7, 6, 5, 5, 5, 5, 6, 6, 7];
    tw.forEach((wid, i) => {
      const y = g - 1 - i;
      const cx = x0 + 15;
      rect(cx - Math.floor(wid / 2), y, wid, 1, B.CONCRETE);
    });
    // chimney
    rect(x0 + 9, g - 14, 1, 5, B.STONEBRICK);
    labels.push({ x: x0 + 8, y: g - 15.5, text: 'Ontario Power Generation', sub: '2024' });
    interactables.push({ id: 'opg', action: 'job:opg', label: 'OPG experience', x: x0, y: g - 14, w: 19, h: 14 });
  }
  [47, 72, 92, 117].forEach((x, i) => tree(x, i));
  // village lamp posts
  [70, 91, 115].forEach((x) => {
    setBg(x, SURF - 1, B.LOG);
    setBg(x, SURF - 2, B.LOG);
    lamp(x, SURF - 3, 5);
  });

  // ================= QUARRY (skills) =================
  const ores: OrePlacement[] = [];
  const groups = ['Languages', 'Frontend', 'Backend', 'Data & Cloud', 'Practices'] as const;
  const cols: number[] = [];
  for (let x = Q0 + 2; x <= Q1 - 2; x++) cols.push(x);
  // distribute skills by category along the pit, in two rows beneath the floor
  const perCat = groups.map((g) => skills.filter((s) => s.cat === g));
  const total = skills.length;
  let cursor = 0;
  perCat.forEach((list, gi) => {
    const span = list.length + Math.floor(((cols.length - total) * list.length) / total);
    const start = cursor;
    const end = Math.min(cols.length, gi === perCat.length - 1 ? cols.length : cursor + span);
    const slots: [number, number][] = [];
    for (let i = start; i < end; i++) {
      const x = cols[i];
      // ores sit under the quarry floor, one per column, so mining never changes the walkable ground
      slots.push([x, surface[x] + 1 + (i % 2)]);
    }
    list.forEach((s, k) => {
      const at = slots[Math.floor((k * slots.length) / list.length)];
      const block = oreBlock[oreFor(s.cat)];
      set(at[0], at[1], block);
      ores.push({ skillId: s.id, x: at[0], y: at[1], block });
    });
    const mid = cols[Math.floor((start + end - 1) / 2)];
    labels.push({ x: mid + 0.5, y: surface[mid] - 2.8, text: groups[gi] });
    cursor = end;
  });
  labels.push({ x: (Q0 + Q1) / 2, y: SURF - 7, text: 'Skill Quarry', sub: 'Click ores to mine them' });
  interactables.push({ id: 'quarry-sign', action: 'skills', label: 'Skills inventory', x: Q0 - 3, y: SURF - 2, w: 2, h: 2 });
  props.push({ kind: 'sign', x: Q0 - 3, y: SURF - 2, w: 1, h: 2, text: ['Skill Quarry', 'Mine ores to', 'collect skills', '[E] inventory'] });
  // scaffolding / torches on the rim
  torch(Q0 - 1, SURF - 1);
  torch(Q1 + 1, SURF - 1);
  for (let x = Q0 + 6; x < Q1 - 4; x += 9) torch(x, surface[x] - 1);

  // ================= BUILDS DISTRICT (projects) =================
  rect(174, SURF, 58, 1, B.STONEBRICK, 'fg');
  // Sisters Through Faith: event hall with a red canopy
  {
    const x0 = 178;
    const g = SURF;
    rect(x0, g - 9, 13, 9, B.QUARTZ);
    rect(x0 + 1, g - 7, 11, 3, B.GLASS);
    rect(x0 - 1, g - 10, 15, 1, B.WOOL_RED);
    rect(x0, g - 11, 13, 1, B.WOOL_RED);
    rect(x0 + 5, g - 3, 3, 3, B.GLASS);
    rect(x0 + 2, g - 13, 9, 2, B.GOLD_BLOCK);
    lamp(x0 + 1, g - 3, 4);
    lamp(x0 + 11, g - 3, 4);
    labels.push({ x: x0 + 6.5, y: g - 15, text: 'Sisters Through Faith', sub: 'Live ticketing platform' });
    interactables.push({ id: 'stf', action: 'project:stf', label: 'Sisters Through Faith project', x: x0, y: g - 13, w: 13, h: 13 });
  }
  // NearMoi: giant map pin
  {
    const cx = 202;
    const g = SURF;
    const pin = [
      '..rrrrr..',
      '.rrrrrrr.',
      'rrrwwwrrr',
      'rrwwwwwrr',
      'rrrwwwrrr',
      '.rrrrrrr.',
      '..rrrrr..',
      '...rrr...',
      '....r....',
    ];
    pin.forEach((row, i) =>
      [...row].forEach((ch, j) => {
        if (ch === '.') return;
        setBg(cx - 4 + j, g - 11 + i, ch === 'r' ? B.WOOL_RED : B.QUARTZ);
      }),
    );
    rect(cx, g - 2, 1, 2, B.IRON);
    props.push({ kind: 'beacon', x: cx, y: g - 12, w: 1, h: 1 });
    lights.push({ x: cx + 0.5, y: g - 8, r: 6 });
    labels.push({ x: cx + 0.5, y: g - 14, text: 'NearMoi', sub: 'Event discovery app' });
    interactables.push({ id: 'nearmoi', action: 'project:nearmoi', label: 'NearMoi project', x: cx - 4, y: g - 12, w: 9, h: 12 });
  }
  // Zenny: giant phone
  {
    const x0 = 214;
    const g = SURF;
    rect(x0, g - 13, 8, 13, B.OBSIDIAN);
    rect(x0 + 1, g - 11, 6, 9, B.WOOL_BLUE);
    rect(x0 + 2, g - 10, 4, 1, B.QUARTZ);
    rect(x0 + 2, g - 8, 2, 2, B.GOLD_BLOCK);
    rect(x0 + 4, g - 8, 2, 2, B.WOOL_YELLOW);
    rect(x0 + 2, g - 5, 4, 2, B.QUARTZ);
    rect(x0 + 3, g - 12, 2, 1, B.CONCRETE);
    lights.push({ x: x0 + 4, y: g - 7, r: 5 });
    labels.push({ x: x0 + 4, y: g - 15, text: 'Zenny', sub: 'iOS budgeting app' });
    interactables.push({ id: 'zenny', action: 'project:zenny', label: 'Zenny project', x: x0, y: g - 13, w: 8, h: 13 });
  }
  // GitHub repos chest
  props.push({ kind: 'chest', x: 228, y: SURF - 1, w: 1, h: 1 });
  interactables.push({ id: 'repos', action: 'repos', label: 'GitHub repos', x: 227.5, y: SURF - 2, w: 2, h: 2 });
  labels.push({ x: 228.5, y: SURF - 2.6, text: 'More on GitHub' });
  [173, 194, 210, 232].forEach((x) => lamp(x, SURF - 1, 4));

  // ================= LIBRARY (education) =================
  {
    const x0 = 240;
    const w = 16;
    const h = 11;
    const g = SURF;
    rect(x0, g - h, w, h, B.STONEBRICK);
    rect(x0 + 1, g - h + 1, w - 2, h - 2, B.BOOKSHELF);
    rect(x0 + 5, g - 5, 6, 5, B.DARK_PLANKS);
    for (let i = 0; i < 5; i++) rect(x0 - 1 + i, g - h - 1 - i, w + 2 - i * 2, 1, B.DARK_PLANKS);
    props.push({ kind: 'enchant', x: x0 + 7, y: g - 1, w: 1, h: 1 });
    torch(x0 + 5, g - 4);
    torch(x0 + 10, g - 4);
    lights.push({ x: x0 + 7.5, y: g - 1.5, r: 4 });
    labels.push({ x: x0 + w / 2, y: g - h - 6.5, text: 'Library', sub: 'Education' });
    interactables.push({ id: 'education', action: 'education', label: 'Education', x: x0, y: g - h - 5, w, h: h + 5 });
  }

  // ================= MULTIPLAYER GATE (contact) =================
  {
    const x0 = 268;
    const g = SURF;
    rect(x0, g - 7, 6, 1, B.OBSIDIAN);
    rect(x0, g - 1, 6, 1, B.OBSIDIAN);
    rect(x0, g - 7, 1, 7, B.OBSIDIAN);
    rect(x0 + 5, g - 7, 1, 7, B.OBSIDIAN);
    props.push({ kind: 'portal', x: x0 + 1, y: g - 6, w: 4, h: 5 });
    lights.push({ x: x0 + 3, y: g - 3.5, r: 6 });
    labels.push({ x: x0 + 3, y: g - 8.8, text: 'Multiplayer', sub: 'Get in touch' });
    interactables.push({ id: 'contact', action: 'contact', label: 'Contact me', x: x0, y: g - 8, w: 6, h: 8 });
    props.push({ kind: 'mailbox', x: 280, y: g - 2, w: 1, h: 2 });
    interactables.push({ id: 'guestbook', action: 'guestbook', label: 'Mailbox', x: 279.5, y: g - 3, w: 2, h: 3 });
    labels.push({ x: 280.5, y: g - 3.6, text: 'Mailbox' });
    props.push({ kind: 'sign', x: 287, y: g - 2, w: 1, h: 2, text: ['You reached', 'the edge.', 'Thanks for', 'visiting!'] });
  }
  // world border walls
  for (let y = 0; y < H; y++) {
    set(0, y, B.BEDROCK);
    set(W - 1, y, B.BEDROCK);
  }
  [264, 292, 295].forEach((x, i) => tree(x, i));

  for (let x = 1; x < W - 1; x++) decorate(x);

  return {
    fg,
    bg,
    surface,
    interactables,
    props,
    labels,
    ores,
    lights,
    bugZones: [
      { from: 50, to: 116 },
      { from: 128, to: 164 },
      { from: 176, to: 230 },
    ],
  };
}
