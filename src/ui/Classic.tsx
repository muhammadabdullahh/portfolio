import { useEffect } from 'react';
import { profile, jobs, projects, skills, categories, education } from '../data/profile';
import { useStore } from '../store';
import { Btn } from './common';
const DARK: Record<string, string> = { diamond: '#0d6e78', emerald: '#0b6e31', gold: '#7a5c00', lapis: '#1d3a9e', redstone: '#9a1010' };

const asset = (p: string) => import.meta.env.BASE_URL + p;

/** Fast, scrollable, print-friendly view for recruiters. Same content as the world, no game required. */
export function Classic() {
  const set = useStore((s) => s.set);
  useEffect(() => {
    document.body.classList.add('classic');
    window.scrollTo(0, 0);
    return () => document.body.classList.remove('classic');
  }, []);
  return (
    <div className="classic-page dirt-bg">
      <header className="cl-top">
        <Btn className="small green" onClick={() => set({ screen: 'play' })}>
          ← Back to the world
        </Btn>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn className="small" href={asset(profile.resume)} download="Muhammad_Abdullah_Resume.pdf" onClick={() => useStore.getState().unlock('resume')}>
            Download PDF
          </Btn>
          <Btn className="small" onClick={() => window.print()}>
            Print
          </Btn>
        </div>
      </header>

      <main className="cl-main">
        <section className="cl-card cl-hero">
          <img src={asset('me.jpg')} alt="Muhammad Abdullah" width={160} height={160} />
          <div>
            <h1>{profile.name}</h1>
            <p className="cl-role">
              {profile.title} · {profile.location}
            </p>
            <p>{profile.summary}</p>
            <p className="cl-links">
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                linkedin.com/in/mabdullah-cs
              </a>
              <a href={profile.github} target="_blank" rel="noreferrer">
                github.com/muhammadabdullahh
              </a>
            </p>
          </div>
        </section>

        <section className="cl-card">
          <h2>Experience</h2>
          {jobs.map((j) => (
            <article key={j.id} className="cl-item">
              <div className="cl-row">
                <h3>
                  {j.role} <span>· {j.company}</span>
                </h3>
                <span className="cl-date">{j.dates}</span>
              </div>
              <ul>
                {j.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="cl-card">
          <h2>Projects</h2>
          {projects.map((p) => (
            <article key={p.id} className="cl-item">
              <div className="cl-row">
                <h3>
                  {p.name} <span>· {p.tagline}</span>
                </h3>
                <a className="cl-date" href={p.url} target="_blank" rel="noreferrer">
                  {p.urlLabel}
                </a>
              </div>
              <p className="cl-stack">
                {p.status} · {p.stack.join(', ')}
              </p>
              <ul>
                {p.points.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="cl-card">
          <h2>Skills</h2>
          <div className="cl-skills">
            {categories.map((c) => (
              <div key={c.id}>
                <h3 style={{ color: DARK[c.ore] }}>{c.id}</h3>
                <p>
                  {skills
                    .filter((s) => s.cat === c.id)
                    .map((s) => s.name)
                    .join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="cl-card">
          <h2>Education</h2>
          <div className="cl-row">
            <h3>
              {education.degree} <span>· {education.school}</span>
            </h3>
            <span className="cl-date">{education.date}</span>
          </div>
          <p>
            {education.honours} · GPA {education.gpa}
          </p>
        </section>
      </main>
      <footer className="cl-foot">Fan-made tribute to a favourite childhood game. Not an official Minecraft product; not affiliated with Mojang.</footer>
    </div>
  );
}
