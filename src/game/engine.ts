import { B, isOre, isSolid, makeTextures } from './blocks';
import { makeProps } from './sprites';
import { makeSkin, type Outfit } from './skin';
import { buildWorld, sectionAt, sections, H, W, type Interactable, type Section, type World } from './world';
import { hash2 } from './rng';

export type EngineEvents = {
  onSection?: (s: Section) => void;
  onNear?: (i: Interactable | null) => void;
  onInteract?: (i: Interactable) => void;
  onMine?: (skillId: string, screen: { x: number; y: number }) => void;
  onBug?: () => void;
  onHover?: (h: { label: string; x: number; y: number } | null) => void;
  onMove?: () => void;
  onStep?: (surface: 'grass' | 'stone' | 'wood' | 'sand') => void;
  onMineHit?: () => void;
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
type Bug = { x: number; y: number; dir: number; zone: { from: number; to: number }; dead: number; speed: number };

const GRAV = 32;
const WALK = 5.2;
const JUMP = 9.6;
const PW = 0.6;
const PH = 1.8;

export class Engine {
  world: World;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex = makeTextures();
  props = makeProps();
  skin: HTMLCanvasElement;
  ev: EngineEvents;

  mode: 'title' | 'play' = 'title';
  px = 22;
  py = 31;
  vx = 0;
  vy = 0;
  facing = 1;
  grounded = false;
  walkPhase = 0;
  targetX: number | null = null;
  pending: Interactable | null = null;
  keys = new Set<string>();
  touchDir = 0;
  jumpQueued = false;

  camX = 0;
  camY = 0;
  block = 40;
  cssW = 0;
  cssH = 0;
  dpr = 1;

  night = 0; // 0 day .. 1 night
  nightTarget = 0;
  time = 0;
  particles: Particle[] = [];
  bugs: Bug[] = [];
  mining: { x: number; y: number; t: number; skillId: string } | null = null;
  near: Interactable | null = null;
  section: Section = sections[0];
  hoverWorld: { x: number; y: number } | null = null;
  reduced = false;
  paused = false;
  hidden = false;
  private raf = 0;
  private last = 0;
  private lightCanvas = document.createElement('canvas');
  private stars: { x: number; y: number; s: number }[] = [];
  private bgCache = new Map<number, HTMLCanvasElement>();

  constructor(canvas: HTMLCanvasElement, ev: EngineEvents, opts: { outfit: Outfit; mined: string[]; night: boolean }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ev = ev;
    this.world = buildWorld();
    this.skin = makeSkin(opts.outfit);
    this.night = this.nightTarget = opts.night ? 1 : 0;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    for (const id of opts.mined) this.removeOre(id);
    for (let i = 0; i < 120; i++) this.stars.push({ x: hash2(i, 1, 5), y: hash2(i, 2, 5) * 0.6, s: hash2(i, 3, 5) < 0.2 ? 2 : 1 });
    for (const z of this.world.bugZones)
      for (let k = 0; k < 2; k++)
        this.bugs.push({ x: z.from + hash2(k, z.from, 3) * (z.to - z.from), y: 0, dir: k % 2 ? 1 : -1, zone: z, dead: 0, speed: 0.6 + hash2(k, 4, z.to) * 0.6 });
    this.py = this.groundY(this.px);
    this.resize();
    this.camX = this.px - this.viewW() / 2;
    this.camY = this.targetCamY();
  }

  // ---------- world helpers ----------
  fg(x: number, y: number) {
    if (x < 0 || x >= W || y < 0 || y >= H) return x < 0 || x >= W ? B.BEDROCK : B.AIR;
    return this.world.fg[y * W + x];
  }
  solidAt(x: number, y: number) {
    return isSolid(this.fg(Math.floor(x), Math.floor(y)));
  }
  groundY(x: number) {
    for (let y = 0; y < H; y++) if (isSolid(this.fg(Math.floor(x), y))) return y;
    return H;
  }
  removeOre(skillId: string) {
    const o = this.world.ores.find((o) => o.skillId === skillId);
    if (o) this.world.fg[o.y * W + o.x] = B.AIR;
  }
  restoreOres() {
    for (const o of this.world.ores) this.world.fg[o.y * W + o.x] = o.block;
  }
  setOutfit(o: Outfit) {
    this.skin = makeSkin(o);
  }
  setNight(n: boolean) {
    this.nightTarget = n ? 1 : 0;
  }
  viewW() {
    return this.cssW / this.block;
  }
  viewH() {
    return this.cssH / this.block;
  }
  targetCamY() {
    // keep the player a bit below centre so the sky and buildings show
    return this.py - this.viewH() * 0.68;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.cssW = Math.max(1, r.width);
    this.cssH = Math.max(1, r.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    const byH = this.cssH / (this.cssH < 500 ? 10 : 14.5);
    const byW = this.cssW / 15;
    this.block = Math.round(Math.max(22, Math.min(64, Math.min(byH, byW * 1.35))));
    this.lightCanvas.width = Math.ceil(this.cssW / 4);
    this.lightCanvas.height = Math.ceil(this.cssH / 4);
  }

  start() {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
      this.last = t;
      if (!this.paused && !this.hidden) this.update(dt);
      if (!this.hidden) this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() {
    cancelAnimationFrame(this.raf);
  }

  // ---------- input ----------
  key(code: string, down: boolean) {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
    if (down && (code === 'Space' || code === 'KeyW' || code === 'ArrowUp')) this.jumpQueued = true;
    if (down && ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      this.targetX = null;
      this.pending = null;
    }
  }
  interact() {
    if (this.near) this.ev.onInteract?.(this.near);
  }
  teleport(x: number) {
    this.burst(this.px, this.py - 0.9, '#c77dff', 24);
    this.px = x;
    this.py = this.groundY(x);
    this.vx = this.vy = 0;
    this.targetX = null;
    this.pending = null;
    this.camX = this.px - this.viewW() / 2;
    this.camY = this.targetCamY();
    this.clampCam();
    this.burst(this.px, this.py - 0.9, '#c77dff', 24);
  }
  walkTo(x: number, then: Interactable | null = null) {
    this.targetX = Math.max(1.5, Math.min(W - 2, x));
    this.pending = then;
  }

  screenToWorld(sx: number, sy: number) {
    return { x: this.camX + sx / this.block, y: this.camY + sy / this.block };
  }
  worldToScreen(x: number, y: number) {
    return { x: (x - this.camX) * this.block, y: (y - this.camY) * this.block };
  }

  hitTest(sx: number, sy: number): { kind: 'ore' | 'bug' | 'inter' | 'ground'; label?: string; inter?: Interactable; ore?: { x: number; y: number; skillId: string } } {
    const p = this.screenToWorld(sx, sy);
    for (const b of this.bugs) if (!b.dead && Math.abs(p.x - b.x) < 0.6 && Math.abs(p.y - (b.y - 0.25)) < 0.5) return { kind: 'bug', label: 'Bug (click to squash)' };
    const bx = Math.floor(p.x);
    const by = Math.floor(p.y);
    if (isOre(this.fg(bx, by))) {
      const o = this.world.ores.find((o) => o.x === bx && o.y === by);
      if (o) return { kind: 'ore', ore: { x: bx, y: by, skillId: o.skillId } };
    }
    for (const i of this.world.interactables)
      if (p.x >= i.x && p.x <= i.x + i.w && p.y >= i.y && p.y <= i.y + i.h) return { kind: 'inter', inter: i, label: i.label };
    return { kind: 'ground' };
  }

  click(sx: number, sy: number) {
    if (this.mode !== 'play') return;
    const h = this.hitTest(sx, sy);
    const p = this.screenToWorld(sx, sy);
    if (h.kind === 'bug') {
      const b = this.bugs.find((b) => !b.dead && Math.abs(p.x - b.x) < 0.6);
      if (b) {
        b.dead = 1;
        this.burst(b.x, b.y - 0.2, '#3fbf6a', 14);
        this.ev.onBug?.();
      }
      return;
    }
    if (h.kind === 'ore' && h.ore) {
      if (!this.mining) {
        this.mining = { ...h.ore, t: 0 };
        this.facing = h.ore.x + 0.5 > this.px ? 1 : -1;
      }
      return;
    }
    if (h.kind === 'inter' && h.inter) {
      const i = h.inter;
      if (this.near?.id === i.id || Math.abs(this.px - (i.x + i.w / 2)) < i.w / 2 + 1) {
        this.ev.onInteract?.(i);
      } else this.walkTo(i.x + i.w / 2, i);
      return;
    }
    this.walkTo(p.x);
  }

  hover(sx: number, sy: number | null) {
    if (sy === null || this.mode !== 'play') {
      this.hoverWorld = null;
      this.ev.onHover?.(null);
      return;
    }
    this.hoverWorld = this.screenToWorld(sx, sy);
    const h = this.hitTest(sx, sy);
    if (h.kind === 'ore' && h.ore) this.ev.onHover?.({ label: 'ore:' + h.ore.skillId, x: sx, y: sy });
    else if (h.label) this.ev.onHover?.({ label: h.label, x: sx, y: sy });
    else this.ev.onHover?.(null);
  }

  // ---------- simulation ----------
  update(dt: number) {
    this.time += dt;
    this.night += (this.nightTarget - this.night) * Math.min(1, dt * 1.5);

    if (this.mode === 'title') {
      this.camX += dt * 1.6;
      if (this.camX > W - this.viewW() - 2) this.camX = 2;
      this.camY = 32 - this.viewH() * 0.55;
      this.updateParticles(dt);
      return;
    }

    let dir = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dir -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dir += 1;
    if (this.touchDir) dir = this.touchDir;
    if (dir) {
      this.targetX = null;
      this.pending = null;
    }
    if (this.targetX !== null && !dir) {
      const d = this.targetX - this.px;
      if (Math.abs(d) < 0.2) {
        this.targetX = null;
        if (this.pending) {
          const p = this.pending;
          this.pending = null;
          this.ev.onInteract?.(p);
        }
      } else dir = Math.sign(d);
    }
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || (this.targetX !== null && Math.abs(this.targetX - this.px) > 12);
    const speed = WALK * (sprint ? 1.7 : 1);
    this.vx = dir * speed;
    if (dir) {
      this.facing = dir;
      this.ev.onMove?.();
    }

    if (this.jumpQueued && this.grounded) this.vy = -JUMP;
    this.jumpQueued = false;

    // horizontal
    const nx = this.px + this.vx * dt;
    if (!this.collides(nx, this.py)) this.px = nx;
    else {
      // auto step-up by one block
      if (this.grounded && !this.collides(nx, this.py - 1.01)) {
        this.vy = -8.8;
      } else if (this.grounded && !this.collides(nx, this.py - 2.01) && !this.collides(this.px, this.py - 2.01)) {
        this.vy = -12.4; // climb out of a freshly mined hole
      }
      this.vx = 0;
      if (this.targetX !== null && !this.grounded && Math.abs(this.targetX - this.px) < 0.6) this.targetX = null;
    }
    // vertical
    this.vy = Math.min(30, this.vy + GRAV * dt);
    const ny = this.py + this.vy * dt;
    if (!this.collides(this.px, ny)) {
      this.py = ny;
      this.grounded = false;
    } else {
      if (this.vy > 0) {
        this.py = Math.floor(ny - 0.0001) + (this.collides(this.px, Math.floor(ny)) ? 0 : 0);
        // settle on top of block
        let yy = ny;
        while (this.collides(this.px, yy)) yy -= 0.01;
        this.py = yy;
        this.grounded = true;
      }
      this.vy = 0;
    }
    if (this.py > H + 4) this.teleport(this.section.spawnX);

    const prevPhase = this.walkPhase;
    this.walkPhase = this.vx ? this.walkPhase + dt * Math.abs(this.vx) * 1.9 : this.walkPhase * 0.8;
    if (this.vx && this.grounded && Math.floor(this.walkPhase / Math.PI) !== Math.floor(prevPhase / Math.PI)) {
      const under = this.fg(Math.floor(this.px), Math.floor(this.py + 0.05));
      const surface = under === B.PLANKS || under === B.DARK_PLANKS ? 'wood' : under === B.SAND ? 'sand' : under === B.GRASS || under === B.DIRT ? 'grass' : 'stone';
      this.ev.onStep?.(surface);
    }

    // mining
    if (this.mining) {
      this.mining.t += dt;
      if (Math.floor(this.mining.t * 12) !== Math.floor((this.mining.t - dt) * 12)) {
        this.burst(this.mining.x + 0.5, this.mining.y + 0.5, '#8a8a8a', 2, 0.6);
      }
      if (Math.floor(this.mining.t * 7) !== Math.floor((this.mining.t - dt) * 7)) this.ev.onMineHit?.();
      if (this.mining.t > 0.45) {
        const m = this.mining;
        const b = this.fg(m.x, m.y);
        this.world.fg[m.y * W + m.x] = B.AIR;
        const col = b === B.ORE_DIAMOND ? '#5decf5' : b === B.ORE_EMERALD ? '#17dd62' : b === B.ORE_GOLD ? '#fcee4b' : b === B.ORE_LAPIS ? '#3a6be8' : '#ff4040';
        this.burst(m.x + 0.5, m.y + 0.5, col, 18);
        this.burst(m.x + 0.5, m.y + 0.5, '#7f7f7f', 10);
        this.mining = null;
        this.ev.onMine?.(m.skillId, this.worldToScreen(m.x + 0.5, m.y + 0.5));
      }
    }

    // bugs
    for (const b of this.bugs) {
      if (b.dead) {
        b.dead += dt;
        if (b.dead > 12) {
          b.dead = 0;
          b.x = b.zone.from + Math.random() * (b.zone.to - b.zone.from);
        }
        continue;
      }
      b.x += b.dir * b.speed * dt;
      if (b.x < b.zone.from || b.x > b.zone.to || this.solidAt(b.x + b.dir * 0.4, this.groundY(b.x) - 0.5)) b.dir *= -1;
      b.y = this.groundY(b.x);
    }

    // proximity
    let near: Interactable | null = null;
    for (const i of this.world.interactables) {
      if (this.px >= i.x - 0.6 && this.px <= i.x + i.w + 0.6 && this.py >= i.y - 1 && this.py <= i.y + i.h + 1.5) {
        if (!near || i.w < near.w) near = i;
      }
    }
    if (near?.id !== this.near?.id) {
      this.near = near;
      this.ev.onNear?.(near);
    }
    const s = sectionAt(this.px);
    if (s.id !== this.section.id) {
      this.section = s;
      this.ev.onSection?.(s);
    }

    // camera
    const tx = this.px - this.viewW() / 2;
    const ty = this.targetCamY();
    const k = this.reduced ? 1 : Math.min(1, dt * 5);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    this.clampCam();
    this.updateParticles(dt);
  }

  clampCam() {
    this.camX = Math.max(0, Math.min(W - this.viewW(), this.camX));
    this.camY = Math.max(-10, Math.min(H - this.viewH(), this.camY));
  }

  collides(x: number, y: number) {
    const l = x - PW / 2;
    const r = x + PW / 2;
    const t = y - PH;
    for (let bx = Math.floor(l); bx <= Math.floor(r - 0.001); bx++)
      for (let by = Math.floor(t); by <= Math.floor(y - 0.001); by++) if (isSolid(this.fg(bx, by))) return true;
    return false;
  }

  burst(x: number, y: number, color: string, n: number, spread = 1) {
    if (this.reduced && n > 4) n = 4;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (1 + Math.random() * 4) * spread;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 0, max: 0.5 + Math.random() * 0.5, color, size: 0.08 + Math.random() * 0.1 });
    }
  }
  updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life += dt;
      p.vy += 18 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
  }

  // ---------- rendering ----------
  private darkTex(id: number) {
    let c = this.bgCache.get(id);
    if (c) return c;
    const src = this.tex[id];
    c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d')!;
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(0, 0, 16, 16);
    this.bgCache.set(id, c);
    return c;
  }

  render() {
    const { ctx, block: bs } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const n = this.night;

    // sky
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * n);
    const top = `rgb(${lerp(110, 8)},${lerp(160, 14)},${lerp(255, 40)})`;
    const bot = `rgb(${lerp(178, 24)},${lerp(212, 32)},${lerp(255, 72)})`;
    const g = ctx.createLinearGradient(0, 0, 0, this.cssH);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.cssW, this.cssH);

    // stars
    if (n > 0.05) {
      ctx.fillStyle = `rgba(255,255,255,${n * 0.9})`;
      for (const s of this.stars) {
        const tw = 0.6 + 0.4 * Math.sin(this.time * 2 + s.x * 50);
        ctx.globalAlpha = n * tw;
        ctx.fillRect(Math.floor(((s.x * this.cssW * 1.5 - this.camX * 2) % this.cssW + this.cssW) % this.cssW), Math.floor(s.y * this.cssH), s.s, s.s);
      }
      ctx.globalAlpha = 1;
    }
    // sun / moon
    const orb = bs * 1.6;
    const ox = this.cssW * 0.78;
    const oy = this.cssH * 0.14;
    ctx.globalAlpha = 1 - n;
    ctx.fillStyle = '#fff6b0';
    ctx.fillRect(ox, oy, orb, orb);
    ctx.fillStyle = '#ffe873';
    ctx.fillRect(ox + orb * 0.15, oy + orb * 0.15, orb * 0.7, orb * 0.7);
    ctx.globalAlpha = n;
    ctx.fillStyle = '#dfe6f2';
    ctx.fillRect(ox, oy, orb * 0.8, orb * 0.8);
    ctx.fillStyle = '#b8c2d6';
    ctx.fillRect(ox + orb * 0.15, oy + orb * 0.2, orb * 0.2, orb * 0.2);
    ctx.fillRect(ox + orb * 0.45, oy + orb * 0.45, orb * 0.15, orb * 0.15);
    ctx.globalAlpha = 1;

    // parallax hills
    this.drawHills(0.25, 0.55, `rgba(${lerp(120, 20)},${lerp(160, 34)},${lerp(130, 50)},1)`, 7);
    this.drawHills(0.45, 0.62, `rgba(${lerp(92, 16)},${lerp(140, 30)},${lerp(90, 40)},1)`, 13);

    // clouds
    ctx.fillStyle = `rgba(255,255,255,${0.85 - n * 0.6})`;
    for (let i = 0; i < 9; i++) {
      const cw = bs * (3 + (i % 3) * 2);
      const span = this.cssW + cw * 2;
      const cx = (((i * 197 + this.time * 6 - this.camX * bs * 0.15) % span) + span) % span - cw;
      const cy = this.cssH * (0.06 + (i % 4) * 0.05) - (this.camY + 10) * bs * 0.05;
      ctx.fillRect(cx, cy, cw, bs * 0.6);
      ctx.fillRect(cx + bs * 0.6, cy - bs * 0.4, cw - bs * 1.4, bs * 0.4);
    }

    // tiles
    const x0 = Math.max(0, Math.floor(this.camX));
    const x1 = Math.min(W - 1, Math.ceil(this.camX + this.viewW()));
    const y0 = Math.max(0, Math.floor(this.camY));
    const y1 = Math.min(H - 1, Math.ceil(this.camY + this.viewH()));
    const ox0 = -this.camX * bs;
    const oy0 = -this.camY * bs;
    const sz = Math.ceil(bs);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const f = this.world.fg[y * W + x];
        const b = this.world.bg[y * W + x];
        const X = Math.floor(ox0 + x * bs);
        const Y = Math.floor(oy0 + y * bs);
        if (b && (!f || !isSolid(f) || f === B.GLASS)) {
          const underground = b === B.STONE;
          ctx.drawImage(underground ? this.darkTex(b) : this.tex[b], X, Y, sz, sz);
        }
      }
    // props behind player
    for (const p of this.world.props) this.drawProp(p.kind, p.x, p.y, p.w, p.h, p.text);

    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const f = this.world.fg[y * W + x];
        if (!f) continue;
        const X = Math.floor(ox0 + x * bs);
        const Y = Math.floor(oy0 + y * bs);
        if (f === B.WATER) {
          ctx.globalAlpha = 0.75;
          ctx.drawImage(this.tex[f], X, Y, sz, sz);
          ctx.globalAlpha = 1;
          continue;
        }
        ctx.drawImage(this.tex[f], X, Y, sz, sz);
        if (isOre(f)) {
          // gentle sparkle so ores read as interactive
          const ph = (this.time * 1.5 + x * 0.7 + y) % 3;
          if (ph < 0.25) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            const s = Math.max(2, bs / 10);
            ctx.fillRect(X + bs * 0.7, Y + bs * 0.2, s, s);
          }
        }
      }

    // mining cracks
    if (this.mining) {
      const m = this.mining;
      const X = ox0 + m.x * bs;
      const Y = oy0 + m.y * bs;
      const stage = Math.min(4, Math.floor((m.t / 0.45) * 5));
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = Math.max(1, bs / 16);
      ctx.beginPath();
      const segs = [
        [0.5, 0.5, 0.2, 0.3],
        [0.5, 0.5, 0.8, 0.25],
        [0.5, 0.5, 0.3, 0.8],
        [0.5, 0.5, 0.85, 0.75],
        [0.2, 0.3, 0.1, 0.6],
      ];
      for (let i = 0; i <= stage; i++) {
        const s = segs[i];
        ctx.moveTo(X + s[0] * bs, Y + s[1] * bs);
        ctx.lineTo(X + s[2] * bs, Y + s[3] * bs);
      }
      ctx.stroke();
    }

    // hover outline
    if (this.hoverWorld && this.mode === 'play') {
      const hx = Math.floor(this.hoverWorld.x);
      const hy = Math.floor(this.hoverWorld.y);
      if (isOre(this.fg(hx, hy))) {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox0 + hx * bs + 1, oy0 + hy * bs + 1, bs - 2, bs - 2);
      }
    }

    // bugs
    for (const b of this.bugs) {
      if (b.dead) continue;
      const s = this.worldToScreen(b.x, b.y);
      const w = bs * 0.62;
      const h = w * 0.8;
      ctx.save();
      ctx.translate(s.x, s.y - h);
      if (b.dir < 0) {
        ctx.scale(-1, 1);
      }
      const bob = Math.sin(this.time * 14 + b.x) > 0 ? 0 : 1;
      ctx.drawImage(this.props.bug, -w / 2, bob, w, h);
      ctx.restore();
    }

    if (this.mode === 'play') this.drawPlayer();

    // particles
    for (const p of this.particles) {
      const s = this.worldToScreen(p.x, p.y);
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.color;
      const z = p.size * bs;
      ctx.fillRect(s.x - z / 2, s.y - z / 2, z, z);
    }
    ctx.globalAlpha = 1;

    // lighting
    if (n > 0.02) this.drawLight(n);

    // labels (nametags)
    if (this.mode === 'play') this.drawLabels();
  }

  drawHills(par: number, base: number, color: string, seed: number) {
    const { ctx, block: bs } = this;
    ctx.fillStyle = color;
    const step = bs * 1.5;
    const off = (this.camX * bs * par) % step;
    const startI = Math.floor((this.camX * bs * par) / step);
    for (let i = -1; i < this.cssW / step + 2; i++) {
      const k = startI + i;
      const h = (0.5 + 0.5 * Math.sin(k * 0.35 + seed) * Math.cos(k * 0.13 + seed * 2)) * this.cssH * 0.18 + this.cssH * 0.04;
      const y = this.cssH * base - h - (this.camY - 20) * bs * par * 0.4;
      ctx.fillRect(i * step - off, y, step + 1, this.cssH);
    }
  }

  drawProp(kind: string, x: number, y: number, w: number, h: number, text?: string[]) {
    const { ctx, block: bs } = this;
    const s = this.worldToScreen(x, y);
    if (s.x > this.cssW + bs * 6 || s.x + w * bs < -bs * 6) return;
    if (kind === 'sign') {
      // post + board, with pixel text
      ctx.fillStyle = '#6b4f2a';
      ctx.fillRect(s.x + bs * 0.42, s.y + bs, bs * 0.16, bs);
      const bw = bs * 3;
      const bh = bs * 1.4;
      const bx = s.x + bs / 2 - bw / 2;
      ctx.fillStyle = '#c9a26a';
      ctx.fillRect(bx, s.y - bh * 0.2, bw, bh);
      ctx.fillStyle = '#6b4f2a';
      ctx.fillRect(bx, s.y - bh * 0.2 + bh - 2, bw, 2);
      ctx.fillStyle = '#1c1206';
      const fs = Math.max(10, Math.round(bs * 0.24));
      ctx.font = `${fs}px "Monocraft", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      (text ?? []).forEach((t, i) => ctx.fillText(t, s.x + bs / 2, s.y - bh * 0.2 + bh * 0.08 + i * fs * 1.1));
      return;
    }
    if (kind === 'portal') {
      const t = this.time;
      for (let i = 0; i < w * 4; i++)
        for (let j = 0; j < h * 4; j++) {
          const v = Math.sin(i * 0.9 + t * 3) + Math.cos(j * 0.7 - t * 2.4) + Math.sin((i + j) * 0.5 + t);
          const a = 0.55 + 0.25 * Math.sin(v);
          ctx.fillStyle = `rgba(${120 + v * 30},${40 + v * 10},${200 + v * 20},${a})`;
          ctx.fillRect(s.x + (i * bs) / 4, s.y + (j * bs) / 4, Math.ceil(bs / 4), Math.ceil(bs / 4));
        }
      return;
    }
    if (kind === 'beacon') {
      const pulse = 0.25 + 0.1 * Math.sin(this.time * 3);
      ctx.fillStyle = `rgba(200,240,255,${pulse})`;
      ctx.fillRect(s.x + bs * 0.25, -50, bs * 0.5, s.y + 50);
      ctx.fillStyle = `rgba(255,255,255,${pulse + 0.2})`;
      ctx.fillRect(s.x + bs * 0.4, -50, bs * 0.2, s.y + 50);
      return;
    }
    const img = this.props[kind];
    if (!img) return;
    const ih = (img.height / 16) * bs;
    ctx.drawImage(img, s.x, s.y + h * bs - ih, (img.width / 16) * bs, ih);
    if (kind === 'enchant') {
      // floating glyphs
      ctx.fillStyle = 'rgba(190,150,255,0.8)';
      for (let i = 0; i < 4; i++) {
        const a = this.time * 0.8 + i * 1.6;
        ctx.fillRect(s.x + bs / 2 + Math.cos(a) * bs * 0.9, s.y - bs * 0.2 + Math.sin(a * 1.3) * bs * 0.3, 3, 3);
      }
    }
  }

  drawPlayer() {
    const { ctx, block: bs, skin } = this;
    const px = bs * (PH / 32); // one skin pixel
    const s = this.worldToScreen(this.px, this.py);
    const f = this.facing;
    const moving = Math.abs(this.vx) > 0.1;
    const swing = Math.sin(this.walkPhase) * (moving ? 0.55 : 0);
    const bob = moving ? Math.abs(Math.sin(this.walkPhase)) * px * 0.8 : 0;
    const mineSwing = this.mining ? -1.4 + Math.sin(this.mining.t * 28) * 0.7 : 0;
    const shade = (x: number, y: number, w: number, h: number, a: number) => {
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(x, y, w, h);
    };
    // limb drawn from a pivot at its top centre
    const limb = (sx: number, sy: number, dx: number, dy: number, angle: number, dark = 0, overlay?: [number, number]) => {
      ctx.save();
      ctx.translate(dx * px, dy * px);
      ctx.rotate(angle);
      ctx.drawImage(skin, sx, sy, 4, 12, -2 * px, 0, 4 * px, 12 * px);
      if (overlay) ctx.drawImage(skin, overlay[0], overlay[1], 4, 12, -2 * px, 0, 4 * px, 12 * px);
      if (dark) shade(-2 * px, 0, 4 * px, 12 * px, dark);
      ctx.restore();
    };

    ctx.save();
    ctx.translate(Math.round(s.x), Math.round(s.y - bob));
    // soft shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-5 * px, bob - px * 0.6, 10 * px, px * 0.8);
    // legs (front view), stride shown as rotation
    limb(4, 20, -2, -12, swing * 0.6, swing > 0 ? 0.12 : 0);
    limb(20, 52, 2, -12, -swing * 0.6, swing < 0 ? 0.12 : 0);
    // body
    ctx.drawImage(skin, 20, 20, 8, 12, -4 * px, -24 * px, 8 * px, 12 * px);
    // arms
    limb(44, 20, -6, -24, f > 0 ? -swing * 0.5 : (this.mining ? -mineSwing : -swing * 0.5));
    limb(36, 52, 6, -24, f > 0 ? (this.mining ? mineSwing * -1 : swing * 0.5) : swing * 0.5);
    // head: front face, nudged toward the walking direction
    const look = this.hoverWorld ? Math.max(-0.12, Math.min(0.12, (this.hoverWorld.x - this.px) * 0.02)) : 0;
    ctx.save();
    ctx.translate(f * px * 0.5, -24 * px);
    ctx.rotate(look);
    ctx.drawImage(skin, 8, 8, 8, 8, -4 * px, -8 * px, 8 * px, 8 * px);
    ctx.drawImage(skin, 40, 8, 8, 8, -4.25 * px, -8.25 * px, 8.5 * px, 8.5 * px);
    ctx.restore();
    ctx.restore();

    // name tag (hidden next to signs/buildings so it never covers their labels)
    if (!this.near) this.nameTag('Muhammad', s.x, s.y - (PH + 0.45) * bs, 0.8);
  }

  nameTag(text: string, x: number, y: number, scale = 1, sub?: string, color?: string) {
    const { ctx, block: bs } = this;
    const fs = Math.max(11, Math.round(bs * 0.34 * scale));
    ctx.font = `${fs}px "Monocraft", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + fs * 0.8;
    let h = fs * 1.4;
    let sw = 0;
    let sfs = 0;
    if (sub) {
      sfs = Math.max(10, Math.round(fs * 0.72));
      ctx.font = `${sfs}px "Monocraft", monospace`;
      sw = ctx.measureText(sub).width + fs * 0.8;
      h += sfs * 1.2;
    }
    const bw = Math.max(w, sw);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(Math.round(x - bw / 2), Math.round(y - fs * 0.7), Math.round(bw), Math.round(h));
    ctx.font = `${fs}px "Monocraft", monospace`;
    ctx.fillStyle = color ?? '#ffffff';
    ctx.fillText(text, x, y);
    if (sub) {
      ctx.font = `${sfs}px "Monocraft", monospace`;
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(sub, x, y + fs * 0.65 + sfs * 0.55);
    }
  }

  drawLabels() {
    const near = this.mode === 'play' ? this.near : null;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
    for (const l of this.world.labels) {
      const s = this.worldToScreen(l.x, l.y);
      if (s.x < -300 || s.x > this.cssW + 300 || s.y > this.cssH + 50) continue;
      const active = !!near && l.x >= near.x - 0.5 && l.x <= near.x + near.w + 0.5;
      // keep tall-building labels on screen
      this.nameTag(l.text, s.x, Math.max(s.y, l.sub ? 84 : 76), l.sub ? 1 : 0.85, l.sub, active ? `rgb(255,${230 + pulse * 25},${60 + pulse * 60})` : undefined);
    }
  }

  drawLight(n: number) {
    const lc = this.lightCanvas;
    const l = lc.getContext('2d')!;
    const scale = lc.width / this.cssW;
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, lc.width, lc.height);
    l.fillStyle = `rgba(4,8,30,${0.5 * n})`;
    l.fillRect(0, 0, lc.width, lc.height);
    l.globalCompositeOperation = 'destination-out';
    const lights = [...this.world.lights, { x: this.px, y: this.py - 1, r: 4.5 }];
    for (const li of lights) {
      const s = this.worldToScreen(li.x, li.y);
      const r = li.r * this.block * scale * (1 + 0.03 * Math.sin(this.time * 6 + li.x));
      const sx = s.x * scale;
      const sy = s.y * scale;
      if (sx < -r || sx > lc.width + r || sy < -r || sy > lc.height + r) continue;
      const g = l.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g;
      l.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(lc, 0, 0, this.cssW, this.cssH);
    this.ctx.imageSmoothingEnabled = false;
    // warm glow
    this.ctx.globalCompositeOperation = 'lighter';
    for (const li of this.world.lights) {
      const s = this.worldToScreen(li.x, li.y);
      const r = li.r * this.block * 0.6;
      if (s.x < -r || s.x > this.cssW + r) continue;
      const g = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      g.addColorStop(0, `rgba(255,170,60,${0.18 * n})`);
      g.addColorStop(1, 'rgba(255,170,60,0)');
      this.ctx.fillStyle = g;
      this.ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
    }
    this.ctx.globalCompositeOperation = 'source-over';
  }
}
