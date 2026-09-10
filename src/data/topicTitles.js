/**
 * The heading each topic panel shows while collapsed.
 *
 * These live apart from the write-ups in `topicOverviews.js` for one reason:
 * the panel starts collapsed, so the title is needed on every page load while
 * the prose is needed only if someone expands it. Keeping them in separate
 * modules is what lets the prose load on demand instead of riding along in the
 * initial bundle. A topic needs an entry in both files.
 */
export const TOPIC_TITLES = {
  race: "Comparing Sorting Algorithms",
  treecompare: "Balance & Height: BST vs AVL vs 2-3",
  dp: "Dynamic Programming",
  backtracking: "Backtracking",
  strings: "String Algorithms",
  rangequery: "Range Queries: Segment & Fenwick Trees",
  btree: "B-Trees & B+ Trees",
  greedy: "Greedy Algorithms & Number Theory",
  huffman: "Huffman Coding",
  linkedlist: "Linked List",
  polynomial: "Polynomial (Linked List Representation)",
  sparsematrix: "Sparse Matrices",
  mdarray: "Multidimensional Arrays & Address Calculation",
  expression: "Expression Notation: Infix, Postfix & Prefix",
  stack: "Stack",
  queue: "Queue",
  unionfind: "Union-Find (Disjoint Set Union)",
  trie: "Trie (Prefix Tree)",
  heap: "Binary Heap",
  leftist: "Leftist Trees (Meldable Heaps)",
  depq: "Priority Queues: Single- and Double-Ended",
  selectiontree: "Selection Trees (Winner & Loser Trees)",
  hashtable: "Hash Table",
  dynamichash: "Dynamic Hashing (Extendible & Linear)",
  graph: "Graph",
  // The tree view's seven types each get their own write-up, because they are
  // different structures rather than settings on one — the panel is keyed
  // `tree:<type>`. See the note in App.jsx.
  "tree:binary": "Binary Tree",
  "tree:bst": "Binary Search Tree",
  "tree:avl": "AVL Tree",
  "tree:threaded": "Threaded Binary Tree",
  "tree:redblack": "Red-Black Tree",
  "tree:splay": "Splay Tree",
  "tree:treap": "Treap",
  twothree: "2-3 Tree",
};
