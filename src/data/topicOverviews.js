// Detailed, page-level explanations for each data structure "thing" — shown once per
// page (as opposed to the short per-operation blurbs in ListInfoPanel, which describe
// what an individual button/operation does).

export const TOPIC_OVERVIEWS = {
  treecompare: {
    overview:
      "A binary search tree has no shape of its own. Its shape is decided entirely by the order its keys arrive in, and the worst order is the most natural one: insert 1, 2, 3, … n into a plain BST and every key is larger than everything already there, so nothing ever branches left and you get a linked list with extra pointers — height n−1, lookups O(n). AVL trees and 2-3 trees exist to make that stop being possible. This view builds all three from the same keys in the same order, one insert per tick, so the difference is visible rather than asserted.",
    howItWorks: [
      "One key sequence — a permutation of 1…n chosen by the insertion order — is handed unchanged to all three structures, so any difference in the result is the structure and not the data.",
      "A BST inserts by plain descent and never restructures, so its height is a direct record of how ordered the input was.",
      "An AVL tree checks the balance factor of every node on the path back up and rotates whenever it leaves [−1, 1]. Each rotation is O(1) and at most a constant number happen per insert, which is what buys a height guaranteed below 1.44 log₂(n+2).",
      "A 2-3 tree never rotates. It absorbs a key into an existing node when there is room, and splits a node that would hold three keys, promoting the middle key to the parent. Splits propagate upward, and the tree only ever gets taller by splitting at the root — which is why every leaf stays at the same depth.",
      "The scoreboard shows height alongside the comparisons spent getting there. They are not the same measure: a 2-3 node holding two keys costs two comparisons to pass through, so it buys its shorter height with wider nodes.",
      "The height sweep runs the same insert code at sizes far past what three canvases can draw, keeping only the final numbers, and plots height against n with log₂ n, log₃ n and n over the top.",
    ],
    useCases: [
      "Seeing why a self-balancing tree is worth its complexity: sorted input turns a BST into a chain and leaves the other two at height 3.",
      "Understanding that 'not sorted' is not the same as 'random' — the alternating-ends order looks scrambled and degenerates a BST just as badly.",
      "Watching the median-first order build a perfectly balanced BST with no rebalancing at all, which is the case where AVL's rotations are pure overhead.",
      "Comparing the two balancing strategies directly: rotations versus splits, and what each costs per insert.",
      "Checking a textbook height bound against a measured height instead of taking it on faith.",
    ],
    advantages: [
      "All three structures are built with the same functions the tree views use, so a shape measured here is the shape those views would draw.",
      "The animated lanes and the height sweep run the same insert code — one with the intermediate trees kept, one without — so the plot cannot drift away from the pictures.",
      "The insertion order is the only variable, and it is on screen with the cursor on it.",
    ],
    disadvantages: [
      "Height is not the whole cost of a lookup. A 2-3 tree is shorter than an AVL tree but examines more keys per node, and neither figure accounts for cache behaviour or pointer chasing.",
      "The canvases cap at 24 keys because that is what three trees side by side can show legibly; the asymptotic behaviour only appears in the sweep.",
      "Only insertions are compared. Deletion is where 2-3 trees get genuinely intricate — borrowing and merging — and none of that is measured here.",
    ],
  },
  race: {
    overview:
      "Comparing sorting algorithms honestly is harder than it looks. Two runs are only comparable if they sorted the same data, and a side-by-side animation is only fair if a step in one lane costs what a step in the other lane costs — which, for algorithms whose frames mean completely different things, it does not. This view fixes both: every lane sorts one shared array built from a named shape and a seed, every algorithm counts its own comparisons, reads, writes, auxiliary memory and recursion depth as it works, and the transport can advance the lanes by equal amounts of *work* rather than equal numbers of frames.",
    howItWorks: [
      "One input array is built from an input shape (random, nearly sorted, reversed, few unique, all equal, sawtooth, organ pipe) and a seed, then handed unchanged to every lane — so any difference you see is the algorithm, not the data.",
      "Each algorithm reports its own counters as it runs, rather than having them inferred from what a frame happened to highlight. A comparison is a key comparison; a write is an array write; auxiliary memory is a high-water mark in elements; depth is the deepest the recursion actually went.",
      "BY WORK sync spends the same number of operations (comparisons + writes) in every lane per tick, so a lane that costs less genuinely finishes earlier on screen. BY FRAME sync advances every lane one frame per tick, which is simpler but compares frames rather than work.",
      "A lane that finishes early freezes on its final frame instead of vanishing, so the finished array sits next to the ones still churning.",
      "The empirical complexity sweep runs each algorithm at ten sizes from 10 up to 5000 with frame recording switched off, and plots measured operations against n with n, n log n and n² fitted over the top. The slope of the measured curve on log-log axes is the growth exponent — a number, not a claim.",
      "Colour-by-origin tints each bar by the index it started at. Two equal values look identical as bars, so this is the only way to see whether a sort kept tied elements in their original order — the definition of stability.",
    ],
    useCases: [
      "Seeing insertion sort beat quick sort on nearly-sorted input, which the asymptotic notation alone will never tell you.",
      "Watching Lomuto quick sort collapse to O(n²) on already-sorted data, then fixing it by switching the pivot rule to median-of-three.",
      "Comparing shell sort's gap sequences — same algorithm, same input, visibly different curves.",
      "Demonstrating stability concretely: merge, insertion, bubble and radix sort keep tied elements in order; selection, shell, heap and quick sort do not.",
      "Checking a textbook complexity claim against measured counts instead of taking it on faith.",
    ],
    advantages: [
      "The numbers are produced by the algorithms themselves, so they are exact rather than inferred from the animation.",
      "The same seeded input rebuilds identically in anyone's browser, so a shared link is the same race.",
      "The complexity sweep and the animation run the same algorithm body — one with frame recording on, one with it off — so the plot cannot drift away from what the bars show.",
    ],
    disadvantages: [
      "Operation counts are not wall-clock time: cache behaviour, branch prediction and constant factors are invisible here, which is exactly why heap sort loses to quick sort in practice despite winning on paper.",
      "The array on the race track is capped at 40 elements because that is what the bars can show; the interesting asymptotic behaviour only appears in the sweep, at sizes far past what can be animated.",
      "Counting conventions are choices. A comparison here includes the two array reads it implies, and OPS means comparisons plus writes — defensible, but not the only defensible answer.",
    ],
  },
  linkedlist: {
    overview:
      "A linked list is a linear data structure made of nodes scattered anywhere in memory, each holding a value and a pointer (or two) to its neighbor(s). Unlike an array, elements aren't stored contiguously, so there's no single block of memory to resize — growing or shrinking the list is just a matter of relinking pointers.",
    howItWorks: [
      "Each node stores a value plus a reference to the next node (and, in a doubly linked list, a reference to the previous node too).",
      "The list keeps a reference to the head (first node) and often the tail (last node) so both ends are reachable quickly.",
      "A circular list links the tail's 'next' back to the head, forming a loop instead of ending in a null pointer.",
      "To reach a node, you walk the chain of pointers one hop at a time — there's no way to jump straight to index k the way an array can.",
    ],
    useCases: [
      "Implementing stacks, queues, and other ADTs where insert/delete at the ends must be O(1).",
      "Situations with frequent insertions and deletions in the middle of a sequence, since no shifting is required.",
      "Building blocks for more advanced structures like adjacency lists (graphs) and LRU caches.",
    ],
    advantages: [
      "Insertion and deletion at a known position are O(1) — no shifting elements like an array requires.",
      "Size grows and shrinks dynamically without needing to reallocate a contiguous block of memory.",
      "A doubly linked list allows O(1) traversal in either direction; a circular list allows continuous looping.",
    ],
    disadvantages: [
      "No random access — reaching the k-th element takes O(n) time since you must walk from the head.",
      "Extra memory overhead per node for storing pointers.",
      "Poor cache locality compared to arrays, since nodes can be scattered anywhere in memory.",
    ],
  },

  polynomial: {
    overview:
      "A polynomial can be represented as a linked list where each node stores one term — a coefficient and an exponent — kept in decreasing order of exponent. This representation naturally handles polynomials of any degree without wasting memory on zero coefficients, since terms that don't exist simply have no node.",
    howItWorks: [
      "Each node holds a (coefficient, exponent) pair, e.g. 3 and 2 for the term 3x².",
      "Nodes are kept sorted by exponent so operations like addition can walk both lists in lockstep.",
      "Addition merges two polynomials term-by-term, combining nodes with matching exponents and copying over the rest.",
      "Multiplication distributes every term of one polynomial across every term of the other, then combines any resulting like terms.",
      "Evaluating the polynomial at a value of x walks the list once, accumulating coefficient × x^exponent for each node.",
    ],
    useCases: [
      "Symbolic math libraries and computer algebra systems that manipulate polynomials of arbitrary size.",
      "Sparse polynomials (e.g. x¹⁰⁰ + 1) where an array indexed by exponent would waste enormous amounts of memory.",
      "Signal processing and coding theory, where polynomial arithmetic underlies operations like CRC checks and error-correcting codes.",
    ],
    advantages: [
      "Memory-efficient for sparse polynomials — only non-zero terms take up space.",
      "Naturally supports polynomials of unbounded degree.",
      "Addition and multiplication map cleanly onto linked-list merge/traversal patterns.",
    ],
    disadvantages: [
      "No random access to a specific term by exponent — you must traverse to find it.",
      "Multiplication is O(n·m) for polynomials with n and m terms, since every pair of terms must be considered.",
      "Extra pointer overhead per term compared to a dense array representation.",
    ],
  },

  stack: {
    overview:
      "A stack is a Last-In-First-Out (LIFO) data structure: the most recently added element is always the first one removed, just like a stack of plates — you add to and take from the top only.",
    howItWorks: [
      "push adds a new element to the top of the stack.",
      "pop removes and returns the element currently on top.",
      "peek looks at the top element without removing it.",
      "Because both insertion and removal happen at the same end, no shifting of other elements is ever needed.",
    ],
    useCases: [
      "Function call management — the 'call stack' that tracks return addresses and local variables.",
      "Undo/redo functionality in editors, where each action is pushed and undone in reverse order.",
      "Expression evaluation and parsing, such as matching brackets or converting infix to postfix notation.",
      "Depth-first search (DFS) traversal of trees and graphs, either explicitly or via recursion's implicit call stack.",
    ],
    advantages: [
      "All core operations (push, pop, peek) run in O(1) time.",
      "Very simple to implement with either an array or a linked list.",
      "Enforces a strict, predictable order that's ideal for problems with a natural 'nesting' structure.",
    ],
    disadvantages: [
      "No access to elements in the middle without popping everything above them first.",
      "A fixed-size array-backed stack can overflow if it exceeds its capacity.",
      "Not suitable when you need first-in-first-out order — that's what a queue is for.",
    ],
  },

  queue: {
    overview:
      "A queue is a First-In-First-Out (FIFO) data structure: elements are added at the back and removed from the front, just like people waiting in a line — whoever arrived first gets served first.",
    howItWorks: [
      "enqueue adds a new element to the back (rear) of the queue.",
      "dequeue removes and returns the element at the front.",
      "peek looks at the front element without removing it.",
      "The front and rear are tracked independently so both operations can run without touching the rest of the elements.",
    ],
    useCases: [
      "Task scheduling and job processing, where requests should be handled in the order they arrive.",
      "Breadth-first search (BFS) traversal of trees and graphs, using a queue to track the next nodes to visit.",
      "Buffering data between producers and consumers that run at different speeds, such as I/O or streaming pipelines.",
      "Print queues, message queues, and request-handling systems.",
    ],
    advantages: [
      "Core operations (enqueue, dequeue, peek) run in O(1) time with a proper implementation.",
      "Preserves arrival order, which matches many real-world processes naturally.",
      "Simple to implement with an array (circular buffer) or a linked list.",
    ],
    disadvantages: [
      "No access to elements in the middle without dequeuing everything ahead of them.",
      "A naive array-backed queue that only tracks a front index can waste space unless implemented as a circular buffer.",
      "A fixed-capacity queue can become full and reject new elements.",
    ],
  },

  unionfind: {
    overview:
      "Union-find answers one question — are these two things in the same group? — and supports one change: merge two groups. That is all it does. It keeps no edges, no paths and no membership lists; each element only stores a pointer to another element, and a group is identified by the one element that points at itself. From those two arrays it answers connectivity queries in effectively constant time, which is why it sits underneath Kruskal's algorithm, connected-component labelling, and every 'are these accounts the same person' merge you have ever written.",
    howItWorks: [
      "Each element stores a parent pointer. An element that points at itself is a root, and the root's identity is the name of the set.",
      "find(x) walks up the parent chain to the root. Two elements are in the same set exactly when their walks end at the same place.",
      "union(a, b) finds both roots and points one at the other — a single pointer write merges two entire sets.",
      "Union by size decides which root moves: the smaller tree is hung under the larger, so the elements that gain depth are always the fewer ones.",
      "Path compression is applied during find: every element the walk passed is re-pointed straight at the root, so the same walk never happens twice and the trees flatten as they are used.",
      "With both optimizations, m operations on n elements cost O(m · α(n)), where α is the inverse Ackermann function — below 5 for any n that could physically be stored.",
    ],
    useCases: [
      "Kruskal's minimum spanning tree, where the cycle check is exactly 'are these two vertices already connected?'.",
      "Connected components and image segmentation — labelling which pixels or nodes belong to the same blob.",
      "Dynamic connectivity in networks: keeping track of what is reachable as links are added.",
      "Merging equivalence classes, from type inference in compilers to de-duplicating records that turn out to be the same entity.",
    ],
    advantages: [
      "Effectively constant time per operation once both optimizations are in place — faster than any tree- or graph-based alternative for pure connectivity.",
      "Tiny memory footprint: two integer arrays, no pointers to allocate and no per-set bookkeeping.",
      "Trivial to implement correctly, and it degrades gracefully — even without path compression, union by size alone keeps trees at O(log n).",
    ],
    disadvantages: [
      "Merges are one-way: there is no undo, no split, and no way to remove an element from a set without rebuilding.",
      "It knows that two elements are connected but not how — no path, no distance, no edges are retained.",
      "The groups themselves are never stored; listing the members of a set means walking every element up to its root.",
    ],
  },

  trie: {
    overview:
      "A trie stores a set of strings by their characters rather than as whole values: every edge carries one character, and every node is the prefix spelled by the path that reaches it. Nothing in the structure holds a complete word — 'car' and 'card' share three nodes and differ by one — and lookup never compares whole strings, only walks a path. That makes a trie's cost depend on the length of the word you are asking about and not at all on how many words are stored, and it makes prefix queries, which every other dictionary structure struggles with, almost free.",
    howItWorks: [
      "Each node holds one child per possible next character, plus a flag marking whether a word ends there.",
      "That end-of-word flag is essential: in a trie holding only 'card', the word 'car' is spelled out perfectly and is still not stored. Without the flag there would be no way to tell the two cases apart.",
      "Insert walks the word, creating nodes only where the path runs out, then sets the flag — so inserting 'card' next to 'car' costs a single node.",
      "Searching walks the same path and checks the flag at the end; running out of edges means nothing stored even begins that way.",
      "Autocomplete walks to the prefix node and enumerates the subtree beneath it, because every completion of a prefix lives under exactly one node.",
      "Deleting clears the flag and then prunes back up the path, stopping at the first node that still has children or is itself a word — those are still spelling out other words.",
      "Visiting each node's children in alphabetical order makes any traversal come out sorted, with no sorting step.",
    ],
    useCases: [
      "Autocomplete and type-ahead suggestions, the canonical use — prefix lookup is what the structure is for.",
      "Spell checkers and word games, where near-misses and valid-prefix checks matter as much as exact hits.",
      "IP routing tables and longest-prefix matching, using tries over bits rather than letters.",
      "Dictionary compression for large word lists that share heavy prefixes.",
    ],
    advantages: [
      "Lookup, insert and delete are O(L) in the length of the word, regardless of how many words are stored.",
      "Prefix queries and autocomplete come for free; a hash table scatters 'car' and 'card' to unrelated buckets and cannot answer them at all.",
      "Traversal yields words in alphabetical order without sorting, and shared prefixes are stored only once.",
      "No hash function, so no collisions to resolve and no worst case caused by unlucky keys.",
    ],
    disadvantages: [
      "Memory-hungry: each node carries a slot per possible character, so a sparse trie over a large alphabet wastes a great deal of space — radix trees and ternary search tries exist to fix exactly this.",
      "Poor cache locality — a lookup chases one pointer per character, where a hash table computes one index and makes a single probe.",
      "Only useful for string-like keys that decompose into characters; there is nothing to walk for an arbitrary value.",
    ],
  },

  heap: {
    overview:
      "A binary heap is a complete binary tree with one rule: every parent outranks its children — larger in a max-heap, smaller in a min-heap. That is a far weaker promise than a binary search tree makes, and the weakness is the point. Nothing orders the two subtrees under a node against each other, so a heap can never answer 'what comes after 30?', but it can keep the single most extreme value at the root through any sequence of insertions and removals for O(log n) a piece. Because the tree is always complete it needs no pointers at all: it lives in a flat array where index i's children sit at 2i+1 and 2i+2.",
    howItWorks: [
      "The tree is complete — every level full except the last, which fills left to right — so the height is always ⌊log₂ n⌋ and no rebalancing machinery is needed.",
      "That completeness is what lets the tree collapse into an array: the root is index 0, index i's children are 2i+1 and 2i+2, and its parent is ⌊(i−1)/2⌋. No child pointers are stored anywhere.",
      "Insert puts the value at the end of the array — the only slot that keeps the tree complete — then sifts it up, swapping with its parent while it outranks it.",
      "Extract returns the root and fills the hole with the last element (again, to stay complete), then sifts that value down, swapping with the better of its two children until both fall below it.",
      "Building a heap from an arbitrary array is done bottom-up: sift down every internal node from the last one back to the root. This costs O(n), not O(n log n), because half the nodes are leaves that never move and only the root can travel the full height.",
      "Heap sort is nothing more than build-then-extract-repeatedly, which is why it is O(n log n) with no extra memory.",
    ],
    useCases: [
      "Priority queues — schedulers, event simulations, and bandwidth shapers that always need the next-most-urgent item.",
      "Dijkstra's and Prim's algorithms, which repeatedly pull the cheapest unvisited vertex.",
      "Heap sort, where the array being sorted doubles as the heap.",
      "Streaming top-k problems: keep a k-element min-heap and every new value is one O(log k) comparison away from being accepted or discarded.",
    ],
    advantages: [
      "Insert and extract are O(log n) with a guaranteed height — unlike a BST, a heap cannot degenerate into a list.",
      "Reading the maximum (or minimum) is O(1), and building a heap from an existing array is O(n).",
      "No pointers and no wasted nodes: the array representation is as compact as a data structure gets, with excellent cache behaviour.",
    ],
    disadvantages: [
      "No ordering beyond parent-vs-child, so searching for an arbitrary value is O(n) and range queries are impossible.",
      "Only one end is cheap: a max-heap gives you the maximum in O(1) but says nothing useful about the minimum.",
      "Not stable, and merging two heaps is O(n) — specialised variants (binomial, Fibonacci) exist precisely because the binary heap is bad at it.",
    ],
  },

  hashtable: {
    overview:
      "A hash table stores keys in an array of buckets, using a hash function to turn each key directly into an index — h(k) = k mod m here. That skips searching entirely: instead of comparing your way to a key, you compute where it must be. The catch is that a function mapping a huge key space onto a small array must send different keys to the same bucket sometimes, so every hash table is really two designs — a hash function, and a plan for what to do when two keys collide.",
    howItWorks: [
      "The hash function maps a key to a bucket index. A table size that is prime keeps (k mod m) from clustering when the keys share a factor with m.",
      "Separate chaining gives every bucket a linked list, so colliding keys simply queue up in the same bucket and the table can hold more keys than it has buckets.",
      "Open addressing stores at most one key per bucket and sends collisions elsewhere: linear probing tries the next slot, then the next; quadratic probing jumps 1, 4, 9, 16... slots ahead to break up the clusters linear probing forms.",
      "A lookup repeats the insert's path exactly — same hash, same chain or probe sequence — and stops at the first free slot, because an insert would have stopped there too.",
      "Deleting under open addressing cannot blank a slot: that would strand every key whose probe sequence runs through it. The slot gets a tombstone instead, which searches skip and later inserts can reuse.",
      "The load factor α = n/m tracks how full the table is. Crossing the limit (about 0.75 for chaining, 0.5 for probing) triggers a resize: allocate a larger prime capacity and rehash every key, since h(k) is taken mod the new size.",
    ],
    useCases: [
      "Dictionaries, maps, and sets in essentially every standard library — Python's dict, Java's HashMap, JavaScript's Map.",
      "Database indexes and caches, where a key must resolve to a record in constant time.",
      "De-duplication and membership tests, such as tracking which URLs a crawler has already visited.",
      "Compiler and interpreter symbol tables, mapping identifiers to their declarations.",
    ],
    advantages: [
      "Insert, search, and delete all run in O(1) on average — no comparisons chain, the hash goes straight to the bucket.",
      "Performance is tunable: the load factor limit trades memory for speed, and resizing keeps that trade in force as the table grows.",
      "Separate chaining degrades gracefully — it keeps working past a load factor of 1, where open addressing would have no room left.",
    ],
    disadvantages: [
      "No ordering. Keys come out in hash order, so range queries and sorted iteration need a tree instead.",
      "Worst case is O(n) — a bad hash function, or adversarial keys, can pile every key into one bucket.",
      "Resizing is an O(n) pause: one unlucky insert rehashes the entire table, which matters for latency even though inserts stay O(1) amortized.",
      "Open addressing wastes slots on tombstones and slows down as it fills, which is why it needs a much lower load factor than chaining.",
    ],
  },

  dynamichash: {
    overview:
      "An ordinary hash table grows by rehashing: allocate a bigger array, recompute every key's index, copy them all across. That is O(n) in one go, and while it runs the table is unusable — fine for an in-memory map, unacceptable for a database index holding millions of records on disk. Dynamic hashing grows a table one bucket at a time instead. Extendible hashing keeps a directory of pointers and splits a single bucket at a time; linear hashing has no directory at all and splits buckets in a fixed rotation, regardless of which one actually overflowed.",
    howItWorks: [
      "Both schemes address a key by its low bits rather than by a remainder against an arbitrary size: doubling the number of buckets then means looking at exactly one more bit, and a key either stays where it is or moves to one specific new bucket.",
      "Extendible hashing keeps a directory of 2^d pointers, where d is the global depth — the number of bits it indexes on. Each bucket records its own local depth: how many bits that bucket has actually been split on. Several directory entries can point at the same bucket, and a bucket with local depth d' is pointed at by 2^(d − d') of them.",
      "When an extendible bucket overflows it splits in two and its keys are redealt by the next bit. If its local depth was below the global depth, the directory already has spare entries to re-aim and nothing else changes. Only when the two are equal must the directory itself double — which costs a copy of the directory, not of the data.",
      "Linear hashing drops the directory and keeps two numbers: the level L, giving the base hash h_L(k) = k mod N·2^L, and a split pointer. A bucket the pointer has already passed has been rehashed to the next level, so it answers to h_(L+1) instead — one comparison decides which hash to apply.",
      "The defining trick is that the bucket that splits is the one the pointer is on, not the one that overflowed. An overflowing bucket chains its extra keys into an overflow block and waits its turn. Splits are triggered by the overall load factor, so growth is spread evenly instead of chasing whichever bucket is currently unlucky.",
      "When the split pointer has been all the way round, every bucket has been rehashed, the level goes up, and the pointer restarts at bucket 0 — the table has doubled without any single operation costing more than one bucket split.",
    ],
    useCases: [
      "Database and file-system indexes, where the table lives on disk and a full rehash would mean rewriting the entire index file.",
      "Any table that must stay responsive while it grows: no single insert pays more than the cost of splitting one bucket.",
      "Extendible hashing where lookups must be exactly one bucket read and the directory is small enough to keep in memory; linear hashing where even that directory is unwelcome, or where it would be a contention point between concurrent writers.",
    ],
    advantages: [
      "Growth is incremental. There is no O(n) rehashing pause, so worst-case insert latency stays flat as the table fills.",
      "Extendible hashing guarantees a lookup in one bucket access after the directory read, no matter how skewed the keys are.",
      "Linear hashing needs no directory at all — just a level and a pointer — so it costs nothing in space and has no structure that all writers have to share.",
    ],
    disadvantages: [
      "Extendible hashing's directory doubles when a bucket at the global depth splits, and a badly skewed set of keys can make it much larger than the data warrants.",
      "Linear hashing tolerates overflow chains by design, so a lookup can degrade to walking one — the price of splitting in rotation rather than where the pressure actually is.",
      "Both are more code than a plain table with a resize, and neither is worth it until a rehash of everything is genuinely too expensive to accept.",
    ],
  },

  graph: {
    overview:
      "A graph is a collection of vertices (nodes) connected by edges, capable of modeling relationships that are far more flexible than the strictly linear or hierarchical connections in lists and trees. Edges can be directed or undirected, and weighted or unweighted, depending on what the relationship represents.",
    howItWorks: [
      "Vertices represent entities (cities, people, web pages, etc.) and edges represent relationships or connections between them.",
      "A directed graph's edges point one way (A → B doesn't imply B → A); an undirected graph's edges go both ways.",
      "A weighted graph attaches a cost or distance to each edge, used by algorithms like Dijkstra's shortest path.",
      "Graphs are commonly stored as an adjacency list (each vertex keeps a list of its neighbors) or an adjacency matrix (an n×n grid marking which vertices are connected).",
      "Traversal algorithms like BFS and DFS, and shortest-path algorithms like Dijkstra's, explore the graph by visiting vertices along its edges.",
    ],
    useCases: [
      "Modeling networks: social connections, road maps, computer networks, and the web's hyperlink structure.",
      "Finding shortest paths (GPS navigation, network routing) with algorithms like Dijkstra's or Floyd-Warshall.",
      "Scheduling tasks with dependencies using topological sort on a directed acyclic graph (DAG).",
      "Building minimum spanning trees (Prim's, Kruskal's) to connect all nodes at the lowest total cost, e.g. designing efficient wiring or network layouts.",
    ],
    advantages: [
      "Extremely flexible — can represent virtually any kind of relationship between entities, not just linear or hierarchical ones.",
      "An adjacency list uses only O(V + E) space, making it efficient for sparse graphs.",
      "A rich family of well-studied algorithms exists for traversal, shortest paths, connectivity, and optimization.",
    ],
    disadvantages: [
      "An adjacency matrix uses O(V²) space regardless of how many edges actually exist, which is wasteful for sparse graphs.",
      "Many graph algorithms (e.g. all-pairs shortest paths) are computationally expensive on large graphs.",
      "Detecting structural properties like cycles or connectivity requires careful traversal logic to avoid revisiting nodes forever.",
    ],
  },

  tree: {
    overview:
      "A tree is a hierarchical data structure made of nodes connected by parent-child relationships, starting from a single root and branching outward with no cycles. A binary search tree (BST) adds an ordering rule: every node's left subtree holds smaller values and its right subtree holds larger values, which makes searching, inserting, and deleting efficient. An AVL tree keeps that ordering and adds rotations that hold the height down; a threaded tree keeps it and instead puts the tree's many null pointers to work as shortcuts to each node's in-order neighbours.",
    howItWorks: [
      "Each node holds a value and up to two children — a left child and a right child.",
      "To insert a value, compare it to the current node: go left if smaller, right if larger, and repeat until an empty spot is found.",
      "Searching follows the same left/right comparisons, discarding half the remaining tree at each step in a balanced tree.",
      "In-order traversal (left, node, right) visits every value in sorted order; pre-order and post-order visit the root before or after its subtrees, which is useful for copying or deleting a tree.",
      "Deleting a node with two children typically replaces it with its in-order successor (the smallest value in its right subtree) to preserve the BST ordering property.",
      "A threaded binary tree spends the null pointers instead of wasting them: in a tree of n nodes, n + 1 of the 2n child pointers are null, and each one can be reused as a 'thread' pointing to an in-order neighbour. A null right pointer becomes a link to the in-order successor; in a fully (double) threaded tree, a null left pointer becomes a link to the in-order predecessor.",
      "Because a thread and a real child live in the same field, each node carries a flag per pointer (lthread / rthread) saying which it is. The first and last nodes in in-order have no neighbour to point at, so their threads go to a dummy header node instead.",
      "Threads make in-order traversal iterative and stack-free: visit a node, then follow its right thread (one hop) or, if it has a real right child, take the leftmost node of that subtree. The links back up the tree that recursion would have kept on the stack are stored in the tree itself.",
    ],
    useCases: [
      "Maintaining a dynamically sorted collection that supports fast search, insert, and delete.",
      "Implementing symbol tables, indexes, and priority-based lookup structures.",
      "Representing hierarchical data such as file systems, organization charts, or parsed expressions (expression trees).",
      "Range queries — finding all values between two bounds by pruning subtrees that fall entirely outside the range.",
      "Threaded trees where traversal has to be cheap and re-entrant: iterating without a stack means no recursion depth to blow, and no allocation, which suits embedded code and lets a caller step through one value at a time.",
    ],
    advantages: [
      "Search, insert, and delete run in O(log n) time on a balanced tree.",
      "In-order traversal yields all elements in sorted order without a separate sorting step.",
      "Naturally represents hierarchical relationships, unlike a flat list.",
      "Threading costs nothing in space — the pointers were already there and null — and buys an O(1)-space traversal plus O(1) successor lookup from a node with no right child.",
    ],
    disadvantages: [
      "An unbalanced BST can degrade to a linked list, with O(n) operations in the worst case — inserting already-sorted data is a classic trigger.",
      "Requires more memory per node than an array (pointers to children).",
      "Keeping the tree balanced (as in AVL or red-black trees) adds implementation complexity that a plain BST doesn't need.",
      "Threads have to be maintained: every insert and delete has to relink the neighbours' threads as well as the child pointers, and every pointer dereference has to check the flag first — which is why threading is usually reserved for trees that are traversed far more often than they are modified.",
    ],
  },

  twothree: {
    overview:
      "A 2-3 tree is a self-balancing search tree where every node is either a 2-node (one value, two children) or a 3-node (two values, three children), and every leaf sits at exactly the same depth. Instead of rebalancing after every operation like a red-black tree, a 2-3 tree keeps itself balanced by growing upward — splitting nodes when they overflow and merging them when they underflow.",
    howItWorks: [
      "A 2-node holds one value with a left child (smaller values) and a right child (larger values), just like a BST node.",
      "A 3-node holds two values with three children, splitting the range into 'less than the first value', 'between the two values', and 'greater than the second value'.",
      "Inserting a value into a full 3-node causes it to split into two 2-nodes, pushing the middle value up into the parent — if the parent overflows too, the split cascades upward, and the tree only grows taller at the root.",
      "Deleting a value may leave a node under-full, which triggers borrowing a value from a sibling or merging with one, again potentially cascading up toward the root.",
      "Because splits and merges always happen at the same depth for every leaf, the tree remains perfectly height-balanced after every operation.",
    ],
    useCases: [
      "The conceptual foundation for B-trees, which generalize the same split/merge balancing idea to database and filesystem indexes.",
      "Any application needing guaranteed O(log n) search, insert, and delete without the risk of the skewed, unbalanced trees a plain BST can produce.",
      "Teaching the mechanics behind self-balancing trees before moving on to more complex variants like red-black trees or B-trees.",
    ],
    advantages: [
      "Guaranteed O(log n) search, insert, and delete — the tree can never degrade into a linked-list shape.",
      "Perfectly balanced by construction: every leaf is at the same depth, unlike a BST which can become lopsided.",
      "Growth happens at the root (splitting upward) rather than requiring separate rebalancing passes.",
    ],
    disadvantages: [
      "More complex to implement than a standard BST due to the extra logic for splitting and merging nodes.",
      "3-nodes require more memory per node (two values, three child pointers) than a simple binary node.",
      "Less commonly used directly in practice — most real systems use the closely related red-black tree or B-tree instead.",
    ],
  },
};
