# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Usability and playback-smoothness pass across every visualizer.

### Added

- **Scrubbable timeline** under the transport bar in every view — drag or click to jump to
  any step of a run. Focusable, so arrow keys scrub it too.
- **Keyboard shortcuts** (`src/hooks/useKeyboardShortcuts.js`):
  <kbd>Space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd> step, <kbd>Home</kbd>/<kbd>End</kbd>
  jump to first/last, <kbd>R</kbd> reset, <kbd>S</kbd> shuffle, <kbd>?</kbd> toggle help.
  They're ignored while typing in a field, and a focused button keeps its native
  <kbd>Space</kbd> behaviour.
- **In-app shortcut cheat sheet**, toggled by <kbd>?</kbd> or the keyboard button at the
  right end of the transport bar.
- **<kbd>Enter</kbd> runs the selected operation** — each sidebar's operation block is now
  a real `<form>`, so submitting from any input runs it.
- **Live speed read-out** next to the slider, in steps per second, replacing the unlabelled
  slider.
- **Replay affordance** — the play button becomes a replay icon once a run reaches the end.
- **Tooltips and `aria-label`s** on every transport control, each naming its shortcut.
- **`prefers-reduced-motion` support** — decorative animation is dropped when the OS asks
  for reduced motion; step playback still works.
- **`DOCS.md`** — setup, shortcuts, input formats, architecture and extension guide.
- **`CHANGELOG.md`** — this file.

### Changed

- **Playback rewritten as a shared `useStepPlayer` hook**, replacing eight near-identical
  `setInterval` blocks duplicated across the view hooks. It runs on
  `requestAnimationFrame` and reads speed through a ref, so changing speed mid-run retimes
  the next step instead of tearing down and restarting the timer.
- **Animation duration now tracks playback speed** via a `--step-anim` CSS variable set
  from the current step delay — slow runs glide, fast runs snap, instead of every run using
  a fixed 250–280 ms transition that smeared steps together at speed.
- **Transport buttons disable at the boundaries** (reset/step-back at step 1, step-forward
  at the end) instead of silently doing nothing.
- **Speed curve unified across views.** Sorting/searching used `620 - speed × 5.5`
  (30 ms floor) while every other view used `720 - speed × 6` (40 ms floor); all views now
  share one curve, 700 ms → 40 ms per step.
- **`Controls` and `ListControls` merged.** `Controls` is now the single transport
  component with optional comparison/swap metrics; `ListControls` is a thin wrapper.
- **`App.jsx` simplified** — one `transport` prop bundle wired to the active view's player,
  replacing eight copies of inline `onReset` / `onStepBack` / `onStepForward` closures.
- **Every clickable `<div>` is now a `<button>`** — algorithm rows, operation rows,
  collapsible group headers and top-bar menu items — with `aria-pressed` / `aria-expanded`
  state and a consistent `:focus-visible` ring.
- **Sidebar range and text inputs are properly labelled** with `<label for>`.

### Fixed

- **Playback stutter when moving the speed slider.** The old playback effect depended on
  `[playing, speed, steps]`, so every slider change destroyed and recreated the interval,
  resetting its phase mid-run.
- **Render-phase side effect in `useVisualizer`** — `setPlaying(false)` was called inside a
  `useMemo`, updating state during render.
- **State setter called inside a state updater** — the playback tick called `setPlaying`
  from within a `setStepIdx` updater. Auto-stop is now its own effect.
- **Right-most top-bar dropdown overflowed the viewport**, adding a horizontal scrollbar to
  the whole page. It now right-aligns and is width-capped.
- **Duplicate keys in the `usePolynomial` return object** (`atEnd`, `runOperation`,
  `togglePlay` were each listed twice).
- **Top-bar dropdowns now close on <kbd>Esc</kbd>**, not only on outside click.

---

## [1.0.0] — 2026-08-03

First working release: an interactive React + Vite visualizer for core algorithms and data
structures, with step-by-step playback, complexity information and pseudocode panels.

### Added

- **Boot screen and category landing page**, plus the long-form topic write-ups shown under
  each visualizer. (`a23a1b7`)
- **Additional searching algorithms** — jump search, interpolation search and exponential
  search, alongside linear and binary search. (`f549486`)
- **Additional sorting algorithms** — shell sort, radix sort and comparison counting sort,
  alongside bubble, selection, insertion, merge, quick and heap sort. (`5d0881d`)
- **Array visualizer** with random array generation, custom array input, adjustable size,
  target selection for searches, and `lo`/`mid`/`hi` pointers for range-based searches.
- **Data-structure visualizers** — linked list (singly, doubly, circular), polynomial
  arithmetic, stack, queue, binary tree / BST / AVL, 2-3 tree, and graph with adjacency-list
  and adjacency-matrix views plus drag-to-connect edge creation.
