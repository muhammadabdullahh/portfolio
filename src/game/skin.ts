// Procedurally painted 64x64 player skin modelled on Muhammad:
// voluminous curly black hair, thin glasses, full beard, medium-brown skin.
// Two outfits: the black double-breasted suit from his convocation photo, and a casual hoodie.

export type Outfit = 'suit' | 'hoodie';

const P: Record<string, string> = {
  H: '#15100d', // hair
  h: '#2a1e18', // hair highlight
  S: '#9a6648', // skin
  s: '#80523a', // skin shadow
  d: '#6c4330', // skin deep shadow
  B: '#1a1310', // beard
  b: '#2a1d16', // beard highlight
  G: '#3a3a40', // glasses frame
  g: '#b9c4c9', // glasses rim (silver)
  W: '#f1efe9', // eye white
  E: '#2b1a12', // iris
  M: '#5a2f24', // lips
  J: '#16161b', // suit jacket
  j: '#24242b', // suit highlight
  k: '#0d0d10', // suit shadow
  w: '#e9ebef', // shirt
  v: '#c9ccd3', // shirt shadow
  T: '#0a0a0c', // tie
  t: '#2a2a30', // tie highlight
  n: '#3a3a42', // button
  p: '#121218', // trousers
  q: '#1c1c24', // trousers highlight
  o: '#060607', // shoes
  O: '#1f1f22', // shoe highlight
  // hoodie
  C: '#2f5d50',
  c: '#244a40',
  x: '#3b7364',
  y: '#e7e2d6', // drawstring
  Q: '#30486e', // jeans
  R: '#263a5a',
  Z: '#f2f2f2', // sneaker
  z: '#c8c8c8',
};

type Ctx = CanvasRenderingContext2D;

function paint(ctx: Ctx, x0: number, y0: number, rows: string[]) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      ctx.fillStyle = P[ch];
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    });
  });
}

function fill(ctx: Ctx, x0: number, y0: number, w: number, h: number, ch: string) {
  ctx.fillStyle = P[ch];
  ctx.fillRect(x0, y0, w, h);
}

const HEAD = {
  top: ['HhHHHhHH', 'HHHhHHHh', 'hHHHHHhH', 'HHhHHHHH', 'HHHHhHHH', 'HhHHHHHh', 'HHHhHHHH', 'hHHHHHhH'],
  bottom: ['BBBBBBBB', 'BBBBBBBB', 'BbBBBBbB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB'],
  front: ['HhHHHHhH', 'HHHhHHHH', 'hHSSSSHh', 'SGGSSGGS', 'GWEGGEWG', 'SSSssSSS', 'SBBBBBBs', 'BBBMMBBB'],
  right: ['HHhHHHHH', 'HHHHHhHH', 'HHHHHHSS', 'HHHGGGGG', 'HHHSsSSS', 'HHHSSSSS', 'BBBBBBBS', 'BBBBBBBB'],
  left: ['HHHHHhHH', 'HHhHHHHH', 'SSHHHHHH', 'GGGGGHHH', 'SSSsSHHH', 'SSSSSHHH', 'SBBBBBBB', 'BBBBBBBB'],
  back: ['HhHHHHhH', 'HHHHhHHH', 'HHhHHHHH', 'HHHHHHhH', 'hHHHHHHH', 'HHHhHHHH', 'HHHHHHHH', 'sHHHHHHs'],
};

function paintHead(ctx: Ctx) {
  paint(ctx, 8, 0, HEAD.top);
  paint(ctx, 16, 0, HEAD.bottom);
  paint(ctx, 0, 8, HEAD.right);
  paint(ctx, 8, 8, HEAD.front);
  paint(ctx, 16, 8, HEAD.left);
  paint(ctx, 24, 8, HEAD.back);
  // hat layer: extra curly volume on top and sides
  paint(ctx, 40, 0, ['h.H..H.h', '.H.hH.H.', 'H.H..H.H', '.h.HH.h.', 'H..h..H.', '.H.H.h.H', 'h.H..H..', '.H.hH.Hh']);
  paint(ctx, 40, 8, ['.hH.Hh.H', 'H.......', '........', '........', '........', '........', '........', '........']);
  paint(ctx, 32, 8, ['hH.HHh.H', 'H.hH....', 'H.......', '........', '........', '........', '........', '........']);
  paint(ctx, 48, 8, ['H.hHH.Hh', '....Hh.H', '.......H', '........', '........', '........', '........', '........']);
  paint(ctx, 56, 8, ['Hh.HH.hH', 'H.hH.H.H', '.H..h.H.', '........', '........', '........', '........', '........']);
}

function suitBody(ctx: Ctx) {
  // body: top(20,16) bottom(28,16) right(16,20) front(20,20) left(28,20) back(32,20)
  fill(ctx, 20, 16, 8, 4, 'J');
  paint(ctx, 22, 16, ['wwww', 'wTTw']);
  fill(ctx, 28, 16, 8, 4, 'p');
  paint(ctx, 20, 20, [
    'jJwTTwJk',
    'JjwTTwJJ',
    'JJjTTjJJ',
    'JJJTTJJJ',
    'JJJjTJnJ',
    'JnJJjJJJ',
    'JJJJJJnJ',
    'JnJJJJJJ',
    'JJJJJJJJ',
    'kJJJJJJk',
    'kkkkkkkk',
    'kJJJJJJk',
  ]);
  fill(ctx, 16, 20, 4, 12, 'J');
  fill(ctx, 16, 30, 4, 1, 'k');
  fill(ctx, 28, 20, 4, 12, 'J');
  fill(ctx, 28, 30, 4, 1, 'k');
  fill(ctx, 32, 20, 8, 12, 'J');
  paint(ctx, 32, 20, ['jJJJJJJj', '.jJJJJj.']);
  fill(ctx, 32, 30, 8, 1, 'k');
  // arms (classic 4px) right: top(44,16) bottom(48,16) faces at y20: right40 front44 left48 back52
  const arm = (x0: number, y0: number, tx: number, ty: number) => {
    fill(ctx, tx, ty, 4, 4, 'J');
    fill(ctx, tx + 4, ty, 4, 4, 'S');
    for (let f = 0; f < 4; f++) {
      const fx = x0 + f * 4;
      fill(ctx, fx, y0, 4, 9, f === 1 ? 'J' : 'J');
      fill(ctx, fx, y0, 4, 1, 'j');
      fill(ctx, fx, y0 + 9, 4, 1, 'w');
      fill(ctx, fx, y0 + 10, 4, 2, 'S');
      fill(ctx, fx, y0 + 11, 4, 1, 's');
    }
  };
  arm(40, 20, 44, 16);
  arm(32, 52, 36, 48);
  // legs right: top(4,16) bottom(8,16) faces y20: right0 front4 left8 back12
  const leg = (x0: number, y0: number, tx: number, ty: number) => {
    fill(ctx, tx, ty, 4, 4, 'p');
    fill(ctx, tx + 4, ty, 4, 4, 'o');
    for (let f = 0; f < 4; f++) {
      const fx = x0 + f * 4;
      fill(ctx, fx, y0, 4, 10, 'p');
      fill(ctx, fx + (f === 1 ? 3 : 0), y0, 1, 10, 'q');
      fill(ctx, fx, y0 + 10, 4, 2, 'o');
      fill(ctx, fx, y0 + 10, 4, 1, 'O');
    }
  };
  leg(0, 20, 4, 16);
  leg(16, 52, 20, 48);
}

function hoodieBody(ctx: Ctx) {
  fill(ctx, 20, 16, 8, 4, 'C');
  fill(ctx, 28, 16, 8, 4, 'Q');
  paint(ctx, 20, 20, [
    'xCCSSCCx',
    'CCcSScCC',
    'CCCcCCCC',
    'CCyCCyCC',
    'CCyCCyCC',
    'CCCCCCCC',
    'CCCCCCCC',
    'CcxxxxcC',
    'CcCCCCcC',
    'CccccccC',
    'cCCCCCCc',
    'cccccccc',
  ]);
  fill(ctx, 16, 20, 4, 12, 'C');
  fill(ctx, 28, 20, 4, 12, 'C');
  fill(ctx, 32, 20, 8, 12, 'C');
  paint(ctx, 32, 20, ['cxxxxxxc', 'ccxxxxcc', '.cccccc.']);
  fill(ctx, 32, 31, 8, 1, 'c');
  const arm = (x0: number, y0: number, tx: number, ty: number) => {
    fill(ctx, tx, ty, 4, 4, 'C');
    fill(ctx, tx + 4, ty, 4, 4, 'S');
    for (let f = 0; f < 4; f++) {
      const fx = x0 + f * 4;
      fill(ctx, fx, y0, 4, 9, 'C');
      fill(ctx, fx, y0 + 8, 4, 1, 'c');
      fill(ctx, fx, y0 + 9, 4, 3, 'S');
      fill(ctx, fx, y0 + 11, 4, 1, 's');
    }
  };
  arm(40, 20, 44, 16);
  arm(32, 52, 36, 48);
  const leg = (x0: number, y0: number, tx: number, ty: number) => {
    fill(ctx, tx, ty, 4, 4, 'Q');
    fill(ctx, tx + 4, ty, 4, 4, 'z');
    for (let f = 0; f < 4; f++) {
      const fx = x0 + f * 4;
      fill(ctx, fx, y0, 4, 10, 'Q');
      fill(ctx, fx + 1, y0 + 3, 1, 1, 'R');
      fill(ctx, fx + 2, y0 + 7, 1, 1, 'R');
      fill(ctx, fx, y0 + 10, 4, 2, 'Z');
      fill(ctx, fx, y0 + 11, 4, 1, 'z');
    }
  };
  leg(0, 20, 4, 16);
  leg(16, 52, 20, 48);
}

const cache = new Map<Outfit, HTMLCanvasElement>();

export function makeSkin(outfit: Outfit): HTMLCanvasElement {
  const hit = cache.get(outfit);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  paintHead(ctx);
  if (outfit === 'suit') suitBody(ctx);
  else hoodieBody(ctx);
  cache.set(outfit, c);
  return c;
}

// Face crop (front + hat layer) for UI avatars.
export function makeFace(outfit: Outfit, size = 64): HTMLCanvasElement {
  const skin = makeSkin(outfit);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(skin, 8, 8, 8, 8, 0, 0, size, size);
  ctx.drawImage(skin, 40, 8, 8, 8, 0, 0, size, size);
  return c;
}
