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

**Stories are back on.** Every component has one, `pnpm test` is green, and it belongs in the loop again alongside `lint` and `build` — the pause that ran through the redesign is over. The `atomic-design` skill's rule applies as written: one colocated story per component, at least one asserting a *computed* value. When a component is deleted or replaced, delete its story in the same commit.

**`pnpm test` runs two projects, not one.** `storybook` drives every story's play assertions in a real browser; **`unit` runs `src/**/*.test.ts` in node**, for logic with no DOM — `lib/game/cellNumbers`, `lib/speech`. Run one on its own with `npx vitest run --project unit`.

**`pnpm test` goes through `scripts/test.sh`, which tees the run to `.test-output.log`** (gitignored). That exists for #83 — the suite intermittently fails whole story files with *zero* failed assertions, and both sightings lost the evidence to an immediate re-run. **It has to be stdout, not a reporter:** the only line saying *why* a file failed to load is Vite's own `[vite] Internal server error`, printed mid-run among the passing files. Vitest's "Failed Suites" section and its `json` reporter both stop at "Failed to fetch dynamically imported module", which names the casualty and not the cause — verified by inducing a load failure and reading both. The pipe costs the live-updating tree (vitest sees no TTY) and nothing else; every line still lands. When files fail but no assertion does, the script says so and points at the issue, and it is pinned *not* to fire on an ordinary failing assertion. Worth knowing it exists: a `.test.ts` file is collected by *nothing* if the unit project is removed, so it would go silently unrun rather than fail, and the assumption that this repo can only test through stories has already sent one issue chasing a blocker that wasn't there.

Two things about the harness are load-bearing and easy to undo by accident:

- **`.storybook/preview.tsx` imports `app/globals.css`.** Without it every custom property is undefined inside a story, so anything painting through `--game-*` or `--sem-*` renders unstyled while still mounting cleanly — smoke tests pass and only a computed-value assertion notices.
- **The font variables go on `<html>`, not on a wrapper.** `tokens.css` declares the `--type-*` composites on `:root`, and a custom property's own `var()` references resolve against the element that declares it — so a font variable set lower down is invisible to `:root`, and the `font` shorthand is silently dropped as invalid.

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
- **`ResultSlot` and `InputPad` bind their `width`/`height` to `Size/slot` and `Size/pad` in Figma** (#63). Before that binding existed, nothing on the canvas aliased those variables, so changing one moved *nothing* and the file could sit out of step with the code indefinitely — which it did, three times, each caught only when someone happened to open it. Changing either variable now resizes every variant and every instance, so a drift announces itself. **Don't unbind them to "just resize something".** The same trap is still open for any size variable nothing references.

## Motion

Durations and easings are tokens; the seven `dots-*` keyframes live in `src/app/tokens.css` beside them. Two rules that aren't obvious:

- **Reduced motion is CSS media queries**, never a `matchMedia` value read once at module load — that can't react to a change and mismatches on SSR. Every animation has a `prefers-reduced-motion` branch. `--dur-pulse-reduced` is `0ms` on purpose: the breathe switches off rather than speeding up.
- **The unlock cue is de-transformed under reduced motion, never removed.** It's the one thing a player watching the TV is waiting for, so the brightness step and the halo still fire.

Exits never transform — an entrance can overshoot because it's announcing something, a departure that springs pulls the eye back to content already gone.

## Layout

Mobile only. 400px max-width centered column, **no breakpoints** — where something must adapt, use intrinsic sizing rather than a media query.

`organisms/AppShell` is the shell, wrapped around every route by `app/layout.tsx`. Spacing *between* sections lives in each template's module CSS, not inside components.

**The shell is `height: 100dvh` with `overflow: hidden`, so each route owns its own overflow.** The board must fit; the history scrolls inside itself, which is what keeps the app bar fixed without `position: sticky`. Two consequences worth knowing:

- **The board's two grids shrink, nothing else does.** Pads and slots hold 104px and 46px wherever there's room — every phone at the design's 844 gets full size — and give way together below that, since iOS Chrome's bars can take 140px off the usable height. Pads floor at the 44px touch minimum, slots at 20px, and the board scrolls only if both floors bind. Numerals are sized in `cqh` against their own circle, so they scale with it.
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

Three routes, all driven by the Zustand store:

- `/` — the twenty-slot readout and dot count, a status strip, Undo, the nine pads, and the round control.
- `/time-results` — sessions, each holding rounds with their wall-clock length, each drilling down to the pad sequence that was tapped. The round in progress counts up live, driven by a `useSyncExternalStore` clock rather than `Date.now()` in render (impure) or a `setState` interval (a cascading render per tick) — the React Compiler lint rejects both.
- `/insights` — what the history adds up to: how many rounds reached the twenty-dot cap, taps per pad, and how far rounds get. Built from the Figma frame `56:356` (#38).

**The bar's link could no longer be "the surface you are not on" once there were three.** The rule now is: the bar always offers the way back to the board, except on the board itself, where it offers Times. **Insights is reached from the sheet instead** — it is read between sessions rather than during one, so it hasn't earned the single slot a 60px bar has, while the Board/Times flip is done constantly.

`organisms/AppShell` wraps both from `app/layout.tsx`. It owns the sticky `AppBar` — wordmark (home from anywhere), a text link to the other surface, menu — and `MenuSheet`, a bottom sheet rather than a side drawer because everything in it is reached one-handed while standing at a machine. The sheet holds New session, Scrap round, the settings, and Reset app quarantined behind a rule.

**The bar's link is the app's only one-tap navigation, so it always names the surface you are *not* on** — "Times" on the board, "Board" on Times. It replaced a sound toggle, which moved to the sheet's settings beside the read-back speed it pairs with: sound is set once and rarely changed, so it hadn't earned a permanent slot in a 60px bar, while moving between surfaces is done constantly and used to be a tap deeper than the setting. If the bar ever stops pointing back from Times, the wordmark becomes the sole way home.

The board's vertical order is deliberate and worth not rearranging:

- **Undo and the round control share the bottom edge**, even halves, 20px apart, pinned by a flexible spacer rather than by positioning. **The gap is load-bearing.** Ending a round banks it and a banked round can't be edited, so this row sets a recoverable action beside an irreversible one; collapsing the gap to the column's usual 10px would be a real regression, not a cosmetic one. Undo previously had its own full-width row above the pads, on the reasoning that the fix shouldn't sit where the mis-aimed thumb missed — pairing them bought back 54px of column, which is what the pads grew into.
- **The status strip is a fixed 44px slot** between the results and the pads — a hint at rest, and deliberately *empty* while the read-back runs, since the toast carries that message and "tap along" is actively wrong with the pads locked. Its height never changes, because anything that reflowed there would shift the pad grid under a thumb already on its way down.
- **The read-back is a toast** (`atoms/Toast`) straddling the app bar's bottom border, not a row in the column: the board has no spare height to lend one, and it is purely presentational — **it owns no timers and gates nothing.** The route decides when the read-back is over and unlocks on its own schedule, which lands *before* the toast has finished fading, so a toast still on screen beside live pads is correct rather than a glitch. Coupling the two would make the lock outlive the audio by the length of an animation. **The board reopens on the same tick the indicator flips to "Go!"** — there was a 500ms hold between them, which told the player to go and then left the pads dead, every tap of every round. The cue then *outlives* the unlock by `GO_LINGER_MS` so it can be read, which is the same separation seen from the other end: the pads are live for the whole time it is up. With read-back off the indicator is cleared at the unlock instead — nothing was read back, so there is no cue to hold.
- **The toast is `position: fixed`, and that is not interchangeable with `absolute`.** The board column carries `overflow-y: auto` as a short-screen last resort, which makes it a scroll container — and a scroll container clips anything above its top edge with no way to scroll to it. Absolutely positioned, the half of the toast above the border was silently sliced off; it looked like a design choice, not a bug. Its offset comes from `--toast-anchor`, which the board points at `--app-bar-h` — declared in `globals.css` rather than `tokens.css`, because it is a layout fact of the shell and `tokens.css` is generated. It stays mounted through its own fade and unmounts after — an invisible toast is still in the accessibility tree, and would announce a read-back that ended minutes ago. Two traps it already survived, both pinned by stories: `animationend` **bubbles**, so the handler that unmounts it must ignore its children (the "Go!" lands and the dots breathe inside it); and the route clears `spoken` at the same moment it unlocks, so the toast is passed a *full* count on the way out rather than the live value — otherwise the cue the player was waiting for visibly un-happens mid-fade.

`templates/HomeTemplate`, `TimeResultsTemplate` and `InsightsTemplate` take every value as a prop, so routes supply the store.

### Insights

`lib/insights.ts` derives everything the surface shows from `Session[]` alone — pure functions, unit-tested, so the shape of a chart is testable without a store, a browser or a render. **Nothing on this surface needs state that isn't already recorded**, which is why it adds none. Nothing is cached in the store: it is a *view* of state, and keeping it would give the app two places that could disagree about how many rounds have been played.

- **Rounds split finished vs ended early, which knowingly differs from the frame.** The frame draws completed/scrapped, but "completed" there means *banked*, and a round abandoned on the seventh dot banks exactly like one that went the full distance — counting both as success is the opposite of what most of them were. So the question asked is "did it reach the cap", derived with **no stored state at all**: the board can't go past `ROUND_CAP` and ends the round itself on reaching it, so a banked round's length already says which it was. Ended early takes the *neutral* cream rather than anything alarming, because ending early is the ordinary outcome of playing.
- **Scrapped rounds are counted nowhere, and that is load-bearing.** Scrapping means the round didn't happen. A counter was built and then removed: it would have been **the only thing in the app that cannot merge across devices**, because a bare number carries no per-event identity — two devices reading 4 and 3 could be 7 or could be 4, and a retried sync would double-count. Everything else here is a record, so it dedupes by id. Logging in does not fix this; identity and idempotency are different problems. **Don't reintroduce a counter for anything without solving that first** — give each event a timestamp and make it a record.
- **`ROUND_CAP` lives in `lib/game/roundCap.ts`**, not on `ResultsBoard`. It is the number of slots the readout draws *and* the only evidence of how a banked round ended, so `lib` needs it and `lib` must not import from `components`. One source, not a second `20`.
- **The bubbles are sized by count, not coloured by it.** A fixed 68px ring holds a bubble running 38→64px from the quietest pad to the busiest. The ring is the constant they are read against; without it a small bubble reads as a small *pad* rather than a quiet one. Every pad paints at full strength — dimming quiet ones was tried and dropped, because it makes the interesting pads the hardest to see. **The ring is an inset `box-shadow`, not a `border`:** under the global `border-box` a real border eats 2px out of the content box, and the bubble's percentage width resolves against that, so every bubble would land 2px under its designed diameter.
- **The scale runs quietest→busiest, not zero→busiest**, following the frame. It makes ranking easy to read and deliberately exaggerates — nine pads within one tap of each other still span the full range. The counts printed underneath are what say how big the difference really is.
- **The histogram and the split bar count the same rounds**, so they always agree — both are just banked rounds, sliced two ways. The frame's mock shows the histogram summing to a larger total than the bar's banked figure, which was only reachable when scrapped rounds were being counted.
- **Round length comes from `Round.dots`, not `pads.length`**, so rounds banked before store v2 still bin correctly — they know how far they got, just not where they landed. The tap counts can't include them, so those taps are reported separately rather than folded in (which would stop the nine counts adding up) or dropped (which would under-report play).

Two places knowingly differ from the Figma frames, both commented where they happen: Undo is full width (the frames hug it left), and the status strip packs right (the frames centre it). A third is behavioural — see Known gaps.

### Game state

`lib/store/gameStore.ts` is the whole model. Vocabulary, smallest to largest: a **dot** is one tapped circle, a **round** is a cumulative sequence of up to twenty dots, a **session** is a visit's worth of rounds.

- Sessions and the three preferences persist to localStorage; the in-progress round and its clock do not, so a reload keeps history and drops you back to Start. Rehydration is deferred (`skipHydration`) and run after mount by `StoreHydrator` so the first client render matches the server's.
- Action names state the outcome: **`logRound`** banks the round and rolls into the next (the board's End round control), **`discardRound`** throws it away (the sheet's Scrap round — renamed in the UI only). They were once `newRound`/`endRound`, which read as the opposite of the labels.
- **A banked `Round` is `{ startedAt, endedAt, dots, pads }`** — the round is timed as a whole, and `pads[N]` says where dot N landed. `dots` is the authoritative length and is deliberately *not* `pads.length`: pre-v2 rounds have no pads at all but still know how far they got, and the histogram counts them. Both `logRound` and `newSession` bank, so a change to what a round records has to land in both.
- Read-back speed has five settings: X-Fast 200, Fast 350, Normal 550, Relaxed 800, Slow 1100. **None of them sit on an even scale, and that is the point** — each was moved on its own at the machine, which is the only place the right value exists. Fast started at 200 and ran too quick to follow; Normal was 500 until it was played and wanted a little more room. The steps that result (200, 250, 300) describe where the useful range actually is, so **don't tidy them into an arithmetic sequence.** Neither adding a setting nor retuning one needs a migration — what persists is the `cadence` key, never the milliseconds.
- **X-Fast is the only cadence that changes the *delivery*, not just the silence**, and that is what makes it a tier rather than a rounding error. Every other setting feeds one number, `gapMs`; the words themselves were always spoken at `rate` 1. But at a group of three roughly **70% of a read-back is the speaking and only 30% the silence** — and most of that silence is already pinned at `MIN_INTRA_GROUP_MS`, which a shorter cadence cannot go under. A gap-only X-Fast measured about **7% quicker**, which is not worth a segment. So `CADENCE_RATE` carries a per-cadence rate, X-Fast at **1.3** and **the other four at 1, where they must stay** — re-rating them would retune four settings that were each settled by playing. The 1.3 is a starting point wanting the machine, and the failure mode is the floor's, approached from the other side: push it and single digits stop being distinct.
- **Five word-labels is the most that segmented control holds.** Measured: at the design's 390 the widest label ("Relaxed") clears its segment by 9px, at 360 by 3px, and **at 320 it clips** — a width the 4-segment version survived. 320 is outside the 390/844 target and there are no breakpoints to add one at, so it is left. A sixth cadence, or a longer label, needs a different control rather than a smaller font.
- **The read-back only runs from the fourth dot** (`READBACK_MIN_DOTS` in `app/page.tsx`). Three and under sit inside ordinary memory span, so reading them back is a crutch nobody needs, and it is not free: the read-back grows with the sequence, so staying silent through dot 3 saves 1+2+3 = 6 spoken numbers a round. It shipped at 5 and was dropped to 4 after a session at the machine — **the threshold is a fact about the player's memory, not a rule of thumb, so it is settled by playing and not by argument.** Dropping it one costs exactly *one* extra read-back a round (the one at dot 4, ~4.5s at Relaxed), because every read-back from 5 up happens either way. Below the threshold a tap takes the *same* path as a tap with speech off, deliberately one branch rather than two, because from the player's side they are the same tap. **`speechEnabled` still means "never" when off; on, it now means "from dot 5"** — no new setting and no migration, since nothing about what persists changed. Two things not to tidy: `primeSpeech()` is keyed on the preference alone and must stay that way, because priming on the silent taps is what unlocks iOS audio before the first real read-back lands; and `setSpoken(0)` in `handleTap` is gated on the threshold, because the template opens the toast on `spoken` alone and would otherwise flash "Reading it back…" over a tap that is never read back. Crossing the threshold needs no special case — the fifth tap reads all five numbers.
- **Numbers are read back in groups**, phone-number style, and **the gap inside a group is a third of the gap between groups** (`INTRA_GROUP_RATIO` in `lib/speech.ts`). The chunking is what pays for the tighter gap: numbers read flat have to be held as one thing each and need air between them, but a few groups is a few things, and the boundary pause is what marks them off — so the sequence is both easier to follow and shorter. The four cadence settings are unchanged and still mean what they say, but they are now the *group-boundary* pause rather than a flat one, so a given setting sounds faster than it used to. That was accepted deliberately; don't restore a flat gap to make the cadences sound as before. **`INTRA_GROUP_RATIO` is a proportion, not a fixed ms**, so the cadence still governs the whole read-back rather than only its boundaries. At the default group of three, a twenty-dot round saves **69s at Relaxed** against a flat gap, versus the ~4.5s the threshold costs.
- **The group *size* is a player setting; the ratio is not.** `groupSize` persists beside `cadence` and `speechEnabled`, runs 1–5 (`GROUP_SIZE_OPTIONS`), and defaults to `DEFAULT_GROUP_SIZE` — **three, the value that has actually been played.** They are independent numbers that spent a while both equal to 3, and conflating them has already produced one bug: `speech.test.ts` used `Math.round(350 / GROUP_SIZE)` as a stand-in for the un-floored ratio, which was right only by coincidence. One is how *long* a group is, the other how *tight*.
  - It is a setting because raising it is **strictly faster** — a longer group is a boundary pause not taken — and that is precisely where arithmetic stops helping: bigger groups are fewer chunks to hold but each is harder to hold, and only the machine can say which wins. Same class as `READBACK_MIN_DOTS` and the floor. Going 3 → 4 is worth ~9s on a twenty-dot round at Relaxed, about 4% — real, but a seventh of what grouping itself bought, so **don't raise the default off the arithmetic alone.**
  - **`1` is the "Off" segment**, and means a boundary after every number — exactly the flat read-back grouping replaced. Keeping it reachable is what lets the setting answer whether grouping helps at all, not just how much.
  - **`groupSize > 1` guards the indicator's group-opening test, and is load-bearing.** `i % 1` is always 0, so without it "Off" makes every dot a group opener and draws the *widest* row of any setting — 371px at the cap against 293px grouped, on a row that already overflows. It shipped broken for about a minute and a story caught it.
  - **The value is captured per read-back, in `handleTap`, not subscribed.** Changing the setting mid-read-back must not regroup the dots under audio already speaking the other rhythm — a picture marking off chunks the ear never hears is worse than no grouping. It takes effect on the next tap. The route reads the store in two places one commit apart, which cannot diverge because no user input fits between them.
- **`MIN_INTRA_GROUP_MS` floors the in-group gap at 160ms**, because a pure proportion breaks down at the fast end — the ratio put Fast's triplets at 117ms, which ran together at the machine. **Fix that end with the floor, never by raising the ratio:** the ratio loosens all four cadences and hands back most of the 69s to solve a problem only Fast has. The floor costs Fast ~5.6s across a twenty-dot round and leaves the other three untouched (Normal is already 183ms). The in-group gap is also clamped to never exceed the boundary gap — dead code at today's cadences, and not dead the moment anyone adds one under 160ms. **All of this is pinned by `lib/speech.test.ts`** (#71), which asserts the *structure* from `DEFAULT_GROUP_SIZE` so a deliberate retune doesn't fail it, and the *per-cadence milliseconds* spelled out so a change to those has to be made on purpose. Each guard was re-checked by breaking the implementation and watching it fail: flattening the gaps fails 11, removing the floor fails exactly the 2 Fast tests, deleting the clamp fails 1.
- **`WaitingIndicator` groups its dots to match** (#72), taking `groupSize` as a prop fed from the same store read the audio uses. Its two gaps are in the **same 1:3 ratio** as the audio's in-group and boundary pauses — deliberately the same proportion, so the picture and the sound describe one rhythm. It is the *ratio* that has to match, not the size. The grouping was made **width-neutral** (3px and 9px against the old flat 5px, 2px narrower at the twenty-dot cap and narrower still above three) because **the indicator already overruns the screen at a full round**: 457px of content on a 390px phone, and the toast centres itself, so roughly 34px is clipped off *each* end — including the first dots, on the longest read-back, where progress matters most. That overflow is older than the grouping and is still there.
- **The round ends itself at the cap.** The twentieth dot is the last one a round can hold, so there is nothing left to decide and no End round press to make — the board banks it once that dot's read-back finishes. It waits for the audio rather than banking on the tap, so the read-back is heard in full, which does mean **the round's clock runs to the end of it** (~40s at Relaxed on a twenty-dot sequence). That was chosen deliberately over stopping the clock at the tap, which would have charged the read-back to the next round instead. Every path out of the one-tap lock — spoken, silent, and the safety-net fallback — goes through one `finish` in `app/page.tsx`, so the cap is handled once rather than at each of the three.
- **A round is timed as a whole, not as a sum of its dots** (store v3). `startedAt` opens the round, starts its clock and gates the pads; `logRound` stamps `endedAt`. The elapsed time therefore **includes the machine setting up and playing its pattern back**, which is the point — that playback is part of the round from the player's side and it grows with the sequence. `logRound` sets the next round's `startedAt` to the moment the last one ended, so no gap falls between rounds: the machine's setup belongs to the round it precedes. **Individual dots are no longer timed at all** — `dotDurations`, `pendingDurations` and `lastTapAt` are gone, and with them the `0`-means-unmeasured sentinel and `formatDotSeconds`. Read elapsed through `roundElapsedMs`, which returns **null, never 0**, for the pre-v3 rounds that never recorded it.
- **`undoDot` only takes the pad back; the clock keeps running.** That is the honest reading under round-level timing — fumbling a pad is time the round actually took — and it is why the whole `pendingDurations` inheritance dance could go when per-dot timing did. Press twice to walk back two dots.
- The board holds a **one-tap-per-dot lock** while the read-back plays. Nothing in the store times the unlock; the route does, because it knows how long the audio runs.

### Known gaps

Real, measured, and deliberately left. Don't "fix" any of them unprompted — each was raised and declined.

- **Rounds banked before store v2 have no pad colours**, and **rounds banked before v3 have no time at all.** Neither was recorded, so no migration can invent it: pre-v2 dots render without a chip, pre-v3 rounds render their total as "—". The v2 → v3 migration deliberately does *not* convert the old per-dot times into a round total — summing them measures first-tap-to-last-tap, while a v3 total measures Start-to-End including the machine's playback, and putting two different quantities in one column is worse than an honest dash. Treat an empty `Round.pads` as "unknown", not "no pads", and a null timestamp as "not recorded", not zero.
- **The disabled `Switch` is nearly invisible** — `bg/surface-disabled` against the page surface is about 1.05:1. Faithful to the tokens, but no frame exercises that state and nothing in the app renders one. Swapping the disabled border to `border/surface-strong` fixes it.
- **Undo stays enabled during read-back**, against the design. Disabling it would mean waiting out a read-back that grows past ten seconds before correcting a mis-tap — which is the entire point of undo. This one is a deliberate contradiction of the frames, not an oversight.
- **A banked round can't be edited, and won't be.** Undo reaches the round in progress and nothing further; once `logRound` banks it, the board can't touch it. This was considered and dropped — there's no reason to go back and correct a round already played, so the surface that would allow it isn't worth building or maintaining.

### Not yet built

- **Getting data off the phone.** Sessions live in localStorage on a single device, so nothing recorded at the machine can be compared across visits or read anywhere else.
