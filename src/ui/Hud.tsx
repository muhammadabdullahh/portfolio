import { useEffect, useState } from 'react';
import { engine, travel } from './Game';
import { ACHIEVEMENTS, useStore, type Panel } from '../store';
import { sfx } from '../audio';
import { Icon } from './common';
import { skills } from '../data/profile';
import type { ITEM_MAPS } from '../game/sprites';
import { guestbookEnabled } from '../lib/guestbook';

type Slot = { icon: keyof typeof ITEM_MAPS; label: string; section?: string; panel?: Panel; act?: () => void; tint?: [string, string] };

export const HOTBAR: Slot[] = [
  { icon: 'book', label: 'About me', section: 'spawn', panel: { kind: 'about' } },
  { icon: 'compass', label: 'Experience', section: 'village', panel: { kind: 'job', company: 'dayforce' } },
  { icon: 'pickaxe', label: 'Skills', section: 'quarry', panel: { kind: 'inventory' } },
  { icon: 'map', label: 'Projects', section: 'projects', panel: { kind: 'project', id: 'stf' } },
  { icon: 'scroll', label: 'Education', section: 'library', panel: { kind: 'education' } },
  { icon: 'pearl', label: 'Contact', section: 'contact', panel: { kind: 'contact' } },
  { icon: 'paper', label: 'Resume', panel: { kind: 'resume' } },
  { icon: 'chat', label: guestbookEnabled ? 'Chat & guestbook' : 'Chat commands', act: () => useStore.getState().set({ chatOpen: true }) },
  { icon: 'eye', label: 'Quick view', act: () => useStore.getState().set({ screen: 'classic' }) },
];

export function useHotbar() {
  return (i: number) => {
    const s = HOTBAR[i];
    const st = useStore.getState();
    if (!s) return;
    if (s.section) travel(s.section);
    if (s.panel) {
      sfx.open();
      setTimeout(() => st.open(s.panel!), s.section ? 220 : 0);
    }
    s.act?.();
  };
}

// survive remounts (e.g. returning from the quick view)
let movedEver = false;
let lastSection: string | null = 'Spawn';

export function Hud() {
  const near = useStore((s) => s.near);
  const chatOpen = useStore((s) => s.chatOpen);
  const panel = useStore((s) => s.panel);
  const sectionName = useStore((s) => s.sectionName);
  const ach = useStore((s) => s.achievements);
  const mined = useStore((s) => s.mined);
  const night = useStore((s) => s.night);
  const sound = useStore((s) => s.sound);
  const set = useStore((s) => s.set);
  const open = useStore((s) => s.open);
  const [active, setActive] = useState(0);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [coords, setCoords] = useState({ x: 22, y: 64 });
  const [secKey, setSecKey] = useState(0);
  const press = useHotbar();
  const [moved, setMoved] = useState(movedEver);
  useEffect(() => {
    if (movedEver) return;
    const on = () => {
      movedEver = true;
      setMoved(true);
    };
    window.addEventListener('player-moved', on, { once: true });
    const t = setTimeout(on, 20000);
    return () => {
      window.removeEventListener('player-moved', on);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const on = (e: Event) => {
      const i = (e as CustomEvent<number>).detail;
      setActive(i);
      press(i);
    };
    window.addEventListener('hotbar', on);
    return () => window.removeEventListener('hotbar', on);
  }, [press]);

  useEffect(() => {
    const t = setInterval(() => {
      if (engine) setCoords({ x: Math.floor(engine.px), y: Math.floor(64 - (engine.py - 32)) });
    }, 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sectionName || sectionName === lastSection) return;
    lastSection = sectionName;
    setSecKey((k) => k + 1);
    const idx = ['Spawn', 'Career Village', 'Skill Quarry', 'Builds District', 'The Library', 'Multiplayer Gate'].indexOf(sectionName ?? '');
    if (idx >= 0) setActive(idx);
  }, [sectionName]);

  const progress = (ach.length + mined.length / skills.length) / (ACHIEVEMENTS.length + 1);
  const level = ach.length;
  const label = hoverSlot !== null ? HOTBAR[hoverSlot].label : HOTBAR[active].label;

  const dirBtn = (d: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      if (engine) engine.touchDir = d;
    },
    onPointerUp: () => engine && (engine.touchDir = 0),
    onPointerCancel: () => engine && (engine.touchDir = 0),
  });

  return (
    <div
      className="hud"
      onClick={(e) => {
        // a mouse/touch click (detail > 0) shouldn't leave the button focused; keyboard clicks keep focus
        const b = (e.target as HTMLElement).closest('button');
        if (b && e.detail > 0) b.blur();
      }}
      style={{ ['--slot-size' as string]: 'min(56px, calc((100vw - 28px) / 9))', ['--hotbar-h' as string]: 'min(60px, calc((100vw - 20px) / 9))' }}>
      <div className="hud-top">
        <div className="coords" aria-live="off">
          <div className="xyz">
            XYZ: {coords.x} / {coords.y} / 0
          </div>
          <div>Biome: {sectionName ?? 'Spawn'}</div>
        </div>
        <div className="hud-actions">
          <button className="mc-btn icon-btn" onClick={() => { sfx.click(); set({ night: !night }); if (!night) useStore.getState().unlock('night'); }} aria-label={night ? 'Switch to day' : 'Switch to night'}>
            {night ? 'Day' : 'Night'}
          </button>
          <button className="mc-btn icon-btn" onClick={() => { set({ sound: !sound }); setTimeout(sfx.click, 0); }} aria-label={sound ? 'Mute sound' : 'Turn sound on'} aria-pressed={sound}>
            {sound ? '♪ On' : '♪ Off'}
          </button>
          <button className="mc-btn icon-btn" onClick={() => { sfx.click(); set({ screen: 'classic' }); }}>
            Quick view
          </button>
          <button className="mc-btn icon-btn" onClick={() => { sfx.open(); open({ kind: 'pause' }); }} aria-label="Menu">
            ☰
          </button>
        </div>
      </div>

      {sectionName && secKey > 0 && !panel && (
        <div className="section-title" key={secKey} aria-live="polite">
          <strong>{sectionName}</strong>
        </div>
      )}

      {near && !panel && (
        <button className="prompt" onClick={() => engine?.interact()}>
          <kbd className="kbd-only">Enter</kbd>
          <span>
            Open <strong>{near.label}</strong>
          </span>
        </button>
      )}

      {!moved && !panel && !near && (
        <div className="hint" role="note">
          <span className="kbd-only">
            <kbd>A</kbd> <kbd>D</kbd> walk · click anything · <kbd>1</kbd>–<kbd>9</kbd> jump to a section
          </span>
          <span className="touch-only">Tap the ground to walk · tap buildings to open them</span>
        </div>
      )}

      <div className="touch" aria-hidden="true" style={chatOpen ? { display: 'none' } : undefined}>
        <div>
          <button {...dirBtn(-1)}>◀</button>
          <button {...dirBtn(1)}>▶</button>
        </div>
        <div>
          <button onPointerDown={() => engine?.key('Space', true)} onPointerUp={() => engine?.key('Space', false)}>
            ▲
          </button>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="slot-label" aria-hidden="true">{label}</div>
        <div className="xp" title={`Level ${level}: ${ach.length} of ${ACHIEVEMENTS.length} advancements`}>
          <i style={{ width: `${Math.round(progress * 100)}%` }} />
          {level > 0 && <b>{level}</b>}
        </div>
        <nav className="hotbar" aria-label="Hotbar: fast travel">
          {HOTBAR.map((s, i) => (
            <button
              key={s.label}
              className={'slot-btn' + (i === active ? ' active' : '')}
              aria-label={`${i + 1}: ${s.label}`}
              onClick={() => {
                setActive(i);
                press(i);
              }}
              onMouseEnter={() => setHoverSlot(i)}
              onMouseLeave={() => setHoverSlot(null)}
              onFocus={() => setHoverSlot(i)}
              onBlur={() => setHoverSlot(null)}
            >
              <span className="num kbd-only">{i + 1}</span>
              <Icon name={s.icon} tint={s.tint} />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
