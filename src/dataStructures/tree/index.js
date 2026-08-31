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
import { threadedInorder } from "./threadedInorder";
import { threadedReverseInorder } from "./threadedReverseInorder";
import { threadedSuccessor } from "./threadedSuccessor";

// The full Tree ADT: build (insert/delete), query (search/height/size),
// traverse (inorder/preorder/postorder/BFS/DFS), and a bulk reset. The same
// operations serve a plain binary tree, a BST, an AVL tree and a threaded
// tree — only the build and query algorithms change to follow (or ignore) the
// BST ordering rule. The three thread-walking operations are the exception:
// they need threads to exist, so they declare the types they belong to.
export const TREE_OPERATIONS = [
  insert,
  del,
  search,
  threadedSuccessor,
  inorder,
  threadedInorder,
  threadedReverseInorder,
  preorder,
  postorder,
  bfs,
  dfs,
  height,
  size,
  clearTree,
];

export const TREE_OP_MAP = Object.fromEntries(TREE_OPERATIONS.map((op) => [op.key, op]));

export const TREE_GROUPS = [
  { key: "build", label: "Build" },
  { key: "query", label: "Query" },
  { key: "traverse", label: "Traversal" },
  { key: "utility", label: "Utility" },
];

// Four ADTs sharing one visual representation — a plain binary tree (shape
// only, level-order insert/delete), a BST (ordered insert/delete/search), an
// AVL tree (ordered, plus rotations that keep it height-balanced), and a
// threaded tree (a BST whose null pointers are reused as links to the inorder
// neighbours).
export const TREE_TYPES = [
  { key: "binary", label: "Binary Tree", short: "BINARY TREE" },
  { key: "bst", label: "Binary Search Tree", short: "BST" },
  { key: "avl", label: "AVL Tree", short: "AVL" },
  { key: "threaded", label: "Threaded Binary Tree", short: "THREADED" },
  { key: "redblack", label: "Red-Black Tree", short: "RED-BLACK" },
  { key: "splay", label: "Splay Tree", short: "SPLAY" },
  { key: "treap", label: "Treap", short: "TREAP" },
];

// How many of a node's null pointers become threads: both of them (also
// called a fully threaded tree), or only the right one.
export const THREAD_MODES = [
  { key: "double", label: "Double", short: "DOUBLE" },
  { key: "single", label: "Single", short: "SINGLE (RIGHT)" },
];

/**
 * Whether an operation applies to the current setup. An operation with no
 * `types` belongs to every tree type; `types` and `threadModes` narrow it to
 * the ones where it means something.
 */
export function treeOpAvailable(op, { treeType, threadMode }) {
  if (op.types && !op.types.includes(treeType)) return false;
  if (op.threadModes && !op.threadModes.includes(threadMode)) return false;
  return true;
}

export const treeOpsFor = (setup) => TREE_OPERATIONS.filter((op) => treeOpAvailable(op, setup));
