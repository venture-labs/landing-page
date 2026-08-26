# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Prerequisites:** Node.js and pnpm must be installed. Check with:
```bash
node -v && pnpm -v
```
If either command is not found:
```bash
brew install node
npm install -g pnpm
```
(Corepack is no longer bundled with recent Node versions, so `pnpm` must be installed via npm.)

**Install dependencies:**
```bash
pnpm install
```

**Development server:**
```bash
pnpm dev
```
Runs on http://localhost:5173 by default.

**Build for production:**
```bash
pnpm build
```

## Project Overview

VentureLabs-Website is a React + Vite single-page application showcasing services and projects. Originally generated from a Figma Make file, it maintains Figma asset integration via a custom Vite plugin.

**Tech Stack:**
- React 18.3 with TypeScript
- Vite 6.3.5 (build tool)
- Tailwind CSS 4 (styling)
- React Router 7 (client-side routing)
- Radix UI (unstyled component primitives)
- Material UI (icons and components)

**Package Manager:** pnpm (workspace enabled via pnpm-workspace.yaml)

## Architecture

### Routing Structure
The app uses React Router with three main routes:
- `/` — Homepage with all sections (hero, profile, services, featured projects, pricing)
- `/leistungen` — Services listing page
- `/leistungen/:slug` — Individual service detail page

### Key Directories
- **src/app/** — Main application container and pages
  - `components/` — Reusable React components (Navbar, Hero, Services, Pricing, Footer, etc.)
  - `pages/` — Full page components (Leistungen, LeistungenDetail)
- **src/data/** — Content and configuration files
  - `services.ts` — Service definitions
  - `cases.ts` — Project/case studies
  - `pricing.ts` — Pricing data
  - `serviceDetails.ts` — Extended service information
  - `site.ts` — Global site configuration
- **src/styles/** — Global stylesheets
- **src/imports/** — Likely re-exports or utility imports
- **src/assets/** — Images and static files (referenced via Figma asset resolver)

### Component Patterns
Components are exported from `src/app/components/` and imported into pages or the main App. The app includes Radix UI primitives (accordion, dialog, select, etc.) with Tailwind styling applied via `class-variance-authority` for variant management.

### Figma Integration
A custom Vite plugin (`figmaAssetResolver` in vite.config.ts) resolves imports with the `figma:asset/` prefix to files in `src/assets/`. This enables seamless asset handling from Figma exports.

### Visual Effects
The homepage includes a mouse-follow glow effect managed via CSS variables (`--gx`, `--gy`) updated on mouse movement. The effect is applied as an overlay with a radial gradient and is toggled on/off based on mouse position.

## Important Notes

**Tailwind CSS:** Tailwind 4 is configured as a Vite plugin (`@tailwindcss/vite`). Both React and Tailwind plugins in vite.config.ts are required for Figma Make compatibility—do not remove them.

**Asset Inclusion:** The Vite config explicitly allows `.svg` and `.csv` files as raw imports. Do not add `.css`, `.tsx`, or `.ts` files to `assetsInclude`.

**Path Alias:** `@` resolves to `src/` for clean imports (e.g., `import { Button } from '@/components/ui/button'`).

**Data-Driven Content:** Service, pricing, and case data are centralized in `src/data/`. Modify these files to update content without touching components.

## Common Development Tasks

**Add a new service:** Update `src/data/services.ts` and `src/data/serviceDetails.ts`, then ensure the detail page references the slug.

**Style adjustments:** Modify Tailwind classes directly in components. Use `clsx` or `tailwind-merge` for conditional/merged class logic.

**Add a new page:** Create a file in `src/app/pages/`, then add a `<Route>` in `src/app/App.tsx`.

**Update Figma assets:** Export from Figma, place in `src/assets/`, and reference via `figma:asset/filename` or standard imports.

## Dependency Notes

- **Motion**: Animation library (currently v12.23.24)
- **Recharts**: Charting library (if needed for data visualization)
- **React Hook Form** + **Sonner** (toasts): For forms and notifications
- **React DnD**: Drag-and-drop support (if interactive features are added)
- Large collection of **Radix UI** primitives for building accessible components
