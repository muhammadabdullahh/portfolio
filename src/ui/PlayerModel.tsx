import { useEffect, useRef } from 'react';
import type { SkinViewer } from 'skinview3d';
import { makeSkin, type Outfit } from '../game/skin';

/** Draggable 3D model of Muhammad's character (skinview3d is lazy-loaded so the first paint stays fast). */
export function PlayerModel({ outfit, anim = 'idle', className }: { outfit: Outfit; anim?: 'idle' | 'wave' | 'walk'; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const viewer = useRef<SkinViewer | null>(null);

  useEffect(() => {
    let disposed = false;
    const el = wrap.current!;
    let ro: ResizeObserver | null = null;
    void import('skinview3d').then((sv) => {
      if (disposed) return;
      const canvas = document.createElement('canvas');
      el.appendChild(canvas);
      const r = el.getBoundingClientRect();
      const v = new sv.SkinViewer({ canvas, width: r.width, height: r.height, skin: makeSkin(outfit), zoom: 0.82, fov: 50 });
      v.controls.enableZoom = false;
      v.controls.enablePan = false;
      v.playerObject.rotation.y = 0.45;
      v.animation = anim === 'walk' ? new sv.WalkingAnimation() : anim === 'wave' ? new sv.WaveAnimation() : new sv.IdleAnimation();
      if (v.animation) v.animation.speed = anim === 'walk' ? 0.6 : 1;
      viewer.current = v;
      ro = new ResizeObserver(() => {
        const b = el.getBoundingClientRect();
        if (b.width && b.height) v.setSize(b.width, b.height);
      });
      ro.observe(el);
    });
    return () => {
      disposed = true;
      ro?.disconnect();
      viewer.current?.dispose();
      viewer.current = null;
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim]);

  useEffect(() => {
    viewer.current?.loadSkin(makeSkin(outfit));
  }, [outfit]);

  return <div ref={wrap} className={'player-model ' + (className ?? '')} aria-label="3D model of Muhammad's character. Drag to rotate." role="img" />;
}
