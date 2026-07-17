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

## Stories

Every component gets a colocated `.stories.tsx`, and at least one story must assert a **computed** value — never just that it rendered.

This is a rule rather than a preference because a render-only test already hid a real bug. Storybook was missing the MUI `ThemeProvider` decorator, so `theme.tokens` was `undefined` in every story and components silently fell back to MUI's default palette. Every smoke test passed the whole time. It only surfaced when a story asserted `getComputedStyle` and got the wrong color back.

```tsx
export const Default: Story = {
  play: async ({ canvasElement }) => {
    // bg/success/fill (#27A93A) — naming the token keeps the value traceable.
    const el = canvasElement.querySelector("button");
    await expect(getComputedStyle(el!).backgroundColor).toBe("rgb(39, 169, 58)");
  },
};
```

Assert what the component is *for*: the resolved token color, the computed layout (`flexGrow`, row and column counts), text that must be present. Anything that would still pass if the theme were missing isn't worth asserting.

**When an assertion fails after an intentional change, that is it working.** Moving the Start button from `primary` to `success` failed the ActionsWrapper assertion on the old blue — which is exactly what should happen. Update the expected value to the new one. Never loosen or delete an assertion to get to green.

Run them with `pnpm test`.

## Verifying

A passing build is not evidence the UI is right — it only proves the code compiled. Before calling component work done, confirm the CSS and markup that actually ship:

- `pnpm lint && pnpm build && pnpm test`
- For anything layout- or theme-related, check the emitted CSS (`grep` the rule out of `.next/static/chunks/*.css`) or the SSR output (`curl` the dev server). This caught a stale story assertion and confirmed real token values more than once.
