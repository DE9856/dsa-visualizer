---
name: DSA Visualizer
description: Algorithms as signals on a dark instrument screen. Every trace means something, and colour is never the only channel.
colors:
  signal-amber: "#ff8a3d"
  signal-amber-light: "#b04804"
  trace-cyan: "#4fb8e0"
  trace-cyan-light: "#146e98"
  settled-green: "#5fd6a0"
  settled-green-light: "#0c7e55"
  swap-red: "#ff6b6b"
  swap-red-light: "#c12a2a"
  pivot-violet: "#b18cff"
  pivot-violet-light: "#6a3ebe"
  caution-gold: "#f5c451"
  caution-gold-light: "#8c6206"
  phosphor-black: "#0b0d12"
  bezel-graphite: "#171a22"
  overlay-graphite: "#11141b"
  trace-white: "#edebe6"
  graticule-grey: "#8b90a0"
  on-amber: "#14100b"
  paper-grey: "#f2f3f6"
  paper-white: "#ffffff"
  ink: "#14171d"
  ink-dim: "#596070"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.08em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.04em"
  control:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
  readout:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.5px"
    fontFeature: "tnum"
rounded:
  bar: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  menu: "12px"
  panel: "14px"
  card: "16px"
  sheet: "20px"
  pill: "999px"
spacing:
  hair: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  gutter: "18px"
  page: "24px"
components:
  button:
    backgroundColor: "{colors.bezel-graphite}"
    textColor: "{colors.graticule-grey}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  button-hover:
    textColor: "{colors.trace-white}"
  button-selected:
    backgroundColor: "{colors.signal-amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.pill}"
  button-run:
    backgroundColor: "{colors.signal-amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.pill}"
  button-done:
    textColor: "{colors.settled-green}"
    rounded: "{rounded.pill}"
  button-accent:
    textColor: "{colors.signal-amber}"
    rounded: "{rounded.lg}"
    padding: "7px 14px"
  button-icon:
    textColor: "{colors.graticule-grey}"
    rounded: "{rounded.lg}"
    padding: "9px"
  chip:
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  input:
    backgroundColor: "{colors.bezel-graphite}"
    textColor: "{colors.trace-white}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  segmented:
    backgroundColor: "{colors.bezel-graphite}"
    rounded: "{rounded.lg}"
    padding: "3px"
  panel:
    backgroundColor: "{colors.bezel-graphite}"
    rounded: "{rounded.panel}"
  sidebar:
    width: "232px"
    padding: "16px"
  canvas:
    height: "340px"
    padding: "20px"
  landing-card:
    backgroundColor: "{colors.bezel-graphite}"
    rounded: "{rounded.card}"
    padding: "20px"
  bottom-sheet:
    backgroundColor: "{colors.overlay-graphite}"
    rounded: "{rounded.sheet}"
---

# Design System: DSA Visualizer

## Overview

**Creative North Star: "The Oscilloscope"**

The app is an instrument screen. A near-black field lit by three soft washes — amber
from the top left, cyan from the top right, violet from below — and on it traces in
saturated hues that each mean exactly one thing: comparing, swapping, in place, pivot,
probing, found, with untouched elements glowing Signal Amber. The chrome around the
screen is the bezel — translucent graphite, mono-labelled — and where you are is lit in
the same amber: the open category, the chosen algorithm, the selected toggle. Glow is how a trace looks on phosphor, which is why the dark
theme is the reference rendering; light and high-contrast are re-tunings of the same
instrument, not different products.

Density is high and deliberate: a sidebar of controls, a canvas, a readout panel, a
transport bar, all on one screen, because the user is operating something and watching
it at once. Everything is driven from a small set of primitives on `:root` — six hue
channels, one overlay ink, a surface — and three independent axes on `<html>`
(`data-theme`, `data-contrast`, `data-palette`) re-point them. Components never know
which theme, contrast or palette is active.

Meaning is carried twice. Every state hue has a glyph beside it (`↔ ⇄ ✓ ◆ ◎ ★`), a
fill strength, and in some views a tone, so no reading of the screen depends on hue
alone.

**Key Characteristics:**
- A near-black phosphor field with three soft radial washes (amber, cyan, violet);
  light theme is cool paper.
- State hues named for what they mean (`--state-compare-rgb`), never for their colour;
  idle is Signal Amber in the default palette.
- Translucent fills mixed from bare RGB channels: tinted body, solid stroke, optional glow.
- JetBrains Mono for controls, values, counters and code; IBM Plex Sans for names,
  titles, narration and prose.
- Signal Amber for the current place and the current choice: filled, with a soft glow.
- A drawn trace mark, and a drawn structure glyph for each family on the landing page.
- Three composable appearance axes; high contrast strips glow and thickens strokes.

## Colors

A dark instrument palette: graphite neutrals, one amber "you are here" accent, and five
signal hues that each carry one algorithm state. Every hue exists as bare channels
(`--primary-rgb: 255 138 61`) so any alpha can be mixed from it, and each has a darker
light-theme variant tuned to hold contrast on white.

### Primary
- **Signal Amber** (`signal-amber`, light: `signal-amber-light`): the warm heart of the
  app. Untouched bars and the probe on the canvas; the open category tab, the chosen
  algorithm, selected toggles and code tabs; panel titles; sliders and the playhead; the
  run and play buttons; the focus ring and the glowing brand mark.

### Secondary
- **Trace Cyan** (`trace-cyan`): comparing. The most frequent state in any run.
- **Settled Green** (`settled-green`): in place / found. The colour of a finished
  element and of result badges.

### Tertiary
- **Swap Red** (`swap-red`): swapping, and errors.
- **Pivot Violet** (`pivot-violet`): pivot, and the Graphs category accent.
- **Caution Gold** (`caution-gold`): category accent for Matrices and Hashing; not a
  state colour in the default palette.

### Neutral
- **Phosphor Black** (`phosphor-black`): the page field in dark. Pure black under high
  contrast.
- **Bezel Graphite** (`bezel-graphite`): the surface every panel is mixed from, at 72% opacity so the washes show through.
- **Overlay Graphite** (`overlay-graphite`): menus, sheets and dialogs that float above
  the panels.
- **Trace White** (`trace-white`): primary text, a warm off-white rather than pure white.
- **Graticule Grey** (`graticule-grey`): dimmed text, idle button labels, secondary
  readouts.
- **On-Amber** (`on-amber`): text on an amber fill; inverts to white in light theme.
- **Paper Grey / Paper White / Ink / Ink Dim**: the light-theme field, surface, text and
  dimmed text.
- Hairlines and soft fills are not their own colours: `--border` is overlay ink at 8%,
  `--border-strong` at 14%, `--panel-alt` at 3.5% (raised to 45% / 80% / 10% under high
  contrast).

### Named Rules
**The Meaning-Not-Hue Rule.** Canvases read only `--state-*-rgb` tokens. A component
never names a hue for a state; the palette decides which hue a meaning gets.

**The Lit Choice Rule.** What you have chosen is lit: a selected button, tab or menu
item is filled Signal Amber with On-Amber text and a soft amber glow; a selected list row
or code tab is amber text on `--primary-dim`. `--active-fill` (a neutral step) is only
for toggled icon buttons such as sound and the shortcut help.

**The Second Channel Rule.** No state is shown by colour alone. A new state ships with a
glyph in `stateStyle.js` and a label, or it does not ship.

**The Primitive Override Rule.** Themes, contrast and palettes redefine primitives
(`--ink-rgb`, the six hue channels, `--fill-*`), never component styles. If a theme
needs a component-specific rule, the primitive is missing.

## Typography

**Display Font:** IBM Plex Sans (with sans-serif)
**Body Font:** IBM Plex Sans (with sans-serif)
**Label/Mono Font:** JetBrains Mono (with monospace)

**Character:** Plex is the engineer's humanist sans — legible and plain for prose and
titles; JetBrains Mono is the instrument's readout voice and owns every control, label,
counter and value. Both are self-hosted variable fonts, 400–700.

### Hierarchy
- **Display** (700, 32px, -0.02em, mono): the landing wordmark only.
- **Headline** (700, 17px, -0.02em): the app title in the top bar.
- **Title** (600, 15–17px, Plex): info-panel titles (`h2`), topic and complexity panel
  titles. Category labels on landing cards stay mono caps at 13px, 0.06em.
- **Narration** (400, 14px, 1.5, full ink): the step message under each canvas.
- **Body** (400, 12.5–14px, 1.5): blurbs, descriptions, topic prose. Canvas hints are
  12.5px sentences in the text face.
- **Label** (mono 400, 11px, 0.04em): field labels above inputs; the most common size in
  the app.
- **Control** (mono, 12px): button and input text; chips drop to 9.5px at 0.06em.
- **Readout** (mono, 12px, tabular figures): step counters, comparison and swap counts,
  anything a number changes in while playing.

Weight is binary in practice: 700 for emphasis, 600 for titles, 400 for everything else.
Uppercase labels carry 0.06–0.08em tracking.

**Floor:** nothing in the stylesheet is set below 11px except index marks inside
fixed-size cells, which are 10px. The scale is still dense for projection; 11px labels are
the minimum, not the target.

**Case:** capitals are for short silkscreen labels of three words or fewer (EXPORT, VALUE,
OPERATIONS, category names). A sentence — a hint, an empty state, a heading — is
sentence case in the text face. All figures use tabular digits.

### Named Rules
**The Readout Rule.** Any number that changes during playback is mono with tabular
figures, so the digits don't jitter as they count.

**The Projection Floor Rule.** No text below 11px, except an index mark inside a cell
that is sized for it (10px).

**The Silkscreen Rule.** Capitals label a control in three words or fewer. Anything that
reads as a sentence is set in sentence case.

## Layout

A single working screen. The app pads 18px top / 24px sides; a top bar holds the title
(separated by a hairline) and every category as a wrapping row of pills — wrapping to two
rows rather than scrolling so every category stays visible. Below it, a flex row with an
18px gutter: a fixed 232px sidebar of controls, then the main column (canvas, transport,
info and pseudocode panels). Canvases have a fixed 340px default height with 20px
padding; wide content (matrices, trees, tables) gets its own scroll container.

Breakpoints: 1100px and 900px tighten panel arrangements (between 761 and 1100px the
wordmark takes its own line above full-width category tabs); 1000px drops the landing to
two columns; 640px compacts it. The floating EXPORT/SHARE cluster reserves
`--share-safe` (196px) in the first panel's top-right corner.
**760px is structural, not cosmetic:** below it the sidebar moves into a bottom sheet
(max 74dvh, so a slice of the canvas stays visible) with a fixed action bar, driven by
`useIsMobile`, not only by a media query.

The landing page is a centred column, 60px vertical padding, a 44px gap under the
header, then a grid of category cards (`auto-fit, minmax(260px, 1fr)`, 16px gap,
max 1080px) that keep their own heights so opening one card doesn't stretch its row.

Spacing is a loose 2px-step rhythm clustered on 4 / 6 / 8 / 12 / 16 / 18 / 24.

### Named Rules
**The No Sideways Scroll Rule.** The page never scrolls horizontally at any width.
Anything wide scrolls inside its own container.

## Elevation & Depth

Layered translucency with soft ambient shadow. Panels are 72%-opaque graphite over the
radial-wash field, edged with an 8% hairline and lifted by a large faint shadow plus a
1px inset highlight on the top edge. Floating layers (menus, the share popover, the
phone's sheets and bars) are more opaque, blurred behind, and cast deeper shadows. Glow
is the signal device: a coloured halo on the brand mark, selected pills, the scrubber
thumb, the family glyphs and highlighted canvas elements — always droppable.

### Shadow Vocabulary
- **Panel rest** (`box-shadow: 0 1px 0 rgb(var(--ink-rgb) / 0.03) inset, 0 10px 30px rgb(var(--shadow-rgb) / 0.25)`): every `.panel`.
- **Menu** (`box-shadow: 0 1px 0 rgb(var(--ink-rgb) / 0.03) inset, 0 14px 32px rgb(var(--shadow-rgb) / 0.4)`): category dropdowns, with a 14px blur behind.
- **Card lift** (`box-shadow: 0 14px 32px rgb(var(--shadow-rgb) / 0.35)`): a hovered landing card, risen 3px.
- **Signal glow** (`box-shadow: 0 0 16px rgb(var(--primary-rgb) / 0.4)`): selected buttons; tabs use 14px at 0.28.
- **Appearance panel** (`box-shadow: 0 18px 40px rgb(var(--shadow-rgb) / 0.45)`).
- **Dialog** (`box-shadow: 0 24px 56px rgb(var(--shadow-rgb) / 0.5)`): the export dialog.
- **Sheet** (`box-shadow: 0 -16px 44px rgb(var(--shadow-rgb) / 0.55)`): the mobile bottom sheet.
- **Trace glow** (`box-shadow: 0 0 10px rgb(var(--state-…-rgb) / var(--glow-alpha))`): canvas elements.

### Named Rules
**The Droppable Glow Rule.** Glow is part of the identity on dark, but it never carries
meaning on its own; canvas glows go through `--glow-alpha` so high contrast can remove
them, and anything that only reads because it glows is broken.

**The Static Blur Rule.** Never transform an element that has a `backdrop-filter`; the
backdrop re-blurs every frame. Panels and cards carry no blur, only overlays do.

## Shapes

Soft, small radii that grow with the size of the container: 4px for bars (with 2px
bottom corners so they sit on the baseline), 6px for focus rings and small cells, 8px for
inputs and toggle buttons, 10px for icon buttons, segmented controls and list items, 12px
for menus, 14px for panels, 16px for landing cards, 20px for the top of the bottom sheet.
Text buttons and chips are full pills (999px). Borders are always 1px hairlines mixed
from the overlay ink; state strokes on canvas elements use `--stroke-width` (1.5px, 2px
under high contrast).

## Components

Instrument controls: quiet, tactile, mono-labelled; they recede until touched, then
answer precisely.

### Buttons
- **Shape:** full pill (999px); icon and accent variants use a 10px rounded rectangle.
- **Default:** translucent fill (`--panel-alt`), Graticule Grey mono text, 12px, 7px × 14px
  padding, no border.
- **Hover / press:** text brightens to Trace White over a 7% ink fill; pressing scales to
  0.97 over 140ms on `--ease-out`. Only colour, fill, border and transform transition.
- **Selected (`.active`):** solid Signal Amber fill, On-Amber text, amber glow (pinned
  through hover).
- **Run (`.active[type="submit"]`):** the same fill at 600 weight.
- **Done (`.is-done`):** Settled Green text on a 10% green fill with a green hairline; the
  tick scales in. Used by Copy and Share.
- **Accent:** amber text with a 40% amber hairline; the play button and the export
  dialog's Render.
- **Ready (`.accent.is-ready`):** the play button is filled amber while a run is loaded
  and has not started, then returns to the outline.
- **Icon:** 9px padding, hairline border, 10px radius.
- **Disabled:** 35% opacity, not-allowed cursor.

### Chips
- **Style:** pill button at 9.5px mono, 0.06em tracking, 4px × 8px; preset values and
  quick picks. Canvas chips (DP, expression, trie) tint with the relevant state hue.

### Cards / Containers
- **Panel:** 14px radius, 72% graphite, 1px 8% hairline, panel-rest shadow. Everything
  in the workspace (sidebar, canvas, info, transport) is a panel.
- **Landing card:** 16px radius, 18px × 20px padding; the whole card toggles open. Each
  family owns an accent (`--accent`), shown in its glyph and, on hover (fine pointers
  only) or when open, in a 55%-accent border and the chevron. Closed cards list their
  topics in two clamped lines; blurb and topics each reserve two lines so a row ends level.
  The largest family spans two columns. Topic tiles inside an open card are 10px-radius,
  tint with the accent at 12% on hover, and their arrow nudges 2px.

### Inputs / Fields
- **Style:** mono 12px, 8px × 10px, 8px radius, `--panel-alt` fill, 1px hairline.
- **Focus:** border turns Signal Amber; no glow. Keyboard focus elsewhere is a 2px amber
  outline at 2px offset.
- **Labels:** mono 11px Graticule Grey above the field, 8px gap.
- **Error:** Swap Red text under the field.

### Segmented Controls / Type Toggles
- A 10px-radius tray (`--panel-alt`, hairline, 3px padding) of flexible buttons at 8px
  radius. Long option sets stack vertically or wrap 2×2 rather than shrinking text.

### Navigation
- **Top bar:** the wordmark is a `<button>` inside the `h1` (the way home, first tab
  stop), with the drawn trace mark in Signal Amber; category pills wrap beside it. Hover
  gives a faint fill; the open category is filled Signal Amber with a soft glow. Dropdown
  menus are translucent overlays (12px radius, 14px blur, menu shadow) that grow from
  their tab's top-left corner over 200ms.
- **Mobile:** below 760px the sidebar becomes a bottom sheet (20px top radius, 97%
  overlay, 18px blur, slides up over 0.32s on `--ease-drawer`) with a fixed action bar. The sheet
  closes on submit, not on click.

### State Bar (signature)
The sorting bar is the system in miniature: a fill of the state hue at
`--fill-soft` / `--fill-mid` / `--fill-strong` (0.14 / 0.32 / 0.5), a solid stroke of the
same hue at `--stroke-width`, an optional glow, and the state glyph. Height animates over
`--step-anim` on `cubic-bezier(0.4, 0, 0.2, 1)`; colour transitions on plain ease. Every
other canvas element (nodes, cells, slots) follows the same fill-stroke-glow-glyph recipe.

### Family Glyph (signature)
Each landing card opens with a 64×28 drawing of its family's structure (`CategoryGlyph`):
bars, a tree, a graph, a sparse grid, a linked list, a stack, a hash chain, a DP table with
its traceback, a string window, a pruned search tree, intervals. One 1.5px stroke in the
card's accent; the marks where a run would be working are filled at 35%.

### Live Trace (signature)
The landing header carries a real run (`LiveTrace`): 26 bars cycling through quick,
insertion, merge and heap sort at 60ms a step, holding the all-green finish for 1.6s,
coloured from the same state tokens as the canvas (pivot marked on the edge). It is a
button that opens the sorting view. It pauses off-screen and in hidden tabs; under
reduced motion it is one still mid-run frame.

### First Open
Once per page load the landing header rises in line by line (0/50/100ms), the live trace
at 120ms, the cards at 150ms plus 35ms each, and each glyph is traced by a 900ms
stroke-dash sweep with its filled marks fading in after — the instrument switching on.
All of it uses `backwards` fill so hover states are untouched afterwards.

### Readouts
Step counters and operation counts (`.lcd`) are mono, tabular, 12px, Graticule Grey.
Result badges are 13px mono bold in Settled Green, centred.

## Do's and Don'ts

### Do:
- **Do** mix every new fill or border from the existing channels:
  `rgb(var(--state-compare-rgb) / var(--fill-mid))`, `rgb(var(--ink-rgb) / 0.08)`.
- **Do** give every new state a glyph, a label and a fill strength in `stateStyle.js`.
- **Do** time step-driven transitions with `var(--step-anim)` so they never outlast the
  gap between steps; interface motion uses `--dur-press` / `--dur-ui` / `--dur-overlay`
  with `--ease-out` (or `--ease-drawer` for sheets), and `--control-transition` on controls.
- **Do** light a selected state in Signal Amber (filled for buttons and tabs, amber text on
  `--primary-dim` for rows and code tabs).
- **Do** check new work in all three axes: light and dark, high contrast on and off,
  default and safe palette.
- **Do** put every control label, value and counter in JetBrains Mono.
- **Do** keep all styling in `src/index.css`, with colours defined as tokens on `:root`.

### Don't:
- **Don't** hardcode a hex or `rgb()` value in a component; a palette or theme switch
  will miss it. (Category accents in `categories.js` point at `var(--…)` for this reason.)
- **Don't** use Signal Amber as a border flourish or for body emphasis.
- **Don't** put a `backdrop-filter` on a panel or card; blur is for overlays.
- **Don't** write a sentence in capitals.
- **Don't** use `transition: all`.
- **Don't** let glow or hue be the only way something reads.
- **Don't** put new canvas or label text below 11px.
- **Don't** let anything scroll the page sideways at any width.
- **Don't** add a webfont, icon CDN or remote asset; fonts are self-hosted and the app
  contacts no third party.
- **Don't** animate a transform on an element with `backdrop-filter`.
