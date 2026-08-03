import { insert } from "./insert";
import { del } from "./delete";
import { search } from "./search";
import { inorder } from "./inorder";
import { preorder } from "./preorder";
import { postorder } from "./postorder";
import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { height } from "./height";
import { size } from "./size";
import { clearTree } from "./clear";

// The full Tree ADT: build (insert/delete), query (search/height/size),
// traverse (inorder/preorder/postorder/BFS/DFS), and a bulk reset. The same
// operations serve both a plain binary tree and a BST — only the build and
// query algorithms change to follow (or ignore) the BST ordering rule.
export const TREE_OPERATIONS = [insert, del, search, inorder, preorder, postorder, bfs, dfs, height, size, clearTree];

export const TREE_OP_MAP = Object.fromEntries(TREE_OPERATIONS.map((op) => [op.key, op]));

export const TREE_GROUPS = [
  { key: "build", label: "Build" },
  { key: "query", label: "Query" },
  { key: "traverse", label: "Traversal" },
  { key: "utility", label: "Utility" },
];

// Three ADTs sharing one visual representation — a plain binary tree (shape
// only, level-order insert/delete), a BST (ordered insert/delete/search),
// and an AVL tree (ordered, plus rotations that keep it height-balanced).
export const TREE_TYPES = [
  { key: "binary", label: "Binary Tree", short: "BINARY TREE" },
  { key: "bst", label: "Binary Search Tree", short: "BST" },
  { key: "avl", label: "AVL Tree", short: "AVL" },
];
