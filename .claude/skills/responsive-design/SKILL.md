---
name: responsive-design
description: Implement modern responsive layouts using container queries, fluid typography, CSS Grid, and mobile-first breakpoint strategies. Use when building adaptive interfaces, implementing fluid layouts, or creating component-level responsive behavior.
---

# Responsive Design

Implement modern responsive layouts using container queries, fluid typography, CSS Grid, and mobile-first breakpoint strategies. Use this skill when building adaptive interfaces, implementing fluid layouts, or creating component-level responsive behavior.

> Based on the official **Responsive Design — LeoYeAI** skill concept from the Skills Directory
> (https://www.skillsdirectory.com/skills/leoyeai-responsive-design), adapted with
> Gienah-project-specific rules.

## 1. When to Use This Skill

- Implementing mobile-first responsive layouts
- Using container queries for component-based responsiveness
- Creating fluid typography and spacing scales
- Building complex layouts with CSS Grid and Flexbox
- Designing breakpoint strategies for design systems
- Implementing responsive images and media
- Creating adaptive navigation patterns
- Fixing responsive UI issues across mobile, tablet, desktop, and large desktop

## 2. Core Capabilities

### Container Queries
- Component-level responsiveness independent of viewport
- Container query units like `cqi` / `cqw`
- Style queries where useful
- Browser support fallbacks

### Fluid Typography & Spacing
- CSS `clamp()`
- Fluid type scales with min/max bounds
- Fluid spacing tokens
- CSS variables for consistent responsive scales

### Layout Patterns
- CSS Grid for 2D layouts
- Flexbox for 1D distribution
- Intrinsic layouts
- `auto-fit` / `minmax()` patterns
- `aspect-ratio` for visual consistency

### Breakpoint Strategy
- Mobile-first media queries
- Content-based breakpoints, not device-only breakpoints
- Feature queries with `@supports`
- Avoid excessive breakpoint hacks

### Responsive Navigation
- Mobile menu behavior
- Proper touch targets
- Accessible toggle state
- No broken navbar layout across breakpoints

### Responsive Images / Media
- Prevent image deformation
- Use `width` / `height` / `aspect-ratio` / `object-fit` correctly
- Avoid layout shift
- Preserve visual composition across devices

### Viewport Units
- Avoid problematic `100vh` on mobile
- Use `svh` / `dvh` / `lvh` where appropriate
- Prevent mobile browser UI height bugs

## 3. Quick Reference

Mobile-first breakpoints (adjust based on content, not blindly copied):

| Breakpoint | Target |
|------------|--------|
| Base       | mobile first (no media query) |
| `640px`    | small devices / landscape phones |
| `768px`    | tablets |
| `1024px`   | laptops / small desktops |
| `1280px`   | desktops |
| `1536px`   | large desktops |

> Breakpoints should be **content-based** — introduce one where the layout actually
> breaks or looks awkward, not because a device has a certain width.

## 4. Best Practices

- Mobile-first
- Content-based breakpoints
- Fluid over fixed
- Container queries for component-level responsiveness
- Test real viewport widths
- Avoid horizontal overflow
- Minimum **44×44px** mobile touch targets
- Logical properties where useful (e.g. `inline-size`, `margin-inline`)
- Preserve accessibility
- Avoid layout thrashing
- Avoid unnecessary JavaScript for layout fixes

## 5. Common Issues to Detect

- Horizontal overflow
- Fixed widths causing viewport breakage
- `100vh` mobile issues
- Text too small or too large
- Touch targets too small
- Aspect-ratio distortion
- Cards clipped outside viewport
- Content overlap
- Awkward tablet layout
- Large desktop stretching
- Z-index / stacking issues
- Decorative / connector lines breaking responsive layout

## 6. Gienah Project Context

This project is the **Gienah landing page**, a premium cosmic/constellation themed
company/studio website.

Sections:
- Hero
- LogoTicker
- Services
- Products
- More From The Studio / Our Studio
- Agile Methodology
- About
- Contact
- Footer
- Navbar / mobile menu

The site already has a **constellation journey connector system**. Do not refactor
that architecture unless a small responsive spacing, z-index, or positioning fix is
required.

## 7. Gienah Responsive Rules

- Do not redesign the website
- Do not change copy/content
- Do not change the cosmic visual identity
- Do not change section architecture
- Preserve current animations unless they cause responsive bugs
- Prefer clean CSS fixes over hardcoded hacks
- Prefer `clamp()`, CSS variables, Grid/Flexbox, container queries, and intrinsic sizing
- Keep desktop behavior unchanged unless broken
- No horizontal scroll on any viewport
- Fix only responsive issues, not unrelated design details

## 8. Section-by-section Audit Checklist

For each section, check:
- spacing
- title alignment
- text overlap
- card clipping
- image/visual deformation
- connector/decoration overlap
- vertical rhythm
- horizontal overflow
- tablet layout quality
- large desktop max-width and spacing
- mobile touch targets

## 9. Final Validation Checklist

- No horizontal scroll
- No console errors
- No title/text overlap
- No cards clipped outside viewport
- No deformed visuals
- Tablet layout feels intentional
- Large desktop feels premium
- Mobile touch targets are comfortable
- Navbar/mobile menu works correctly
- Connector lines do not create responsive layout bugs
- Animations remain smooth
- `prefers-reduced-motion` is respected where relevant
