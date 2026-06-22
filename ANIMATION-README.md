# 3D / Antigravity-style animation — Node.js setup

This project uses a small Node.js build step for two things: the 3D crystal in the hero, and a GSAP-powered "Antigravity" scroll system (floating glass cards, parallax depth, isometric tilt).

## What was added
- `package.json` — `three` and `gsap` as dependencies, `vite` as the build tool
- `vite.config.js` → builds `src/three-hero.js` into `assets/three-hero.bundle.js` (the 3D crystal)
- `vite.config.scrollfx.js` → builds `src/scroll-fx.js` into `assets/scroll-fx.bundle.js` (scroll/parallax/tilt/glass system)
- Both bundles are **pre-built and committed** — you don't need to run anything to deploy. `index.html` already loads them via `<script>` tags.

## What the scroll-fx system does
- **Frosted-glass nav** — the top nav turns to blurred glass once you scroll past the hero
- **Parallax depth in the hero** — the headline, the call-transcript card, and the 3D crystal drift at different speeds as you scroll, instead of moving together
- **Floating cards** — the call-transcript card and the crystal gently bob up and down (the literal "antigravity" weightless effect)
- **Isometric tilt** — the call card, industry chips, and stat cards tilt in 3D toward your cursor
- **Glass surfaces** — chips, stat cards, and the contact form get a frosted, translucent treatment
- **3D scroll reveals** — sections rise into view with a slight tilt instead of a flat fade
- Everything respects `prefers-reduced-motion` (effects are skipped, final states applied instantly)

## If you want to edit either animation
```
npm install
# edit src/three-hero.js or src/scroll-fx.js
npm run build:all      # rebuilds both bundles
```
Commit the updated files in `assets/` along with your source changes.

## Notes
- The 3D crystal is hidden on small phones (`max-width: 640px`) for performance.
- Tilt/parallax/float effects are skipped entirely when `prefers-reduced-motion` is on.
- Colors are pulled from the site's brass/navy palette — edit the gradients/lights in `src/three-hero.js` and the glass colors in `index.html`'s `.glass-surface` rule to change the look.
