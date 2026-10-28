import { useEffect, useRef } from 'react';
import { hash2 } from '../game/rng';

const FONT: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
};

const LINES = ['MUHAMMAD', 'ABDULLAH'];

/** Chunky stone block-letter wordmark, drawn pixel by pixel (no fonts or external art). */
export function Logo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const cell = 12; // each letter pixel is a 12x12 "block"
    const depth = 4; // extrusion in cells... drawn in px multiples
    const cols = 8 * 5 + 7;
    const rows = 7 * 2 + 2;
    c.width = cols * cell + depth * 3;
    c.height = rows * cell + depth * 3;
    const g = c.getContext('2d')!;
    const cellsAt: [number, number][] = [];
    LINES.forEach((word, li) =>
      [...word].forEach((ch, i) => {
        FONT[ch].forEach((row, y) =>
          [...row].forEach((v, x) => {
            if (v === '#') cellsAt.push([i * 6 + x, li * 9 + y]);
          }),
        );
      }),
    );
    // extrusion
    for (let d = depth * 3; d > 0; d -= 1) {
      for (const [x, y] of cellsAt) {
        g.fillStyle = d === depth * 3 ? '#1a1a1a' : '#2e2e2e';
        g.fillRect(x * cell + d, y * cell + d, cell, cell);
      }
    }
    // faces with stone noise
    for (const [x, y] of cellsAt) {
      for (let py = 0; py < 4; py++)
        for (let px = 0; px < 4; px++) {
          const n = hash2(x * 4 + px, y * 4 + py, 21);
          const v = 150 + Math.floor(n * 50) - (y % 9) * 6;
          g.fillStyle = `rgb(${v},${v},${v})`;
          g.fillRect(x * cell + px * 3, y * cell + py * 3, 3, 3);
        }
      // bevel
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(x * cell, y * cell, cell, 2);
      g.fillRect(x * cell, y * cell, 2, cell);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(x * cell, y * cell + cell - 2, cell, 2);
      g.fillRect(x * cell + cell - 2, y * cell, 2, cell);
    }
  }, []);
  return <canvas ref={ref} role="img" aria-label="Muhammad Abdullah" />;
}
