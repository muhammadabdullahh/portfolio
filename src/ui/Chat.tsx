import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { profile, skills } from '../data/profile';
import { addEntry, guestbookEnabled, listEntries } from '../lib/guestbook';
import { travel } from './Game';
import { sfx } from '../audio';

type Line = { id: number; kind: 'sys' | 'msg' | 'cmd'; who?: string; text: ReactNode };
let lid = 0;
const sys = (text: ReactNode): Line => ({ id: ++lid, kind: 'sys', text });

const PLACES = ['spawn', 'village', 'quarry', 'projects', 'library', 'contact'];

export function Chat() {
  const open = useStore((s) => s.chatOpen);
  const set = useStore((s) => s.set);
  const [lines, setLines] = useState<Line[]>(() => [sys(guestbookEnabled ? 'Welcome! Type /help for commands, or say hi to sign the guestbook.' : 'Welcome! Type /help to see what you can do, e.g. /tp quarry or /hire.')]);
  const [text, setText] = useState('');
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('gb-name') || 'Visitor';
    } catch {
      return 'Visitor';
    }
  });
  const [history, setHistory] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  const push = (...l: Line[]) => setLines((x) => [...x, ...l].slice(-80));

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    if (!loaded.current) {
      loaded.current = true;
      if (guestbookEnabled)
        listEntries()
          .then((es) => push(...es.map((e) => ({ id: ++lid, kind: 'msg' as const, who: e.name, text: e.message }))))
          .catch(() => push(sys('Couldn’t load the guestbook right now.')));
    }
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines, open]);

  const run = async (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setHistory((h) => [t, ...h].slice(0, 30));
    setHi(-1);
    if (!t.startsWith('/')) {
      push({ id: ++lid, kind: 'msg', who: name, text: t });
      if (guestbookEnabled) {
        try {
          await addEntry(name, t);
          sfx.pop();
        } catch (e) {
          push(sys((e as Error).message));
        }
      } else push(sys(<>Only you can see this. To reach me, use /email or <a href={`mailto:${profile.email}`}>email me</a>.</>));
      return;
    }
    push({ id: ++lid, kind: 'cmd', text: t });
    const [cmd, ...args] = t.slice(1).split(/\s+/);
    const st = useStore.getState();
    st.unlock('cli');
    switch (cmd.toLowerCase()) {
      case 'help':
        push(
          sys('/tp <spawn|village|quarry|projects|library|contact>'),
          sys('/time set <day|night> · /outfit <suit|hoodie> · /nick <name>'),
          sys('/resume · /email · /linkedin · /github · /skills · /hire · /clear'),
        );
        break;
      case 'tp':
      case 'warp': {
        const p = (args[0] || '').toLowerCase();
        if (PLACES.includes(p)) {
          travel(p);
          push(sys(`Teleported to ${p}.`));
        } else push(sys('Usage: /tp ' + PLACES.join('|')));
        break;
      }
      case 'time':
        if (args[1] === 'night' || args[0] === 'night') {
          st.set({ night: true });
          st.unlock('night');
          push(sys('Set the time to night.'));
        } else {
          st.set({ night: false });
          push(sys('Set the time to day.'));
        }
        break;
      case 'outfit':
        st.set({ outfit: args[0] === 'hoodie' ? 'hoodie' : 'suit' });
        if (args[0] === 'hoodie') st.unlock('drip');
        push(sys('Outfit changed.'));
        break;
      case 'nick': {
        const n = args.join(' ').slice(0, 24).trim();
        if (n) {
          setName(n);
          try {
            localStorage.setItem('gb-name', n);
          } catch {
            /* ignore */
          }
          push(sys(`You are now ${n}.`));
        } else push(sys('Usage: /nick <name>'));
        break;
      }
      case 'resume':
        st.open({ kind: 'resume' });
        set({ chatOpen: false });
        break;
      case 'email':
        push(sys(<>Email: <a href={`mailto:${profile.email}`}>{profile.email}</a></>));
        break;
      case 'linkedin':
        push(sys(<>LinkedIn: <a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedin}</a></>));
        break;
      case 'github':
        push(sys(<>GitHub: <a href={profile.github} target="_blank" rel="noreferrer">{profile.github}</a></>));
        break;
      case 'skills':
        push(sys(skills.filter((s) => s.core).map((s) => s.name).join(', ') + ' (core). Press E for all.'));
        break;
      case 'hire':
        push(sys(<>Great choice. Opening the contact gate… or email <a href={`mailto:${profile.email}`}>{profile.email}</a></>));
        travel('contact');
        setTimeout(() => st.open({ kind: 'contact' }), 300);
        set({ chatOpen: false });
        break;
      case 'clear':
        setLines([]);
        break;
      case 'gamemode':
        push(sys('Nice try. This world is read-only, but the quick view is one click away.'));
        break;
      default:
        push(sys(`Unknown command: /${cmd}. Try /help`));
    }
  };

  if (!open) return null;
  return (
    <div className="chat" role="dialog" aria-label="Chat and guestbook">
      <div className="chat-log" ref={log} aria-live="polite">
        {lines.map((l) => (
          <div key={l.id} className={'chat-line ' + l.kind}>
            {l.who && <span className="who">&lt;{l.who}&gt; </span>}
            {l.text}
          </div>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(text);
          setText('');
        }}
      >
        <label className="sr-only" htmlFor="chat-input">
          Chat message or command
        </label>
        <input
          id="chat-input"
          ref={input}
          value={text}
          maxLength={160}
          autoComplete="off"
          placeholder={guestbookEnabled ? `Chatting as ${name} · /help` : 'Type a command, e.g. /help'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              set({ chatOpen: false });
            }
            if (e.key === 'ArrowUp' && history.length) {
              const n = Math.min(history.length - 1, hi + 1);
              setHi(n);
              setText(history[n]);
              e.preventDefault();
            }
            if (e.key === 'ArrowDown') {
              const n = hi - 1;
              setHi(n);
              setText(n >= 0 ? history[n] : '');
            }
          }}
        />
        <button className="mc-btn small" type="submit">
          Send
        </button>
        <button className="mc-btn small" type="button" onClick={() => set({ chatOpen: false })} aria-label="Close chat">
          ✕
        </button>
      </form>
    </div>
  );
}
