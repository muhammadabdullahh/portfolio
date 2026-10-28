// Tiny synthesized sound effects (no audio files).
import { useStore } from './store';

let ac: AudioContext | null = null;
function ctx() {
  if (!useStore.getState().sound) return null;
  try {
    ac ??= new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.05, delay = 0, slide = 0) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.08, hp = 800) {
  const a = ctx();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  click: () => tone(520, 0.06, 'square', 0.035),
  open: () => {
    tone(330, 0.08, 'triangle', 0.06);
    tone(440, 0.1, 'triangle', 0.05, 0.05);
  },
  close: () => tone(300, 0.07, 'triangle', 0.05, 0, -80),
  pop: () => tone(700, 0.08, 'sine', 0.08, 0, 500),
  hit: () => noise(0.06, 0.05, 1500),
  breakBlock: () => noise(0.18, 0.12, 500),
  squish: () => {
    noise(0.1, 0.08, 300);
    tone(180, 0.12, 'sawtooth', 0.04, 0, -100);
  },
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, i * 0.08)),
  whoosh: () => {
    noise(0.35, 0.05, 1200);
    tone(200, 0.35, 'sine', 0.05, 0, 600);
  },
};
