# Muhammad Abdullah · Portfolio

A walkable block-world portfolio. Visitors explore my career as a little 2D world: read the About book at spawn, walk through the Career Village, mine my skills as ores in the Skill Quarry, open live projects in an in-game browser, use the enchanting table for education, and step through the Multiplayer gate to get in touch.

Recruiters in a hurry can hit **Quick view** (or go to `/#quick`) for a plain, printable resume page.

## Features

- **Playable world**: walk with A/D or the arrow keys, Space to jump, or just click/tap where you want to go. The 1–9 hotbar fast-travels to each section.
- **My character**: a pixel skin painted from my photo, rendered as a draggable 3D model on the title screen and in the inventory. There's a suit and a hoodie outfit.
- **Skill Quarry**: 38 skills placed as ores (diamond = languages, emerald = frontend, gold = backend, lapis = data & cloud, redstone = practices). Mine them to fill the inventory.
- **Live projects**: Sisters Through Faith and Zenny load inside the in-game browser. NearMoi blocks embedding, so it opens in a new tab.
- **GitHub chest**: lists my repos live from the GitHub API.
- **Advancements**: 14 achievements, plus bugs to squash. Progress is saved in the browser.
- **Chat console** (T or /): `/help`, `/tp quarry`, `/time set night`, `/hire`, and so on. Plain messages go to the guestbook.
- Day and night follow the visitor's local time. Sounds are synthesized. Responsive from phones to desktops, with touch controls, keyboard support and reduced-motion support.

All textures, sprites and the logo are drawn in code. This is a fan-made tribute: no Mojang assets are used, and it isn't affiliated with Mojang or Minecraft.

## Stack

Vite · React 19 · TypeScript · Canvas 2D (custom engine) · skinview3d (three.js) · Zustand · Vitest · Playwright. Hosted free on GitHub Pages via GitHub Actions.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # world-generation tests
npm run build    # outputs to dist/
```

Content lives in `src/data/profile.ts`. Edit it to update jobs, projects, skills or splash texts.

## Deploy (free)

1. Push to `main`.
2. In the repo: **Settings → Pages → Source: GitHub Actions** (one time).
3. The site goes live at `https://muhammadabdullahh.github.io/portfolio/`.

### Custom domain later

Buy the domain, then add it under **Settings → Pages → Custom domain**. At your registrar, add the DNS records GitHub shows: four `A` records for the apex domain and a `CNAME` for `www` pointing to `muhammadabdullahh.github.io`. Turn on **Enforce HTTPS**. After that, update `og:image` and `og:url` in `index.html` to the new domain.

## Optional guestbook (free Supabase)

The chat works without a backend; messages just stay local. To make the guestbook public:

1. Create a free project at supabase.com and run `supabase/guestbook.sql` in its SQL editor.
2. Add two repository secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
3. Re-run the deploy workflow.

Row-level security only allows reading and inserting short messages without links, with a simple rate limit. Moderate or delete messages from the Supabase dashboard. Free Supabase projects pause after a week with no traffic; open the dashboard to wake one up.
