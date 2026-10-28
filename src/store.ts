import { create } from 'zustand';
import type { Outfit } from './game/skin';
import type { Action, Interactable } from './game/world';

export type Panel =
  | { kind: 'about' }
  | { kind: 'resume' }
  | { kind: 'job'; company: 'dayforce' | 'tmu' | 'opg' }
  | { kind: 'project'; id: string }
  | { kind: 'repos' }
  | { kind: 'education' }
  | { kind: 'contact' }
  | { kind: 'inventory' }
  | { kind: 'pause' }
  | { kind: 'home' }
  | null;

export const ACHIEVEMENTS = [
  { id: 'hello', name: 'Hello World', desc: 'Step into the world' },
  { id: 'book', name: 'Bookworm', desc: 'Read the About book' },
  { id: 'inventory', name: 'Taking Inventory', desc: 'Open your inventory' },
  { id: 'career', name: 'Career Path', desc: 'Visit all three workplaces' },
  { id: 'firstore', name: 'Diamonds!', desc: 'Mine your first skill' },
  { id: 'fullstack', name: 'Full Stack', desc: 'Mine every skill in the quarry' },
  { id: 'bug', name: 'Exterminator', desc: 'Squash a bug' },
  { id: 'shipit', name: 'Ship It', desc: 'Open a live project' },
  { id: 'scholar', name: 'Enchanted', desc: 'Use the enchanting table' },
  { id: 'edge', name: 'Explorer', desc: 'Reach the Multiplayer gate' },
  { id: 'resume', name: 'Paper Trail', desc: 'Open the resume' },
  { id: 'night', name: 'Night Owl', desc: 'Switch to night' },
  { id: 'cli', name: 'Command Line Hero', desc: 'Run a chat command' },
  { id: 'drip', name: 'Change of Clothes', desc: 'Try a different outfit' },
] as const;
export type AchId = (typeof ACHIEVEMENTS)[number]['id'];

type Persist = {
  mined: string[];
  achievements: AchId[];
  visitedJobs: string[];
  outfit: Outfit;
  sound: boolean;
  bugs: number;
  seenTutorial: boolean;
};

const KEY = 'ma-portfolio-v1';
function load(): Partial<Persist> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
function save(p: Persist) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

const hour = new Date().getHours();
const saved = load();

type State = Persist & {
  screen: 'title' | 'play' | 'classic';
  panel: Panel;
  night: boolean;
  near: Interactable | null;
  toasts: { id: number; title: string; body: string; kind: 'ach' | 'info' }[];
  chatOpen: boolean;
  sectionName: string | null;
  setScreen: (s: State['screen']) => void;
  open: (p: Panel) => void;
  close: () => void;
  unlock: (id: AchId) => void;
  mine: (skillId: string) => boolean;
  resetOres: () => void;
  toast: (title: string, body: string, kind?: 'ach' | 'info', ms?: number) => void;
  set: (p: Partial<State>) => void;
  visitJob: (c: string) => void;
};

export const useStore = create<State>((setState, get) => {
  const persist = () => {
    const s = get();
    save({ mined: s.mined, achievements: s.achievements, visitedJobs: s.visitedJobs, outfit: s.outfit, sound: s.sound, bugs: s.bugs, seenTutorial: s.seenTutorial });
  };
  let tid = 0;
  return {
    mined: saved.mined ?? [],
    achievements: saved.achievements ?? [],
    visitedJobs: saved.visitedJobs ?? [],
    outfit: saved.outfit ?? 'suit',
    sound: saved.sound ?? true,
    bugs: saved.bugs ?? 0,
    seenTutorial: saved.seenTutorial ?? false,
    screen: 'title',
    panel: null,
    night: hour >= 19 || hour < 7,
    near: null,
    toasts: [],
    chatOpen: false,
    sectionName: null,
    setScreen: (screen) => setState({ screen }),
    open: (panel) => setState({ panel }),
    close: () => setState({ panel: null }),
    unlock: (id) => {
      if (get().achievements.includes(id)) return;
      setState({ achievements: [...get().achievements, id] });
      persist();
      const a = ACHIEVEMENTS.find((a) => a.id === id)!;
      get().toast('Advancement made!', a.name, 'ach');
    },
    mine: (skillId) => {
      if (get().mined.includes(skillId)) return false;
      setState({ mined: [...get().mined, skillId] });
      persist();
      return true;
    },
    resetOres: () => {
      setState({ mined: [] });
      persist();
    },
    toast: (title, body, kind = 'info', ms = 3800) => {
      const id = ++tid;
      setState({ toasts: [...get().toasts, { id, title, body, kind }].slice(-2) });
      setTimeout(() => setState({ toasts: get().toasts.filter((t) => t.id !== id) }), ms);
    },
    set: (p) => {
      setState(p);
      if ('outfit' in p || 'sound' in p || 'bugs' in p || 'seenTutorial' in p) persist();
    },
    visitJob: (c) => {
      if (get().visitedJobs.includes(c)) return;
      setState({ visitedJobs: [...get().visitedJobs, c] });
      persist();
    },
  };
});

export function panelFor(a: Action): Panel {
  switch (a) {
    case 'about':
      return { kind: 'about' };
    case 'resume':
      return { kind: 'resume' };
    case 'job:dayforce':
      return { kind: 'job', company: 'dayforce' };
    case 'job:tmu':
      return { kind: 'job', company: 'tmu' };
    case 'job:opg':
      return { kind: 'job', company: 'opg' };
    case 'project:stf':
      return { kind: 'project', id: 'stf' };
    case 'project:nearmoi':
      return { kind: 'project', id: 'nearmoi' };
    case 'project:zenny':
      return { kind: 'project', id: 'zenny' };
    case 'repos':
      return { kind: 'repos' };
    case 'education':
      return { kind: 'education' };
    case 'contact':
      return { kind: 'contact' };
    case 'skills':
      return { kind: 'inventory' };
    case 'home':
      return { kind: 'home' };
    case 'guestbook':
      return null;
  }
}
