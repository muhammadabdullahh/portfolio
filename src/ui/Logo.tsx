import { useEffect, useRef } from 'react';
import { hash2 } from '../game/rng';

const LINES = ['MUHAMMAD', 'ABDULLAH'];

/** Stone block-letter wordmark: pixel font as a mask, filled with stone texture and extruded. */
export function Logo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      const c = ref.current!;
      const W = 760;
      const depth = 10;
      // pick the largest size where the longer line fits, with real letter spacing (no squashing)
      const probe = document.createElement('canvas').getContext('2d')!;
      let fs = 132;
      const fit = (size: number) => {
        probe.font = `700 ${size}px "Monocraft", monospace`;
        (probe as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(size * 0.1)}px`;
        return Math.max(...LINES.map((t) => probe.measureText(t).width));
      };
      while (fs > 40 && fit(fs) > W - depth - 16) fs -= 2;
      const H = Math.round(fs * 2.05 + depth + 8);
      c.width = W;
      c.height = H;
      const g = c.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      // 1) text mask
      const mask = document.createElement('canvas');
      mask.width = W;
      mask.height = H;
      const m = mask.getContext('2d')! as CanvasRenderingContext2D & { letterSpacing: string };
      m.font = `700 ${fs}px "Monocraft", monospace`;
      m.letterSpacing = `${Math.round(fs * 0.1)}px`;
      m.textAlign = 'center';
      m.textBaseline = 'top';
      m.fillStyle = '#fff';
      LINES.forEach((t, i) => m.fillText(t, (W - depth) / 2 + Math.round(fs * 0.05), 4 + i * fs * 1.02));
      // 2) extrusion
      for (let d = depth; d > 0; d--) {
        const shade = document.createElement('canvas');
        shade.width = W;
        shade.height = H;
        const sg = shade.getContext('2d')!;
        sg.drawImage(mask, 0, 0);
        sg.globalCompositeOperation = 'source-in';
        sg.fillStyle = d === depth ? '#141414' : `rgb(${40 + d},${40 + d},${44 + d})`;
        sg.fillRect(0, 0, W, H);
        g.drawImage(shade, d, d);
      }
      // 3) stone face
      const face = document.createElement('canvas');
      face.width = W;
      face.height = H;
      const f = face.getContext('2d')!;
      const px = 5;
      for (let y = 0; y < H; y += px)
        for (let x = 0; x < W; x += px) {
          const n = hash2(x / px, y / px, 21);
          const v = 168 + Math.floor(n * 48) - Math.floor((y % Math.round(fs * 1.02)) / 6);
          f.fillStyle = `rgb(${v},${v},${v + 2})`;
          f.fillRect(x, y, px, px);
        }
      f.globalCompositeOperation = 'destination-in';
      f.drawImage(mask, 0, 0);
      g.drawImage(face, 0, 0);
      // 4) top highlight
      const hi = document.createElement('canvas');
      hi.width = W;
      hi.height = H;
      const h = hi.getContext('2d')!;
      h.drawImage(mask, 0, 0);
      h.globalCompositeOperation = 'destination-out';
      h.drawImage(mask, 0, 3);
      h.globalCompositeOperation = 'source-in';
      h.fillStyle = 'rgba(255,255,255,0.7)';
      h.fillRect(0, 0, W, H);
      g.drawImage(hi, 0, 0);
    };
    void document.fonts.load('700 120px "Monocraft"').then(draw, draw);
    return () => {
      cancelled = true;
    };
  }, []);
  return <canvas ref={ref} role="img" aria-label="Muhammad Abdullah" />;
}
