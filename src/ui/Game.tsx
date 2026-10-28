import { useEffect, useRef, useState } from 'react';
import { Engine } from '../game/engine';
import { sections, type Interactable } from '../game/world';
import { panelFor, useStore } from '../store';
import { sfx } from '../audio';
import { skills } from '../data/profile';
import { guestbookEnabled } from '../lib/guestbook';

export let engine: Engine | null = null;

export function openInteractable(i: Interactable) {
  const st = useStore.getState();
  if (i.action === 'guestbook' && guestbookEnabled) {
    st.set({ chatOpen: true });
    sfx.open();
    return;
  }
  const p = i.action === 'guestbook' ? ({ kind: 'contact' } as const) : panelFor(i.action);
  if (!p) return;
  sfx.open();
  st.open(p);
}

export function travel(sectionId: string) {
  const s = sections.find((x) => x.id === sectionId);
  if (!s || !engine) return;
  sfx.whoosh();
  engine.teleport(s.spawnX);
}

type Hover = { label: string; x: number; y: number } | null;

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const screen = useStore((s) => s.screen);
  const panel = useStore((s) => s.panel);
  const chatOpen = useStore((s) => s.chatOpen);

  useEffect(() => {
    const st = useStore.getState();
    let moved = false;
    const e = new Engine(
      canvasRef.current!,
      {
        onSection: (s) => {
          useStore.setState({ sectionName: s.name });
          if (s.id === 'contact') useStore.getState().unlock('edge');
        },
        onNear: (i) => useStore.setState({ near: i }),
        onInteract: (i) => openInteractable(i),
        onMine: (id) => {
          const store = useStore.getState();
          sfx.breakBlock();
          setTimeout(sfx.pop, 120);
          if (store.mine(id)) {
            const sk = skills.find((s) => s.id === id);
            store.toast('Skill collected', sk ? `${sk.name} (${sk.cat})` : id);
            store.unlock('firstore');
            if (useStore.getState().mined.length >= skills.length) {
              store.unlock('fullstack');
              sfx.levelUp();
            }
          }
        },
        onBug: () => {
          const store = useStore.getState();
          sfx.squish();
          store.set({ bugs: store.bugs + 1 });
          store.unlock('bug');
          if (store.bugs + 1 === 1) store.toast('Bug fixed', 'Only 49+ more to match my Dayforce record');
        },
        onHover: (h) => setHover(h),
        onMove: () => {
          if (moved) return;
          moved = true;
          window.dispatchEvent(new Event('player-moved'));
        },
      },
      { outfit: st.outfit, mined: st.mined, night: st.night },
    );
    engine = e;
    (window as unknown as { __engine: Engine }).__engine = e;
    e.start();
    const onResize = () => e.resize();
    window.addEventListener('resize', onResize);
    // keep things in sync with the store
    const unsub = useStore.subscribe((s, prev) => {
      if (s.outfit !== prev.outfit) e.setOutfit(s.outfit);
      if (s.night !== prev.night) e.setNight(s.night);
      if (s.mined.length === 0 && prev.mined.length > 0) e.restoreOres();
    });
    return () => {
      window.removeEventListener('resize', onResize);
      unsub();
      e.stop();
      engine = null;
    };
  }, []);

  useEffect(() => {
    if (!engine) return;
    engine.mode = screen === 'play' ? 'play' : 'title';
    engine.hidden = screen === 'classic';
    engine.resize();
    if (screen === 'play') {
      engine.camX = engine.px - engine.viewW() / 2;
      engine.clampCam();
    }
  }, [screen]);

  // keyboard
  useEffect(() => {
    if (screen !== 'play') return;
    const typing = () => {
      const a = document.activeElement;
      return a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement;
    };
    const down = (ev: KeyboardEvent) => {
      const st = useStore.getState();
      if (typing()) return;
      // let focused buttons and links handle Enter/Space themselves
      const tgt = document.activeElement;
      if ((ev.code === 'Enter' || ev.code === 'Space') && (tgt instanceof HTMLButtonElement || tgt instanceof HTMLAnchorElement)) return;
      if (ev.key === 'Escape') {
        if (st.chatOpen) st.set({ chatOpen: false });
        else if (st.panel) st.close();
        else {
          sfx.open();
          st.open({ kind: 'pause' });
        }
        return;
      }
      if (/^Digit[1-9]$/.test(ev.code)) {
        // hotbar works from anywhere, even with a panel open
        if (st.panel) st.close();
        window.dispatchEvent(new CustomEvent('hotbar', { detail: Number(ev.code.slice(5)) - 1 }));
        return;
      }
      if (st.panel) {
        if (ev.code === 'KeyE' && st.panel.kind === 'inventory') st.close();
        return;
      }
      if (ev.code === 'KeyT' || ev.key === '/') {
        ev.preventDefault();
        st.set({ chatOpen: true });
        return;
      }
      if (ev.code === 'KeyE') {
        sfx.open();
        st.open({ kind: 'inventory' });
        return;
      }
      if (ev.code === 'Enter' || ev.code === 'KeyF') {
        ev.preventDefault(); // stop the same keypress from clicking the panel's first button
        engine?.interact();
        return;
      }
      if (/^Digit[1-9]$/.test(ev.code)) {
        window.dispatchEvent(new CustomEvent('hotbar', { detail: Number(ev.code.slice(5)) - 1 }));
        return;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.code)) ev.preventDefault();
      engine?.key(ev.code, true);
    };
    const up = (ev: KeyboardEvent) => engine?.key(ev.code, false);
    const blur = () => engine?.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [screen]);

  useEffect(() => {
    if (engine) engine.paused = !!panel && panel.kind === 'pause';
    if (panel) engine?.keys.clear();
  }, [panel]);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  let tip: { title: string; sub?: string; cat?: string; color?: string } | null = null;
  if (hover) {
    if (hover.label.startsWith('ore:')) {
      const sk = skills.find((s) => s.id === hover.label.slice(4));
      if (sk) tip = { title: sk.name, cat: sk.cat, sub: 'Click to mine' };
    } else if (hover.label.startsWith('Bug')) tip = { title: 'A bug!', sub: 'Click to squash it' };
    else tip = { title: hover.label, sub: 'Click to open' };
  }

  return (
    <div className="game" aria-hidden={screen !== 'play'} style={screen === 'classic' ? { display: 'none' } : undefined}>
      <canvas
        ref={canvasRef}
        className={hover ? 'pointer' : ''}
        aria-label="Game world. Use the hotbar buttons, or A and D to walk and Enter to interact."
        onPointerDown={(e) => {
          if (screen !== 'play' || chatOpen) {
            if (chatOpen) useStore.getState().set({ chatOpen: false });
            return;
          }
          const p = pos(e);
          const h = engine?.hitTest(p.x, p.y);
          if (h?.kind === 'ore') sfx.hit();
          engine?.click(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (e.pointerType === 'mouse') {
            const p = pos(e);
            engine?.hover(p.x, p.y);
          }
        }}
        onPointerLeave={() => engine?.hover(0, null)}
      />
      {tip && hover && (
        <div className="tooltip" style={{ left: Math.min(hover.x + 16, window.innerWidth - 220), top: hover.y + 16 }}>
          <div>{tip.title}</div>
          {tip.cat && <div className="t-cat" style={{ color: '#55ffff' }}>{tip.cat}</div>}
          {tip.sub && <div className="t-sub">{tip.sub}</div>}
        </div>
      )}
    </div>
  );
}
