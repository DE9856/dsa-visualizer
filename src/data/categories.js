export const CATEGORIES = [
  {
    key: "arrays",
    label: "ARRAYS",
    accent: "var(--primary)",
    blurb: "Compare orderings and searches, one swap at a time.",
    items: [
      { key: "sorting", label: "Sorting", desc: "Bubble, merge, quick & more" },
      { key: "searching", label: "Searching", desc: "Linear, binary, jump, interpolation & exponential" },
      { key: "race", label: "Race & Compare", desc: "Sorts side by side, real counters, empirical Big-O" },
    ],
  },
  {
    key: "linkedlists",
    label: "LINKED LISTS",
    accent: "var(--blue)",
    blurb: "Pointers, nodes, and the arithmetic hiding inside them.",
    items: [
      { key: "linkedlist", label: "Linked List", desc: "Singly, doubly & circular" },
      { key: "polynomial", label: "Polynomial", desc: "Linked-list polynomial ops" },
    ],
  },
  {
    key: "stacksqueues",
    label: "STACKS & QUEUES",
    accent: "var(--red)",
    blurb: "LIFO and FIFO, watched from the inside.",
    items: [
      { key: "stack", label: "Stack", desc: "Push, pop, peek" },
      { key: "queue", label: "Queue", desc: "Enqueue, dequeue, circular" },
    ],
  },
  {
    key: "trees",
    label: "TREES",
    accent: "var(--green)",
    blurb: "Branching structures and how they stay balanced.",
    items: [
      { key: "tree", label: "Tree", desc: "BST, AVL & threaded trees" },
      { key: "twothree", label: "2-3 Tree", desc: "Balanced multi-way tree" },
      { key: "heap", label: "Heap", desc: "Max/min heap, sift up & down" },
      { key: "trie", label: "Trie", desc: "Prefix tree & autocomplete" },
      { key: "treecompare", label: "Balance & Height", desc: "BST vs AVL vs 2-3 on the same keys" },
    ],
  },
  {
    key: "hashing",
    label: "HASHING",
    accent: "var(--yellow)",
    blurb: "Keys turned into addresses, and the collisions that follow.",
    items: [
      { key: "hashtable", label: "Hash Table", desc: "Chaining, probing, cuckoo & resizing" },
      { key: "dynamichash", label: "Dynamic Hashing", desc: "Extendible & linear, split by split" },
    ],
  },
  {
    key: "dp",
    label: "DYNAMIC PROGRAMMING",
    accent: "var(--yellow)",
    blurb: "Tables filled cell by cell, then walked backwards for the answer.",
    items: [
      { key: "dp:lcs", label: "Longest Common Subsequence", desc: "Two strings, one grid" },
      { key: "dp:edit", label: "Edit Distance", desc: "Insert, delete, substitute" },
      { key: "dp:knapsack", label: "0/1 Knapsack", desc: "Take it or leave it" },
      { key: "dp:coins", label: "Coin Change", desc: "Fewest coins, where greedy fails" },
      { key: "dp:lis", label: "Longest Increasing Subseq.", desc: "One row, answer in the middle" },
      { key: "dp:matrixchain", label: "Matrix Chain Order", desc: "Where to put the brackets" },
    ],
  },
  {
    key: "backtracking",
    label: "BACKTRACKING",
    accent: "var(--red)",
    blurb: "Choose, check, and undo — a search tree with most of it cut away.",
    items: [
      { key: "bt:queens", label: "N-Queens", desc: "No two on a line" },
      { key: "bt:sudoku", label: "Sudoku", desc: "Row, column, box" },
      { key: "bt:subset", label: "Subset Sum", desc: "Two bounds kill most branches" },
      { key: "bt:perms", label: "Permutations", desc: "The same search, nothing pruned" },
    ],
  },
  {
    key: "graphs",
    label: "GRAPHS",
    accent: "var(--purple)",
    blurb: "Vertices, edges, and the shortest way between them.",
    items: [
      { key: "graph", label: "Graph", desc: "BFS, DFS, MST & shortest paths" },
      { key: "unionfind", label: "Union-Find", desc: "Disjoint sets & path compression" },
    ],
  },
];