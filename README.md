# Gienah

Gienah is a digital product studio website built with Next.js. The project presents the studio's services, featured work, delivery process, company story, open roles, and contact information, with supporting project detail pages and a product-style landing/dashboard route.

## Main Routes And Sections

- `/` - marketing homepage with hero, technology ticker, Services, featured Projects, More from the studio, Agile methodology, About, Contact, and Footer sections.
- `/projects/[id]` - statically generated project detail pages driven by product data and local images.
- `/careers` - careers page with open roles from shared site content.
- `/landing` - product landing flow with login and dashboard screens.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- CSS Modules with global design tokens
- Motion for in-view and animation helpers
- Lucide React icons
- Native Canvas 2D for the star-field background

## Getting Started

This repository includes a `yarn.lock` file.

```bash
yarn install
yarn dev
```

The local development server runs at `http://localhost:3000` by default.

The package scripts can also be run with npm:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Build

```bash
npm run build
```

To run the production build locally after building:

```bash
npm run start
```

## Project Structure

```text
src/
  app/
    layout.tsx
    page.tsx
    styles/globals.css
    careers/
    landing/
    projects/[id]/
  shared/
    components/          Reusable UI primitives and section components
    data/                Editable JSON content for the site and routes
    utils/               Homepage shell, navigation, visual effects, hooks, helpers
  styles/tokens/         Global CSS tokens for color, type, spacing, motion, and fonts

public/
  assets/                Brand assets
  banners/               Project banner imagery
  logos/                 Partner and project logos
  mockups/               Homepage mockups
  */                     Project screenshot folders
```

## Content

Most site content is stored in JSON files under `src/shared/data/`:

- `site.json` - brand metadata, navigation, hero copy, careers roles, and About content.
- `services.json` - Services section content.
- `products.json` - featured projects, more projects, project detail copy, banners, screenshots, and logos.
- `agile.json` - Agile methodology stages.
- `landing.json` - landing/dashboard data.
- `partners.json` - partner/logo ticker data.

Images live under `public/` and are referenced from the JSON data by public paths.

## Visual System

The site uses a dark cinematic visual system on the marketing pages and lighter surfaces for project and landing screens. Styling is split between global design tokens and CSS Modules. Scroll-linked reveals, section connectors, sticky section choreography, and in-view light accents are implemented with React, CSS, SVG, IntersectionObserver, ResizeObserver, and Motion helpers.

The homepage star background is implemented with the native Canvas 2D API in `src/shared/utils/starfield/StarField.tsx`, mounted through `HomeStarBackdrop`. It supports reduced-motion behavior, visual-budget adjustments, parallax drift, twinkling stars, and optional constellation/shooting-star details.

## Development Notes

- `src/shared/utils/SiteApp.tsx` composes the marketing homepage and lazy-loads heavier sections.
- `src/shared/utils/homepagePrewarm.ts` prewarms homepage sections based on viewport proximity and visual budget.
- `src/shared/utils/visualBudget.ts` and `src/shared/utils/viewport.ts` tune animation and Canvas work for device capability.
- `src/shared/components/sections/` contains the homepage section implementations.
- `src/shared/components/` contains reusable UI primitives such as buttons, cards, inputs, tabs, badges, dialogs, switches, and tooltips.
