# Performance Phase 8 Runtime Audit

Local audit date: 2026-07-03

Scope: runtime architecture for the Gienah landing page, focused on canvas, scroll-linked work, rAF loops, layout reads/writes, compositor layer pressure, low-end budgets, and dynamic section loading. This report is audit-only; no source behavior was changed.

## 1. Executive summary

The current homepage is no longer dominated by many different canvas systems. `ParticleField`, `Meteors`, and `BackgroundBeams` are not present in the live `src/shared` tree. The active canvas system is `StarField`, mounted directly in Hero and Agile and indirectly through `SectionStars` in Services, Products, Studio, About, and Contact. Because each `StarField` owns a canvas, its own `requestAnimationFrame` loop, and its own `IntersectionObserver`, the homepage can still have up to seven canvas instances in or near the viewport over a full scroll session.

The stronger remaining performance risk is scroll orchestration. The page has multiple independent scroll listeners and rAF loops: global parallax, global layer choreography, scroll progress, every section connector, ProductStoryline, Services sticky cards, and Agile timeline progress. Most handlers are rAF-throttled, visibility-gated, and skip duplicate writes, which is good. The cost comes from the number of independent systems that can read layout and write transforms/CSS variables in separate rAF callbacks during the same frame.

Compositor layer pressure is also plausible. There are permanent or long-lived `will-change` hints on reveal elements, parallax wrappers, product rows, active service cards, nav/fab elements, ticker marquee, heading reveals, hero atmosphere, Agile slots, and Studio preview layers. Several are appropriate while animating, but Phase 8.3 should add lifecycle release for elements that settle.

## 2. Top 5 likely causes of current lag/memory pressure

1. Multiple active canvas backing stores from `StarField`: Hero, Agile, and five `SectionStars` sections can allocate canvases. DPR is capped and offscreen rAF pauses, but canvases are not unmounted when far away.
2. Many independent scroll/rAF systems: `useParallax`, `useLayerChoreography`, `ScrollProgress`, `SectionConnector` instances, `ProductStoryline`, Services sticky cards, and Agile timeline all subscribe separately.
3. Interleaved layout reads and style writes: several scroll systems call `getBoundingClientRect()` and then write transforms, CSS variables, MotionValues, attributes, or opacity in separate rAF callbacks.
4. Persistent compositor hints: `will-change` is left active on broad classes such as `.reveal`, `.parallax`, `[data-sx]`, `.pjRow`, `.svcCard`, ticker track, and Agile slots/connectors.
5. Low-end/mobile reductions are partial: `StarField` lowers quality and FPS, parallax halves on mobile, and reduced motion disables many effects, but Services sticky cards, ProductStoryline, SectionConnector, and Agile scroll progress still run on mobile at mostly desktop architecture cost.

## 3. Canvas / WebGL inventory

| System | Component/file | Mounted/used | Possible homepage instances | Own rAF loop | Pauses offscreen | Unmounts far away | DPR/backing store | Cleanup | Mobile/low-end/reduced motion | Risk |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| StarField | `src/shared/utils/starfield/StarField.tsx` | Directly in Hero and Agile; indirectly by SectionStars | Up to 7 | Yes, `loop()` schedules rAF at lines 208-216 | Yes, IO at lines 218-223 and document visibility at 233-234 | No; canvas stays mounted, paused | DPR capped to 1.5 desktop, 1.25 low-end, and pixel budget at lines 82-87 | Cancels rAF, disconnects IO, clears arrays, sets canvas to 0x0 at lines 236-244 | Low-end reduces quality and caps FPS to 30 at lines 59-61; reduced motion renders once | Medium-high |
| SectionStars | `src/shared/utils/sectionStars/SectionStars.tsx` | Services, Products, Studio, About, Contact | 5 | Inherited from StarField | Inherited | Inherited | `density=5600`, `maxCount=300`, `reducedMax=110`, no shadow/constellations/shooting | Inherited | Inherited; no separate mobile disable | Medium |
| Hero StarField | `src/shared/components/sections/heroSection/HeroSection.tsx` | Hero background through `ScrollParallax` | 1 | Inherited from StarField | Inherited | Inherited | Default dense params: density 4200, max 460, shadow on | Inherited | Low-end quality reduction only | Medium-high because it is LCP-adjacent but should not be changed in this phase |
| Agile StarField | `src/shared/components/sections/agileSection/AgileSection.tsx` | Agile background through `ScrollParallax` line 166 | 1 | Inherited from StarField | Inherited | Inherited | Default dense params, shadow on | Inherited | Low-end quality reduction only | Medium-high |
| ParticleField | Not found in live `src/shared` | Previously removed | 0 | N/A | N/A | N/A | N/A | N/A | N/A | Low |
| Meteors / BackgroundBeams | Not found in live `src/shared` | Previously removed | 0 | N/A | N/A | N/A | N/A | N/A | N/A | Low |
| LightPillar / shader / WebGL / Three | No homepage component found. `three` is installed in `package.json`, but no live `src/shared` import/use was found. | None on homepage | 0 | N/A | N/A | N/A | N/A | N/A | N/A | Low |

Non-homepage note: `StarField` is also mounted in `src/app/projects/[id]/components/ProjectDetail.tsx` and `src/app/careers/components/CareersPage.tsx`. These are route-specific, not concurrent with the landing page.

## 4. Scroll / rAF inventory

| System | File | What it does | Own scroll listener | Own rAF | Layout reads | Writes | Duplicate write skip | Viewport gate | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ScrollProgress | `src/shared/utils/helpers.tsx` lines 287-296 | Fixed top progress bar | Yes | No | `scrollHeight`, viewport height | React state width | No explicit duplicate skip | No | Medium |
| useParallax | `src/shared/utils/helpers.tsx` lines 145-204 | Drives all `[data-parallax]` transforms | Yes | Yes | Offset chain and `offsetHeight` on collect; scroll position per frame | `style.transform`, `style.willChange` | Yes, `item.last` | Proximity skip per item, not IO | High |
| useLayerChoreography | `src/shared/utils/helpers.tsx` lines 318-375 | Drives all `[data-layer]` transforms/opacity | Yes | Yes | Offset chain and `offsetHeight` on collect | `style.transform`, `style.opacity` | Yes, last transform/opacity | Proximity skip per item, not IO | Medium |
| SectionConnector | `src/shared/utils/sectionConnector/SectionConnector.tsx` lines 251-321 | Draws per-section journey SVG path | Yes per instance | Yes per instance | `getBoundingClientRect()` per active frame at line 290; measurement on resize at line 132 | MotionValues and node/star attributes | Yes, thresholded `last1/last2` | IO rootMargin 120% | High due to many instances |
| ProductStoryline | `src/shared/utils/productStoryline/ProductStoryline.tsx` lines 223-292 | Draws Products path and reveals rows | Yes | Yes | `getBoundingClientRect()` per active frame at line 272; offset measurement on resize | MotionValue, data attributes | Yes for draw fraction; attributes once | IO rootMargin 120% | High in Products entry |
| Services sticky deck | `src/shared/components/sections/servicesSection/ServicesSection.tsx` lines 155-185 | Scroll-playhead for stacked service cards | Yes | Yes | `getBoundingClientRect()`, `offsetHeight` per active frame | `style.transform`, `style.opacity`, React active index occasionally | Yes via WeakMap style cache | IO rootMargin 120% | High |
| Agile reveal IO | `src/shared/components/sections/agileSection/AgileSection.tsx` lines 56-73 | Reveals timeline slots once | No scroll listener | No | `getBoundingClientRect()` on setup | data attribute | N/A | IO | Low |
| Agile path build | `src/shared/components/sections/agileSection/AgileSection.tsx` lines 78-113 | Measures timeline path and mobile rail | Resize only | No | `clientWidth`, `clientHeight`, offsets | React state, CSS vars `--rail-top/bottom` | No explicit CSS var cache | ResizeObserver | Medium |
| Agile path progress | `src/shared/components/sections/agileSection/AgileSection.tsx` lines 118-158 | Draws Agile timeline via `--p` | Yes | Yes | `getBoundingClientRect()` per active frame | `style.setProperty("--p")` | Yes, `lastP` | IO rootMargin 120% | Medium-high |
| Hero pointer parallax | `src/shared/components/sections/heroSection/HeroSection.tsx` lines 25-60 | Fine-pointer mousemove transform on atmosphere | Mousemove only | Yes while easing | No layout read except viewport height in pointer math | `style.transform` | Yes, transform string cache | IO | Low-medium |
| Reveal / HeadingReveal / Typing / CountUp | `helpers.tsx`, `headingReveal`, `typing` | Entry animations and text/count effects | No scroll listener | One-shot rAFs/timers | `getBoundingClientRect()` on setup | React state/classes | N/A | IO or setup check | Low-medium collectively |

## 5. Layout thrashing risks

- `SectionConnector` and `ProductStoryline` both read `svg.getBoundingClientRect()` inside their own scroll-rAF callbacks, while other systems may write transforms/opacity in separate callbacks during the same frame.
- Services sticky deck reads `trackRef.current.getBoundingClientRect()` and `deckRef.current.offsetHeight` per active frame, then writes transforms and opacity to each card.
- Agile progress reads `root.getBoundingClientRect()` and writes `--p` per active frame. Agile build also writes rail CSS variables after offset measurements on resize.
- `useParallax` and `useLayerChoreography` are better than earlier transform-sensitive reads because they use offset chains for layout-space measurement and skip off-proximity items, but they still write transforms in independent rAF callbacks.
- First visible frame risk exists in Products and SectionConnector because resize/settle measurements happen after mount and can coincide with reveal transforms, image decode, and connector drawing.
- `ScrollProgress` updates React state on every scroll event without rAF throttling. This is small visually, but it adds another independent update path.

## 6. will-change / compositor layer risks

| File/class | Lines | Permanent or temporary | Release behavior | Multiplicity | Mobile/low-end | Phase 8.3 note |
| --- | --- | --- | --- | --- | --- | --- |
| `.reveal` | `src/shared/utils/site.module.css:88` | Long-lived opacity hint | `.settled` removes transition but does not clear will-change | Many reveal elements | Active unless reduced-motion CSS overrides some transforms only | Clear after settled or avoid permanent hint |
| `.parallax` / inline `style.willChange` | `site.module.css:110`, `helpers.tsx:163-170` | Permanent while collected | Safari-lock can set auto; otherwise not cleared until unmount | Every `[data-parallax]` element | Mobile gets half movement, still promoted | Add proximity-based promotion/release |
| `[data-sx]` | `site.module.css:142-154` | Long-lived opacity hint | No release after `data-shown` | Studio/About/Contact sections | Reduced motion sets opacity/transform only | Clear after section shown |
| `.layer` | `site.module.css:154` | Permanent transform/opacity hint | No visible release | Any `[data-layer]` layer if present | Reduced motion forces transform none | Audit live usage; clear when out of active range |
| `.pjRow` | `site.module.css:421-437` | Permanent until row reveal and after | No release after `data-revealed` | One per featured product | Active on mobile too | Clear after reveal transition completes |
| Nav/FAB panel | `site.module.css:801` | Permanent multi-property hint | No release found | Single nav/fab panel | Active globally | Reduce hinted properties or lifecycle only while open |
| `.svcCard` | `site.module.css:899-909` | Active card permanent, hidden cards auto | Hidden cards release via aria-hidden | Number of service cards, one active promoted | Active on mobile sticky deck | Good pattern; ensure active old cards release promptly |
| `.pcard/.scard` legacy carousel classes | `site.module.css:1343` | Permanent if still used | No release found | Unknown live use | Unknown | Verify if dead CSS; remove only in a later cleanup phase |
| `.track` ticker | `src/shared/utils/logoTicker/logoTicker.module.css:19` | Permanent marquee transform hint | Reduced motion disables animation but hint remains unless overridden by cascade | One long track | Active mobile unless reduced motion | Consider disabling will-change when paused/reduced |
| Hero atmosphere | `src/shared/utils/heroAtmosphere/heroAtmosphere.module.css:18` | Permanent transform/opacity hint | No release found | One hero atmosphere | Pointer parallax fine-pointer only, but CSS hint exists | Do not change Hero/LCP now; include in 8.3 |
| HeadingReveal | `src/shared/utils/headingReveal/headingReveal.module.css:10,20` | Temporary by class if `.in` applies | CSS has `will-change:auto` on shown state | Many headings | Reduced motion likely not material | Good lifecycle pattern |
| GienahLight | `src/shared/utils/gienahLight/gienahLight.module.css:129` | Permanent opacity hint | No release found | Hero light | Active in Hero | Keep out of Phase 8.1 |
| Agile slots/connectors | `agileStage.module.css:49,75` | Permanent until revealed | No release after reveal | One per Agile card plus pseudo glow | Mobile too | Clear after reveal; reduce node pulse on low-end |
| Studio preview | `studioSection/moreExplorer.module.css:111` | Permanent transform/opacity hint | No release found | Preview layers, at most previous+current mounted | Touch drops hover pane by media query state | Phase 8.3 candidate |

## 7. Low-end/mobile visual budget findings

Current detection:

- `lowEndMotionDevice()` in `src/shared/utils/viewport.ts` treats narrow viewport (`max-width: 760px`), `hardwareConcurrency <= 4`, or `deviceMemory <= 4` as low-end.
- `StarField` uses low-end to reduce quality, cap DPR, lower pixel budget, and throttle to 30 FPS.
- `prefers-reduced-motion` is checked in `StarField`, shared hooks, Services, Agile, ProductStoryline, and SectionConnector.
- `useParallax` halves movement on `max-width: 760px`.
- Services uses a `max-width: 1023px` match to alter deck behavior, but it still keeps the sticky scroll deck unless reduced motion is set.
- Studio drops the hover preview pane on `max-width: 920px`.

Effects already reduced:

- StarField quality/count/DPR/FPS on low-end.
- StarField reduced motion renders once.
- Global parallax disabled under reduced motion and halved on mobile.
- Services reduced motion uses a plain stack.
- ProductStoryline and SectionConnector fully draw under reduced motion.
- Agile reduced motion reveals cards and disables draw transition/pulse animation.
- LogoTicker stops animation under reduced motion.

Effects still running at desktop-level architectural cost on low-end/mobile:

- Multiple SectionConnector instances still register per-instance scroll listeners/rAF and use wide `rootMargin`.
- ProductStoryline still measures/draws with the same scroll architecture on mobile.
- Services sticky deck still runs scroll-progress transforms on mobile/tablet unless reduced motion.
- Agile timeline still has scroll progress and animated streaks unless reduced motion.
- SectionStars still mounts StarField canvases on mobile/low-end, only reduced by density/count/DPR rather than collapsed into fewer shared canvases.

Phase 8.4 candidates:

- Add a low-end visual budget tier separate from reduced motion.
- On low-end/mobile, reduce SectionStars count or replace some section canvases with CSS/static stars.
- Consider simpler Services mobile behavior without sticky card transforms.
- Consider disabling Agile decorative streak animation and lowering node pulse costs on low-end.
- Keep Hero/LCP behavior unchanged unless a later explicit phase allows it.

## 8. Dynamic import / prewarm findings

Dynamic imports in `src/shared/utils/SiteApp.tsx`:

- Services: line 12
- Featured/Products: line 13
- Studio/MoreProducts: line 14
- Agile: line 15
- About: line 16
- Contact: line 17
- Footer: line 18

These use `next/dynamic` with default client behavior. There is no explicit visibility loader, prewarm, or preload strategy in this file. Because `SiteApp` renders the sections in order, chunks can still load during hydration/mount rather than only when visible, but Products/Agile/Studio/Services can also do expensive measurement/decode soon after they mount.

Phase 6.2 prewarm is still useful after Phase 8.1/8.2 if scroll entry still feels late, especially for Products and Agile. However, prewarm should come after canvas reduction and scroll coordination so it does not hide the underlying runtime contention.

## 9. Prioritized next phases

1. Phase 8.1 Canvas Budget Reduction
   - Reduce how many `StarField` canvases can be active or allocated across lower sections.
   - Keep Hero/LCP behavior unchanged.
   - Prefer section-level budget changes over broad redesign.
2. Phase 8.2 Scroll/rAF Coordinator
   - Consolidate scroll reads/writes for SectionConnector, ProductStoryline, Services, Agile, parallax, and layer choreography.
   - Establish one measured frame pipeline: read first, compute, write after.
3. Phase 8.3 will-change Lifecycle
   - Release layer hints after reveal/settle/offscreen.
   - Avoid permanent hints on many rows/cards.
4. Phase 8.4 Low-End Visual Budget
   - Add an explicit low-end tier and simplify nonessential visuals beyond reduced motion.
5. Phase 6.2 Smooth Section Prewarm
   - Prewarm dynamic chunks and key images only after runtime pressure is reduced.

## 10. Exact recommended changes for Phase 8.1 only

Do not implement these in this audit phase.

1. Preserve Hero `StarField` exactly for LCP/brand continuity.
2. Reduce lower-section canvas count:
   - Replace some `SectionStars` instances with a lightweight non-canvas static star layer or a shared background layer.
   - Highest-value targets: Studio, About, Contact, because they currently each mount their own `SectionStars` canvas for subtle background continuity.
3. Change Agile `StarField` from default dense settings to the cheaper SectionStars-style parameters:
   - `density={5600}`
   - `maxCount={300}`
   - `reducedMax={110}`
   - `shadow={false}`
   - `constellations={false}`
   - `shooting={false}`
4. Consider a viewport-distance unmount wrapper for non-Hero StarField instances:
   - Mount within near viewport range.
   - Pause inside the existing IO range.
   - Unmount and release backing store when far away.
5. Keep the required layering order:
   - page background
   - connector line/path
   - section decorations
   - content/cards/visuals
   - title nodes + activation star
6. Add a before/after canvas count check:
   - `document.querySelectorAll("canvas").length`
   - log only manually in DevTools, not committed instrumentation.

## 11. Validation checklist for future phases

- Run `npm.cmd run build` or `npm run build` depending on PowerShell policy.
- Check lint only if `next lint` is configured; otherwise record the interactive prompt as a tooling blocker.
- Chrome Performance recording with Memory checkbox:
  - Full page scroll from Hero through Contact.
  - Products entry.
  - Services sticky intro and final card hold.
  - Agile heading and timeline entry.
- Check JS heap:
  - After load.
  - After full scroll down.
  - After scroll back to top.
- Check canvas count:
  - `document.querySelectorAll("canvas").length`
  - During Hero, Products, Agile, Contact.
- Check layers/GPU if available:
  - Chrome DevTools Layers panel.
  - Performance trace layer count and raster/composite activity.
- Check scroll frame gaps:
  - Long tasks over 50 ms.
  - rAF frame spacing spikes over 32 ms.
- Check low-end simulation:
  - Mobile viewport.
  - CPU throttling.
  - `prefers-reduced-motion`.
  - Low-memory/low-core device if available.
- Check visual layering after every phase:
  - page background
  - connector line/path
  - section decorations
  - content/cards/visuals
  - title nodes + activation star

## Validation results for this audit

- Source code changed: no.
- Audit markdown created: yes, this file.
- `git status` before audit: clean tracked tree on `main...origin/main`; untracked `.claude/skills/openclaw-master-skills/` present and intentionally untouched.
- Scripts in `package.json`: `dev`, `build`, `start`, `lint`.
- Build: `npm.cmd run build` passed. Next.js compiled successfully, lint/type validity checks completed inside build, and static generation completed for 18 pages.
- Lint: `npm.cmd run lint` did not complete because `next lint` opened the interactive ESLint configuration prompt: "How would you like to configure ESLint?" No lint config was created or changed.
- Separate typecheck script: none present in `package.json`.
