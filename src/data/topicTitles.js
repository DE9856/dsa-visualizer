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
  stack: "Stack",
  queue: "Queue",
  unionfind: "Union-Find (Disjoint Set Union)",
  trie: "Trie (Prefix Tree)",
  heap: "Binary Heap",
  hashtable: "Hash Table",
  dynamichash: "Dynamic Hashing (Extendible & Linear)",
  graph: "Graph",
  tree: "Tree (Binary Search Tree)",
  twothree: "2-3 Tree",
};
