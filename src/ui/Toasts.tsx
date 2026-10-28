import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { sfx } from '../audio';
import { Icon } from './common';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const seen = useRef(0);
  useEffect(() => {
    const last = toasts[toasts.length - 1];
    if (last && last.id > seen.current) {
      seen.current = last.id;
      if (last.kind === 'ach') sfx.levelUp();
      else sfx.pop();
    }
  }, [toasts]);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + t.kind}>
          <Icon name={t.kind === 'ach' ? 'compass' : 'gem'} />
          <div>
            <b>{t.title}</b>
            <span>{t.body}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
