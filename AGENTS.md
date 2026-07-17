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

- **Colors come from `theme.tokens`** (`useTheme().tokens`, or import `tokens` directly in a styled call). Never hardcode hex.
- `src/lib/theme/tokens.ts` is **generated** from the Figma "Semantic" variable collection. Don't hand-edit it; regenerate from Figma.
- One exception, on purpose: `PatternCircle`'s 8 pad colors are raw fills, because game colors aren't semantic UI colors. Figma treats them the same way.
- **Fonts:** import `antonSC` from `@/lib/fonts`. Never call `Anton_SC()` in a component — `next/font` emits a `@font-face` block per call site, so a second call duplicates CSS and can drift.

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

The mockup is built (header, camera feed, pattern grid, actions) and **the camera works end to end**.

- `hooks/useCamera` owns `getUserMedia` and returns `{ status, stream, start, stop }`. `organisms/CameraFeed` stays presentational — it takes the stream rather than requesting it, so its five states (`off`, `requesting`, `denied`, `error`, `on`) are storyable without mocking.
- No dev/prod branching: `getUserMedia` needs a **secure context**, which is a property of the URL, not the build. localhost and HTTPS qualify; a plain-HTTP LAN address does not, so an undefined `mediaDevices` means `error`, not `denied` — the user was never asked.
- `templates/HomeTemplate` takes every value as a prop, so the route supplies data and stories drive any state.

Not yet built:

- **Pattern detection.** The next feature: watch a bar-top arcade machine's 3x3 grid and read the pattern. The reference video is analyzed and the plan — measured thresholds, pipeline, risks — is in Notion (Dashboard → Projects → Simon). **Read that before building.** The one thing to know up front: the pulse is a *fade to white*, not a size change, and saturation is the wrong metric because the gray circle has none to lose.
- **Game state.** Zustand is installed but has no stores; the grid and step count render placeholder content matching the mockup.
