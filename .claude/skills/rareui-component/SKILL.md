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
3. **Page**: `app/components/(docs)/<slug>/page.tsx`, copy `lightbeamcard/page.tsx` and change `HREF`. The slug is the name lowercased, no dashes (`lightbeamcard`).
4. **Entry**: add to `components` in `lib/components.ts`: `name`, `href`, `category`, `registry`, `isNew: true`, `description`, `dependencies`, `interaction`, `props`, `usage`. Follow `CONVENTIONS.md` copy rules exactly. Every number must match the code.
5. **Card preview**: no video yet? Add a small live version to `PREVIEWS` in `components/gallery/LivePreview.tsx`, keyed by the registry name.
6. **Registry**: add an item to `registry-pro.json` (path `components/pro/<kebab-name>.tsx`, `registryDependencies: ["utils"]` if it uses `cn`). The description matches `lib/components.ts` word for word. Then run `npm run registry:build`, which writes `registry/pro/*.json`.
7. **Verify**: `npx tsc --noEmit` and `npx eslint` on the touched files. Don't start the dev server; the user checks in their own browser.

## Report

One short line per file touched, then anything the user must decide.

## Learned from Swami

Add each correction or approved pattern here as a one-line rule, so the next component gets it right first time.
