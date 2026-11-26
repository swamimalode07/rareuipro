---
name: rareui-component
description: How to build and ship a new Rare UI Pro component end to end, from the component file to docs, gallery card and shadcn registry. Use whenever the user asks for a new component, or to change how an existing one is built, documented or registered.
---

# Rare UI component

Run the `rareui-design` skill first for the look. This skill covers the build and the wiring.

## Steps

1. **Component**: `components/pro/<kebab-name>.tsx`.
   - `"use client"` only if it needs state, effects or motion.
   - shadcn hygiene: props extend `React.ComponentProps<"div">` (or the root element), `cn()` merges `className`, rest props spread on the root, `data-slot="<kebab-name>"` on the root.
   - Forward user handlers you override (call `onPointerMove?.(event)` before your own logic).
   - Honour `useReducedMotion()`; skip pointer effects on touch (`event.pointerType !== "mouse"`).
   - Animation with `motion/react`. Only add a dependency the user approved.
   - Export both named and default.
2. **Demo**: `app/components/(docs)/<slug>/demo.tsx`, the component centred in `flex h-full items-center justify-center p-6`, with real-looking content.
3. **Page**: `app/components/(docs)/<slug>/page.tsx`, copy `folder/page.tsx` and change `HREF`. The slug is the name lowercased, no dashes (`colorpicker`).
4. **Entry**: add to `components` in `lib/components.ts`: `name`, `href`, `category`, `registry`, `isNew: true`, `description`, `dependencies`, `interaction`, `props`, `usage`. Follow `CONVENTIONS.md` copy rules exactly. Every number must match the code.
5. **Card preview**: no video yet? Add a small live version to `PREVIEWS` in `components/gallery/LivePreview.tsx`, keyed by the registry name.
6. **Registry**: add an item to `registry-pro.json` (path `components/pro/<kebab-name>.tsx`, `registryDependencies: ["utils"]` if it uses `cn`). The description matches `lib/components.ts` word for word. Then run `npm run registry:build`, which writes `registry/pro/*.json`.
7. **Verify**: `npx tsc --noEmit` and `npx eslint` on the touched files. Don't start the dev server; the user checks in their own browser.

## Report

One short line per file touched, then anything the user must decide.

## Learned from Swami

Add each correction or approved pattern here as a one-line rule, so the next component gets it right first time.

- Squircles must work in every browser. `corner-shape: squircle` is Chrome only; draw shapes as SVG paths with squircle corners (see `squircle()` in `components/pro/folder.tsx`), or use `@squircle-js/react`.
- Docs demos show one instance of the component, not a row of variants.
- Match the reference closely: shape, depth, inner glow and shadow. Ask before dropping details.
- Surfaces get depth: a 1px border a shade darker, a soft inner rim lighter than the fill, and a neutral shadow (tinted shadows read as glow on dark).
- Keep the demo content plain; no decorative glyphs or letters on the component unless asked.
- Default to simple and clean: flat fills, no borders, inset highlights, glows or backdrop blur unless the reference clearly has them.
- Animated pieces must never cause layout shift: reserve the largest size in CSS (e.g. a hidden grid stack) instead of animating width.
- Keep moving parts on one shared axis so the motion reads symmetric.
- Take the mechanic from a reference, not its look: swap brand logos, gold or themed materials for neutral Rare UI ones so it never reads as a copy.
- Physical objects need stacked shadows that follow one light from above: each layer casts onto the one beneath it (cap on paper, paper on body, everything on the surface), plus a contact shadow where things touch or lift.
- UI surfaces (buttons, menus, cards) use tight shadows, not big blurs: light is a 1px ring at 4% black plus a faint 1-2px drop; dark is a surface a step lighter than the page, a faint inset top highlight and a crisp dark outer ring.
- Realistic objects: measure the reference (sample pixel colours across edges, fit corner curves) instead of eyeballing, and build it as clean SVG rather than embedding the image.
