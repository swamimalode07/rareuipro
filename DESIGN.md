# Design

The visual language of Rare UI Pro. Read this before designing any page, section or component for the site. `CONVENTIONS.md` covers code and copy; this file covers how things look.

## Principles

- Restrained and deliberate. Show the product, do not decorate around it.
- One accent moment per section. Everything around it stays quiet.
- No SaaS template tropes: glow blobs, background grids, gradient headline text, checkmark feature rows, clashing badge colours.
- No metallic or chrome surfaces in large areas. Metal is reserved for the logo mark.
- Copy is short, plain and human. Two-line headlines, no slogans, no "you"-heavy marketing voice.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| Orange | `#FC4C01` | The brand accent: primary buttons, the rare petal, the word Pro. Hover is `#ff5a12`. |
| Surface light | `#F5F5F7` | Cards and the hero shell in light mode. |
| Surface dark | `#121212` | Cards and the hero shell in dark mode. Pricing card uses `#0E0E0E`. |
| Page | white / black | Page background behind the surfaces. |
| Text dim | `black/40`, `white/45` | Second line of two-tone headlines. |
| Text muted | `black/50` to `/70`, `white/50` to `/70` | Body copy, captions, list items. |

Orange is used sparingly. If more than one orange thing competes in a view, remove one.

## Type

- Open Runde (`font-runde`) for headings, buttons, labels and the wordmark. The system sans for running text.
- Headlines are bold, tight (`tracking-[-0.04em]` to `-0.045em`), leading near `0.95`.
- Two-tone headlines: the first line full strength, the second line in the dim tone. Example: "Tasteful interfaces, / made to feel rare."
- Prices and counts use `tabular-nums`.

## Shape

- Squircles everywhere: `corner-shape: squircle` on large containers, `@squircle-js/react` with `cornerSmoothing={1}` on buttons.
- Radii: buttons 16, cards 32 to 40, the hero shell 45.
- Navbar pieces are full pills with a frosted glass fill and a 1px inset top highlight.

## Buttons

- Primary: solid orange squircle, white Open Runde semibold, 44 to 48px tall. Brightens on hover. Presses to `scale(0.97)`. No stretch on hover.
- Secondary: plain text link with an arrow that nudges right on hover. No frosted box.
- On a coloured surface (like the pricing beam), the button flips to a solid neutral: near-black in light mode, `#EDEDED` in dark mode.

## Logo

- Free: the five-petal flower, all orange (`public/logos/Rareui.svg`).
- Pro: four brushed-silver petals and one orange petal on the right, the rare one. Component `RareuiProLogo` in `components/logos.tsx`, favicon `public/logos/RareuiPro.svg`.
- Wordmark: "Rare UI Pro" in Open Runde bold, with Pro in orange.

## Motion

- Springs, not easing curves, for UI: `stiffness 300, damping 22` is the default.
- Content rises in with a short blur (`y: 18, blur(6px)` to rest), staggered by about 90ms.
- Background shaders move slowly and follow the cursor gently. They never pull focus from the copy.
- Every animation honours `prefers-reduced-motion`.

## Signature surfaces

### Satin petals

The hero and footer background: the logo's five petals, huge and matte, rendered in WebGL by `components/hero/PetalField.tsx`. Soft graphite with grey and cream mist and slow orange wisps. Matte only; no gloss, stripes or metal. Pass `center` and `size` to place the flower; pass `veilRef` to darken the area behind copy.

### Light strands

The beam on the pricing card: warm light pouring in from one corner, cut by fine diagonal hairlines that run along the beam. Built in `components/pricing/PricingSection.tsx` (`Beam`) from layered blurred gradients plus a `repeating-linear-gradient` of 1px lines every 6px, masked to fade out along the beam.

These strands are a signature of the brand. Reuse them when a surface needs one moment of energy: a featured card, a highlighted block, an empty state, an OG image. Rules:

- Lines are hairline (1px), low contrast (white at about 12%), and run in the beam's direction.
- They only appear inside the light, fading out with it. Never on a flat background.
- One beam per view.

## Layout

- Hero, pricing and footer content sits in a `max-w-6xl` column; cards are narrower (pricing is `30rem`).
- Sections breathe: `py-24` on mobile, `py-32` on desktop.
- Section headers are centred; the gap from header to content is 40 to 48px.

## How Swami likes it

The taste behind this file, learned from what was accepted and what was rejected. Follow it whenever designing for Rare UI.

### What gets rejected

- Anything that reads as "vibecoded": decorative dots under active links, gradient glows with no reason, stretch-on-hover buttons, logo icons stuffed into buttons, frosted boxes around secondary links.
- Copying a reference 1:1. Inspiration sets the direction; the result must feel like Rare UI, built from its own petals, orange and squircles.
- Metal or chrome surfaces in backgrounds. It reads as depressing; matte satin and warm mist read as Rare UI.
- Fire. Strong orange everywhere feels like flames; orange is a wisp or a single accent.
- Slogan copy: "Rare by design", "the details others skip", "ready when you are". Headlines stay short, plain and in the free site's shape (adjective, noun, then a "made to" line).
- Oversized sections. Scale every new section against the navbar and the hero button; if it towers over them, shrink it.
- Big refactors when a tweak was asked for. "Polish it" means keep the structure and adjust details.

### What gets accepted

- The free site's quality bar: "Tasteful Components, Made to Stand Out." is the tone benchmark.
- Subtle motion that follows the cursor, slow drifts, and restrained light.
- Squircles, Open Runde, two-tone headlines, one orange accent per view.
- Crisp rendering. Blurry or jagged edges are bugs; render shaders at device resolution and rasterize real SVG paths, never upscale a small texture.
- Signature details that can be reused, like the light strands, written into this file once approved.

### How to work

1. Look first. Read the screenshot or reference carefully and name what makes it work before building.
2. Build the smallest version that captures it, in the Rare UI language.
3. Screenshot it yourself (headless Chrome against the running dev server) and judge it at real size before reporting back. Check navbar and button scale against the new piece.
4. Iterate in small steps. When feedback says "too much", pull back by one step, not to zero.
5. Offer options as a visual board (an artifact) when the direction is open, with one clear pick and why.
6. When something is approved, record it here so the next session keeps it.
