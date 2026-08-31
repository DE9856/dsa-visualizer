# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Usability and playback-smoothness pass across every visualizer, five new structures — hash
tables, dynamic hashing, heaps, tries and union-find — and two new comparison views: Race &
Compare, which puts sorting algorithms against each other on real, self-reported operation
counts, and Balance & Height, which builds a BST, an AVL tree and a 2-3 tree from one key
sequence. Dynamic programming arrives as a family of its own: six problems that fill a
table cell by cell and then walk it backwards to recover the answer the number alone
never gives you. Backtracking arrives as another: four searches drawn beside the tree they
explore, with the branches pruning cut away marked as such. The TREES section grows the
most: red-black trees, splay trees and treaps alongside AVL, segment and Fenwick trees over
one array, B-trees and B+ trees, and Huffman coding — four different answers to "what
should a tree be shaped by", none of them the same as balance.

### Changed

- **Panels no longer blur a backdrop nobody can see.** `.panel` — the canvas and the
  sidebar, the two largest elements on screen — carried `backdrop-filter: blur(14px)`, and
  so did the nine landing cards. Everything behind them is a static gradient, so the blur
  was invisible, but it forced the compositor to re-blur that region on every frame the
  panel or its contents changed, which is every step of every animation. Blur is kept for
  the overlays that sit over real content: menus, the mobile sheet, the action bar.

- **Per-step transitions name the properties they animate.** Linked-list nodes, queue and
  stack slots, union-find and heap cells used `transition: all`, which asks the browser to
  watch every animatable property — including the ones that trigger layout — on elements
  that restyle on every frame. They now list only what actually changes.

- **The landing page says what each view actually holds.** A card description shared its
  line with the label and was truncated with an ellipsis when it did not fit, then hidden
  outright below 560px — so the one place a view says what is inside it was the first thing
  to disappear. Descriptions now wrap onto their own line under the label at every width.
  The Tree card admits to red-black, splay and treap, and the Graph card to SCC and max
  flow; both had been describing a smaller app than the one that shipped.

- **The multi-way tree canvas is shared, and knows nothing about 2-3 trees.**
  `TwoThreeTreeCanvas` was already generic over `keys`/`children` arrays except for one
  line that drew a divider only when a node held exactly two keys. It is now
  `MultiwayTreeCanvas`, draws a divider between every adjacent pair, derives its slot width
  from the widest node in the tree so order-5 boxes cannot overlap, scrolls inside its own
  container when the tree outgrows the panel, and draws the B+ leaf chain when a frame asks
  for it.

- **`cloneNode` copies whatever a node carries.** It picked out `id`, `value`, `left` and
  `right` by name, which was exactly right until a node had a colour or a priority — a clone
  that silently dropped them would leave the tree looking correct and behaving wrongly.

- **A frame can ask for edge labels.** `GraphCanvas` drew weights only when the WEIGHTS
  toggle was on, which made max flow unreadable whenever it was off — `flow/capacity` is not
  optional decoration for that operation. A frame carrying `showWeights` now gets labels
  regardless. Graph operations are also handed `directed`, `weighted` and the vertex
  `positions` alongside the sidebar's inputs, because the newer ones need to know whether
  the arrows mean anything, and A* cannot have a heuristic without knowing where things are.

- **Each problem shows its own example again.** The dynamic programming and string views
  keep one flat record of input fields so that switching between related problems keeps what
  you typed — LCS and edit distance are the same grid read two ways, and seeing one input
  under both is the point. But the record was seeded by merging every problem's defaults,
  so where two of them share a field name the last one silently won: landing on LCS gave
  you edit distance's KITTEN/SITTING, and three of the four string algorithms lost the
  demo text chosen to show them off. The current problem's own defaults now go on top, and
  they are re-applied when you switch — unless you have edited the input, in which case
  what you typed survives, which was the behaviour worth keeping in the first place.

- **The algorithm modules are their own bundle chunk.** Every family added brings frame
  builders, pseudocode and long-form descriptions with it, and the four of them pushed the
  app chunk back over Rollup's 500 kB warning. They are pure logic with no components in
  them, so they now split out and cache independently of the UI: the largest chunk is 290 kB
  rather than 510 kB.

- **A shorter header: categories beside the title, SHARE on the canvas.** The title,
  category strip and share button were a wrapping flex row, which was fine at six
  categories. At nine — with the active one showing its open problem, so
  `DYNAMIC PROGRAMMING / Longest Common Subsequence` is a 377px pill by itself — they
  wanted 1529px against the 1209px a 1280px screen has, and wrapped onto *three* lines.
  That put 165px of header above the visualization.

  The categories now sit beside the title and wrap to a second line, and **SHARE** has
  moved to the canvas's top-right corner. Header height goes from 165px to 85px, every
  category stays visible without scrolling, and the row count is capped at two.

  They are also drawn as a plain row rather than inside a rounded container. A container
  has to be as wide as its widest line, so on two rows it left a large empty box beside the
  short one. Inactive categories are transparent and fill in on hover; only the one you are
  on keeps the filled treatment, which gives the row a focal point instead of eight
  identical chips. A hairline after the wordmark separates it from the nav.

  Two things had to move with it. The dropdowns are now positioned `fixed` from their
  trigger's rect and clamped to the viewport, rather than absolutely inside the strip,
  since with eight wrapping categories the right-most pill is no longer the last one. And
  `.main-col` now publishes a `--share-safe` custom property naming how much of the
  corner the button occupies: canvas headers that run the full width of the panel pad
  themselves out of it, which the hash table and dynamic hashing views need — their load
  factor read-out ends exactly where the button floats. Headers that are centred or
  left-aligned ignore it, and on a phone it is zero, because SHARE is in the nav sheet
  there and the corner is free.

- **`DpInfoPanel` is now `CodeInfoPanel`, shared by two views.** It was already just
  "description, costs, and code with the executing line lit up", which is what the
  backtracking view needs too. The code block's heading is a prop, since one view shows a
  recurrence and the other a recursive procedure.

- **`treeHeight` is memoized against the node object.** Every AVL balance factor asks for
  two heights and `avlFixupTree` asks for a balance factor at every node, so an unmemoized
  O(n) height made a single insert O(n²) and building a tree O(n³) — fine for the thirty-node
  trees the canvas draws, hopeless for the new height-vs-n sweep. Caching is sound because
  nodes in this codebase are immutable: every operation builds new nodes rather than
  mutating the ones it was given, so a node's height can never change after it exists. A
  WeakMap means a cached height dies with the tree it describes.

- **Sorting counters are counted, not guessed.** `annotateSteps` used to infer comparisons
  and swaps from what a frame happened to highlight, which meant an algorithm that wrote
  without drawing a swap (merge sort, radix sort) under-reported, and one that drew a frame
  per comparison counted frames rather than comparisons. Every sorting algorithm is now
  written against a shared sort context and reports five real counters as it works — key
  comparisons, array reads, array writes, auxiliary-memory high-water mark in elements, and
  deepest recursion — which is what makes racing two of them fair. The transport bar shows
  all five, omitting the two that are structurally zero for a given algorithm. Searching
  algorithms keep the old derived CMP/WRT read-out, which is exact for a linear scan and
  close enough for the range searches, whose cost *is* the frames they draw.

  The same rewrite is what gives every sort a frame-free `count()` path, since one body now
  serves both — two hand-maintained copies would drift, and then the plot and the animation
  would disagree.

- **Bucket lists flow into columns instead of scrolling.** A 37-bucket table, or a
  directory at global depth 5, used to be a long scroll through a narrow strip while the
  right half of the canvas sat empty. Both now fill a column top-to-bottom and start
  another one beside it, so the whole table is on screen at once. Column order, not row
  order — a probe walks consecutive indices, and those have to stay next to each other.
  A phone has no width to spare, so there the lists stay single columns and scroll.

- **The bundle is split three ways, so less of it has to arrive before the app runs.**
  React and the icon set are their own chunk — they change only when a dependency does,
  so an app redeploy no longer invalidates them in anyone's cache. The topic write-ups
  are another: `TopicPanel` starts collapsed, so its 30 kB of prose is fetched the first
  time someone expands it rather than on every visit, and the panel's heading now lives
  in `topicTitles.js` so the collapsed state needs nothing else. Initial download is
  ~151 kB gzipped, and Rollup's 500 kB chunk warning is gone.

- **The graph view opens empty, on the adjacency matrix.** It used to land on a random
  graph with the adjacency list showing. The graph is the topic you build yourself now
  that the canvas and the matrix are both editable, and a graph already on screen is
  something to clear before you can start; RANDOM GRAPH is one click away when you want
  one. The matrix leads because it is the representation you can type into, and it shows
  the pairs that *aren't* connected too — which is most of a graph you are still
  building. Shared links are unaffected: they arrive with the graph they carry.

### Added

- **B-trees and B+ trees, at order 3, 4 or 5.** A new view under TREES, and the one
  structure in the app whose shape is an argument about hardware rather than about
  mathematics: a node is as wide as the block it lives in, so one read narrows the search
  *m* ways instead of two, and the height falls from log₂ n to log_m n.

  What it is built to show is that **nothing rebalances it**. There is not a rotation
  anywhere in the implementation. Every leaf stays at the same depth because the update
  rules are symmetric about the vertical — an overflowing node splits and pushes its median
  *up*, an underflowing one borrows from a sibling or merges and pulls a separator *down*,
  and the only way to gain a level is to split the root while the only way to lose one is to
  empty it. Run Insert at order 3 and watch a split travel upward a level at a time.

  Delete is the intricate half and the frames say so as they go: an internal key is a
  separator and cannot simply be removed, so it is overwritten with its predecessor — which
  lives in a leaf — and that copy is deleted instead, which turns every deletion into a leaf
  deletion followed by a repair that can cascade to the root.

  **VARIANT** rebuilds the same keys the other way. A B+ tree moves every key into a leaf,
  keeps only routing separators upstairs and links the leaves left to right — drawn as a
  dashed chain along the bottom — so Inorder Traversal walks one level instead of touring
  the tree. That is why database indexes are B+ trees: a range scan finds its starting leaf
  once and never touches the interior again. It costs a uniform full-height search, which
  sounds worse and makes every lookup predictable.

  Verified against the invariants at every order and in both variants: all leaves at one
  depth, key counts inside [⌈m/2⌉−1, m−1] for every node but the root, separators bounding
  their subtrees, sorted traversal — checked after each of twelve inserts in sorted,
  reversed and mixed order, after **every one of fourteen single deletions** from a
  fourteen-key tree, and after deleting everything in three different orders.

  That testing caught a real bug that no amount of looking at the screen would have. A B+
  separator equal to the key being searched for is only a *copy* of the right subtree's
  smallest key, so an equal key must route **right**; routing it left walked past the leaf
  holding it, and deleting a key that had been copied upward silently did nothing while the
  tree still looked perfectly correct.

- **Huffman coding trees.** Also under TREES. Build a code from any text and watch the
  greedy rule that produces the optimal one: repeatedly merge the two lightest trees.

  The canvas is a forest for every step but the last, which is the point — you watch trees
  get eaten. Each frame draws the priority queue as it stands beside the forest, so "the two
  lightest" is something you see selected rather than a rule you are asked to take on trust.
  The last frame reads the codes off the paths and reports the encoded size against a
  fixed-width code for the same text.

  Checked against an independent reference implementation on eight texts — the total cost
  matches the optimum every time — plus the properties that matter and are easy to get
  subtly wrong: the codes are prefix-free, encoding and decoding round-trip through the
  finished tree, every internal weight is the sum of its children, the root weighs exactly
  the length of the text, and the sibling property holds so a rarer symbol is never given a
  shorter code than a commoner one.

- **Range queries: segment trees and Fenwick trees, over one array.** A new view under
  TREES. Both answer "what is the sum of positions 1 to 5?" on an array that keeps changing,
  and both get O(log n) for query *and* update by storing partial answers over ranges rather
  than positions — where a plain array is O(n) to query and a prefix-sum array is O(n) to
  repair.

  They share a canvas on purpose. Under the array sits a row of spans, each drawn across the
  cells it summarises; spans on one row never overlap, because a segment tree's row is a
  depth and a Fenwick tree's is a lowbit class. That makes the punchline visible in both: a
  query lights up three or four stored values that happen to tile the range exactly. On the
  default array a Fenwick `a[1..5]` shows two green spans tiling prefix(5) = 17 + 10 = 27 and
  one red span for the prefix(0) = 5 it never wanted — 22, from three reads instead of five.

  MIN and MAX are disabled for the Fenwick tree, and that is the lesson rather than a
  limitation of the implementation: a Fenwick range is one prefix minus another, subtraction
  undoes a sum, and nothing undoes a minimum. A segment tree takes all three because it never
  relies on undoing anything.

  Checked exhaustively rather than by sampling: every one of the 36 ranges of an 8-element
  array, for segment/sum, segment/min, segment/max and fenwick/sum, against brute force —
  then four point updates each, re-verifying all 36 ranges after every one. Plus the invariant
  the canvas depends on: no two spans overlap within a row, in either structure.

- **Red-black trees, splay trees and treaps.** Three more TREE TYPE options in the existing
  tree view, sharing its operations, canvas and shared links — and disagreeing with AVL, and
  with each other, about what "balanced" should mean. AVL keeps sibling heights within one
  and pays for it in rotations; a red-black tree only promises the longest path is at most
  twice the shortest, and restructures far less; a splay tree promises *nothing* per
  operation and is O(log n) only amortised; a treap has no balancing rule at all and gets
  O(log n) expected height from random priorities alone.

  Red-black nodes are drawn in their colour, because the colour is the data. A new key
  arrives red, since a black one would change its path's black-height immediately while red
  only risks the locally repairable "no two reds in a row". Treap priorities are drawn above
  each node in purple. Splay's **Search** is the only search in the app that rewrites the
  structure it is searching — and it does it on a failed search too.

  All three needed a mutable, parent-linked representation internally, which the rest of the
  app deliberately does not use: rotations and fix-up walk *upward*. Each converts on the way
  in and freezes on the way out. That is also what made red-black deletion tractable to get
  right — the double-black cases are hard enough without rebuilding the spine every step.

  Verified against the invariants rather than by eye: red-black insert over four key sets
  including sorted and reversed input; **every one of fourteen single deletions** from an
  eleven-key tree, plus delete-everything in three orders, each checked for root-black,
  no-red-red and equal black-height; treaps checked for BST order *and* heap order over six
  random trials; splay checked for last-inserted-at-root, searched-key-at-root, and that a
  failed search still splays.

- **Eight more graph algorithms, and the operation list split by what each is allowed to
  know.** Shortest paths now sit under two headings rather than one, because the difference
  between them is not speed but assumptions. **Uninformed** — Dijkstra, Bellman-Ford,
  Floyd–Warshall — know the edges and nothing else, expand in every direction including
  away from the target, and hold on any graph. **Heuristic** — A* — is handed an estimate of
  what is left and leans towards the goal, expanding 4 of 6 vertices on the default network
  where Dijkstra would settle everything nearer than the target first.

  A*'s estimate is the straight-line distance between vertices *as drawn*, so dragging one
  changes it. That needs care: A* only returns the true shortest path when the estimate
  never overshoots the real remaining cost, and straight-line distance is not admissible on
  its own, because edge weights have nothing to do with how far apart vertices happen to be
  drawn. It is scaled by (cheapest edge ÷ longest edge on screen) — a route covering
  geometric distance D needs at least D ÷ longest-edge hops at at least the cheapest edge
  each — and checked against Dijkstra on three graphs to confirm they agree.

  **Bellman-Ford** earns its O(V·E) twice: it survives negative edges, and one pass past the
  V−1 guarantee turns it into a negative-cycle detector — a distance that still improves
  proves that going round a loop makes the total smaller, so no shortest path exists at all.

  **Connectivity & structure** is a new group of five. Cycle detection runs a genuinely
  different algorithm per DIRECTED setting — grey/black stack colouring against
  parent-exclusion — so a diamond is a DAG directed and cyclic undirected, from one picture.
  Bipartite check reports its failure as an *odd cycle*, which is what non-bipartite
  actually means. Bridges & articulation points finds single points of failure from
  discovery times and low-links in one pass. Tarjan's and Kosaraju's find the same strongly
  connected components two different ways — one pass with a stack, or two passes with the
  graph reversed — and are worth running back to back on the same graph.

  **Max flow (Edmonds–Karp)** labels every edge `flow/capacity` regardless of the WEIGHTS
  toggle, and the residual backward edges are the point: they let a later augmenting path
  undo an earlier decision without having to notice it was wrong. When no path remains, the
  vertices still reachable are one side of a minimum cut whose capacities add to exactly the
  flow. Verified at 23 on the CLRS network, and at 2 on the small case that only reaches the
  optimum by using a backward edge.

  All eight are checked against reference implementations: Tarjan against Kosaraju on four
  graphs, A* against Dijkstra on three, bridges against hand-worked path/triangle/bowtie
  cases, and max flow against two known networks.

- **Floyd–Warshall is actually reachable now.** It has been in the repository, complete and
  with a matching `DistanceMatrixPanel`, since before this changelog — and imported by
  nothing, so it has never appeared in the app while README and DOCS both listed it. Both
  are now wired in: it sits with the other uninformed shortest-path operations and fills an
  all-pairs distance matrix under the canvas. Its S→T distance agrees with A*'s on the same
  graph, which is a pleasant way to find out that two unrelated implementations are right.

- **String algorithms: KMP, Z, Rabin-Karp and Manacher on one aligned grid.** A new family.
  Brute-force matching is O(n·m) because a comparison that fails after eight matching
  characters throws all eight away; each of these keeps a different piece of what the failed
  attempt proved, and the view is built to show which piece.

  Everything is drawn on one set of columns, and a row can start part-way along — so KMP's
  search draws the pattern as a second row beginning at the column it is aligned with, and a
  shift is that row physically moving right rather than a number changing. Blue marks the
  span being *reused instead of recompared* — KMP's border, Z's mirror, Manacher's reflected
  radius — which is the one idea the whole family shares.

  **KMP builds its failure function on screen first.** π[i] is the length of the longest
  proper prefix of P[0..i] that is also a suffix, and when one is found both ends light up
  at once: the prefix at the front and the matching suffix ending at i. That picture is the
  failure function; the number under it is only its length. Then the search uses it, and
  each mismatch says what it is trading — "8 matched, π[7] = 4 of them are also a prefix, so
  slide 4 and keep those 4" — with the text pointer never moving backwards.

  Two of the defaults were chosen by measurement rather than taste. Rabin-Karp's modulus is
  233, found by searching for one that actually produces a spurious hit on the default text,
  because a verification loop that never fires looks like pointless ceremony — "BABCA" and
  "ABABC" both hash to 170. And the Z default exercises the mirror on 18 of its 46 frames,
  four of them needing no character comparisons at all.

  All four are checked against brute force: the three matchers agree with a naive search on
  eight cases including overlapping matches, KMP's π matches a reference implementation, and
  Manacher agrees with an O(n²) longest-palindrome search.

- **Backtracking: four searches, one board, and a tree that shows what pruning removes.**
  A new family — n-queens, sudoku, subset sum and permutations — sharing one canvas and
  one search-tree panel.

  Backtracking is depth-first search over partial answers with one addition: the moment a
  partial answer is provably hopeless, the whole subtree under it is abandoned without
  being built. Choose, check, recurse, and — the step that gets skipped when people write
  it out by hand — undo. The board shows all of it: what the constraint has already ruled
  out (squares a placed queen attacks, the digit that clashes), the choice being made, and
  in yellow the choice being taken back.

  **The state space tree is the point, and it is not `RecursionPanel`.** Every path from the
  root to a node is one partial solution, and the tree of all of them is the space the
  search moves through — so `SearchTreePanel` draws it with its edges. Without them you can
  see that eighteen nodes at depth 3 were rejected; with them you can see they were all
  children of one choice, and that rejecting it removed an entire subtree. Nodes carry the
  classical names: **E-node** for the one being expanded, live for the rest of the path,
  killed-by-the-bounding-function for branches rejected before their children were ever
  generated, dead end for those tried and undone, answer node for those that worked. The
  path from the root to the E-node is drawn as one thick line and spelled out underneath,
  because that chain *is* the partial solution the board is showing.

  `RecursionPanel` could not do this job. It draws merge and quick sort's recursion, where a
  call owns a contiguous `[lo, hi]` slice and is drawn as a segment on the bars' own
  horizontal scale — containment is an interval relationship there, so it needs no lines at
  all. A backtracking node owns no interval. Same frame vocabulary (`calls`, `callId`,
  `depth`, one shared array rather than a copy per frame), different geometry.

  Two things keep the tree cheap enough to redraw every frame: the layout is computed once
  per run from the finished tree and memoized on the shared `calls` array, so nodes appear
  in place instead of the picture shuffling sideways on every step; and nodes are batched
  into one `<path>` per state rather than one element each, since 7-queens over every
  solution is 3,585 nodes. Trees run from 4 leaves to 764, so the slot width adapts — labels
  while they fit — and the E-node is kept in view as you step.

  Making that colouring correct needed one extension to the shared-array trick. A
  merge-sort call never changes after it is created, so `RecursionPanel` can slice by
  `callCount` and be done. A backtracking node does change — it starts as exploring and
  later becomes a dead end or a solution — so mutating a status field would make early
  frames show nodes dying before they died. Instead each node records *when* it changed, as
  frame ordinals (`openedAt`, `closedAt`), and the panel compares them against the frame's
  own `seq`. Mutation stays safe because it is only ever read as a comparison, and stepping
  backwards shows the tree as it was rather than as it ended up.

  **Permutations is in there as the control case.** It has no constraint, so nothing is
  ever pruned, every leaf is an answer, and the tree is exactly the size of the output — 65
  nodes for 24 answers. Next to n-queens, where 140 of 172 nodes are rejected on sight, the
  difference between the two trees is precisely what a constraint buys.

  Searches stop at 4,000 nodes, and the number is not arbitrary: every solution to 7-queens
  is 3,585 nodes, 8-queens is 15,721, and the newspaper sudoku at the top of the Wikipedia
  article takes this row-major solver 37,653 nodes and 4,157 backtracks. The three sudoku
  presets were chosen by running the solver over candidates rather than by how hard they
  look to a person — one that needs no guessing at all, one with three, one with eight —
  because those two things turn out to be barely related.

- **Dynamic programming: six problems, one table, filled and then walked backwards.** A
  new family on the landing page — longest common subsequence, edit distance, 0/1
  knapsack, coin change, longest increasing subsequence and matrix chain order — each
  listed as its own entry, all six sharing one canvas.

  Every problem is a table filled cell by cell, and the frame model already had exactly
  the right shape for it: `run(params)` returns an array of frames, so stepping backwards
  through a fill and scrubbing into the middle of a backtrack are free. Each step marks
  four things, and they mean different things: the cell being written, the cells it read
  and rejected, the one cell its answer actually **came from**, and — during the
  backtrack — the cells on the recovered solution. The third of those is the recurrence
  made visible: a knapsack cell looks at two neighbours and takes one, and which one it
  took is the difference between putting the item in the bag or leaving it out.

  **The backtrack is half of it.** A filled table holds a number, and a number is not a
  solution — "length 4" is not a subsequence and "23" is not a set of items. Every cell
  records the decision it made in its corner (`↖ ↑ ←`, `✓` or `·`, `←j`, `k=3`), the walk
  back reads those marks rather than recomputing anything, and the answer builds up under
  the table as it goes: the subsequence, the edit script, the items taken, the coins
  spent, the bracketing. Reading rather than recomputing is what stops the recovered
  answer from ever disagreeing with the number the fill produced.

  The six are grouped by what the table is indexed by, not by what the problem is about,
  because that is where the lesson is. LCS and edit distance are the same grid with the
  arithmetic turned upside down — one counts what two strings share, the other what they
  don't — and switching between them keeps your input so the two are one click apart.
  Coin change is the knapsack with a single index changed, reading from its own row
  instead of the one above, which is exactly the difference between a coin you can spend
  again and an item you cannot. The increasing subsequence's answer is not in the last
  cell but the largest cell anywhere in its single row. Matrix chain fills diagonally, by
  chain length, and its lower triangle is drawn as absent rather than unfilled — a run
  never goes backwards, so those cells are not "not yet", they are "not a cell".

  Defaults are the textbook cases and the numbers match: KITTEN → SITTING is distance 3
  with the classic script, and the CLRS matrix chain 30, 35, 15, 5, 10, 20 comes out at
  ((A1(A2A3))(A4A5)) for 11,875 multiplications against 25,500 bracketed left to right.
  Coin change opens on 1, 3, 4 making 6, where the table finds 3+3 and greedy gets three
  coins — the panel says so when it happens.

  Input sizes are capped (12 characters, 8 items, capacity 20, amount 24, 14 numbers, 7
  matrices) because one frame per cell means the table's *area* is the length of the
  animation.

- **Probes against load factor, for all six collision strategies at once.** A sweep under
  the hash table view. The canvas holds a couple of dozen keys and resizes itself at α 0.5
  or 0.75, so it can never show the part that decides which strategy you pick: what a
  lookup costs as the table fills. This fills a table of 79, 331 or 673 slots to each load
  factor from 0.05 to 0.95 — five tables per point, every strategy dealt the same keys in
  the same order — and counts the slots a lookup examines, using the same `locate()` the
  animation walks.

  At α 0.95 in a 673-slot table an unsuccessful search costs linear probing 112 slots,
  double hashing 19, Robin Hood 9 and chaining 2. Two results are worth the sweep on their
  own: linear probing and Robin Hood have *identical* averages — Robin Hood moves keys
  around without changing how many there are, so what it buys is the worst case (284
  against 22), not the mean — and cuckoo hashing's curve simply stops at α 0.5, where its
  eviction chains start closing into cycles a bigger table is the only fix for. The
  classical curves are drawn dashed over the top, and the measurements sit under them past
  α 0.8, because those results are asymptotic in the table size and a few hundred slots is
  not asymptotic.

- **Adjacency list vs adjacency matrix, as a cost rather than a rendering.** A panel under
  the graph view. The representation panel above it shows the two as alternative views of
  one graph, which is true of a graph with six vertices and misleading about every other:
  they are opposite bets, and which one pays depends only on density.

  It reads out exact numbers for the graph on screen — memory, edge query and traversal,
  with every ordered pair of vertices actually asked about rather than sampled — and
  sweeps the same measurement to 256 vertices at four densities. Both structures are
  really built and really queried; nothing is quoted from a complexity table. At V = 128
  and average degree 4 the matrix stores 16,384 cells against the list's 640. At the
  Complete setting the two land on exactly the same number, because V + 2E = V + V(V−1) =
  V², which is the whole rule in one line.

- **Prim vs Kruskal on the same graph.** A panel under the graph view. Both algorithms run
  on the graph the canvas is drawing and their chosen edges are listed in the order each
  picked them, numbered — Prim's tree connected at every moment, Kruskal's a scattering of
  fragments until the last edge — with the totals, which are equal, side by side. When no
  two edges share a weight the edge sets are identical too, and the panel says which case
  it is looking at.

  Underneath, a density sweep at fixed V: array-based Prim's curve is nearly flat, because
  it scans every vertex on every round whether the graph has V edges or V², while
  Kruskal's E log E climbs past it. At V = 128 the crossing lands between E = 1.4k and
  E = 2.5k, so "Kruskal for sparse graphs" becomes a number you read off rather than a
  rule of thumb. Every point also checks that the two totals still agree, which is the one
  assertion the whole comparison rests on and is cheap to verify at every size.

- **Balance & Height: BST vs AVL vs 2-3 tree, on the same keys in the same order.** A new
  view under TREES. A binary search tree has no shape of its own — its shape is decided
  entirely by the order its keys arrive in, and the worst order is the most natural one.
  Insert 1, 2, 3 … 15 and the BST reaches height 14 while the AVL tree and the 2-3 tree
  both sit at 3.

  Six insertion orders make that the variable: sorted, reversed, random, alternating ends,
  median-first (which builds a perfectly balanced BST with no rebalancing at all) and
  sawtooth. The sequence is drawn above the lanes with a cursor on the next key, and one
  transport tick is one insert.

  The board underneath shows height beside the comparisons spent reaching it, which stops
  "shortest" from being read as "cheapest": the 2-3 tree matches AVL's height on 15 sorted
  keys but spends 51 comparisons against AVL's 45, because a node holding two keys costs
  two comparisons to pass through. A GUARANTEE column carries each structure's promised
  bound at the current key count — and `none` for the BST, which promises nothing.

- **Height against n, measured.** The canvases cap at 24 keys; the sweep below them runs
  the same insert code without keeping the intermediate trees, so n reaches 1600. It plots
  height (or total comparisons) against n with log₂ n, log₃ n and n dashed over the top.
  On sorted input at n = 400 the BST measures height 399 — tracking n exactly — against
  the AVL tree's 8 and the 2-3 tree's 7, with log₂ 400 = 8.6.

- **Race & Compare: two to four sorting algorithms side by side, and an empirical
  complexity plot.** A new view under ARRAYS. One input array is built from a named shape
  and a seed and handed unchanged to every lane, so any difference on screen is the
  algorithm rather than the data; a lane that finishes early freezes on its last frame
  instead of blanking, because the finished array sitting beside one still being churned
  *is* the comparison.

  The transport can sync the lanes two ways. BY FRAME advances every lane one frame per
  tick, which is simple but compares frames rather than work — a bubble sort frame is one
  comparison while a merge sort frame can be a whole write. BY WORK, the default, spends
  the same number of operations in every lane per tick, so the lane that costs less
  genuinely finishes earlier on screen.

  Under the track, a live scoreboard fills each counter against the largest final value in
  its column, so one lane overtaking another is something you watch rather than work out.

- **Eight input shapes, for sorting and for the race.** Random, nearly sorted, already
  sorted, reversed, few unique, all equal, sawtooth and organ pipe. This is where the
  interesting comparisons live: on nearly-sorted input at n = 24, insertion sort finishes
  in 25 operations against merge sort's 165 and quick sort's 872 — the reverse of what
  their average-case complexities imply. Every shape is a pure function of `(n, seed)`, so
  a shared link rebuilds the same array in someone else's browser, and NEW DATA only has
  to change the seed.

- **Empirical complexity: growth measured, not asserted.** Every sorting algorithm now
  also exports `count()` — the same body as `run()` with frame recording switched off — so
  a sweep can run it at 10, 20, 40 … 5000 elements without materialising millions of
  frames. The panel plots measured operations against n with n, n log n and n² fitted over
  the top, and reports each algorithm's measured growth exponent beside the complexity its
  metadata claims. Log-log by default, because that is the only view where a power law is
  a straight line you can read the slope off.

  It shows things a complexity table cannot: insertion sort measuring 1.08 on nearly-sorted
  input while quick sort measures 1.97 on the same data, and quick sort's 2.00 on sorted
  input dropping to 1.21 the moment the pivot rule changes.

- **Pivot and gap-sequence variants.** Quick sort can partition around the last element
  (Lomuto's textbook pivot), the first, the median of three, or a random element drawn
  from the run's seed. Shell sort can use the Shell (n/2), Knuth (3h+1) or Sedgewick
  (1, 5, 19, 41, …) gap sequence. Same algorithm, same input, visibly different curves —
  and the choice travels in the share link.

- **A stability demo you can see.** COLOUR BY ORIGIN tints every bar by the index it
  started at. Paired with the FEW UNIQUE or ALL EQUAL shapes the values are identical, so
  the colours are the only record of whether tied elements kept their original order —
  which is the definition of stability and something a chart of numbers simply cannot
  show. Displaced elements are outlined in dashed red once the run finishes, and the
  verdict is measured from *this* run rather than repeated from the algorithm's metadata:
  an input with no ties says so instead of claiming a pass it never earned.

- **Self-loops on the graph.** An edge may now have both endpoints on one vertex. Click a
  vertex to arm it and click it again to loop it back to itself, set FROM and TO to the
  same vertex in ADD EDGE, or type into the matrix's diagonal — which is an ordinary
  editable cell now rather than a `·`, and one cell rather than a mirrored pair. `A-A`,
  `A: A` and a `1` on the diagonal all build one from text, and it travels in a shared
  link like any other edge. The loop is drawn away from the middle of the canvas, turning
  aside if it would hang off the edge, and carries an arrowhead and a weight like any
  other edge does. Degree counts one twice on an undirected graph — it leaves the vertex
  and arrives back at it — Kruskal's reports it as the cycle it is, and a topological sort
  now finds the cycle a self-loop makes.

- **Dynamic hashing, as its own view: extendible and linear.** The thing a plain hash
  table cannot do — grow without rehashing everything at once. **Extendible** keeps a
  directory of 2^d pointers, drawn as a column of `0110 → B2` entries beside the buckets,
  each carrying its own local depth; an overflowing bucket splits, and the directory only
  doubles when that bucket was already as deep as the directory itself. **Linear** has no
  directory at all, just a level and a split pointer, and the bucket that splits is the
  one the pointer is on — not the one that overflowed, which chains into an overflow
  block and waits its turn. Each bucket is labelled with the hash it currently answers
  to, since that one comparison is the whole of a directoryless lookup.

  Switching scheme replays the same keys in the same arrival order, which is the
  comparison worth making: in both, where a key ends up depends on how many splits had
  happened when it got there. Insert, search, delete and list keys are joined by
  **Depths & Pointers**, which reads out the numbers that decide what the next insert
  will do.

- **Three more collision strategies, and a hash function to choose.** **Double hashing**
  steps by `h₂(k) = 1 + k mod (m−2)`, a stride each key computes for itself, so two keys
  that collide once don't collide all the way along. **Robin Hood** probes forward but
  swaps the key it is carrying with any sitting key closer to home — each slot shows its
  probe distance, and evening those out lets it run at α 0.75, stop a search early, and
  delete by shifting the run back instead of leaving a tombstone. **Cuckoo hashing** puts
  two tables side by side: a key takes its T1 slot outright and evicts whoever was there
  into T2, so no lookup ever costs more than two probes, and an eviction chain that won't
  end is a cycle that only a bigger table can break.

  **HASH FUNCTION** is now a separate axis above collision handling, because it decides
  where keys land before any collision rule gets a say: division, multiplication,
  mid-square and digit folding. Switching one redeals the same keys, the way switching
  strategy already did.

- **Threaded binary trees, as a fourth tree type.** THREADED builds and searches like a
  BST; what it does differently is spend the null pointers. A tree of *n* nodes carries
  *n* + 1 null child pointers, and each becomes a thread to an inorder neighbour: a null
  right pointer to the successor, and under double threading a null left pointer to the
  predecessor. THREADING switches between double and single (right-only) threading and
  re-threads the tree already on screen rather than building a new one.

  Threads are drawn as dashed curves under the solid child links — purple to a successor,
  yellow to a predecessor — and the one a step is following lights up. Three operations
  appear with the type: **Threaded Inorder**, which walks the whole tree with no stack and
  no recursion (O(1) space, against O(h) for the ordinary traversal); **Reverse Inorder**,
  which is the same walk backwards and so needs the left threads, offered only under
  double threading; and **Inorder Successor**, where a node with no right child answers in
  one hop instead of climbing back up through parents it doesn't store. Insert and delete
  say which threads they relinked.

  The threads are derived from the tree's shape rather than stored on the node, so they
  cannot fall out of sync with it and every existing tree operation works unchanged.
  A threaded tree travels in a shared link like any other, with `tm` carrying which of
  its pointers are threaded.

- **The adjacency matrix is editable.** Click a cell off the diagonal, type, and the
  graph follows. The matrix is the graph, so a cell says all three things a cell can
  mean: a different number reweights the edge, a number where there was a `0` creates
  one, and `0` removes it. Enter or clicking away commits, Escape cancels, and an empty
  or unparseable cell is treated as a slip rather than an instruction.

  One `setEdgeWeight` operation covers all three cases instead of the call site choosing
  between addEdge and removeEdge — deciding which operation a typed number amounts to is
  exactly the question the matrix has already answered. Undirected edges occupy both
  cells and move together; directed ones stay independent.

  An unweighted graph's matrix now reads `1` and `0` rather than showing the weights its
  edges happen to be carrying unused underneath, which is what an unweighted adjacency
  matrix means and what makes typing into one coherent.

- **Undo and redo, on every structure.** `Ctrl+Z` takes back the last edit and `Ctrl+Y`
  (or `Ctrl+Shift+Z`) puts it back, on all twelve views. Each keeps its own history of up
  to 50 edits, so the graph's undo can't reach into what you did to the heap and
  switching views leaves both stacks where they were.

  A new `useHistory` hook holds the machinery; a view supplies only a `snapshot()` of
  what is worth restoring and a `restore()` that puts it back. Snapshots store references
  rather than clones, which is free and safe because every operation in the codebase
  already builds a new structure instead of mutating the one it was handed — the same
  property that makes the frames precomputed and the stepping reversible.

  Playback is deliberately outside the document. Undo takes back a change to the
  *structure*, not your position in a run, so the timeline, the selected operation and
  half-typed sidebar text are left alone. Read-only operations are still recorded rather
  than filtered out: an undo that lands on an identical structure costs nothing, where a
  second list of which operations mutate would be one more thing to keep in step.

- **Copy and paste on the graph.** What `Ctrl+C` takes depends on where the cursor is —
  over a vertex it copies that vertex and its neighbours, over empty canvas the whole
  graph. Pasting our own vertex copy back duplicates it, wired to the same neighbours;
  anything else is read as graph text and replaces the graph. Comparing the clipboard
  text against what we put there is what tells those apart, so copying something else in
  another app in between wins, as it should.

  What lands on the system clipboard is adjacency-list text the sidebar's LIST box would
  accept, so a graph can be pasted into notes or another tab and back. Adjacency rather
  than the terser edge list because it is the only one of the two that can say a vertex
  exists and is connected to nothing.

  Both ride the browser's own `copy`/`paste` events rather than intercepting the
  keystrokes, which means no clipboard permission prompt, and a copy made with text
  selected or the cursor in a field stays an ordinary text copy.

- **An editable graph canvas.** The ring the vertices start on keeps a fresh graph
  readable but says nothing about the graph, and building one meant going through the
  sidebar. The canvas now does all of it: **drag** a vertex to move it, **double-click**
  empty space to add one where you pressed, and **click two vertices** to connect them.
  On a phone the same three gestures are a hold-then-drag, a hold on empty canvas, and a
  tap on each end. **Triple-clicking** a vertex deletes it, edges and all, which is a
  cursor gesture only — the phone keeps REMOVE VERTEX in the sidebar.

  The triple counts clicks by the browser's own `detail`, the same burst that defines a
  double click, rather than adding a second timing rule of its own. Each click still
  answers as it arrives, so triple-clicking a vertex while another is armed makes the
  edge and then deletes the vertex under it; the edge goes too, so the result is right,
  it just takes two undos rather than one.

  Connecting moved from a drag between two vertices to a click on each, because a drag
  is now what moves one. That is also the only gesture touch can offer — the browser
  claims a finger drag off an SVG shape as a page scroll — so both inputs finally behave
  the same way. A vertex only comes loose once a cursor has actually travelled a few
  pixels, leaving a click that doesn't move still a click; a finger has to hold, since
  its rival reading is that page scroll. Clicking empty canvas calls off a half-made
  edge.

  Edges follow their endpoints live, so a crossing can be pulled apart or a path lined up
  left to right before running a traversal over it. Positions are stored as a fraction of
  the canvas rather than in pixels, so a layout arranged on a desktop survives the switch
  to the phone's taller viewBox; they outlast operations and playback, and reset with
  **RESET LAYOUT**, SHUFFLE or a newly loaded graph. An arrangement also travels in the
  shared link, as an `xy` field listing `label:x:y` for the vertices actually dragged off
  the ring — so an untouched graph's link is byte-for-byte what it was before, and a
  rearranged one hands someone else the layout you built. A moving vertex wears a dashed
  ring, and a phone buzzes once as it comes loose.

  The touch drag refuses the page scroll for as long as it lasts, which is what makes it
  possible at all — the browser otherwise cancels the pointer mid-gesture. The canvas is
  now drawn even when the graph is empty, with the placeholder floated over it rather
  than replacing it, because pressing the canvas is how the first vertex gets made.
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

### Removed

- **The boot screen.** The app opens straight on the category picker. A 2.6-second
  loading animation for a bundle that is already loaded was a delay pretending to be
  work, and it sat between you and the app every single visit. Its pointer-following
  glow went with it — that effect existed nowhere else.
- **RESET LAYOUT on the graph canvas.** Undo already walks back a vertex you dragged
  somewhere you didn't mean, and SHUFFLE or a newly loaded graph still returns every
  vertex to the ring, so the button was a third way to do something two other controls
  already covered — taking room in the hint line to say so.

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

- **Cursor-to-canvas mapping on the graph.** Client coordinates were converted to the SVG
  viewBox by scaling against the element's bounding box, which is only correct when the
  two share an aspect ratio — the desktop graph is fluid-width against a fixed 640×300
  viewBox, so `preserveAspectRatio` letterboxes it and the error grew with distance from
  the centre. It now goes through the SVG's own `getScreenCTM()`. Drag-to-connect was
  forgiving enough to hide this; dragging a vertex is not.
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
- **RUN buttons did nothing in the phone sheet**, on every structure view. Tapping one
  closed the sheet, and closing unmounted the form before the browser got to the click's
  default action — the form submission algorithm drops a form that is no longer connected
  without even firing `submit`, so the operation never started while the sheet slid away as
  if it had. Buttons that own a form now close the sheet from its bubbled `submit` instead,
  once the run is under way. The test is `.form` rather than the type alone, since a bare
  `<button>` reports `type="submit"` even when it has no form to submit — RANDOM and APPLY
  still close on click.

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
