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
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> | [Undo](#undo-and-redo) the last edit on the current structure. |
| <kbd>Ctrl</kbd>+<kbd>Y</kbd> | Redo it. <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> does the same. |
| <kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>Ctrl</kbd>+<kbd>V</kbd> | [Copy / paste](#copy-and-paste), on the graph view. |
| <kbd>?</kbd> | Toggle the shortcut help panel. |

On a Mac, <kbd>Cmd</kbd> works wherever <kbd>Ctrl</kbd> is listed.

Also useful:

| Key | Where | Action |
| --- | --- | --- |
| <kbd>Enter</kbd> | Any operation input in the sidebar | Runs the selected operation. |
| <kbd>Esc</kbd> | Anywhere | Closes an open top-bar dropdown. |
| <kbd>Tab</kbd> | Anywhere | Moves focus. Every control is keyboard-reachable and shows a focus ring. |

Shortcuts are deliberately ignored while you're typing in a text field, a textarea, or a
select, so <kbd>S</kbd> and <kbd>R</kbd> never eat your input. Arrow keys on a focused
slider adjust that slider rather than stepping the animation. That applies to the
<kbd>Ctrl</kbd> pairs too: inside a field they are the field's own undo and clipboard.

### Undo and redo

Every structure view keeps its own history — the graph's undo doesn't reach back into
what you did to the heap, and switching views leaves each stack where it was. Up to 50
edits are remembered per view.

What counts as an edit is *anything that changed the structure*: an operation run from
the sidebar, a vertex dragged or added on the canvas, a shuffle, custom
data applied, and the type switches that rebuild as they go — list type, tree type, heap
max/min, hash-table collision strategy. On the sorting and searching views it covers the
algorithm, the array, its size, and the search target.

What isn't an edit: playback. Undo takes back a change to the structure, not your
position in a run, so where the timeline had got to, which operation is selected and
half-typed text in the sidebar all stay as they are. Traversals that only read — BFS,
Dijkstra, a search that finds nothing — leave the structure alone, so undoing one lands
you on the same structure it started from.

Redo is dropped as soon as you make a new edit, in the usual way: the branch you undid
away from is no longer reachable.

### Copy and paste

On the graph view, what <kbd>Ctrl</kbd>+<kbd>C</kbd> copies depends on where the cursor
is:

| Cursor | Copies | Pasting it back |
| --- | --- | --- |
| Over a vertex | that vertex and its neighbours, as `B: A, C` | duplicates the vertex, wired to the same neighbours |
| Over empty canvas | the whole graph, as adjacency-list text | rebuilds that graph |

Both go to the real system clipboard as text the sidebar's LIST box would accept, so a
copied graph can be pasted into notes, a message, or another tab. Isolated vertices
survive, which is why the text is the adjacency form (`C:` with nothing after it) rather
than the terser edge list.

<kbd>Ctrl</kbd>+<kbd>V</kbd> accepts either format the sidebar does — `A-B, B-C@5` as
well as the adjacency form — so you can paste a graph you wrote by hand. A pasted graph
replaces the one on screen, and like everything else that is one <kbd>Ctrl</kbd>+<kbd>Z</kbd>
away.

The duplicate-a-vertex path only triggers when the text on the clipboard is still exactly
what the app put there. Copy something else in another app in between and
<kbd>Ctrl</kbd>+<kbd>V</kbd> treats it as graph text, which is what you meant.

Copy and paste ride the browser's own clipboard events rather than intercepting the
keystrokes, so they need no clipboard permission — and a copy made with text selected on
the page, or with the cursor in a sidebar field, is left alone as an ordinary text copy.

---

## Using the app

### Flow

1. **Category picker** — six families (Arrays, Linked Lists, Stacks & Queues, Trees,
   Hashing, Graphs). Pick a topic to enter.
2. **Visualizer** — sidebar on the left, canvas + transport + explanation on the right.
   The top bar switches topics at any time; clicking the `DSA://VISUALIZER` title
   returns to the category picker.

### The transport bar

Every view shares the same transport bar:

```
[↺] [⏮] [▶] [⏭]   SPEED ▬▬▬▬●▬▬  3.3/s   STEP 24/242   CMP 13 RD 26 WR 11   [⌨]
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
| CMP / RD / WR / AUX / DEP | Sorting only: cumulative key comparisons, array reads, array writes, auxiliary-memory high-water mark (elements) and deepest recursion, counted by the algorithm itself. AUX and DEP are omitted for an algorithm they are structurally zero for. Searching shows CMP / WRT, still derived from the frames. |
| Timeline | Drag or click to jump anywhere in the run. Arrow keys work when it's focused. |
| ⌨ | Toggles the shortcut cheat sheet. |

Animation duration follows the speed setting, so fast runs snap crisply instead of
smearing steps into one another.

### The recursion tree

Merge sort and quick sort show an extra panel under the bars. Each recursive call is a
segment covering exactly the columns it owns, one row per depth, on the same horizontal
scale as the bars — so containment is something you see rather than infer. The live call
is highlighted, its ancestors (the rest of the call stack) are outlined, and bars outside
the active subrange fade back without changing colour, so a sorted or pivot bar keeps
saying so.

The tree fills in as the run proceeds. For merge sort the shape is fixed by the array's
length, so it appears almost at once; quick sort discovers its subranges as pivots land,
and the tree grows with them. Feed quick sort an already-sorted array and the staircase
of `0–22`, `0–21`, `0–20`… is the O(n²) worst case, drawn.

### The race view

**ARRAYS / Race & Compare** puts two to four sorting algorithms side by side on one shared
input, under one transport.

**One input, built from a shape and a seed.** The sidebar picks from eight shapes —
random, nearly sorted, already sorted, reversed, few unique, all equal, sawtooth, organ
pipe — and the array is built once and handed unchanged to every lane, so any difference
you see is the algorithm rather than the data. The builders are pure functions of
`(n, seed)`, which is why a race link rebuilds the same race in someone else's browser and
why NEW DATA only has to change the seed.

The shapes are where the interesting comparisons live. On nearly-sorted input at n = 24,
insertion sort finishes in 25 operations, merge sort in 165 and quick sort in 872 — the
opposite of the ordering their average-case complexities imply.

**Two ways to sync the lanes.**

| Mode | A tick means |
| --- | --- |
| BY FRAME | Every lane advances one frame. Simple, but it compares frames rather than work: a bubble sort frame is one comparison, a merge sort frame can be a whole write. |
| BY WORK | Every lane spends the same number of operations (comparisons + writes). The lane that costs less genuinely finishes earlier on screen. |

BY WORK is the default and the fair one. A lane that reaches its end freezes on its last
frame rather than blanking or looping — the finished array sitting beside one still being
churned is the comparison.

**The scoreboard** under the track shows all five counters live, each cell filling against
the largest final value in its column, so you can watch one lane overtake another. The
lane that finishes in the fewest operations is marked FEWEST OPS; an exact tie leaves no
winner rather than picking one arbitrarily.

**Colour by origin** tints every bar by the index it started at. Pair it with FEW UNIQUE
or ALL EQUAL: the values are then identical, so the colours are the only way to see
whether tied elements came out in their original order. Displaced elements get a dashed
red outline once the run finishes, and the scoreboard says how many of the tied elements
moved. Stability is checked run by run — within a stretch of equal values a stable sort
must leave the tags ascending — so it is a measurement of *this* run, not a repeat of the
algorithm's metadata. An input with no ties says so instead of claiming a pass it never
earned.

### Empirical complexity

The panel below the scoreboard measures growth rather than asserting it.

Press RUN SWEEP and each selected algorithm is run at 10, 20, 40, 80, 160, 320, 640, 1280,
2560 and 5000 elements (capped by the MAX n setting) with frame recording switched off,
counting operations without drawing anything. The results are plotted as measured
operations against n, with n, n log n and n² fitted over the top by least squares on their
constant factor alone — the shape is fixed by the model, so a model that fits lands on the
data at every n and one that doesn't can't be rescued by scaling. Click a legend row to
anchor those reference curves to a different algorithm.

Log-log is the default because it is the only view in which the claim is checkable by eye:
a power law becomes a straight line whose slope is the exponent. That slope is reported
per algorithm as **measured slope**, next to what the algorithm's metadata **claims**.

Some things it shows that a complexity table cannot:

| Setup | Measured slope |
| --- | --- |
| Bubble / insertion / selection / counting sort, random input | 1.97 – 2.00 |
| Merge / quick / heap sort, random input | 1.24 – 1.28 |
| Radix sort, random input | 1.15 |
| Insertion sort, nearly-sorted input | 1.08 |
| Quick sort, nearly-sorted input | 1.97 |
| Quick sort, sorted input, last-element pivot | 2.00 |
| Quick sort, sorted input, median-of-three pivot | 1.21 |

The sweep runs on the main thread in chunks, yielding between points so the progress bar
keeps painting, and it can be stopped. It is deliberately not automatic: at n = 5000 with
a quadratic sort selected it is tens of seconds of real work.

Operation counts are not wall-clock time. Cache behaviour, branch prediction and constant
factors are invisible here, which is exactly why heap sort loses to quick sort in practice
despite winning on paper.

### The Balance & Height view

**TREES / Balance & Height** builds a binary search tree, an AVL tree and a 2-3 tree from
the same keys in the same order, one insert per transport tick.

**The insertion order is the variable, because it is the whole story.** A BST has no shape
of its own — its shape is decided entirely by the order its keys arrive in, and the worst
order is the most natural one. Six orders are available:

| Order | What it does to a plain BST |
| --- | --- |
| Sorted (1…n) | A right spine. Height n−1: a linked list with extra pointers. |
| Reversed (n…1) | The mirror image — a left spine, equally bad. |
| Random | Expected height about 4.3 log₂ n. Much better than the worst case, still visibly worse than either balanced structure. |
| Alternating ends | 1, n, 2, n−1, … Looks scrambled, degenerates anyway — "not sorted" is not the same as "random". |
| Median-first | The recursive midpoint of each range. Builds a *perfectly* balanced BST with no rebalancing at all. |
| Sawtooth | Short ascending runs, each adding another right spine to whichever subtree it lands in. |

The sequence is drawn above the canvases with a cursor on the next key, so what is about
to happen is never a mystery.

**Height is the headline; comparisons are the honest cost.** The board under the lanes
shows both, plus the rotations (AVL) or node splits (2-3) each structure performed. They
are not the same measure — a 2-3 node holding two keys costs two comparisons to pass
through, so it buys its shorter height with wider nodes. On 15 sorted keys the BST reaches
height 14 for 105 comparisons; the AVL tree and the 2-3 tree both reach height 3, for 45
and 51 comparisons respectively.

The **GUARANTEE** column is the bound each structure promises at the current key count —
1.44 log₂(n+2) − 0.33 for AVL, log₂(n+1) for a 2-3 tree — and `none` for the BST, which
promises nothing. That column being satisfied is a check on the implementation, not
decoration.

Lanes wrap the real tree canvases rather than redrawing the trees, so a lane is exactly
the picture the ordinary tree view would give you.

### Height against n

The canvases cap at 24 keys, which is enough to watch a sorted BST turn into a chain but
nowhere near enough to see the *shape* of how the three diverge. The sweep below them runs
the same insert code without keeping the intermediate trees, so n can reach 1600.

It plots height (or total comparisons) against n on a log x-axis, with log₂ n, log₃ n and
n dashed over the top, each anchored to the structure it describes. The y-axis defaults to
logarithmic: on a linear one, a degenerate BST's height of 399 flattens both balanced
curves onto the baseline and hides the comparison the panel exists for.

On sorted input at n = 400 the BST measures height 399 — it tracks n exactly, a straight
line of slope 1 on log-log — while the AVL tree sits at 8 and the 2-3 tree at 7, against
log₂ 400 = 8.6. That is the whole argument for self-balancing trees, measured rather than
asserted.

One implementation note: `treeHeight` in `tree/helpers.js` is memoized against the node
object. Every AVL balance factor asks for two heights and `avlFixupTree` asks for a
balance factor at every node, so an unmemoized O(n) height made a single insert O(n²) and
building a tree O(n³) — fine for the thirty-node trees the canvas draws, hopeless for this
sweep. Caching is sound because nodes in this codebase are immutable: every operation
builds new nodes rather than mutating the ones it was given, so a node's height can never
change after it exists.

### Sharing a setup

The address bar always holds a link to whatever is on screen — the topic, the
algorithm, and the data itself. **SHARE** in the top bar (or at the top of the ☰ menu
on a phone) copies it. Opening that link goes straight to the visualizer with the data
loaded, skipping the category screen.

| Topic | Link |
| --- | --- |
| Sorting | `#v=sorting&algo=quick&a=9,4,7,1,3,8` |
| Sorting, shaped input | `#v=sorting&algo=quick&sh=sorted&sd=7&q=quick.pivot:median3` |
| Race | `#v=race&algos=insertion,merge,quick&sh=nearly&n=24&sd=7&sy=op&st=1` |
| Balance & Height | `#v=treecompare&ord=sorted&n=15&sd=7` |
| Searching | `#v=searching&algo=binary&a=10,20,30,40,50&t=40` |
| Linked list | `#v=linkedlist&type=doubly&a=5,12,3,44` |
| Stack / queue | `#v=stack&a=7,8,9` |
| Tree | `#v=tree&type=avl&a=30,20,10,25,40,50` |
| Threaded tree | `#v=tree&type=threaded&tm=single&a=30,20,10,25,40,50` |
| 2-3 tree | `#v=twothree&a=12,5,30,3,8,21,44` |
| Heap | `#v=heap&type=min&a=4,10,3,5,1,8` |
| Hash table | `#v=hashtable&type=linear&a=42,13,7,20&m=17` |
| Hash table, cuckoo | `#v=hashtable&type=cuckoo&hf=midsquare&a=42,13,7,20` |
| Dynamic hashing | `#v=dynamichash&type=extendible&a=12,5,30,3,8,21` |
| Trie | `#v=trie&a=car,card,care,cat,dog` |
| Union-Find | `#v=unionfind&p=0,0,2,0,4,4` |
| Graph | `#v=graph&w=1&g=A,B,C,D&e=A-B(5),B-C(2),C-D(7),A-D` |
| Graph, rearranged | `#v=graph&g=A,B,C&e=A-B,B-C&xy=A:0.2:0.15,C:0.75:0.8` |
| Polynomial | `#v=polynomial&p=6x^4 - 2x^2 + 9` |

The values are the same text the sidebar's custom-data boxes take, so links stay
readable and can be written by hand. Trees are listed in the order that rebuilds them
(preorder for a BST, AVL or threaded tree, level order for a plain binary tree — a
threaded tree adds `tm`, which of its null pointers are threaded), and a graph carries its
vertices and edges separately so both keep their order. A hash table is listed in
insertion order — with probing, the order keys arrive in decides where the collisions
land — plus `m`, its capacity, which depends on how big the table ever got rather than
on how many keys are in it now, and `hf` when the hash function isn't the default
division. A dynamically hashed table carries its arrival order alone: both schemes grow
one split at a time, so replaying the keys reproduces every depth and pointer with them. A heap is written in array order, which *is* the heap. A
union-find carries its raw parent array, since path compression is part of the state
worth sharing. Everything round-trips exactly, including tree shape.

The sorting and searching links carry two extra optional fields: `sh`, the input shape,
and `sd`, the seed it was built from. The array itself still travels in `a` — that is the
exact data someone meant to share — but the shape and seed ride along so the sidebar comes
back saying what the array *is*, and so NEW ARRAY re-rolls the same shape. `q` carries
variant choices, qualified by algorithm (`quick.pivot:median3`), and `st=1` turns on
colour-by-origin.

A race carries no array at all: `algos` names the lanes, and `sh` + `n` + `sd` rebuild the
input exactly, which is shorter and says more than forty numbers would. `sy` is the sync
mode (`frame` or `op`). The tree comparison is the same idea: `ord` is the insertion order
and `n` the key count, which between them are the whole setup — the keys are always a
permutation of 1…n, and only the random order looks at `sd`.

A graph you have [rearranged](#building-and-arranging-the-graph) also carries an `xy` field —
`label:x:y` per vertex, each coordinate a fraction of the canvas rather than a pixel, so
the arrangement survives being opened on a phone. Only the vertices actually dragged off
the ring are listed, so an untouched graph's link is exactly what it was before.

Some details are deliberately not in the link: playback position, speed, which
operation is selected, and half-typed text in the sidebar. The link is the *data*, not
the session.

The hash is written with `replaceState`, so it keeps up with your edits without filling
browser history — but it's read only once, on load. Editing it by hand needs a reload,
and the back button leaves the app rather than stepping through past states.

Anything unrecognised in a link is ignored and falls back to the default: an unknown
algorithm, a bad tree type, non-numeric values, or an edge naming a vertex that doesn't
exist. A link can only ever produce a setup the app could have built itself.

### Live pseudocode

On the sorting and searching views the pseudocode panel highlights the line the current
step is executing, and follows along as you play, step or scrub. When a run finishes,
nothing is highlighted — the algorithm has returned. Lines that never produce a frame of
their own (loop headers, recursive calls) stay dim throughout.

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
- **Graphs** lay their vertices out in a portrait ring. Tapping, holding a vertex to
  move it and holding empty canvas to add one all work exactly as they do with a
  cursor — see [building and arranging](#building-and-arranging-the-graph). The one
  difference is that a move has to begin with a hold, because a finger that simply
  drags is scrolling the page; once a vertex is loose the drag refuses that scroll
  outright, for as long as it lasts.
- **Trees** keep their nodes at a readable size and scroll sideways inside the canvas
  instead of shrinking to fit.

The breakpoint lives in one place, `MOBILE_QUERY` in `src/hooks/useMediaQuery.js`, and
is mirrored by the `@media (max-width: 760px)` block at the end of `src/index.css`.

### Reduced motion

If your OS has "reduce motion" enabled, decorative animation and transitions are turned
off automatically. Step-by-step playback still works normally.

---

## What's included

The Arrays family holds three views: **Sorting**, **Searching**, and **Race & Compare** —
[two to four sorts side by side](#the-race-view) on one input, with a live scoreboard and
an [empirical complexity](#empirical-complexity) sweep. The Trees family adds
**[Balance & Height](#the-balance--height-view)**, which builds a BST, an AVL tree and a
2-3 tree from the same keys in the same order.

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

Two of them are configurable, and the setting travels in the share link:

| Algorithm | Setting | Options |
| --- | --- | --- |
| Quick Sort | `pivot` | `last` (Lomuto's textbook pivot), `first`, `median3`, `random` |
| Shell Sort | `gaps` | `shell` (n/2), `knuth` (3h+1), `sedgewick` (1, 5, 19, 41, …) |

These are not cosmetic. Quick sort with a last-element pivot on already-sorted input
measures a growth exponent of 2.00; switching the same run to median-of-three drops it to
1.21. Shell sort's three sequences differ by a factor of nearly two in operations at
n = 1280.

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
| **Tree** | Binary Tree, BST, AVL, Threaded (single/double) | insert, delete, search, inorder, preorder, postorder, DFS, BFS (level order), height, size, clear — plus threaded inorder, reverse inorder and inorder successor on a threaded tree |
| **2-3 Tree** | balanced multi-way | insert (with splits), delete, search, inorder, height, size, clear |
| **Heap** | max-heap, min-heap | insert (sift up), extract root (sift down), peek, build heap, search, height, size, clear |
| **Hash Table** | separate chaining, linear probing, quadratic probing, double hashing, Robin Hood, cuckoo — each over division, multiplication, mid-square or digit-folding hashing | insert, search, delete, load factor, list keys, resize, clear |
| **Dynamic Hashing** | extendible (directory), linear (directoryless) | insert (with bucket splits, directory doubling and overflow blocks), search, delete, depths & pointers, list keys, clear |
| **Trie** | prefix tree over a–z | insert, delete (with pruning), search, autocomplete, list words, size, clear |
| **Union-Find** | union by size + path compression | union, find, connected?, components, add element, reset |
| **Graph** | directed/undirected, weighted/unweighted | add & remove vertex/edge, neighbours, degree, is-adjacent, BFS, DFS, topological sort, Dijkstra, Floyd–Warshall, Prim's MST, Kruskal's MST |

The graph canvas is editable directly: **click two vertices** to connect them, **drag**
one to move it and **double-click empty space** to add one — see [building and
arranging](#building-and-arranging-the-graph). The panel below switches between
adjacency-list and adjacency-matrix representations, and the
[matrix is editable too](#editing-the-adjacency-matrix).

A vertex may be joined to **itself**: an edge with both endpoints on one vertex is a
**self-loop**, drawn as a loop leaving the vertex's rim and coming back to it, pointing
away from the middle of the canvas where there is room for it. See
[self-loops](#self-loops).

### Editing the adjacency matrix

Click any cell off the diagonal and type. The matrix *is* the graph, so a cell can say
all three things a cell can mean, and the graph follows:

| You type | What happens |
| --- | --- |
| a different number on an existing edge | the edge is reweighted |
| a number where the cell was `0` | the edge is created with that weight |
| `0` | the edge is removed |

<kbd>Enter</kbd> or clicking away commits; <kbd>Esc</kbd> cancels and leaves the graph
alone, as does an empty or unparseable cell. The change animates on the canvas like any
other operation and is one <kbd>Ctrl</kbd>+<kbd>Z</kbd> away.

On an **undirected** graph an edge occupies both cells, so editing either one moves both.
On a **directed** graph the cells are independent: setting `[C][A]` gives you C → A and
leaves A → C exactly as it was.

On an **unweighted** graph there is no weight to set, so the matrix reads `1` and `0` —
presence, which is all an unweighted matrix means — and any non-zero you type connects the
pair. The **diagonal** is an ordinary cell like any other: `[A][A]` is A's
[self-loop](#self-loops), and it is one cell rather than a mirrored pair, so an
undirected graph edits it on its own.

### Self-loops

An edge whose two endpoints are the same vertex is a self-loop, and every part of the
view treats it as the one edge it is:

| | |
| --- | --- |
| **On the canvas** | click a vertex to arm it, then click it **again** — naming it as both ends of the edge. A loop is drawn away from the centre of the canvas, turning aside if it would otherwise hang off the edge. On a directed graph it carries an arrowhead like any other edge; a weight sits on its crown. |
| **In the sidebar** | ADD EDGE with FROM and TO set to the same vertex. Both selects stay usable on a one-vertex graph for exactly this reason. |
| **In the matrix** | type into the diagonal cell `[A][A]`; `0` clears it again. |
| **In the text formats** | `A-A` in the EDGES box, `A: A` in the LIST box, a `1` on the diagonal in the MATRIX box — and the same forms in a [shared link](#sharing-a-setup). |

A vertex can hold at most one, the same rule that stops an edge being added twice.

What the operations make of one:

- **Degree** counts a self-loop **twice** on an undirected graph — it leaves the vertex
  and arrives back at it, the convention that keeps the degrees summing to 2*E*. On a
  directed graph it adds one to the in-degree and one to the out-degree.
- **Get neighbours** lists the vertex among its own neighbours, which is what its
  adjacency row says.
- **BFS** and **DFS** walk over it without effect: the vertex it leads to is the one
  already being visited.
- **Dijkstra** never relaxes through it — the vertex is locked in by the time its own
  edges are scanned — so it can't shorten anything, which is exactly right.
- **Kruskal's** reports it as a cycle and skips it; **Prim's** ignores it, since its far
  end is already in the tree.
- **Topological sort** finds the cycle it is: a self-loop gives its vertex an in-degree
  that never reaches 0, so no full order exists.

### Building and arranging the graph

The graph view opens **empty**, with the adjacency **matrix** showing rather than the
list — this is the topic you build yourself, and an empty canvas is a starting point
where a graph already on screen is something to clear first. RANDOM GRAPH in the sidebar
is one click away when you want one to play with, and a [shared
link](#sharing-a-setup) still arrives with the graph it carries.

Everything the canvas does, on both a cursor and a finger:

| | Cursor | Touch |
| --- | --- | --- |
| **Connect two vertices** | click one, then the other | tap one, then the other |
| **Add a self-loop** | click one, then click it again | tap one, then tap it again |
| **Move a vertex** | drag it | press and hold it, then drag |
| **Add a vertex** | double-click empty canvas | press and hold empty canvas |
| **Delete a vertex** | triple-click it | REMOVE VERTEX in the sidebar |
| **Cancel a half-made edge** | click empty canvas | tap empty canvas |
| **Copy** | `Ctrl+C` — see [clipboard](#copy-and-paste) | — |
| **Undo / redo** | `Ctrl+Z` / `Ctrl+Y` | — |

Connecting is a click on each end rather than a drag between them, because a drag is
what moves a vertex. It is also the only gesture touch can offer: the browser claims a
finger drag off an SVG shape as a page scroll, so drag-to-connect never worked there.
Both inputs now behave the same way.

A vertex only comes loose once a cursor has actually moved, so a click that doesn't move
is still a click. A finger has to hold, because the rival reading of a finger on a vertex
is a page scroll; sliding before the hold completes leaves it a scroll. A vertex being
moved wears a dashed ring, and a phone buzzes once when it comes loose, since there is no
cursor there to change shape.

A new vertex lands exactly where you pressed, named with the next free letter — the same
naming ADD VERTEX in the sidebar uses. On a phone it is a hold rather than a double-tap,
which the browser may still read as zoom.

Deleting is a **triple-click**, and takes the vertex's edges with it, exactly as the
sidebar's REMOVE VERTEX does. It counts clicks using the browser's own notion of a burst,
the one behind a double click, rather than inventing a second timing rule — so a plain
double-click still just arms and disarms the vertex, and never deletes.

The same burst is what separates a double-click from the two clicks that make a
[self-loop](#self-loops). Clicking an armed vertex again loops it back to itself only
when that click stands on its own; inside a burst it is the middle of a double- or
triple-click, which mean something else, and it disarms as it always did. Touch has no
rival gesture, so a second tap always makes the loop.

Because each click in the burst is answered as it arrives, triple-clicking a vertex while
*another* one is armed will make the edge on the first click and then delete the vertex
on the third. The edge goes with it, so the graph ends up where you wanted, but it takes
two <kbd>Ctrl</kbd>+<kbd>Z</kbd> to walk back rather than one. Triple-clicking with
nothing armed — the normal case — has no such intermediate step. There is no triple-tap
on touch; use REMOVE VERTEX there.

Edges follow their endpoints live, so you can pull a crossing apart, line a path up left
to right, or drag the vertices of a subgraph together before running BFS over it.

Positions survive everything that keeps the same graph — operations, playback, switching
directed/weighted, resizing between the desktop and phone layouts (they are stored as a
fraction of the canvas, not in pixels). SHUFFLE and loading a custom graph put every
vertex back on the ring, since those replace the graph outright.

A vertex is clamped to the canvas, so it can't be dropped somewhere it would be invisible.

An arrangement travels in the [shared link](#sharing-a-setup) as an `xy` field, so
whoever opens it sees the graph laid out the way you left it.

### The threaded tree

**THREADED** is the fourth tree type. It builds and searches exactly like a BST — the
difference is what happens to the null pointers. A tree of *n* nodes has 2*n* child
pointers of which *n* + 1 are null, and a threaded tree spends them on shortcuts: a null
right pointer becomes a **thread** to the node's inorder successor, and, under double
threading, a null left pointer becomes a thread to its predecessor.

- Threads are drawn as **dashed curves** — purple for a right thread (→ successor),
  yellow for a left one (→ predecessor) — and the thread a step is following lights up
  orange. Real child links stay solid, exactly as the two kinds of pointer differ in a
  real implementation only by a flag on the node.
- **THREADING** switches between **DOUBLE** (both null pointers threaded) and
  **SINGLE (RIGHT)** (only the right ones). It re-threads the tree you already have
  rather than building a new one.
- **Threaded Inorder** walks the tree in order with no stack and no recursion: visit,
  then take the right thread if there is one, otherwise the leftmost node of the right
  subtree. It is the payoff — O(1) space where the ordinary Inorder needs O(h).
- **Reverse Inorder** is the mirror image, and needs the left threads, so it is offered
  only under double threading.
- **Inorder Successor** shows the other payoff: from a node with no right child the
  successor is one hop along the thread, where an unthreaded tree would have to climb
  back up through the parents it doesn't store.
- Insert and delete relink the threads as they go, and say which ones changed. The first
  and last nodes in inorder have no neighbour to point at — their threads go to a dummy
  header node, which isn't drawn.

Threads are derived from the tree's shape rather than stored on the node, so they cannot
fall out of sync with it and every other tree operation works on the same nodes unchanged.

### The hash table view

The canvas is the bucket array itself, one row per index, so a probe sequence reads top
to bottom and its wrap past the last bucket is visible. The header carries the load
factor as a bar with a tick at the limit that triggers a resize; the line under it shows
the hash being computed, `h(42) = 42 mod 7 = 2`.

- **HASH FUNCTION** is a separate axis from collision handling, because it decides where
  keys land *before* any collision rule gets a say. Division (`k mod m`), multiplication
  (`⌊m × frac(k × 0.6180)⌋`), mid-square (the middle digits of k²) and digit folding
  (the sum of k's digits) all deal the same keys into different buckets, and switching
  redeals them rather than starting over.
- Six collision strategies share the one canvas. Beyond chaining and linear/quadratic
  probing: **double hashing** steps by `h₂(k) = 1 + k mod (m−2)`, a stride the key
  computes for itself, so two keys that collide once do not then collide all the way
  along. **Robin Hood** probes linearly but swaps the key it is carrying with any sitting
  key closer to home — the `+n` badge on each slot is that distance, and evening them out
  is what lets it run at α 0.75 and stop a search early. **Cuckoo hashing** gets two
  tables side by side: a key takes its T1 slot outright and evicts whoever was there into
  T2, so a lookup is two probes worst case, and a chain that will not terminate is a
  cycle only a bigger table can break.
- Table sizes are prime (7 → 17 → 37 → …). A prime modulus keeps `k mod m` from
  clustering, and it is what makes quadratic probing's guarantee hold.
- **Resizing is automatic.** Crossing the load factor limit — 0.75 under chaining, 0.5
  under probing — grows the table on the spot and replays every key into it, one frame
  per key, since `h(k)` is taken mod the new capacity. **Resize** in the sidebar forces
  the same thing by hand.
- **Deleting under open addressing leaves a tombstone** (`DEL`), not an empty slot:
  blanking it would strand every key whose probe sequence runs through it. Searches step
  over tombstones and later inserts reuse them.
- Switching the collision strategy **replays the same keys** into a fresh table rather
  than starting over, which is the fastest way to see the three strategies deal the same
  collisions differently.

### The dynamic hashing view

Two schemes that grow a table one bucket at a time instead of rehashing all of it at
once — the thing a plain hash table cannot do, and the reason database indexes use these
instead. **SCHEME** switches between them and replays the same keys in the same arrival
order, because in both of them where a key lands depends on how many splits had happened
when it got there. Buckets hold two keys, which keeps a split never more than a couple of
inserts away.

- **Extendible hashing** keeps a **directory** of 2^d pointers, drawn as a column of
  `0110 → B2` entries beside the buckets. Several entries pointing at one bucket is the
  normal state, not a bug: a bucket at local depth d' is named by 2^(d − d') of them.
- Each bucket shows its **local depth**. That number against the global depth is the
  whole decision: below it, a split just re-aims directory entries that already exist;
  equal to it, the directory has to double first. A split can also send every key to the
  same side, in which case it simply happens again.
- **Linear hashing** has no directory at all — just a level and a **split pointer**,
  marked `▸`. Each bucket is labelled with the hash it currently answers to (`mod 4`
  or `mod 8`), which is the one comparison a lookup makes.
- The bucket that splits is **the one the pointer is on, not the one that overflowed**.
  An overflowing bucket chains its extra keys into a dashed **overflow block** and waits
  its turn. Splitting in rotation is what spreads growth evenly instead of chasing
  whichever bucket is currently unlucky.
- When the pointer has been all the way round, every bucket has been rehashed, the level
  goes up and the pointer restarts at 0 — the table has doubled without any one insert
  costing more than a single bucket split.
- **Depths & Pointers** reads out the numbers that decide what the next insert does, and
  neither scheme shrinks on delete here — that is the part real implementations usually
  leave out too.

### The heap view

The tree and the array it actually lives in are both on screen, highlighted in lockstep,
with the index arithmetic (`parent ⌊(i−1)/2⌋`, `left 2i+1`, `right 2i+2`) spelled out for
whichever index the current step is touching. A heap stores no child pointers at all —
the tree is drawn *from* the array, which is the point.

- **New values arrive unheapified.** RANDOM ARRAY and the custom-values box load a plain
  array and then run the bottom-up build on screen, because watching an array become a
  heap is the most interesting thing the structure does. It is O(n), not O(n log n) —
  half the nodes are leaves that never move.
- **Switching max/min re-heapifies the same values** rather than starting over.
- Insert sifts up from the end of the array; extract fills the root from the end and
  sifts down. Both are capped at ⌊log₂ n⌋ swaps because a complete tree cannot be taller.
- The visualizer stops at 31 nodes (5 full levels) so the tree stays readable.

### The trie view

Every edge is one character, and a **green ring marks an end-of-word node**. That ring is
the whole distinction between a stored word and a passing prefix: search "car" in a trie
holding only "card" and the walk succeeds while the answer is still PREFIX ONLY.

- **Insert** creates nodes only where the path runs out — inserting "card" beside "car"
  costs one node, and the run reports how many characters it reused.
- **Delete** clears the flag and then prunes back up, stopping at the first node that
  still has children or is itself a word. Deleting "car" from {car, card} removes nothing.
- **Autocomplete** walks to the prefix and enumerates the subtree below it; results come
  out alphabetically because children are always visited in alphabetical order.
- Up to 12 words of at most 10 letters, a–z only.

### The union-find view

The forest and the parent array are both on screen. A **ringed node is a root** — an
element that is its own parent — and its `size` is shown above it, because union by size
decides which root survives a merge.

- **Path compression is animated.** Every find walks to the root and then re-points each
  element it passed straight at that root, one frame per pointer, and the tree visibly
  flattens. Run the same find twice and the second one has nothing left to compress.
- **Union** finds both roots (compressing on the way) and hangs the smaller tree under
  the larger. A union of two elements already in the same set reports ALREADY CONNECTED —
  which is exactly the cycle check Kruskal's algorithm runs on every edge.
- This is the same implementation Kruskal's MST uses: `makeUnionFind()` in
  `src/dataStructures/unionFind/helpers.js` is the silent version of what this view
  animates.

---

## Input formats

### Custom array (sorting / searching)

Comma-separated integers. Needs at least 2 values; the first 40 are used.

```
5, 12, 3, 8, 21, 4
```

Array size can also be set with the slider (6–40); random values fall in 10–99.

### Custom list / stack / queue / tree / heap / hash table

Comma-separated integers.

```
8, 3, 10, 1, 6, 14, 4
```

For trees the values are inserted in the order given, following the rules of the selected
tree type. A hash table takes up to 24 keys, inserted in the order given and resized
along the way as the load factor demands; duplicates are dropped, since keys are unique.
A heap takes up to 31 values, loaded as a plain array and then heapified on screen —
duplicates are fine. Dynamic hashing takes up to 20 non-negative keys and grows through
the splits their arrival forces.

### Trie words

Comma- or space-separated words, letters only. Anything else in a word is stripped, and
duplicates are dropped. Up to 12 words of at most 10 letters.

```
car, card, care, cat, dog
```

### Union-Find

A count of elements (2–12), which loads that many singleton sets. Elements are named
`A`, `B`, `C`… and the operation fields accept either the letter or the index.

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
│   ├── metrics.js          createMetrics(): the counters every sort reports
│   ├── sortContext.js      makeSort(): one body, exported as run() and count()
│   ├── stability.js        checkStability(): did ties keep their original order?
│   ├── complexity.js       runSweep() + the curve fits behind the empirical plot
│   ├── stepUtils.js        derives CMP/WRT for the searches, passes sort stats through
│   └── index.js            registry: ALGORITHMS, ALGO_MAP, getSteps(), countRun()
│
├── dataStructures/
│   ├── dynamicHash/  graph/  hashTable/  heap/  linkedList/  polynomial/
│   │   queue/  stack/  tree/  trie/  twoThreeTree/  unionFind/
│   │           each folder = one file per operation + helpers.js + index.js registry
│   │           unionFind/ also exports the silent makeUnionFind() that
│   │           graph/kruskalMST.js uses for its cycle check
│   │           tree/compare.js holds the insertion orders and the height sweep
│   │           behind the Balance & Height view
│
├── components/             canvases, sidebars, panels, the shared transport bar
│
├── hooks/
│   ├── useStepPlayer.js         shared playback engine (see below)
│   ├── useKeyboardShortcuts.js  global transport shortcuts
│   ├── useRace.js               2-4 sorts on one input, under one transport
│   ├── useTreeCompare.js        BST/AVL/2-3 from one key order, one insert per tick
│   └── useVisualizer.js, useLinkedList.js, usePolynomial.js, useStack.js,
│       useQueue.js, useGraph.js, useTree.js, useTwoThreeTree.js,
│       useHashTable.js, useHeap.js, useTrie.js, useUnionFind.js
│
├── data/                   category metadata and long-form topic write-ups
├── utils/
│   ├── distributions.js    the eight named input shapes, each pure in (n, seed)
│   ├── rng.js              the seeded PRNG everything random draws from
│   └── urlState.js         encodes/decodes the shareable link
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
  line: 2,              // pseudocode line this frame is executing
  pivot: 1, mid: 1, lo: 0, hi: 2, found: -1,
  tags: [0, 2, 1],      // where each element started (sorting only)
  stats: { comparisons: 4, reads: 8, writes: 2, aux: 0, depth: 0 },
  cCount: 4, sCount: 2  // short aliases for the transport bar
}
```

`stats` is cumulative and **counted by the algorithm itself**, not inferred from what the
frame highlights. Sorting algorithms are written against `sortContext.js`, whose `gt`,
`lt`, `swap` and `put` helpers do the counting as a side effect of doing the work; the
searches have no counters of their own, so `annotateSteps` still derives `cCount`/`sCount`
for them the old heuristic way and synthesises a matching `stats`.

`tags[i]` is the index the element now in slot `i` started at. It is what makes stability
observable: two equal values are indistinguishable as bars, so the tags are the only
record that a sort moved one past the other. Every value move goes through `swap`/`put`,
which carry the tag along, so no algorithm has to think about it.

The same body serves both `run(array, options)` and `count(array, options)` — `makeSort`
runs it a second time with frame recording switched off. That is the fast path the
empirical complexity sweep uses to reach n = 5000, and writing it once is what stops the
plotted counts from drifting away from the animated ones.

`line` indexes the algorithm's own `pseudocode` array, which is what lets `InfoPanel`
highlight the line as the run plays. `null` means the run has finished and no line is
executing. Each algorithm declares its indices once, as a `LINE` constant next to `run`:

```js
const LINE = { COMPARE: 2, SWAP: 3, DONE: null };
```

Not every pseudocode line lights up — a frame only exists where the algorithm has
something to show, so loop headers and recursive calls that produce no frame stay dim.

**Merge and quick sort carry recursion structure on top of that:**

```js
{
  range: [4, 7],   // inclusive subrange this call owns
  depth: 1,        // recursion depth, root is 0
  callId: 2,       // index into calls[]
  callCount: 7,    // how many calls have been entered by now
  calls: [ { id, parent, range: [lo, hi], depth }, ... ]
}
```

`range` is what dims the bars outside the active partition; `calls` is what
`RecursionPanel` draws. That array is built once per run and shared by reference across
every frame of it — `callCount` is how much of it had been entered at that point, so the
tree fills in as the run proceeds rather than showing the whole shape up front. Note the
two sorts recurse over different conventions internally (merge sort's `r` is exclusive,
quick sort's is inclusive); `range` is always inclusive.

A data-structure step carries the structure plus a human-readable line:

```js
{ nodes: [...], message: "Node linked in as the new head" }
```

Because steps are precomputed and immutable, stepping backwards, scrubbing and replaying
are all free — there's no state to unwind.

### `useStepPlayer`

One hook owns playback for every view: `stepIdx`, `playing`, `speed`, and the
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

1. Create `src/algorithms/sorting/mySort.js` and write the body against a **sort
   context**, then export the `run` / `count` pair `makeSort` builds from it:

   ```js
   import { makeSort } from "../sortContext.js";

   // Indices into `pseudocode` below — the line each frame is executing.
   const LINE = { COMPARE: 1, SWAP: 2, DONE: null };

   const { run, count } = makeSort((ctx) => {
     for (let i = 0; i < ctx.n; i++) {
       // Do the comparison first, then draw it: the frame's counters then
       // include the work the frame is illustrating.
       const outOfOrder = ctx.gt(i, i + 1);
       ctx.emit({ compare: [i, i + 1], line: LINE.COMPARE });
       if (outOfOrder) {
         ctx.swap(i, i + 1);
         ctx.emit({ swap: [i, i + 1], line: LINE.SWAP });
       }
     }
     ctx.markAll();
     ctx.emit({ line: LINE.DONE });
   });

   export const mySort = {
     key: "mySort",
     label: "My Sort",
     category: "sorting",
     desc: "One-paragraph explanation shown in the info panel.",
     time: { best: "O(n)", avg: "O(n log n)", worst: "O(n²)" },
     space: "O(1)",
     stable: true,
     pseudocode: ["for i in 0..n:", "  ..."],
     run,
     count,
   };
   ```

   The context owns the array and does the counting: `gt` / `lt` compare two slots,
   `ltValues` / `lteValues` compare values already read out, `swap` and `put` move data,
   `markSorted` / `markRange` / `markAll` maintain the sorted set, and `ctx.m` takes the
   counts the loops can't infer (`read`, `write`, `aux`, `atDepth`). `emit` fills in the
   array, tags, sorted set and stats, so a frame only has to say what it is highlighting.

   Writing it this way is what gives you `count()` for free: `makeSort` runs the same body
   a second time with `emit` as a no-op and no array copies, which is what the empirical
   complexity sweep calls at n = 5000. Never write the counting path by hand — two copies
   of an algorithm drift, and then the plot and the animation disagree.

   Moving data through `swap` / `put` also keeps the stability tags in step, which is what
   makes the colour-by-origin view able to tell whether your sort preserved ties. Declare
   `stable` honestly; the view will check you.

   Searching algorithms are unchanged: they export a plain `run(array, target)` and their
   counters are still derived from the frames by `annotateSteps`.

   Give every frame a `line`, or the pseudocode panel won't follow your algorithm. Where
   the pseudocode is too coarse for the frames you push — a whole helper collapsed onto
   one line, say — spell that helper out as extra lines rather than pointing several
   different frames at the same one.

2. To make the algorithm configurable, declare `variants` and read the choice off
   `ctx.options`:

   ```js
   variants: [
     {
       key: "pivot",
       label: "PIVOT",
       default: "last",
       options: [{ key: "last", label: "Last", desc: "Shown under the picker." }],
     },
   ],
   ```

   `resolveVariants()` drops anything the registry doesn't declare, so a hand-edited link
   can only ever name a setting the algorithm really has.

3. Register it in `src/algorithms/sorting/index.js` (or `searching/index.js`).

That's all — the counters, the sidebar entry, the variant picker, the race lane, the
complexity sweep, the info panel and the pseudocode display are wired automatically from
the registry.

### Add a data-structure operation

1. Add `src/dataStructures/<structure>/myOp.js` exporting an operation object with
   `key`, `label`, `group`, `fields`, `desc`, and a `run(current, params)` that returns
   `{ steps, finalList | finalTree | finalTable | finalHeap | finalTrie | finalUf |
   finalGraph }`.
2. Register it in that folder's `index.js` operation map.

The sidebar renders the inputs listed in `fields`, and the transport bar picks up the new
steps with no extra work.

An operation that only makes sense for some variants of its structure says so instead of
checking at run time: a tree operation may carry `types` (which tree types it belongs to)
and `threadModes`, and `treeOpAvailable()` in `src/dataStructures/tree/index.js` is what
both the sidebar and `useTree` filter by — that is how the threaded walks stay hidden on a
plain BST.

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
