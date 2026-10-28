import { useEffect } from 'react';
import { useStore } from './store';
import { Game } from './ui/Game';
import { Hud } from './ui/Hud';
import { TitleScreen } from './ui/TitleScreen';
import { Toasts } from './ui/Toasts';
import { Chat } from './ui/Chat';
import { Classic } from './ui/Classic';
import { AboutPanel, ContactPanel, EducationPanel, HomePanel, InventoryPanel, JobPanel, PausePanel, ProjectPanel, ReposPanel, ResumePanel } from './ui/Panels';
import { sfx } from './audio';

function CurrentPanel() {
  const panel = useStore((s) => s.panel);
  if (!panel) return null;
  switch (panel.kind) {
    case 'about':
      return <AboutPanel />;
    case 'job':
      return <JobPanel company={panel.company} />;
    case 'project':
      return <ProjectPanel id={panel.id} />;
    case 'repos':
      return <ReposPanel />;
    case 'education':
      return <EducationPanel />;
    case 'contact':
      return <ContactPanel />;
    case 'inventory':
      return <InventoryPanel />;
    case 'pause':
      return <PausePanel />;
    case 'resume':
      return <ResumePanel />;
    case 'home':
      return <HomePanel />;
  }
}

export default function App() {
  const screen = useStore((s) => s.screen);
  const set = useStore((s) => s.set);

  // deep links: #resume / #quick opens the quick view, #play skips the title
  useEffect(() => {
    const h = location.hash.slice(1);
    if (h === 'resume' || h === 'quick') set({ screen: 'classic' });
    else if (h === 'play') set({ screen: 'play' });
  }, [set]);

  useEffect(() => {
    const want = screen === 'classic' ? '#quick' : screen === 'play' ? '#play' : '';
    if (location.hash !== want) history.replaceState(null, '', want || location.pathname);
  }, [screen]);

  const play = () => {
    sfx.levelUp();
    set({ screen: 'play' });
    const st = useStore.getState();
    st.unlock('hello');
    if (!st.seenTutorial) set({ seenTutorial: true });
  };

  return (
    <>
      <Game />
      {screen === 'title' && <TitleScreen onPlay={play} />}
      {screen === 'play' && (
        <>
          <Hud />
          <Chat />
          <CurrentPanel />
        </>
      )}
      {screen === 'classic' && <Classic />}
      {screen !== 'classic' && <Toasts />}
    </>
  );
}
