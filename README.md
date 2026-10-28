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
- Day and night follow the visitor's local time. Sounds are synthesized in the browser (including surface-aware footsteps). Responsive from phones to desktops, with touch controls, keyboard support and reduced-motion support.

All textures, sprites, sounds and the logo are original: drawn or synthesized in code. No Minecraft game files (textures, sounds, music, fonts or logos) are used or redistributed, per the [Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines). The UI font is [Monocraft](https://github.com/IdreesInc/Monocraft), an independent open-source font (SIL OFL 1.1).

**NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.** Built and run by Muhammad Abdullah (info.abdullahmuhammad@gmail.com).

## Stack

Vite · React 19 · TypeScript · Canvas 2D (custom engine) · skinview3d (three.js) · Zustand · Vitest. Hosted free on Vercel; GitHub Actions runs the tests.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # world-generation tests
npm run build    # outputs to dist/
```

Content lives in `src/data/profile.ts`. Edit it to update jobs, projects, skills or splash texts.

## Deploy (free, Vercel)

1. Push to GitHub: `git push -u origin main`.
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, import `muhammadabdullahh/portfolio`, and keep the detected **Vite** settings (build `npm run build`, output `dist`). Click **Deploy**.
3. Every push to `main` now redeploys automatically, and every branch or PR gets its own preview link.

### Custom domain

In the Vercel project, go to **Settings → Domains** and add the domain plus `www.` (redirect `www` to the apex). Vercel shows the exact DNS records to create; add them at your registrar (usually an `A` record for the apex and a `CNAME` for `www`). HTTPS is issued automatically. Then update `og:image` and `og:url` in `index.html` to the new domain.

## Optional guestbook (free Supabase)

The chat works without a backend; messages just stay local. To make the guestbook public:

1. Create a free project at supabase.com and run `supabase/guestbook.sql` in its SQL editor.
2. Add two repository secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
3. Add the same two values in Vercel under **Settings → Environment Variables**, then redeploy.

Row-level security only allows reading and inserting short messages without links, with a simple rate limit. Moderate or delete messages from the Supabase dashboard. Free Supabase projects pause after a week with no traffic; open the dashboard to wake one up.
