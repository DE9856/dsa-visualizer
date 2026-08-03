// Detailed, page-level explanations for each data structure "thing" — shown once per
// page (as opposed to the short per-operation blurbs in ListInfoPanel, which describe
// what an individual button/operation does).

export const TOPIC_OVERVIEWS = {
  linkedlist: {
    title: "Linked List",
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
    title: "Polynomial (Linked List Representation)",
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
    title: "Stack",
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
    title: "Queue",
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

  graph: {
    title: "Graph",
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
    title: "Tree (Binary Search Tree)",
    overview:
      "A tree is a hierarchical data structure made of nodes connected by parent-child relationships, starting from a single root and branching outward with no cycles. A binary search tree (BST) adds an ordering rule: every node's left subtree holds smaller values and its right subtree holds larger values, which makes searching, inserting, and deleting efficient.",
    howItWorks: [
      "Each node holds a value and up to two children — a left child and a right child.",
      "To insert a value, compare it to the current node: go left if smaller, right if larger, and repeat until an empty spot is found.",
      "Searching follows the same left/right comparisons, discarding half the remaining tree at each step in a balanced tree.",
      "In-order traversal (left, node, right) visits every value in sorted order; pre-order and post-order visit the root before or after its subtrees, which is useful for copying or deleting a tree.",
      "Deleting a node with two children typically replaces it with its in-order successor (the smallest value in its right subtree) to preserve the BST ordering property.",
    ],
    useCases: [
      "Maintaining a dynamically sorted collection that supports fast search, insert, and delete.",
      "Implementing symbol tables, indexes, and priority-based lookup structures.",
      "Representing hierarchical data such as file systems, organization charts, or parsed expressions (expression trees).",
      "Range queries — finding all values between two bounds by pruning subtrees that fall entirely outside the range.",
    ],
    advantages: [
      "Search, insert, and delete run in O(log n) time on a balanced tree.",
      "In-order traversal yields all elements in sorted order without a separate sorting step.",
      "Naturally represents hierarchical relationships, unlike a flat list.",
    ],
    disadvantages: [
      "An unbalanced BST can degrade to a linked list, with O(n) operations in the worst case — inserting already-sorted data is a classic trigger.",
      "Requires more memory per node than an array (pointers to children).",
      "Keeping the tree balanced (as in AVL or red-black trees) adds implementation complexity that a plain BST doesn't need.",
    ],
  },

  twothree: {
    title: "2-3 Tree",
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
