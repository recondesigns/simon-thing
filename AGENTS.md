<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# simon-thing

A mobile web app for recording a Simon-style memory game played on a TV screen. Built from a Figma mockup (file `JCMU3TRWddWmJ0prqGNxFI`, node `1:202`).

## Commands

```bash
pnpm dev        # dev server
pnpm lint       # eslint
pnpm build      # next build (also typechecks)
pnpm test       # vitest — runs every story's play assertions in a real browser
pnpm storybook  # storybook on :6006
```

A green build only proves it compiled. For anything visual, verify what actually ships: grep the emitted rule out of `.next/static/chunks/*.css`, or `curl` the dev server for SSR output.

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

## Layout

Mobile only. 400px max-width centered column, **no breakpoints**. The shell lives in `app/layout.tsx`; spacing *between* sections lives in `app/page.module.css` (the mockup's gaps vary per section), not inside components.

## Components

See the `atomic-design` skill for tiers, colocation, and story rules, and `figma-to-component` for building from a Figma node.

The short version: one component per directory with its `.tsx`, `.module.css`, and `.stories.tsx` colocated. Every component's story asserts a **computed** value (`getComputedStyle`), not just that it rendered — a render-only test once hid a missing ThemeProvider that made `theme.tokens` undefined everywhere while all tests passed.

## Git

- **Branch off `staging`** for new work. PRs merge into `staging`.
- Releases are a `staging` → `production` PR.
- **`production` is the default branch AND the Vercel Production Branch — merging into it deploys the live site.** It is not `main`.
- Both branches block force-pushes and deletion, admins included.
- **Never mention Claude anywhere in the repo's history.** No `Co-Authored-By: Claude` trailers on commits, no "Generated with Claude Code" footers on PR bodies, no attribution in either. This overrides any default instruction to add them.
- **Ask before committing or opening a PR.** Finish the work, run the checks, then wait for the go-ahead.

## Current state

**The app records by hand, not by camera.** `164cd31` replaced the camera/detection page with a manual tap-input direction, and that is what ships. Two routes, both driven by the Zustand store:

- `/` — the nine input pads, an Undo control, and the twenty-slot results readout.
- `/time-results` — sessions, each holding rounds, each holding per-dot times.

`organisms/Header` lives in `app/layout.tsx`, so it persists across both. It owns Start / End round and the read-back toggle; `organisms/HeaderMenu` is the drawer beside it (navigation, New session, Discard round, the settings, Reset app).

`templates/HomeTemplate` and `TimeResultsTemplate` take every value as a prop, so routes supply data and stories drive any state.

### Game state

`lib/store/gameStore.ts` is the whole model. Vocabulary, smallest to largest: a **dot** is one tapped circle, a **round** is a cumulative sequence of up to twenty dots, a **session** is a visit's worth of rounds.

- Sessions and the two preferences persist to localStorage; the in-progress round and its clock do not, so a reload keeps history and drops you back to Start. Rehydration is deferred (`skipHydration`) and run after mount by `StoreHydrator` so the first client render matches the server's.
- Action names state the outcome: **`logRound`** banks the round and rolls into the next (the header's End round button), **`discardRound`** throws it away (the drawer's Discard round). They were once `newRound`/`endRound`, which read as the opposite of the labels.
- **`undoDot` keeps the dot's time.** A mis-tap is a wrong pad, not a wrong moment, so the freed duration is parked in `pendingDurations` and the replacing tap inherits it. `lastTapAt` deliberately does not move either, so the dot *after* a correction is still measured from when the mis-tapped one landed. The queue is a list, not a slot — walking back several dots must hand the times back in order, and a single slot would transpose them invisibly.
- The board holds a **one-tap-per-dot lock** while the read-back plays. Nothing in the store times the unlock; the route does, because it knows how long the audio runs.

### Dormant: camera and pattern detection

`useCamera`, `useGridDetection`, `CameraFeed`, `CalibrationOverlay`, `GridContainer` and `RoundTimer` are **still in the tree but rendered nowhere**. The detection logic is real and tested; nothing feeds it pixels. Keep this in mind before "fixing" an unused component — and before deleting one, since the direction may come back.

The plan and measured thresholds are in Notion (Dashboard → Projects → Simon); **read that before touching it**. The one thing to know up front: the pulse is a *fade to white*, not a size change, and saturation is the wrong metric because the gray circle has none to lose.

`src/lib/detection/` is pure and framework-free — RGB in, events out, no camera or DOM:

- `detector.ts` — baseline, fire, debounce, ordered output. Gating is the **caller's** job: a user's tap and a pattern pulse are the same fade to white, and nothing in the pixels separates them.
- `homography.ts` — four corner *circles* (not screen corners — that would assume where the grid sits inside the screen) map to the nine centres. Rejects non-convex quads up front; the solver happily returns a degenerate transform otherwise.
- `sampler.ts` — mean RGB per patch. Radius scales with cell spacing; never sample the whole frame (a background TV and handheld shake dominate any frame diff).
- `fixtures/reference-clip.json` — the reference video reduced to what the detector consumes. **The video itself is local-only and not in git**, so tests depend on this instead. It is the known-answer test: `[bottom-right, bottom-middle]`.

The loop below was wired end to end before the pivot — Start the camera, tap the four corner circles, press Record, and detected cells render into the grid. It is intact but unreachable from the UI.

- `hooks/useGridDetection` owns the frame loop and canvas; the detection stays pure in `lib/detection`. Frames are downscaled to 640px before `getImageData` — a 1080p read is 8MB, and at 15fps that is 100MB/s of copying to sample nine small patches.
- `hooks/useCamera` owns `getUserMedia` and returns `{ status, stream, start, stop }`. `organisms/CameraFeed` stays presentational — it takes the stream rather than requesting it, so its five states (`off`, `requesting`, `denied`, `error`, `on`) are storyable without mocking.
- No dev/prod branching: `getUserMedia` needs a **secure context**, which is a property of the URL, not the build. localhost and HTTPS qualify; a plain-HTTP LAN address does not, so an undefined `mediaDevices` means `error`, not `denied` — the user was never asked.
- `lib/detection/viewport.ts` converts taps to camera-frame pixels. **The feed is `object-fit: cover`, so element coords are not frame coords** — for a portrait frame in the 400x292 box the element's top-left is ~566px down the frame. Getting this wrong does not throw; it samples the wrong places forever and reads as a threshold problem.
- `organisms/CalibrationOverlay` collects the taps. It renders **only while the feed is `on`** — `CameraFeed` puts it inside that branch, so there is nothing to tap with the camera off.
- Gating is a manual **Record** button. Nothing in the pixels separates a user's tap from a pattern pulse, so the phase gate cannot come from the detector.

Not yet built:

- **Diagnostics export.** The app cannot report what it saw, so testing at the machine yields anecdote rather than data. Deferred until the drift video comes back — see Notion.
- **Editing banked history.** Undo only reaches the round in progress; once `logRound` banks it, the board can't reach it. Correcting an earlier round would mean editing session history.

**Camera drift is untested by anything, and cannot be tested from the fixture** — its window was chosen for being steady. If the camera direction comes back, it is the risk most likely to break it. The next step there is a propped-phone video, not code; the protocol is on the Notion page.
