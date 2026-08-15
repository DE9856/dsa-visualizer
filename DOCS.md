# DSA Visualizer — Documentation

Everything you need to run, use, and extend the visualizer.

- [Running it locally](#running-it-locally)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Using the app](#using-the-app)
- [What's included](#whats-included)
- [Input formats](#input-formats)
- [Architecture](#architecture)
- [Extending it](#extending-it)
- [Troubleshooting](#troubleshooting)

---

## Running it locally

### Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | 18.x or 20+ | Required by Vite 5. Check with `node -v`. |
| npm | 9+ | Ships with Node. |

No database, no API keys, no backend — it's a static single-page app.

### First run

```bash
git clone <repository-url>
cd dsa-visualizer
npm install
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it in the browser.
The dev server hot-reloads on save.

If port 5173 is taken, pick another:

```bash
npm run dev -- --port 5177
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload. |
| `npm run build` | Type-free production build into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally to sanity-check a build. |

### Deploying

`npm run build` produces a fully static `dist/` folder. Drop it on any static host
(GitHub Pages, Netlify, Vercel, S3, nginx). There is nothing to configure server-side.

If you deploy under a sub-path (e.g. `user.github.io/dsa-visualizer/`), set the base
in `vite.config.js`:

```js
export default defineConfig({ base: "/dsa-visualizer/", plugins: [react()] })
```

---

## Keyboard shortcuts

Available on any visualizer screen. Press <kbd>?</kbd> in the app to see the same list
inline, or click the keyboard icon at the right end of the transport bar.

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Play / pause. At the end of a run it replays from step 1. |
| <kbd>←</kbd> | Step back one step (pauses playback). |
| <kbd>→</kbd> | Step forward one step (pauses playback). |
| <kbd>Home</kbd> | Jump to the first step. |
| <kbd>End</kbd> | Jump to the last step. |
| <kbd>R</kbd> | Reset to the first step. |
| <kbd>S</kbd> | Shuffle — new random array / list / stack / queue / tree / graph. |
| <kbd>?</kbd> | Toggle the shortcut help panel. |

Also useful:

| Key | Where | Action |
| --- | --- | --- |
| <kbd>Enter</kbd> | Any operation input in the sidebar | Runs the selected operation. |
| <kbd>Esc</kbd> | Anywhere | Closes an open top-bar dropdown. |
| <kbd>Tab</kbd> | Anywhere | Moves focus. Every control is keyboard-reachable and shows a focus ring. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Boot screen | Skips the boot animation. |

Shortcuts are deliberately ignored while you're typing in a text field, a textarea, or a
select, so <kbd>S</kbd> and <kbd>R</kbd> never eat your input. Arrow keys on a focused
slider adjust that slider rather than stepping the animation.

---

## Using the app

### Flow

1. **Boot screen** — a short loading animation. Click or press <kbd>Enter</kbd> to skip.
2. **Category picker** — five families (Arrays, Linked Lists, Stacks & Queues, Trees,
   Graphs). Pick a topic to enter.
3. **Visualizer** — sidebar on the left, canvas + transport + explanation on the right.
   The top bar switches topics at any time; clicking the `DSA://VISUALIZER` title
   returns to the category picker.

### The transport bar

Every view shares the same transport bar:

```
[↺] [⏮] [▶] [⏭]   SPEED ▬▬▬▬●▬▬  3.3/s   STEP 24/242   CMP 13  SWP 11   [⌨]
────────────────────────●──────────────────────────────────────────────────
                    (draggable timeline)
```

| Control | Behaviour |
| --- | --- |
| ↺ Reset | Back to step 1. Disabled when already there. |
| ⏮ / ⏭ | One step at a time. Pauses playback. Disabled at the ends. |
| ▶ / ⏸ | Play or pause. Turns into a replay icon once the run finishes. |
| SPEED | 1–100. The number beside it is the real rate in steps per second (~1.4/s at the slowest, 25/s at the fastest). |
| STEP | Current step and total step count for the run. |
| CMP / SWP | Sorting and searching only: cumulative comparisons and swaps (writes, for searching). |
| Timeline | Drag or click to jump anywhere in the run. Arrow keys work when it's focused. |
| ⌨ | Toggles the shortcut cheat sheet. |

Animation duration follows the speed setting, so fast runs snap crisply instead of
smearing steps into one another.

### The sidebar

Contents differ per topic, but the shape is consistent:

- **Algorithm / operation list** — grouped and collapsible on the data-structure views.
- **Operation inputs** — value, position, second list, weights, and so on. <kbd>Enter</kbd> runs the operation.
- **New / custom data** — a shuffle button plus a text field to load your own data.

### On a phone

Below 760px wide the app rearranges itself rather than shrinking:

- The **visualization takes the screen**, with the transport bar and the write-ups
  below it.
- The sidebar becomes a **bottom sheet**, opened from the button in the middle of the
  fixed action bar. It stops short of the top of the screen so you can watch the
  canvas react while you change things, and closes itself when you run an operation,
  apply custom data or shuffle.
- The **action bar** also carries play/pause and shuffle, so the two most-used
  controls are always within thumb reach.
- Topics move from the row of top-bar dropdowns into a **single menu sheet** behind
  the ☰ button.
- **Graphs** lay their vertices out in a portrait ring, and you connect two of them by
  **tapping one and then the other** (drag-to-connect is a cursor gesture; browsers
  claim a finger drag off an SVG shape as a page scroll).
- **Trees** keep their nodes at a readable size and scroll sideways inside the canvas
  instead of shrinking to fit.

The breakpoint lives in one place, `MOBILE_QUERY` in `src/hooks/useMediaQuery.js`, and
is mirrored by the `@media (max-width: 760px)` block at the end of `src/index.css`.

### Reduced motion

If your OS has "reduce motion" enabled, decorative animation and transitions are turned
off automatically. Step-by-step playback still works normally.

---

## What's included

### Sorting (9)

| Algorithm | Best | Average | Worst | Space |
| --- | --- | --- | --- | --- |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) |
| Shell Sort | O(n log n) | O(n^1.3) | O(n²) | O(1) |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) |
| Counting Sort (Comparison) | O(n²) | O(n²) | O(n²) | O(n) |
| Radix Sort | O(nk) | O(nk) | O(nk) | O(n + k) |

### Searching (5)

| Algorithm | Best | Average | Worst | Space |
| --- | --- | --- | --- | --- |
| Linear Search | O(1) | O(n) | O(n) | O(1) |
| Binary Search | O(1) | O(log n) | O(log n) | O(1) |
| Jump Search | O(1) | O(√n) | O(√n) | O(1) |
| Interpolation Search | O(1) | O(log log n) | O(n) | O(1) |
| Exponential Search | O(1) | O(log n) | O(log n) | O(1) |

Binary, jump, interpolation and exponential search sort the array first — the canvas
says so — and draw `lo` / `mid` / `hi` pointers under the bars.

### Data structures

| Structure | Variants | Operations |
| --- | --- | --- |
| **Linked List** | singly, doubly, circular | insert at head/tail/position, delete by value/position, search & traverse, update node, reverse, sort, count length, concatenate, merge sorted, clear |
| **Polynomial** | linked-list backed | add, multiply, evaluate P(x) |
| **Stack** | fixed capacity 8 | push, pop, peek/top, search, size, isEmpty, isFull, clear |
| **Queue** | fixed capacity 8 | enqueue, dequeue, peek/front, search, size, isEmpty, isFull, clear |
| **Tree** | Binary Tree, BST, AVL | insert, delete, search, inorder, preorder, postorder, DFS, BFS (level order), height, size, clear |
| **2-3 Tree** | balanced multi-way | insert (with splits), delete, search, inorder, height, size, clear |
| **Graph** | directed/undirected, weighted/unweighted | add & remove vertex/edge, neighbours, degree, is-adjacent, BFS, DFS, topological sort, Dijkstra, Floyd–Warshall, Prim's MST, Kruskal's MST |

On the graph canvas you can **drag from one vertex to another** to create an edge, and
switch the panel below between adjacency-list and adjacency-matrix representations.

---

## Input formats

### Custom array (sorting / searching)

Comma-separated integers. Needs at least 2 values; the first 40 are used.

```
5, 12, 3, 8, 21, 4
```

Array size can also be set with the slider (6–40); random values fall in 10–99.

### Custom list / stack / queue / tree

Comma-separated integers.

```
8, 3, 10, 1, 6, 14, 4
```

For trees the values are inserted in the order given, following the rules of the selected
tree type.

### Polynomial

Standard algebraic notation. `^` marks the exponent; a bare `x` is `x^1`.

```
4x^3 + 3x^2 - 5x + 7
```

### Graph

Three build modes; pick one with the EDGES / LIST / MATRIX toggle.

**Edge list**

```
A-B, B-C, A-C
```

Weighted — append `@weight`:

```
A-B@5, B-C@2
```

**Adjacency list** — one vertex per line:

```
A: B, C
B: C
C:
```

Weighted — put the weight in parentheses:

```
A: B(5), C(2)
```

**Adjacency matrix** — whitespace-separated numbers, one row per line, square:

```
0 1 0
1 0 1
0 1 0
```

---

## Architecture

### Layout

```
src/
├── algorithms/
│   ├── sorting/            one file per sorting algorithm
│   ├── searching/          one file per searching algorithm
│   ├── stepUtils.js        annotates steps with cumulative CMP/SWP counts
│   └── index.js            registry: ALGORITHMS, ALGO_MAP, getSteps()
│
├── dataStructures/
│   ├── graph/  linkedList/  polynomial/  queue/  stack/  tree/  twoThreeTree/
│   │           each folder = one file per operation + helpers.js + index.js registry
│
├── components/             canvases, sidebars, panels, the shared transport bar
│
├── hooks/
│   ├── useStepPlayer.js         shared playback engine (see below)
│   ├── useKeyboardShortcuts.js  global transport shortcuts
│   └── useVisualizer.js, useLinkedList.js, usePolynomial.js,
│       useStack.js, useQueue.js, useGraph.js, useTree.js, useTwoThreeTree.js
│
├── data/                   category metadata and long-form topic write-ups
├── utils/
├── App.jsx                 stage + view routing, wires the active player
├── main.jsx
└── index.css               the whole stylesheet
```

### The step model

Every algorithm and every data-structure operation is a **pure function that returns an
array of frames**. Nothing animates itself; the UI just renders frame `stepIdx`.

A sorting/searching step looks roughly like:

```js
{
  array: [5, 3, 8],     // array state at this point
  compare: [0, 1],      // indices being compared
  swap: [0, 1],         // indices being swapped
  sorted: [2],          // indices locked in
  pivot: 1, mid: 1, lo: 0, hi: 2, found: -1,
  cCount: 4, sCount: 2  // added by annotateSteps()
}
```

A data-structure step carries the structure plus a human-readable line:

```js
{ nodes: [...], message: "Node linked in as the new head" }
```

Because steps are precomputed and immutable, stepping backwards, scrubbing and replaying
are all free — there's no state to unwind.

### `useStepPlayer`

One hook owns playback for all eight views: `stepIdx`, `playing`, `speed`, and the
`togglePlay` / `stepForward` / `stepBack` / `reset` / `seek` / `pause` actions.

It runs on `requestAnimationFrame` and reads the current speed through a ref, so changing
speed mid-run retimes the next step instead of tearing down and restarting a timer. A
backgrounded tab is clamped so the run doesn't fast-forward when you come back.

```js
const player = useStepPlayer(steps.length);   // inside a view hook
return { ...player, /* view-specific state */ };
```

`delayForSpeed(speed)` is exported from the same file and maps 1–100 onto 700ms–40ms per
step. `App.jsx` uses it to set the `--step-anim` CSS variable, which is what keeps the bar
and node transitions in sync with playback.

### How a view is wired

```
useXxx() hook                 App.jsx                     components
─────────────                 ───────                     ──────────
steps  (precomputed frames) → active.steps        →  <Controls {...transport} />
step   (frames[stepIdx])    → step                →  <XxxCanvas step={step} />
player (from useStepPlayer) → transport props     →  transport bar + timeline
                              keyboard shortcuts
```

`App.jsx` picks the hook matching the current view and feeds that one player to the
transport bar and the keyboard shortcuts, so both always drive whatever is on screen.

---

## Extending it

### Add a sorting or searching algorithm

1. Create `src/algorithms/sorting/mySort.js` (or `searching/mySearch.js`) and export an
   object shaped like the existing ones:

   ```js
   export const mySort = {
     key: "mySort",
     label: "My Sort",
     category: "sorting",
     desc: "One-paragraph explanation shown in the info panel.",
     time: { best: "O(n)", avg: "O(n log n)", worst: "O(n²)" },
     space: "O(1)",
     code: ["for i in 0..n:", "  ..."],   // pseudocode lines
     run(array) {
       const steps = [];
       // push a frame whenever something visible changes
       steps.push({ array: [...array], compare: [i, j] });
       return steps;
     },
   };
   ```

   Searching algorithms take `run(array, target)` instead.

2. Register it in `src/algorithms/sorting/index.js` (or `searching/index.js`).

That's all — comparison/swap counters, the sidebar entry, the info panel and the
pseudocode display are wired automatically from the registry.

### Add a data-structure operation

1. Add `src/dataStructures/<structure>/myOp.js` exporting an operation object with
   `key`, `label`, `group`, `fields`, `desc`, and a `run(current, params)` that returns
   `{ steps, finalList | finalTree | finalGraph }`.
2. Register it in that folder's `index.js` operation map.

The sidebar renders the inputs listed in `fields`, and the transport bar picks up the new
steps with no extra work.

### Add a whole new structure

Create `src/dataStructures/<name>/`, a `use<Name>()` hook that calls `useStepPlayer`, a
canvas component, a sidebar component, then add a branch in `App.jsx` and an entry in
`src/data/categories.js`.

---

## Troubleshooting

**`npm run dev` fails with an engine/version error**
Vite 5 needs Node 18+. Check `node -v` and upgrade if needed.

**Port already in use**
`npm run dev -- --port 5177`, or stop whatever is on 5173.

**Blank page after `npm run build` + deploy**
Almost always a sub-path deploy. Set `base` in `vite.config.js` (see [Deploying](#deploying)).

**Shortcuts don't respond**
Click once on the page background first — the window needs focus. They're also
intentionally inert while a text field, textarea or select has focus.

**Playback looks choppy**
Drop the SPEED slider. Above roughly 15 steps/s, individual steps are shorter than a
display frame and the browser can't show every one distinctly.

**Stale build output**
`dist/` is git-ignored. Delete it and rebuild if you suspect a stale artefact.
