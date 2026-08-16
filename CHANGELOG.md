# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Usability and playback-smoothness pass across every visualizer, plus four new structures:
hash tables, heaps, tries and union-find.

### Added

- **Binary heaps** — max and min, under TREES. The complete tree and the flat array it
  actually lives in are drawn together and highlighted in lockstep, with the index
  arithmetic (`parent ⌊(i−1)/2⌋`, `left 2i+1`, `right 2i+2`) spelled out for whatever the
  current step is touching, since a heap stores no child pointers at all. Insert sifts up
  from the end, extract fills the root from the end and sifts down, and new values arrive
  as a plain array that is heapified on screen — the bottom-up build is O(n), and watching
  it is the point. Switching max/min re-heapifies the same values. Search prunes subtrees
  whose root is already outranked by the target, which is a real optimization and still
  O(n) — a heap is not a search structure. New `src/dataStructures/heap/`, `useHeap`,
  `HeapCanvas`, `HeapSidebar`.
- **Tries** — a prefix tree under TREES, where a green ring marks an end-of-word node.
  That ring carries the structure's central distinction: searching "car" in a trie holding
  only "card" walks the whole path successfully and still answers PREFIX ONLY. Insert
  creates only the nodes a word actually needs and reports how many it reused; delete
  clears the flag and prunes back up, stopping at the first node that still has children
  or is itself a word; autocomplete walks to a prefix and enumerates the subtree below it,
  alphabetically, because children are always visited in order. New
  `src/dataStructures/trie/`, `useTrie`, `TrieCanvas`, `TrieSidebar`.
- **Union-Find surfaced as its own structure** under GRAPHS, with path compression
  animated. The forest and the parent array sit side by side: every find walks to the root
  and then re-points each element it passed straight at that root, one frame per pointer,
  and the trees visibly flatten — run the same find twice and the second has nothing left
  to compress. Union by size hangs the smaller tree under the larger, and a union of two
  elements already in one set reports ALREADY CONNECTED, which is precisely the cycle check
  Kruskal's runs. New `src/dataStructures/unionFind/`, `useUnionFind`, `UnionFindCanvas`,
  `UnionFindSidebar`.

- **Hash tables** — a new HASHING category with all three classic collision strategies:
  separate chaining, linear probing and quadratic probing. The canvas is the bucket array
  itself, one row per index, so a probe sequence reads top to bottom and its wrap past the
  last bucket is visible; the header carries the load factor as a bar with a tick at the
  limit that triggers a resize, and the line below shows the hash being computed. Insert,
  search and delete all walk the same path through `locate()`, so a lookup provably
  retraces its insert. Operations: insert, search, delete, load factor, list keys, resize,
  clear. New `src/dataStructures/hashTable/`, `useHashTable`, `HashTableCanvas`,
  `HashTableSidebar`.
- **Load-factor-triggered resizing, animated.** Crossing the limit (0.75 chaining, 0.5
  probing) grows the table to the next prime capacity mid-run and replays every key into
  it, one frame per key — a rehash is not a copy, since `h(k)` is taken mod the new
  capacity. Table sizes are prime (7 → 17 → 37 → …), which keeps `k mod m` from clustering
  and is what makes quadratic probing's guarantee hold. **Resize** forces the same by hand.
- **Tombstones.** Deleting from an open-addressed table leaves a `DEL` marker rather than
  an empty slot, because blanking it would strand every key whose probe sequence runs
  through it. Searches step over tombstones; later inserts reuse the first one they passed.
- **Strategy switching replays the keys.** Changing the collision strategy rebuilds the
  same keys into a fresh table instead of starting over, so the three strategies can be
  compared on identical input.
- **Recursion structure for the divide-and-conquer sorts.** Merge and quick sort frames now
  carry `range` (the inclusive subrange the current call owns), `depth`, and the call tree
  itself. Bars outside the active partition fade back — by opacity, not colour, so a sorted
  or pivot bar keeps its meaning — and a new `RecursionPanel` draws the tree under the bars:
  one row per depth, each call a segment covering exactly the columns it owns, on the same
  horizontal scale as the bars. The live call is highlighted and its ancestors outlined. The
  tree fills in as the run proceeds; quick sort on sorted input draws its O(n²) staircase.
- **Shareable links.** The address bar tracks the topic, algorithm and data on screen,
  and a **SHARE** button copies the link; opening one goes straight to the visualizer with
  that data loaded. Custom arrays, lists, stacks, queues, trees, 2-3 trees, hash tables,
  graphs and polynomials all round-trip exactly, tree shape included — trees are written in
  the order that rebuilds them, a graph carries its vertices and edges separately so both
  keep their order, and a hash table carries its keys in insertion order plus its capacity,
  which depends on how big the table ever got rather than on how many keys it holds now. New `src/utils/urlState.js`; each view hook now takes an optional `init`.
  Written with `replaceState`, so it doesn't fill browser history, and read once on load.
  Anything unrecognised in a link falls back to the default, so a hand-edited link can only
  produce a setup the app could have built itself.
- **Live pseudocode.** Every sorting/searching frame now carries a `line` index into its
  algorithm's `pseudocode`, and `InfoPanel` highlights that line as the run plays, steps or
  scrubs. A finished run reports `null` and highlights nothing. Each algorithm declares its
  indices once as a `LINE` constant beside `run`.
- **Pseudocode expanded where it was too coarse to follow** — shell sort's inner pass,
  quick sort's partition, merge sort's `merge`, heap sort's `heapify` and exponential
  search's binary phase were each a single line that every frame would have mapped to.
  Binary and interpolation search gained the `return not found` line their miss frames land
  on.
- **Phone layout.** Below 760px the two-column workspace rearranges instead of shrinking:
  the visualization takes the screen, the sidebar becomes a **bottom sheet** (capped so the
  canvas stays visible behind it, and self-closing when you run/apply/shuffle), and a fixed
  **action bar** carries play/pause, the sheet toggle and shuffle within thumb reach.
  Top-bar dropdowns collapse into one **menu sheet** behind a ☰ button. New
  `Workspace` component and `useMediaQuery` hook; `MOBILE_QUERY` is the single breakpoint.
- **Tap-to-connect graph vertices on touch** — tap one vertex, then another. Drag-to-connect
  stays on the cursor; a finger drag off an SVG shape gets claimed as a page scroll, so the
  pointer was cancelled mid-gesture.
- **Portrait graph layout and readable trees on small screens** — the vertex ring becomes an
  ellipse that fills a tall canvas, and trees keep a fixed slot per node, scrolling sideways
  inside the panel rather than shrinking to fit.
- **Touch-sized controls** — buttons, rows, sliders and slider thumbs grow under any coarse
  pointer, and text inputs move to 16px so iOS Safari stops zooming in on focus.
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

- **Kruskal's MST now uses the shared union-find** instead of its own copy buried in
  `kruskalMST.js`. The shared version adds union by size and full path compression (the
  old local one had neither), so it is strictly faster; the MST it produces is unchanged,
  since the edge choices depend only on connectivity and not on which root wins a merge.
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
- **Stacked layout shrank to its content width** below 900px — `align-items: flex-start` on
  the row layout also applied once it became a column. The visualization now also comes
  first in that stacked order, instead of sitting below a full-width sidebar.

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
