import { useStore } from '../store';
import { Icon } from './common';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
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
