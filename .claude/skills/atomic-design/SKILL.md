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

## Overriding MUI

MUI applies its own styles through Emotion, which beats a plain `className`. An override can therefore be correct about the value and still lose. This has bitten **four times**, always silently, never caught by a test that was already there:

- `:hover` stuck on touch, because overriding MUI's hover dropped the `@media (hover: hover)` guard it wraps its own in
- Button labels rendered in Roboto, because `typography.button` beat the font class sitting on the element
- `size` did nothing, because hardcoded padding overrode MUI's size classes while the prop still type-checked
- **`disabled` looked enabled** — an unconditional `backgroundColor` on `.MuiButton-contained` beat MUI's own `Mui-disabled` styling, so the button rendered full primary blue with a white label at opacity 1. It shipped. It was inert and looked pressable.

It cuts both ways. The first three are MUI taking a value back. The fourth is **our override winning when it should have lost** — MUI had correct disabled styling and we overrode it by accident. Both directions are silent.

So, in order of preference:

1. **Configure MUI rather than override it.** If MUI has a home for the value — `theme.typography.button`, the palette, `styleOverrides` — put it there. You cannot lose a cascade fight you are not in.
2. **If you must override, do it inside `styled()`**, never via a className.
3. **Assert the computed result.** Any value MUI also sets is a value MUI can quietly take back, so pin it with `getComputedStyle`. `Atoms/Button > CascadeContract` is the pattern: one story asserting the whole contract in one place.
4. **If an override makes a prop meaningless, remove it from the type.** A compile error beats a prop that type-checks and silently does nothing.
5. **Every MUI state we override must be pinned by a *computed* assertion. An attribute check does not count.**

On (5): `toBeDisabled()` passed the entire time the disabled button was rendering as an enabled one — and it passed *honestly*. The attribute was real, the element genuinely ignored taps, the state was never wrong. Only the pixels lied, and nothing was looking at pixels.

So `toBeDisabled`, `toBeChecked`, `toHaveAttribute`, `toHaveValue` and friends assert that **React did what you asked**. They say nothing about what MUI then painted. They are worth keeping, but they are not the guard — pair them with the colour:

```tsx
await expect(record).toBeDisabled();
// The assertion that would actually have caught it:
await expect(getComputedStyle(record).backgroundColor).toBe("rgb(32, 32, 37)");
```

The tell for this whole family of bug: **a state that is real in the DOM and invisible on screen.** If a user could not tell the two states apart in a screenshot, no attribute assertion will ever fail.

**If a state has no design, it has no implementation — it has a cascade winner.** The disabled button existed in code for hours before it existed in Figma, so nothing decided what it should look like and MUI's default lost a fight nobody knew was happening. Design the state first, then build from the node.

## Verifying

A passing build is not evidence the UI is right — it only proves the code compiled. Before calling component work done, confirm the CSS and markup that actually ship:

- `pnpm lint && pnpm build && pnpm test`
- For anything layout- or theme-related, check the emitted CSS (`grep` the rule out of `.next/static/chunks/*.css`) or the SSR output (`curl` the dev server). This caught a stale story assertion and confirmed real token values more than once.
