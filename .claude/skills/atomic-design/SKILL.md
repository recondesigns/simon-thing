---
name: atomic-design
description: Enforces Atomic Design structure (atoms/molecules/organisms/templates/pages) for UI components in simon-thing. Use whenever creating, moving, reviewing, or organizing a component under src/components or src/app.
---

Follow Atomic Design when creating or organizing components in this repo. Every component lives in exactly one tier under `src/components/`, named by what it *is*, not by what feature it belongs to.

## Tiers

- **atoms** (`src/components/atoms/`) — smallest indivisible UI primitives that can't be broken down further without losing meaning: a button, an input, an icon, a label, a single lit/unlit color pad. Usually a thin, styled wrapper around one MUI primitive. No knowledge of app state or business logic.
- **molecules** (`src/components/molecules/`) — small groups of atoms functioning together as one unit: a labeled input, an icon button with a tooltip, a score readout (label + number). Still generic and reusable outside this specific app.
- **organisms** (`src/components/organisms/`) — distinct, complex sections composed of molecules and atoms, specific to this product: the game board, the header/scoreboard, a settings panel. These can hold local UI state and read from Zustand stores.
- **templates** (`src/components/templates/`) — page-level layout skeletons that arrange organisms/molecules into a structure, with no real data — just placement and responsive layout.
- **pages** — Next.js route components under `src/app/`. These fetch/own real data and state, and render a template filled with real organisms. Don't create a `pages/` tier under `src/components/` — the App Router *is* the pages layer.

## Rules

- One component per directory, colocated with its story and styles: `atoms/Button/Button.tsx`, `Button.stories.tsx`, `Button.module.css` (matches the existing convention in this repo).
- Before creating a component, decide its tier by asking "what's the smallest thing this can't be broken into?" — don't default everything to organism.
- A component may only import from its own tier or tiers below it (organisms → molecules/atoms; molecules → atoms). Never import a molecule into an atom, or an organism into a molecule.
- If a component grows business logic or reads app state (Zustand), it has outgrown "atom" or "molecule" — move it up to organism rather than smuggling state into a lower tier.
- Prefer composition over configuration: an organism assembles molecules/atoms as children rather than one component with many conditional branches.

## Applying this to existing code

`src/components/Button` and `src/components/Counter` predate this convention and live flat. Move them into `atoms/` (Button) and `organisms/` (Counter, since it owns store state) the next time either is touched, rather than as a standalone reorg.
