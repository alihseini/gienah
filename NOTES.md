# Gienah — project notes & handoff

Live repo: **alihseini/gienah** (branch `main`). The Next.js app lives in **`gienah/`**.

## What this is
A **Next.js 15 (App Router) + TypeScript + CSS Modules** marketing site + product console for **Gienah**, a digital‑product studio. Dark, cinematic, premium. Recreated from a Claude Design handoff bundle (the original HTML/CSS prototypes are in the repo root under `project/`, and the design chat in `chats/`).

## Run it
```bash
cd gienah
yarn install        # (npm works too; repo uses yarn.lock — don't reintroduce package-lock.json)
yarn dev            # http://localhost:3000
yarn build          # production build (this is the check we run before every push)
```
Node 18.18+ (built on Node 22).

## Routes
- `/` — the marketing site (one-page scroll).
- `/projects/[id]` — case-study detail pages (SSG, 11 products). Dark themed.
- `/careers` — Job Opportunities (its own page; distinct gradient + animations).
- `/console` — product console (login → dashboard).

## Structure
```
gienah/src/
  app/
    globals.css            # tokens + fonts (global) + global @keyframes
    layout.tsx, page.tsx   # root + marketing home (renders <SiteApp/>)
    projects/[id]/         # case-study route (ProjectDetail + module css)
    careers/               # careers route
    console/               # console route
  components/              # 17 design-system primitives (.tsx) + ds.module.css (shared)
  site/                    # ALL marketing-site pieces:
    SiteApp.tsx            # composition + scroll-choreography hooks
    sections.tsx           # Hero, Services, Featured(Products), MoreProducts, Agile, About, Contact, Footer
    helpers.tsx            # Reveal, Parallax, CountUp, SectionHead, AnimatedBG, hooks, siteStyles
    Nav.tsx                # floating bubble nav
    LogoTicker.tsx         # partner-logo marquee (data-driven)
    StarField / HeroAtmosphere / LogoConstellation   # hero background system
    Aurora / Meteors       # Services background layers
    BackgroundBeams        # About background
    LightPillar            # three.js shader (Products background)
    ParticleField          # Contact particle halo
    HeadingReveal          # word-by-word title reveal
    TypingAnimation        # section-description typing effect
    motion.tsx             # Motion (framer-motion) primitives: Stagger/StaggerItem/FadeIn/Lift/Press
    GienahLight + gienahLight.module.css   # per-section "Gienah light signature" (star core+halo+cross-flare)
    site.module.css        # the big marketing CSS module
  data/                    # EDITABLE JSON content (see below)
  styles/tokens/           # colors/type/spacing/elevation/motion/fonts
```

## Editable data (no code changes needed)
- `data/products.json` — products (homepage carousel via `featured: true`, case studies, image paths under `/public/uploads`).
- `data/services.json`, `data/agile.json`, `data/site.json` (nav/hero/about/roles/marquee), `data/console.json`, `data/partners.json` (logo ticker — logos in `/public/logos`).

## Conventions / gotchas (important for the next session)
- **CSS Modules everywhere.** Tokens + fonts + a few global `@keyframes` are global (in `globals.css`); everything else is a `*.module.css`.
  - **Pitfall:** an `@keyframes` defined in `globals.css` but referenced from a module gets its animation-name scoped/renamed and silently won't run. Define keyframes **inside the same module** that uses them (this caused the "static marquee" bug — see `logoTicker.module.css`).
  - Selectors must be "pure" (contain a local class). Attribute-only selectors are wrapped in `:global(...)` and scoped under `.site` (see `site.module.css`).
- **No Tailwind.** Aceternity/Magic UI background effects are still ported natively (CSS keyframes + IntersectionObserver/rAF) — don't add Tailwind.
- **Motion (`motion` pkg, the framer-motion rebrand) IS now a dep — but only for the *interaction layer*.** Use it (via `src/site/motion.tsx`: `Stagger`/`StaggerItem`/`FadeIn`/`Lift`/`Press` and `GienahLight`) for viewport reveals, staggered entrances, hover/tap, nav/menu, and the per-section "Gienah light signature" activation (`useInView`). **Do NOT** use Motion for the scroll-coupled systems (parallax / sticky decks / `useLayerChoreography`) — those stay hand-rolled rAF, and Three.js/WebGL + CSS-module backgrounds/glows/starfields stay as-is.
- **Reduced-motion + SSR hydration (important):** any component whose *rendered markup* depends on `prefers-reduced-motion` must NOT read it synchronously in render/`useState` — the server can't read the media query, so the reduced client hydrates a different tree (React #418). Detect it AFTER mount (`const [reduce,setReduce]=useState(false); useEffect(()=>setReduce(reduceMotion()),[])`) — this is what `Services` does. For Motion components, keep the animation *targets* and gesture-prop *shape* identical regardless of reduced motion (only change the transition to `{duration:0}` and neutralise hover/tap values); toggling `whileTap` on/off flips Motion's `tabindex` and also mismatches.
- **Brand colors only:** azure `#2A92CC` / `#58ABCE`, gold `#F4C65F` / `#E2AA3B`.
- **Hydration:** components that use `Math.random()` for decoration (Sparks, Meteors) are **client-gated** (render after mount) to avoid SSR mismatch. Keep that pattern for any new random visuals.
- **Sticky sections:** Services, Products, and Agile-ish use internal `position: sticky` scroll stages. **Do not wrap them in a moving `transform`** — it breaks sticky pinning. (This is why the "layered section transitions" experiment was reverted.)
- **lucide-react** for icons via the `<Icon name="kebab-case" />` helper.

## Git / pushing
- Push is via HTTPS with a fine-grained PAT (the sandbox has no stored write creds). Commits authored as `Claude <noreply@anthropic.com>`.
- Commits show **"Unverified"** on GitHub — this sandbox has no usable commit-signing key (placeholder only). Cosmetic; code is intact. Set up a real SSH/GPG signing key locally if you want verified commits.

## Open items / ideas
- `ui-ux-pro-max` skill install is **blocked in this cloud sandbox** (git proxy 403s non-connected repos). Run `npx -y skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max --agent claude-code` in **local** Claude Code instead.
- Optional: gentle intra-section parallax on Products/More (safe — doesn't touch sticky mechanics).
- Some products (HR Management, Tapsi Legal screens) lack real images and fall back to branded placeholders — drop assets in `/public/uploads` + point `products.json` at them to upgrade.
