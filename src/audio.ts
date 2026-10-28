// Synthesized sound effects (original, no game audio files).
// Tuned to evoke block-game feel: soft UI ticks, gritty stone breaks, pitch-varied XP dings,
// surface-aware footsteps and a wooden creak for chests.
import { useStore } from './store';

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function ctx() {
  if (!useStore.getState().sound) return null;
  try {
    if (!ac) {
      ac = new AudioContext();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(comp).connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

const vary = (x: number, amt = 0.12) => x * (1 - amt + Math.random() * amt * 2);

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number, attack = 0.004) {
  const a = ctx();
  if (!a || !master) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

/** Filtered noise burst. type: lowpass/bandpass/highpass at freq. */
function noise(dur: number, vol: number, filter: BiquadFilterType, freq: number, q = 1, delay = 0, decay = 1) {
  const a = ctx();
  if (!a || !master || !noiseBuf) return;
  const t = a.currentTime + delay;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = vary(1, 0.2);
  const f = a.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur * decay);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

export type Surface = 'grass' | 'stone' | 'wood' | 'sand';

export const sfx = {
  /** UI button: short soft tick with a tiny low thump */
  click: () => {
    noise(0.035, 0.22, 'bandpass', 2600, 1.4);
    tone(180, 0.05, 'sine', 0.12);
  },
  /** chest / panel open: wooden creak */
  open: () => {
    const a = ctx();
    if (!a) return;
    tone(vary(95, 0.05), 0.28, 'sawtooth', 0.035, 0, vary(70, 0.05), 0.03);
    tone(vary(140, 0.05), 0.22, 'square', 0.02, 0.02, 110, 0.03);
    noise(0.25, 0.08, 'bandpass', 700, 3);
    noise(0.06, 0.18, 'lowpass', 400, 1, 0.22);
  },
  /** panel close: low wooden thunk */
  close: () => {
    noise(0.08, 0.22, 'lowpass', 500, 1);
    tone(110, 0.09, 'sine', 0.16, 0, 70);
  },
  /** item pickup pop */
  pop: () => tone(vary(500), 0.09, 'sine', 0.18, 0, vary(1100), 0.002),
  /** XP orb: bright ding with random pitch, like collecting several orbs */
  xp: () => {
    const f = vary(1250, 0.25);
    tone(f, 0.18, 'sine', 0.09);
    tone(f * 2.01, 0.12, 'sine', 0.03);
  },
  /** pickaxe hitting stone */
  hit: () => {
    noise(0.07, 0.28, 'bandpass', vary(1800, 0.2), 1.2);
    tone(vary(220), 0.04, 'triangle', 0.06);
  },
  /** stone block breaking: gritty multi-grain crunch */
  breakBlock: () => {
    for (let i = 0; i < 5; i++) noise(0.09, 0.3 - i * 0.04, 'bandpass', vary(1300, 0.35), 0.9, i * 0.025);
    noise(0.22, 0.22, 'lowpass', 600, 0.7);
  },
  step: (s: Surface) => {
    if (s === 'stone') noise(0.06, 0.11, 'bandpass', vary(1600, 0.2), 1.5);
    else if (s === 'wood') {
      noise(0.07, 0.1, 'lowpass', 700, 1);
      tone(vary(160), 0.06, 'sine', 0.05);
    } else if (s === 'sand') noise(0.09, 0.08, 'highpass', 2500, 0.7);
    else noise(0.08, 0.09, 'bandpass', vary(900, 0.25), 0.8); // grass
  },
  squish: () => {
    noise(0.12, 0.2, 'lowpass', 900, 2);
    tone(vary(260), 0.14, 'sine', 0.1, 0, 90);
  },
  /** level up / advancement: rising bright chime */
  levelUp: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.32, 'triangle', 0.07, i * 0.07, undefined, 0.01));
    tone(2093, 0.5, 'sine', 0.025, 0.35);
  },
  /** teleport: portal whoosh */
  whoosh: () => {
    noise(0.45, 0.14, 'bandpass', 900, 0.6);
    tone(180, 0.45, 'sine', 0.06, 0, 720, 0.05);
    tone(270, 0.4, 'triangle', 0.03, 0.05, 900, 0.05);
  },
};
