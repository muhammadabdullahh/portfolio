import { useState } from 'react';
import { profile } from '../data/profile';
import { useStore } from '../store';
import { Logo } from './Logo';
import { PlayerModel } from './PlayerModel';
import { Btn } from './common';
import { sfx } from '../audio';

export function TitleScreen({ onPlay }: { onPlay: () => void }) {
  const outfit = useStore((s) => s.outfit);
  const set = useStore((s) => s.set);
  const [splash, setSplash] = useState(() => Math.floor(Math.random() * profile.splashes.length));

  return (
    <main className="title-screen">
      <div className="logo-wrap">
        <h1 className="sr-only">Muhammad Abdullah, Full-Stack Software Developer</h1>
        <Logo />
        <span className="edition">Software Developer Edition</span>
        <button
          className="splash"
          tabIndex={-1}
          aria-label={`Splash: ${profile.splashes[splash]} (click for another)`}
          onClick={() => {
            sfx.pop();
            setSplash((i) => (i + 1) % profile.splashes.length);
          }}
        >
          {profile.splashes[splash]}
        </button>
      </div>

      <div className="title-body">
        <PlayerModel outfit={outfit} anim="wave" />
        <nav className="title-menu" aria-label="Main menu">
          <Btn className="wide green" onClick={onPlay}>
            Explore my world
          </Btn>
          <Btn className="wide" onClick={() => set({ screen: 'classic' })}>
            Quick view (resume)
          </Btn>
          <div className="row">
            <Btn href={profile.linkedin}>LinkedIn</Btn>
            <Btn href={profile.github}>GitHub</Btn>
          </div>
          <div className="row">
            <Btn href={`mailto:${profile.email}`}>Email me</Btn>
            <Btn href={profile.resume} download="Muhammad_Abdullah_Resume.pdf">
              Resume PDF
            </Btn>
          </div>
          <p className="title-hint shadow-text">
            <span className="kbd-only">Walk with A / D or ← →, click things to interact.</span>
            <span className="touch-only"> Tap to walk and interact.</span>
          </p>
        </nav>
      </div>

      <footer className="title-foot">
        <span>Muhammad Abdullah · Software Developer · {profile.location}</span>
        <span>
          A Minecraft-inspired portfolio by Muhammad Abdullah ({profile.email}). NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
        </span>
      </footer>
    </main>
  );
}
