
<p align="center">
  <img src="public/chiku.png" alt="Chiku Logo" width="350"/>
</p>

> A calmer way to watch. **Made to reduce YouTube addiction** — not feed it.

Chiku Tube is a distraction-free, AI-powered video discovery app. No
endless infinite scroll. No autoplay traps. No notifications screaming
for your attention. Just a clean player, hand-picked shelves, and a
"Continue Watching" row so you can finish the one video you came for and
**actually close the tab**.

---

## Why this exists

YouTube is brilliant at one thing: keeping you watching. Recommendations,
shorts, autoplay, banners, comments — every pixel is engineered to extend
session time.

Chiku Tube flips the goal:

- **Watch what you came for, leave when you're done.**
- No suggested rabbit holes after every video.
- No comments, no shorts, no live notifications.
- AI is used to *help you find one good thing*, not to keep you scrolling.
- Your watch history lives in *your browser* — no cross-device profile
  building, no ad targeting.

If you've ever opened YouTube to play one song and looked up an hour later
wondering where the time went, this is for you.

---

## Features

- 🎯 **AI-personalized "Discover"** — suggests search phrases based on
  your taste, in your language. With a deterministic fallback so the feed
  is *never* empty.
- ▶️ **Continue Watching** — pick up videos you didn't finish.
- 🔥 **Trending Now** — refreshed every 10 minutes.
- 🎶 **Mood chips** — Lofi, Tech, Gaming, Cooking, Travel, Comedy, Learn,
  Podcasts, Documentary in one tap.
- ❤️ **Liked Picks** — a curated row of fresh videos based on what you
  loved.
- 🕘 **Watch Again** — revisit recent finishes.
- 🎬 **Persistent custom player** — never restarts when you navigate.
  - Double-tap to seek ±10s
  - Keyboard shortcuts (space, ←/→, m, f)
  - Speed control 0.5×–2×
  - Picture-in-picture style **mini player** when you leave /watch
  - Background-friendly: MediaSession metadata in the OS notification
  - Download button for offline keeping
- 🛡️ **Self-healing stream layer** — broken/expired stream URLs are
  auto-retried once, then quietly hidden from every shelf.
- 💾 **History-keyed cache** — recommendations persist across reloads,
  navigation is instant.
- 🌗 **Dark UI**, soft motion, semantic design tokens.
- 📱 Mobile-first with a bottom tab bar.

---

## Tech stack

- **Framework**: TanStack Start v1 (React 19 + Vite 7, SSR-ready)
- **Routing**: file-based, type-safe (`src/routes/`)
- **State**: Zustand with `localStorage` persistence
- **Styling**: Tailwind CSS v4 + custom design tokens (`src/styles.css`)
- **Deploy target**: Cloudflare Workers (edge) — also runs on Vercel and
  any Node 18+ host.

---

## Getting started

```bash
# Install
bun install     # or: npm install / pnpm install

# Run dev server (http://localhost:8080)
bun run dev

# Type-check + production build
bun run build

# Preview the build
bun run preview
```

### Environment

No secrets are required — Chiku Tube has no backend database, no
auth, and no analytics. Watch history and likes live in `localStorage`.

---

## Deployment

### Cloudflare Workers

`wrangler.jsonc` is preconfigured. Build then deploy:

```bash
bun run build
npx wrangler deploy
```

The build outputs an SSR worker plus static assets. Make sure the
`nodejs_compat` flag is enabled (already set in `wrangler.jsonc`).

### Vercel

`vercel.json` targets the Vercel adapter. Connect the repo on
[vercel.com](https://vercel.com), then:

```bash
bun run build:vercel
```

Vercel will run the same command on push.

### Self-host (Node)

```bash
bun run build
node .output/server/index.mjs
```

Any Node-18+ host works (Fly.io, Railway, your own VPS, a Raspberry Pi
on your home network).

### Docker (optional sketch)

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

---



## Privacy & data

- **Watch history, likes, position memory** → `localStorage` only.
- **No analytics, no trackers, no third-party scripts.**

You can wipe everything in one click via your browser's site-data
settings.

---


## 👩‍💻 Creators

<table width="100%">
    <tr>
      <td align="center" width="50%">
        <img src="https://itz-murali-images.vercel.app/anya" width="260"><br><br>
        <b>𝜜ɴყꫝㅤ𓆩💗𓆪</b><br><br>
        <a href="https://github.com/itz-Anya">
          <img src="https://img.shields.io/badge/GitHub-Anya-black?style=for-the-badge&logo=github">
        </a>
      </td>
      <td align="center" width="50%">
        <img src="https://itz-murali-images.vercel.app/api" width="260"><br><br>
        <b>𝐌 𝐔 𝐑 𝚨 𝐋 𝐈 𓂃ִֶָ⋆.˚</b><br><br>
        <a href="https://github.com/Itz-Murali">
          <img src="https://img.shields.io/badge/GitHub-Itz--Murali-black?style=for-the-badge&logo=github">
        </a>
      </td>
    </tr>
  </table>


---

<p align="center">
⭐ If you like this project, don’t forget to star the repo!
</p> 

