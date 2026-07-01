# Gienah — Next.js + CSS Modules

A production implementation of the **Gienah Design System** export (`../project/`), built
with **Next.js (App Router) + TypeScript + CSS Modules**. It recreates, pixel-for-pixel,
the three surfaces the design was iterated into:

1. **Marketing story-scroll site** (`/`) — dark cinematic hero with an animated mesh
   background, a sticky scroll-stack **Services** showcase, a stepped sticky **Products**
   carousel, a flowing **More from the studio** list, an **Agile methodology** section with
   a real Three.js light-pillar background, **About**, **Careers**, and a **Contact**
   section with a brand particle-halo canvas and scroll-linked scale reveal.
2. **Case-study detail pages** (`/projects/[id]`) — banner, overview, at-a-glance, and a
   screenshot grid, wired with the real project screenshots.
3. **Product landing** (`/landing`) — login → dashboard (overview, deployments,
   observability, storage, settings) composed from the design-system primitives.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Editing content (no code changes needed)

All copy, data, and image mappings live in editable JSON under `src/data/`:

| File | Drives |
| --- | --- |
| `products.json` | Featured + "more" products, case-study copy, and **image paths** (`banner`, `shots`). Set `featured: true` to put a product in the homepage carousel. Point `banner`/`shots` at any file in `public/uploads/` (or `null`/`[]` to fall back to a branded placeholder frame). |
| `services.json` | The four Services scroll-stack panels. |
| `agile.json` | Agile methodology stages. |
| `site.json` | Brand name, contact email, nav links, marquee items, hero copy + stats, open roles, About copy + stats. |
| `landing.json` | Landing org/user, deployments, metrics, charts, storage, settings toggles. |

Images live in `public/uploads/` and `public/assets/logo-mark.png`. Drop new screenshots
in `public/uploads/` and reference them from `products.json`.

## Architecture

```
src/
  app/
    globals.css            # imports tokens + fonts (global); global @keyframes
    layout.tsx, page.tsx   # root layout + marketing home
    projects/[id]/         # case-study route (SSG via generateStaticParams)
    landing/               # product landing route
  components/              # 17 design-system primitives (.tsx) + ds.module.css
  site/                    # marketing-site pieces (sections, Nav, LightPillar,
                           #   ParticleField, helpers/hooks) + site.module.css
  styles/tokens/           # design tokens (colors, type, spacing, elevation, motion, fonts)
  data/                    # editable JSON content
```

### Styling approach (CSS Modules)

- **Design tokens** (CSS custom properties) and **`@font-face`/`@keyframes`** are global
  (`globals.css` + `styles/tokens/`) — they have to be, and inline styles reference some
  keyframes by name.
- **Everything else is a CSS Module**: every primitive is backed by `components/ds.module.css`;
  the marketing site's section/animation styling lives in `site/site.module.css`; each route
  has its own `*.module.css`.
- The marketing site re-themes the design tokens to its dark cinematic palette by scoping the
  overrides to the `.site` wrapper class — the same primitives render light in the landing and
  on the case-study pages.
- JS-driven scroll state (section entrance, off-screen animation pausing) uses **data
  attributes** (`data-sx`, `data-shown`, `data-paused`) so it survives CSS-module class hashing.

## Notes & substitutions (carried over from the design system)

- **Fonts**: Geist + Geist Mono via the Google Fonts CDN (`styles/tokens/fonts.css`).
  Self-host the `.woff2` files for production.
- **Icons**: `lucide-react` (the design's chosen substitution for a brand icon set).
- **Brand colors** are sampled from the logo: azure `#2A92CC`, gold `#E2AA3B`
  (with `#58ABCE` / `#F4C65F` light variants used in the motion system).
- The Three.js **LightPillar** is a faithful port of the ReactBits shader, colors set to brand
  blue/gold; it pauses rendering when scrolled off-screen and honors `prefers-reduced-motion`.
