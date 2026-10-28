import { useEffect, useMemo, useState } from 'react';
import { profile, jobs, projects, skills, categories, education, oreFor, type SkillCategory } from '../data/profile';
import { ACHIEVEMENTS, useStore } from '../store';
import { Btn, CloseBtn, Gui, Icon, Overlay } from './common';
import { PlayerModel } from './PlayerModel';
import { oreColor } from '../game/blocks';
import { sfx } from '../audio';
import { travel } from './Game';
import { guestbookEnabled } from '../lib/guestbook';

const asset = (p: string) => import.meta.env.BASE_URL + p;

// ---------------- About (book & quill) ----------------
export function AboutPanel() {
  const close = useStore((s) => s.close);
  const unlock = useStore((s) => s.unlock);
  const [page, setPage] = useState(0);
  useEffect(() => unlock('book'), [unlock]);
  const pages = [
    <>
      <img className="book-photo" src={asset('me.jpg')} alt="Muhammad Abdullah in a black suit and tie" width={240} height={240} />
      <h2 id="book-title">Muhammad Abdullah</h2>
      <p style={{ marginTop: 4 }}>
        <em>{profile.title}</em>
        <br />
        {profile.location}
      </p>
      <p>{profile.about[0]}</p>
    </>,
    <>
      <p>{profile.about[1]}</p>
      <p>{profile.about[2]}</p>
    </>,
    <>
      <p>{profile.about[3]}</p>
      <p>
        Fastest way to reach me: <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
    </>,
  ];
  return (
    <Overlay labelledBy="book-title">
      <article className="book">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="page-n" aria-live="polite">
            Page {page + 1} of {pages.length}
          </span>
          <CloseBtn onClick={close} />
        </div>
        {page !== 0 && <h2 id="book-title" className="sr-only">About me</h2>}
        {pages[page]}
        <div style={{ clear: 'both', display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 12 }}>
          <Btn className="small" onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="Previous page">
            ← Back
          </Btn>
          {page < pages.length - 1 ? (
            <Btn className="small" onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              Next →
            </Btn>
          ) : (
            <Btn
              className="small green"
              onClick={() => {
                close();
                travel('village');
              }}
            >
              Visit my workplaces
            </Btn>
          )}
        </div>
      </article>
    </Overlay>
  );
}

// ---------------- Jobs ----------------
const COMPANY_TABS = [
  { id: 'dayforce', name: 'Dayforce', jobs: ['dayforce-associate', 'dayforce-intern'] },
  { id: 'tmu', name: 'TMU', jobs: ['tmu'] },
  { id: 'opg', name: 'OPG', jobs: ['opg'] },
] as const;

export function JobPanel({ company }: { company: 'dayforce' | 'tmu' | 'opg' }) {
  const [tab, setTab] = useState<string>(company);
  const visitJob = useStore((s) => s.visitJob);
  const unlock = useStore((s) => s.unlock);
  useEffect(() => {
    visitJob(tab);
    if (['dayforce', 'tmu', 'opg'].every((c) => useStore.getState().visitedJobs.includes(c))) unlock('career');
  }, [tab, visitJob, unlock]);
  const t = COMPANY_TABS.find((c) => c.id === tab)!;
  return (
    <Gui title="Quest log" subtitle="Work experience, most recent first">
      <div className="tabs" role="tablist">
        {COMPANY_TABS.map((c) => (
          <button key={c.id} className="tab" role="tab" aria-selected={tab === c.id} onClick={() => { sfx.click(); setTab(c.id); }}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="tab-body" role="tabpanel">
        {t.jobs.map((id) => {
          const j = jobs.find((x) => x.id === id)!;
          return (
            <div key={id} style={{ marginBottom: 18 }}>
              <h3>{j.role}</h3>
              <div className="muted">
                {j.company} · {j.dates} · {j.place}
              </div>
              <ul className="check-list">
                {j.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <ul className="tags" aria-label="Stack">
                {j.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Gui>
  );
}

// ---------------- Projects (in-game browser) ----------------
export function ProjectPanel({ id }: { id: string }) {
  const [pid, setPid] = useState(id);
  const [loaded, setLoaded] = useState(false);
  const close = useStore((s) => s.close);
  const unlock = useStore((s) => s.unlock);
  const p = projects.find((x) => x.id === pid)!;
  useEffect(() => {
    setLoaded(false);
    unlock('shipit');
  }, [pid, unlock]);
  return (
    <Overlay labelledBy="proj-title">
      <section className="gui browser">
        <div className="gui-head" style={{ marginBottom: 0 }}>
          <div className="tabs" role="tablist" aria-label="Projects">
            {projects.map((x) => (
              <button key={x.id} className="tab" role="tab" aria-selected={x.id === pid} onClick={() => { sfx.click(); setPid(x.id); }}>
                {x.name}
              </button>
            ))}
          </div>
          <CloseBtn onClick={close} />
        </div>
        <div className="addr">
          <div className="url" aria-label="Address">
            https://{p.urlLabel}
          </div>
          <Btn className="small green" href={p.url}>
            Open site
          </Btn>
        </div>
        <div className="proj-split">
          <div className="frame-wrap dirt-bg">
            {p.embeddable ? (
              <>
                {!loaded && (
                  <div className="frame-loading">
                    <p className="shadow-text">Loading terrain…</p>
                  </div>
                )}
                <iframe key={p.id} src={p.url} title={`${p.name} live preview`} loading="lazy" onLoad={() => setLoaded(true)} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" referrerPolicy="no-referrer" />
              </>
            ) : (
              <div className="frame-loading">
                <div>
                  <p className="shadow-text" style={{ fontSize: 22, margin: '0 0 8px' }}>
                    {p.name} can’t load inside this window
                  </p>
                  <p className="shadow-text" style={{ margin: '0 0 16px', color: '#ddd' }}>
                    The site blocks embedding, so open it in a new tab.
                  </p>
                  <Btn className="green" href={p.url}>
                    Open {p.urlLabel}
                  </Btn>
                </div>
              </div>
            )}
          </div>
          <div className="proj-side inset" style={{ background: 'var(--gui)' }}>
            <h2 id="proj-title" style={{ fontSize: 24 }}>
              {p.name}
            </h2>
            <div className="muted">
              {p.tagline} · <strong>{p.status}</strong>
            </div>
            <ul className="check-list">
              {p.points.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <ul className="tags" aria-label="Stack">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Overlay>
  );
}

// ---------------- GitHub chest ----------------
type Repo = { name: string; description: string | null; html_url: string; language: string | null; stargazers_count: number; pushed_at: string; fork: boolean };
export function ReposPanel() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const k = 'gh-repos';
    try {
      const c = sessionStorage.getItem(k);
      if (c) {
        setRepos(JSON.parse(c));
        return;
      }
    } catch {
      /* ignore */
    }
    fetch(`https://api.github.com/users/${profile.githubUser}/repos?per_page=100&sort=pushed`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Repo[]) => {
        const list = d.filter((r) => !r.fork && r.name !== profile.githubUser);
        setRepos(list);
        try {
          sessionStorage.setItem(k, JSON.stringify(list));
        } catch {
          /* ignore */
        }
      })
      .catch(() => setErr(true));
  }, []);
  return (
    <Gui title="GitHub chest" subtitle="Live from github.com, most recently updated first">
      {err && (
        <p>
          The GitHub API didn’t answer (it allows 60 requests an hour). Browse everything at{' '}
          <a href={profile.github} target="_blank" rel="noreferrer">
            github.com/{profile.githubUser}
          </a>
          .
        </p>
      )}
      {!repos && !err && <p>Opening chest…</p>}
      {repos && (
        <div style={{ display: 'grid', gap: 4 }}>
          {repos.map((r) => (
            <a key={r.name} className="server" href={r.html_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <span className="ico">
                <Icon name="book" />
              </span>
              <span>
                <span className="name">{r.name}</span>
                <span className="motd" style={{ display: 'block' }}>
                  {r.description ?? 'No description'}
                </span>
              </span>
              <span className="motd">{r.language ?? ''}</span>
            </a>
          ))}
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Btn href={profile.github}>Open my GitHub profile</Btn>
      </div>
    </Gui>
  );
}

// ---------------- Education (enchanting table) ----------------
export function EducationPanel() {
  const unlock = useStore((s) => s.unlock);
  useEffect(() => {
    unlock('scholar');
    sfx.levelUp();
  }, [unlock]);
  return (
    <Gui title="Enchanting table" subtitle="Education">
      <div className="enchant-wrap">
        <img className="diploma-photo" src={asset('convocation.jpg')} alt="Muhammad holding his framed Toronto Metropolitan University BSc diploma" loading="lazy" width={450} height={640} />
        <div>
          <h3>{education.degree}</h3>
          <p className="muted" style={{ margin: '2px 0 12px' }}>
            {education.school} · {education.date}
          </p>
          <div className="enchant-opt">
            <span>
              <span className="galactic" aria-hidden="true">ᒷ⍑ᔑリᓵ⍑ ᓭ↸ᔑ</span>With Distinction
            </span>
            <span className="lvl">III</span>
          </div>
          <div className="enchant-opt">
            <span>
              <span className="galactic" aria-hidden="true">ℸ ̣⍑ᒷ ⋮ᔑ!¡∴</span>GPA {education.gpa}
            </span>
            <span className="lvl">II</span>
          </div>
          <div className="enchant-opt">
            <span>
              <span className="galactic" aria-hidden="true">ᓵ∷ᔑ⎓ℸ ̣ ⍊</span>Computer Science (Honours)
            </span>
            <span className="lvl">I</span>
          </div>
          <p style={{ marginTop: 14 }}>Worked as a software engineer for TMU’s Department of Architectural Science while studying, and interned at OPG and Dayforce before graduating.</p>
        </div>
      </div>
    </Gui>
  );
}

// ---------------- Contact (server list) ----------------
export function ContactPanel() {
  const [copied, setCopied] = useState(false);
  const set = useStore((s) => s.set);
  const close = useStore((s) => s.close);
  const servers = [
    { name: 'Email', motd: profile.email, href: `mailto:${profile.email}`, ico: '✉' },
    { name: 'LinkedIn', motd: 'linkedin.com/in/mabdullah-cs', href: profile.linkedin, ico: 'in' },
    { name: 'GitHub', motd: 'github.com/muhammadabdullahh', href: profile.github, ico: '⌥' },
  ];
  const [sel, setSel] = useState(0);
  return (
    <Gui title="Play Multiplayer" subtitle="Pick a server to reach me.">
      <div role="listbox" aria-label="Contact options">
        {servers.map((s, i) => (
          <a
            key={s.name}
            role="option"
            aria-selected={sel === i}
            className={'server' + (sel === i ? ' sel' : '')}
            href={s.href}
            target={s.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            onFocus={() => setSel(i)}
            onMouseEnter={() => setSel(i)}
            onClick={() => sfx.click()}
            style={{ textDecoration: 'none' }}
          >
            <span className="ico">{s.ico}</span>
            <span>
              <span className="name">{s.name}</span>
              <span className="motd" style={{ display: 'block' }}>
                {s.motd}
              </span>
            </span>
            <span className="ping" aria-hidden="true">
              {[4, 7, 10, 13, 16].map((h) => (
                <i key={h} style={{ height: h }} />
              ))}
            </span>
          </a>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Btn
          className="green"
          onClick={() => {
            void navigator.clipboard?.writeText(profile.email).then(() => setCopied(true));
          }}
        >
          {copied ? 'Copied!' : 'Copy email'}
        </Btn>
        {guestbookEnabled && (
          <Btn
            onClick={() => {
              close();
              set({ chatOpen: true });
            }}
          >
            Sign the guestbook
          </Btn>
        )}
        <Btn href={asset(profile.resume)} download="Muhammad_Abdullah_Resume.pdf" onClick={() => useStore.getState().unlock('resume')}>
          Download resume
        </Btn>
      </div>
    </Gui>
  );
}

// ---------------- Resume chest ----------------
export function ResumePanel() {
  const unlock = useStore((s) => s.unlock);
  const set = useStore((s) => s.set);
  useEffect(() => unlock('resume'), [unlock]);
  return (
    <Gui title="Resume chest" subtitle="Grab a copy of my resume">
      <div className="dark-inset">
        <p style={{ margin: 0 }}>{profile.summary}</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Btn className="green" href={asset(profile.resume)} download="Muhammad_Abdullah_Resume.pdf">
          Download resume (PDF)
        </Btn>
        <Btn href={asset(profile.resume)}>Open in new tab</Btn>
        <Btn onClick={() => set({ screen: 'classic', panel: null })}>Quick view</Btn>
      </div>
    </Gui>
  );
}

// ---------------- Home (wardrobe) ----------------
export function HomePanel() {
  const outfit = useStore((s) => s.outfit);
  const set = useStore((s) => s.set);
  const unlock = useStore((s) => s.unlock);
  return (
    <Gui title="Home base" subtitle="Pickering, Ontario">
      <div className="inv-layout">
        <div className="inset model-col" style={{ display: 'grid', placeItems: 'center', background: '#000' }}>
          <PlayerModel outfit={outfit} anim="idle" />
        </div>
        <div>
          <p>Block games were my childhood. They’re where I first learned you can build anything one piece at a time, which is still how I write software.</p>
          <h3>Wardrobe</h3>
          <p className="muted">Switch between the suit from my convocation photo and a casual hoodie.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['suit', 'hoodie'] as const).map((o) => (
              <Btn
                key={o}
                className={outfit === o ? 'green' : ''}
                onClick={() => {
                  set({ outfit: o });
                  if (o !== 'suit') unlock('drip');
                }}
              >
                {o === 'suit' ? 'Convocation suit' : 'Coding hoodie'}
              </Btn>
            ))}
          </div>
        </div>
      </div>
    </Gui>
  );
}

// ---------------- Inventory (skills) ----------------
export function InventoryPanel() {
  const mined = useStore((s) => s.mined);
  const outfit = useStore((s) => s.outfit);
  const unlock = useStore((s) => s.unlock);
  const close = useStore((s) => s.close);
  const [cat, setCat] = useState<SkillCategory | 'All'>('All');
  const [sel, setSel] = useState<string>(skills[0].id);
  useEffect(() => unlock('inventory'), [unlock]);
  const list = useMemo(() => (cat === 'All' ? skills : skills.filter((s) => s.cat === cat)), [cat]);
  const sk = skills.find((s) => s.id === sel)!;
  const tint = (c: SkillCategory): [string, string] => {
    const col = oreColor[oreFor(c)];
    return [col, shade(col)];
  };
  return (
    <Gui title="Inventory" subtitle={`My ${skills.length} skills. Hover or tap one for details · ${mined.length} mined in the quarry`}>
      <div className="inv-layout">
        <div className="model-col inset" style={{ display: 'grid', placeItems: 'center', background: '#000' }}>
          <PlayerModel outfit={outfit} anim="idle" />
        </div>
        <div>
          <div className="tabs" role="tablist" aria-label="Skill categories">
            {(['All', ...categories.map((c) => c.id)] as const).map((c) => (
              <button key={c} className="tab" role="tab" aria-selected={cat === c} onClick={() => { sfx.click(); setCat(c); }}>
                {c}
              </button>
            ))}
          </div>
          <div className="tab-body" style={{ padding: 8 }}>
            <div className="inv-grid" role="listbox" aria-label="Skills">
              {list.map((s) => (
                <button
                  key={s.id}
                  role="option"
                  aria-selected={sel === s.id}
                  aria-label={`${s.name}, ${s.cat}${mined.includes(s.id) ? ', mined' : ''}`}
                  className={'inv-slot' + (s.core ? ' glint' : '') + (sel === s.id ? ' sel' : '')}
                  onClick={() => {
                    sfx.click();
                    setSel(s.id);
                  }}
                  onMouseEnter={() => setSel(s.id)}
                  onFocus={() => setSel(s.id)}
                >
                  <Icon name="gem" tint={tint(s.cat)} />
                  {mined.includes(s.id) && <span className="mined" aria-hidden="true">✓</span>}
                  <span className="qty">{s.short}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="inv-detail dark-inset" aria-live="polite">
            <div style={{ fontSize: 20, color: sk.core ? '#ff77ff' : '#fff' }}>
              {sk.name}
              {sk.core ? ' ✦' : ''}
            </div>
            <div style={{ color: oreColor[oreFor(sk.cat)], fontSize: 15 }}>{sk.cat}</div>
            {sk.usedAt.length > 0 && <div style={{ color: '#aaa', fontSize: 15 }}>Used at: {sk.usedAt.join(', ')}</div>}
            {sk.core && <div style={{ color: '#d9a8ff', fontSize: 15 }}>Core skill</div>}
            <div style={{ color: '#9a9a9a', fontSize: 14, marginTop: 2 }}>{mined.includes(sk.id) ? 'Mined in the quarry ✓' : 'Tip: mine this ore in the Skill Quarry'}</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn
              className="small"
              onClick={() => {
                close();
                travel('quarry');
              }}
            >
              Go to the Skill Quarry
            </Btn>
          </div>
        </div>
      </div>
    </Gui>
  );
}

function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.floor(((n >> 16) & 255) * 0.55);
  const g = Math.floor(((n >> 8) & 255) * 0.55);
  const b = Math.floor((n & 255) * 0.55);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------------- Pause / options ----------------
export function PausePanel() {
  const ach = useStore((s) => s.achievements);
  const bugs = useStore((s) => s.bugs);
  const close = useStore((s) => s.close);
  const set = useStore((s) => s.set);
  const resetOres = useStore((s) => s.resetOres);
  const outfit = useStore((s) => s.outfit);
  return (
    <Gui title="Game menu" subtitle={`${ach.length} of ${ACHIEVEMENTS.length} advancements · ${bugs} bugs squashed`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Btn className="green" onClick={close}>
          Back to game
        </Btn>
        <Btn onClick={() => set({ screen: 'classic', panel: null })}>Quick view</Btn>
        <Btn onClick={() => set({ outfit: outfit === 'suit' ? 'hoodie' : 'suit' })}>Outfit: {outfit === 'suit' ? 'Suit' : 'Hoodie'}</Btn>
        <Btn onClick={() => { resetOres(); close(); travel('quarry'); }}>Respawn quarry ores</Btn>
        <Btn onClick={() => set({ screen: 'title', panel: null })}>Title screen</Btn>
      </div>
      <h3 style={{ marginBottom: 8 }}>Advancements</h3>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={'ach' + (ach.includes(a.id) ? '' : ' locked')}>
            <Icon name={ach.includes(a.id) ? 'compass' : 'paper'} />
            <span>
              {a.name}
              <small>{a.desc}</small>
            </span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
        Controls: A/D or ←/→ walk · Space jump · Shift sprint · Enter interact · E inventory · T chat · 1–9 hotbar · Esc menu. Or just click and tap.
      </p>
    </Gui>
  );
}
