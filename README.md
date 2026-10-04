# Navain AI — website

The Navain AI marketing site: ten static HTML pages, two pre-built animation bundles, and a
serverless API layer for the AI chat assistant.

Live site: https://navainai.com

## Quick start

```bash
npm install          # three, gsap, vite — only needed to rebuild animations
cp .env.example .env.local   # then paste your GROQ_API_KEY in
npm run dev          # preview at http://localhost:3000
```

`npm run dev` serves the pages **and** runs everything in `api/` as if it were Vercel, so the
"Stacy" chat widget works locally. Without a `.env.local` the site still runs — the chat just
replies with the "please email us" fallback instead.

## What's in the repo

| Path | What it is |
|---|---|
| `*.html` | The ten pages (home, how-it-works, why-navain, industries, testimonials, about, pricing, contact, privacy, terms) |
| `src/three-hero.js` | Source for the 3D crystal in the hero (Three.js) |
| `src/scroll-fx.js` | Source for the scroll system: glass nav, parallax, floating cards, isometric tilt (GSAP) |
| `assets/*.bundle.js` | **Pre-built and committed** — the pages load these directly, so a deploy needs no build step |
| `api/chat.js` | Server-side proxy to Groq for the chat widget |
| `api/speak.js` | Server-side proxy to ElevenLabs for text-to-speech |
| `api/config.js` | Returns feature flags only (`{ chat, tts }`) — never secrets |
| `lib/api-utils.js` | Shared helpers: CORS, JSON body parsing, in-memory rate limiting |
| `dev-server.js` | Local static host + `api/` runtime (not used in production) |
| `contact.html` | Contact form posts to Formspree (`formspree.io/f/xnjwnoyw`) |

## Environment variables

Set these locally in `.env.local` and on Vercel under **Settings → Environment Variables**.
Change a value on Vercel → redeploy for it to take effect.

| Name | Required | Used by | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | for chat | `api/chat.js` | Free key: https://console.groq.com/keys |
| `GROQ_MODEL` | no | `api/chat.js` | Defaults to `llama-3.3-70b-versatile` |
| `ELEVEN_API_KEY` | for voice | `api/speak.js` | `ELEVEN_KEY` also accepted (legacy name) |
| `ELEVEN_VOICE_ID` | no | `api/speak.js` | Defaults to `21m00Tcm4TlvDq8ikWAM` |
| `ELEVEN_MODEL` | no | `api/speak.js` | Defaults to `eleven_turbo_v2` |
| `GROQ_API_URL` | no | `api/chat.js` | Override for testing only |

**The keys stay on the server.** Pages call `/api/chat` and `/api/speak`; `/api/config` returns
booleans only. Nothing sensitive is ever shipped to the browser.

## Rebuilding the animations

```bash
npm install
# edit src/three-hero.js or src/scroll-fx.js
npm run build:all       # writes dist/ and dist-scrollfx/
```

Then copy the rebuilt file over the committed bundle:

```bash
cp dist/three-hero.bundle.js   assets/three-hero.bundle.js
cp dist-scrollfx/scroll-fx.bundle.js assets/scroll-fx.bundle.js
```

See `ANIMATION-README.md` for what the scroll system actually does.

## Contact form

`contact.html` submits to Formspree. If you change the form ID, update both the `<form action>`
and the `fetch()` call near the bottom of the file.
