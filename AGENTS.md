<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# simon-thing

A mobile web app for recording a Simon-style memory game played on a TV screen.

The design lives in Figma file **`eOTvsRFGbnUcvxzXeuOr0M`** — section *Dots — App Screens* holds the ten screen frames, *Dots — Components* the four component sets. Frame `10` is a working scrolling prototype and is the spec for the Times screen's overflow behaviour. The motion spec and the change log against the original functionality inventory live in the Claude Design project that produced them (`1212577e-4907-4c13-9381-527c80e15d13`, file `Dots App Screens.dc.html`).

## Commands

```bash
pnpm dev        # dev server
pnpm lint       # eslint
pnpm build      # next build (also typechecks)
pnpm test       # vitest — runs every story's play assertions in a real browser
pnpm storybook  # storybook on :6006
```

A green build only proves it compiled. For anything visual, verify what actually ships: grep the emitted rule out of `.next/static/chunks/*.css`, `curl` the dev server for SSR output, or drive it in a real browser and read computed values. The redesign shipped four invisible-text bugs that all passed `pnpm build` — every one was caught by measuring, none by compiling.

**Stories are paused**, and this overrides the `atomic-design` skill's rule that every component gets one. `pnpm test` runs each story's play assertions, but no new stories are being written while the design is validated in the real world, and `pnpm test` isn't part of the loop. Several surviving stories still assert the pre-redesign palette, so expect failures if you turn it back on. When a component is deleted or replaced, delete its story in the same commit.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · MUI v9 + Emotion · CSS modules · Zustand · Storybook 10 (`nextjs-vite`) · pnpm

**No Tailwind.** Figma's extracted code is always Tailwind — convert it to CSS modules and theme tokens. Never install it.

## Design system

Tokens are **generated from the Figma file `eOTvsRFGbnUcvxzXeuOr0M`** (collections: Semantic, Game, Spacing, Radius, Size, Motion). Don't hand-edit either emitted file — regenerate from Figma.

There are two emitted forms of the same source, and they aren't interchangeable:

- **`src/app/tokens.css`** — CSS custom properties, plus the seven `dots-*` keyframes. **Prefer these in CSS modules.** They're named exactly as the design system's own stylesheet names them — including `--sem-icon-*` singular against Figma's `icons/*` — so a rule can be lifted from the reference implementation without translation.
- **`src/lib/theme/tokens.ts`** — the same values in TypeScript, for the MUI theme and anything needing a literal (`viewport.themeColor`, a `styled()` call). Reach it as `useTheme().tokens`, or import `tokens` directly.

**Never hardcode a hex.** Two invisible-label bugs shipped from `#ffffff` literals left over from when the key colour was blue.

- **`primary` is a light cream, not a blue.** Anything painted with `bg.primary` takes `text.inverse` on top — white vanishes on it. Outlined controls are the reverse: no fill, so they take `text.primary` against the dark page. `danger` and `success` are *deep tinted surfaces* meant to sit under bright text, not bright fills, and they have no hover/pressed steps.
- **The nine pad colours are tokens now**, under `Game` — `tokens.game[n]` / `--game-N`, keyed by telephone-keypad position, each with `fill` / `dim` / `ink` / `glow`. They keep their own collection rather than folding into Semantic, because a game colour still isn't a semantic UI colour; they're just no longer raw fills.
- **Fonts:** three faces, each declared exactly once in `src/lib/fonts.ts` and exposed as a CSS variable — `bungee` / `--font-display` (arcade signage: short copy, loud), `spaceGrotesk` / `--font-body`, `spaceMono` / `--font-numeral` (monospaced, so a ticking time doesn't jitter as digits change). Never call a `next/font` loader in a component: it emits a `@font-face` block per call site, so a second call duplicates CSS and lets the options drift apart silently.
- Figma also holds a 115-token **Component tier** (`button/primary/bg-default`, …). It is **deliberately not emitted to code** — every entry resolves to a Semantic or Game value, so shipping it would add a lookup and buy nothing. It exists to tell a designer which token to reach for.

## Motion

Durations and easings are tokens; the seven `dots-*` keyframes live in `src/app/tokens.css` beside them. Two rules that aren't obvious:

- **Reduced motion is CSS media queries**, never a `matchMedia` value read once at module load — that can't react to a change and mismatches on SSR. Every animation has a `prefers-reduced-motion` branch. `--dur-pulse-reduced` is `0ms` on purpose: the breathe switches off rather than speeding up.
- **The unlock cue is de-transformed under reduced motion, never removed.** It's the one thing a player watching the TV is waiting for, so the brightness step and the halo still fire.

Exits never transform — an entrance can overshoot because it's announcing something, a departure that springs pulls the eye back to content already gone.

## Layout

Mobile only. 400px max-width centered column, **no breakpoints** — where something must adapt, use intrinsic sizing rather than a media query.

`organisms/AppShell` is the shell, wrapped around every route by `app/layout.tsx`. Spacing *between* sections lives in each template's module CSS, not inside components.

**The shell is `height: 100dvh` with `overflow: hidden`, so each route owns its own overflow.** The board must fit; the history scrolls inside itself, which is what keeps the app bar fixed without `position: sticky`. Two consequences worth knowing:

- **The board's two grids shrink, nothing else does.** Pads and slots hold 96px and 40px wherever there's room — every phone at the design's 844 gets full size — and give way together below that, since iOS Chrome's bars can take 140px off the usable height. Pads floor at the 44px touch minimum, slots at 20px, and the board scrolls only if both floors bind. Numerals are sized in `cqh` against their own circle, so they scale with it.
- **Anything in a scrolling flex column needs `flex-shrink: 0`.** Flex children default to shrinking, so a list will silently compress to fit instead of overflowing — nine sessions squashed into one screen with `scrollHeight === clientHeight`, which looks fine to every measurement and wrong to every eye.

## Components

See the `atomic-design` skill for tiers and colocation, and `figma-to-component` for building from a Figma node.

One component per directory with its `.tsx` and `.module.css` colocated. Prefer the CSS custom properties over `theme.tokens` in modules; keep the TS tokens for the MUI theme.

**Interaction lives in CSS, not React state.** `:active` and `:focus-visible` are cheaper than a `useState` per pointer event and can't desynchronise from the element. Use `:focus-visible`, not `:focus` — a mouse press shouldn't leave a ring behind. Guard `:hover` behind `@media (hover: hover)`: touch devices fire it on tap and never clear it.

**MUI stays for behaviour, not looks.** The theme carries `tokens`, and `SwipeableDrawer` gives the sheet its focus trap, scroll lock and escape handling. Don't style *through* MUI — the design is a pill-and-glow system that looks nothing like it, and every rule becomes an Emotion cascade fight.

## Git

- **Branch off `staging`** for new work. PRs merge into `staging`.
- Releases are a `staging` → `production` PR.
- **`production` is the default branch AND the Vercel Production Branch — merging into it deploys the live site.** It is not `main`.
- Both branches block force-pushes and deletion, admins included.
- **Never mention Claude anywhere in the repo's history.** No `Co-Authored-By: Claude` trailers on commits, no "Generated with Claude Code" footers on PR bodies, no attribution in either. This overrides any default instruction to add them.
- **Ask before committing or opening a PR.** Finish the work, run the checks, then wait for the go-ahead.

## Current state

**The app records by hand, not by camera.** `164cd31` replaced the camera/detection page with a manual tap-input direction, and that is what ships. The whole visual layer was then rebuilt on a new design system across six phases; the game logic underneath is unchanged. The camera and pattern-detection code sat unreachable in the tree until it was removed outright — don't go looking for it, and check the history rather than rebuilding from scratch if that direction ever returns.

Two routes, both driven by the Zustand store:

- `/` — the twenty-slot readout and dot count, a status strip, Undo, the nine pads, and the round control.
- `/time-results` — sessions, each holding rounds, each holding per-dot times.

`organisms/AppShell` wraps both from `app/layout.tsx`. It owns the sticky `AppBar` — wordmark (home from anywhere), sound toggle, menu — and `MenuSheet`, a bottom sheet rather than a side drawer because everything in it is reached one-handed while standing at a machine. The sheet holds navigation to the other surface, New session, Scrap round, the settings, and Reset app quarantined behind a rule.

The board's vertical order is deliberate and worth not rearranging:

- **Undo sits above the pads**, full width. The mistake it fixes is a mis-aimed thumb, so the fix must not sit where the miss happened.
- **The status strip is a fixed 44px slot** between the results and the pads — a hint at rest, the read-back indicator mid-lock, flipping to a green "Go!" at unlock. Its height never changes, because anything that reflowed there would shift the pad grid under a thumb already on its way down.
- **The round control is pinned to the bottom** by a flexible spacer, not by positioning.

`templates/HomeTemplate` and `TimeResultsTemplate` take every value as a prop, so routes supply the store.

Two places knowingly differ from the Figma frames, both commented where they happen: Undo is full width (the frames hug it left), and the status strip packs right (the frames centre it). A third is behavioural — see Known gaps.

### Game state

`lib/store/gameStore.ts` is the whole model. Vocabulary, smallest to largest: a **dot** is one tapped circle, a **round** is a cumulative sequence of up to twenty dots, a **session** is a visit's worth of rounds.

- Sessions and the two preferences persist to localStorage; the in-progress round and its clock do not, so a reload keeps history and drops you back to Start. Rehydration is deferred (`skipHydration`) and run after mount by `StoreHydrator` so the first client render matches the server's.
- Action names state the outcome: **`logRound`** banks the round and rolls into the next (the board's End round control), **`discardRound`** throws it away (the sheet's Scrap round — renamed in the UI only). They were once `newRound`/`endRound`, which read as the opposite of the labels.
- Read-back speed has four settings, evenly 300ms apart: Fast 200, Normal 500, Relaxed 800, Slow 1100. Adding a value needs no migration, since a stored `cadence` stays valid.
- **`undoDot` keeps the dot's time.** A mis-tap is a wrong pad, not a wrong moment, so the freed duration is parked in `pendingDurations` and the replacing tap inherits it. `lastTapAt` deliberately does not move either, so the dot *after* a correction is still measured from when the mis-tapped one landed. The queue is a list, not a slot — walking back several dots must hand the times back in order, and a single slot would transpose them invisibly.
- The board holds a **one-tap-per-dot lock** while the read-back plays. Nothing in the store times the unlock; the route does, because it knows how long the audio runs.

### Known gaps

Real, measured, and deliberately left. Don't "fix" any of them unprompted — each was raised and declined.

- **Banked rounds have no pad colours.** `Session.rounds` stores durations alone, so the per-dot colour chip only appears on the round in progress. Recording pad identity means a v1→v2 migration, and existing history can't be recovered either way — the information was never written.
- **The disabled `Switch` is nearly invisible** — `bg/surface-disabled` against the page surface is about 1.05:1. Faithful to the tokens, but no frame exercises that state and nothing in the app renders one. Swapping the disabled border to `border/surface-strong` fixes it.
- **Undo stays enabled during read-back**, against the design. Disabling it would mean waiting out a read-back that grows past ten seconds before correcting a mis-tap — which is the entire point of undo. This one is a deliberate contradiction of the frames, not an oversight.

### Not yet built

- **Editing banked history.** Undo only reaches the round in progress; once `logRound` banks it, the board can't reach it. Correcting an earlier round would mean editing session history.
- **Getting data off the phone.** Sessions live in localStorage on a single device, so nothing recorded at the machine can be compared across visits or read anywhere else.
