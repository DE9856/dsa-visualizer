# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and instructors, as equal first-class users. Neither is sacrificed for the other.

- **Students** learning Data Structures & Algorithms, mostly self-study: they have read
  about an operation and step through it, forwards and backwards, until the mechanism
  makes sense. Also developers refreshing algorithms for coding interviews.
- **Instructors** demonstrating in class: projecting a run to a room, building a setup
  beforehand and sharing it as a link, and relying on playback behaving predictably while
  they talk over it.

## Product Purpose

An interactive visualizer that shows how algorithms and data-structure operations execute,
one step at a time. Every run is precomputed as frames, so stepping back, scrubbing and
replay are free. Success is a learner who can explain *why* the structure changed at each
step, and an instructor who can make a point in front of a room without fighting the tool.

## Positioning

All of the following together; a neighbouring visualizer typically has one of them:

- **Honest mechanics.** Nothing is faked for the animation: operation counts are reported
  by the algorithms as they run, the pseudocode line and the matching lines in C, C++,
  Java, Python and JavaScript light up on the same step, and complexity claims are checked
  with empirical sweeps.
- **Breadth of syllabus.** Well past the usual set: B/B+ trees, leftist and selection
  trees, double-ended priority queues, sparse matrices and array layout, dynamic hashing,
  dynamic programming, backtracking, string algorithms, network flow.
- **Comparison as a first-class idea.** Race & Compare (2–4 sorts on one input, fair
  operation-synced mode, empirical Big-O) and Balance & Height (BST vs AVL vs 2-3 on the
  same keys).
- **Private and shareable.** No accounts, nothing stored server-side, no third party
  contacted; a whole setup travels in the URL hash.

## Operating Context

- Self-study at a laptop or on a phone; projected in a lecture hall.
- Keyboard-driven playback (transport bar, shortcuts), undo/redo, copy/paste of
  structures, hand-edited arrays.
- Shared links (`#v=tree&type=avl&a=30,20,10`) as the unit of a prepared demo.
- Exports (GIF and others) for slides and notes.
- Deployed as a static bundle on Vercel; routing lives entirely in the hash.

## Capabilities and Constraints

- React 18 + Vite, plain JS/JSX, `lucide-react` as the only other runtime dependency. All
  styling in `src/index.css`. See `CLAUDE.md` and `DOCS.md#architecture`.
- **No third-party requests.** Fonts are self-hosted; no CDNs, embeds, analytics or remote
  scripts. `public/privacy.html` states this outright and becomes false otherwise. Only
  three `localStorage` keys exist and the notice lists them.
- **Phone is a real target.** Below 760px the sidebar becomes a bottom sheet with a fixed
  action bar; nothing may scroll the page sideways.
- Appearance (theme, high contrast, state colours) describes the reader, not the run, and
  stays out of shareable links.
- Standalone pages (`404.html`, `privacy.html`, `terms.html`) must render without the
  bundle.
- Animations and complexity claims are teaching simplifications; the terms say so.
- Undecided: contact address and governing jurisdiction in `terms.html` are placeholders.

## Brand Commitments

- Name: **DSA Visualizer**.
- Voice in docs and UI copy: precise, explanatory, says *why* — e.g. "Cycle Sort — the
  fewest writes any sort can make".
- Self-hosted JetBrains Mono and IBM Plex Sans are already in use (`public/fonts/`).

## Evidence on Hand

- `README.md`, `DOCS.md`, `CHANGELOG.md` — detailed, maintained descriptions of every view.
- Measured colour-blind palette results documented in `DOCS.md` ("Colour is not the only
  channel").
- No testimonials, user counts, adoption figures or institutional endorsements exist;
  future work must not invent them.

## Product Principles

1. **Show the real mechanism.** If the picture and the algorithm disagree, the picture is
   wrong. Counts, highlights and claims come from the run itself.
2. **Every step must be legible on its own.** A paused frame, read cold by a student or
   from the back of a lecture hall, should say what just happened.
3. **Comparison teaches.** Prefer putting things side by side over describing differences.
4. **The setup is the document.** A run must be reproducible from its link alone.
5. **Respect the reader.** No tracking, no accounts, nothing contacting a third party.

## Accessibility & Inclusion

- **Colour is never the only channel.** Every state carries a glyph as well as a colour;
  a measured colour-blind-safe palette and a high-contrast modifier (light and dark) ship.
- **Projector legibility** is a requirement: canvases, labels and state cues must survive
  projection, washed-out contrast and distance.
- Reduced motion is honoured: decorative motion off, step playback unaffected.
- Sonification ("Hearing the run") exists as an additional channel.
