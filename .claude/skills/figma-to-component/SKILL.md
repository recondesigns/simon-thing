---
name: figma-to-component
description: Workflow for building or updating a simon-thing component from a Figma node, and for keeping the Figma file in sync when code intentionally diverges. Use whenever given a Figma URL or node id to implement, or when reconciling code against the design file.
---

Building a component from the Figma file `JCMU3TRWddWmJ0prqGNxFI` ("Simon-thing"). Load the `figma-use` skill before any `use_figma` call, and `atomic-design` for tier placement and story rules — this skill covers only what those two don't.

## 1. Read the node

Given a Figma URL, extract the node id (`?node-id=1-202` → `1:202`) and call both:

- `get_design_context` — reference code, screenshot, and any component **descriptions**
- `get_metadata` — structure, child names, sizes, positions

The returned code is React + Tailwind. It is a **reference, not an answer**: convert it to this project's stack (CSS modules + `theme.tokens`). Never install Tailwind.

## 2. Trust the node, never the description

**This is the rule this skill exists for.** Figma descriptions are prose. They drift from the thing they describe, and `get_design_context` presents them as authoritatively as real data. Three separate bugs in this project came from believing them:

- `PatternCircle`'s description said the label was `#0A0A0C`. The node was `#FFFFFF`. We shipped the wrong color and only caught it later.
- The same description advertised token-bound colors long after the component had moved to raw hex fills.
- Six variants cloned from `primary` silently inherited descriptions still reading `color=primary`.

So before writing any color into code, read it off the node with `use_figma` and resolve bound variables down to a literal:

```js
const toHex = (c) => {
  const h = (v) => Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
};

// A bound variable may alias through several collections before reaching a color.
const resolveVar = async (id) => {
  const v = await figma.variables.getVariableByIdAsync(id);
  const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  let value = v.valuesByMode[c.defaultModeId];
  let guard = 0;
  while (value && value.type === "VARIABLE_ALIAS" && guard++ < 10) {
    const next = await figma.variables.getVariableByIdAsync(value.id);
    const nc = await figma.variables.getVariableCollectionByIdAsync(next.variableCollectionId);
    value = next.valuesByMode[nc.defaultModeId];
  }
  return { name: v.name, hex: value && value.r !== undefined ? toHex(value) : null };
};
```

When the description and the node disagree, the node wins — then fix the description (see §5).

## 3. Tokens, and when *not* to use them

`node.boundVariables.fills` / `.strokes` tells you what the design actually intends:

- **Bound to a variable** → map to the matching `theme.tokens` path. `bg/success/fill` → `theme.tokens.bg.success.fill`. Never hardcode the hex.
- **Raw solid fill** → the design means it to be raw. Don't invent a token to "fix" it.

Both exist here on purpose. Every semantic UI color is bound; `PatternCircle`'s 8 pad colors are raw, because game colors aren't semantic UI colors. Ask before converting one kind into the other — it's a design decision, not a cleanup.

## 4. Build

Follow `atomic-design` for tier, colocation, and story rules. Beyond that:

- Read `src/lib/theme/tokens.ts` for the exact path; don't guess token names.
- Use `antonSC` from `@/lib/fonts` — never call `Anton_SC()` in a component. `next/font` emits a `@font-face` block per call site, so a second call duplicates CSS and can drift.
- Geometry (padding, radius, gap, size) comes from the node, not the description.
- Positioning *between* sections belongs to the page (`page.module.css`), not inside the component.
- Figma's extracted code carries auto-layout artifacts (odd asymmetric padding like `pl-[22px] pr-[21px]` on a centered flex). Reproduce the intent, not the artifact.

## 5. When code diverges from Figma, fix Figma too

Adding something the design lacks (a new color, a new state) leaves the file lying. Update all three, or the next reader inherits the drift:

1. **The component set** — add the variants. Clone an existing variant and rebind rather than building fresh, so geometry and text stay identical by construction.
2. **The descriptions** — the set's axis list and variant count, plus every new variant. Clones inherit the source's description; overwrite them.
3. **Mockup instances** — `setProperties({ color: "success" })` on instances still pointing at the old variant. A component set can be perfectly correct while the mockup still shows the old design.

Prefer targeted string replacement over retyping a description, so the untouched parts stay byte-identical.

## 6. Figma gotchas specific to this file

- **Descriptions escape quotes.** `"` and `'` become `&quot;` / `&#39;`. Write descriptions without them, and read back to confirm.
- **Component sets don't auto-resize.** Appending a variant outside the frame bounds leaves it clipped. Resize the set explicitly afterward.
- **Always read back after writing.** Assert the new value is present, the stale one is gone, and no entities crept in.
- Return every created/mutated node id from `use_figma`, per `figma-use`.

## 7. Done means verified

Per `atomic-design`: lint, build, and the Storybook suite, plus a check of the emitted CSS or SSR output for anything visual. Then confirm the built result against the Figma screenshot — that's what catches a faithful-looking component with the wrong color in it.
