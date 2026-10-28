import { useEffect, useRef, type ReactNode } from 'react';
import { makeItemIcon, type ITEM_MAPS } from '../game/sprites';
import { sfx } from '../audio';
import { useStore } from '../store';

export function Icon({ name, tint, className, label }: { name: keyof typeof ITEM_MAPS; tint?: [string, string]; className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const src = makeItemIcon(name, tint);
    c.width = 16;
    c.height = 16;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, 16, 16);
    g.drawImage(src, 0, 0);
  }, [name, tint]);
  return <canvas ref={ref} className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

export function CanvasImg({ src, className, label }: { src: HTMLCanvasElement; className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')!.drawImage(src, 0, 0);
  }, [src]);
  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}

export function Gui({ title, subtitle, children, className, labelledBy }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; className?: string; labelledBy?: string }) {
  const close = useStore((s) => s.close);
  const id = labelledBy ?? 'gui-title';
  return (
    <Overlay labelledBy={id}>
      <section className={'gui ' + (className ?? '')}>
        <header className="gui-head">
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <div className="muted">{subtitle}</div>}
          </div>
          <CloseBtn onClick={close} />
        </header>
        {children}
      </section>
    </Overlay>
  );
}

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="mc-btn x-btn"
      aria-label="Close"
      onClick={() => {
        sfx.close();
        onClick();
      }}
    >
      ✕
    </button>
  );
}

export function Overlay({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  const close = useStore((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>('button, a, input, [tabindex]');
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button, a[href], input, iframe, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.hasAttribute('disabled'));
        if (!f.length) return;
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <div
      className="overlay"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          sfx.close();
          close();
        }
      }}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, href, className, ...rest }: { children: ReactNode; onClick?: () => void; href?: string; className?: string; download?: string | boolean; 'aria-label'?: string }) {
  if (href)
    return (
      <a
        className={'mc-btn ' + (className ?? '')}
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        onClick={() => {
          sfx.click();
          onClick?.();
        }}
        {...rest}
      >
        {children}
      </a>
    );
  return (
    <button
      className={'mc-btn ' + (className ?? '')}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
