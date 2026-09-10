import { nextId } from "../linkedList/nodeId";

/**
 * A leftist tree — a heap you can *meld* in O(log n).
 *
 * A binary heap cannot do that. Its shape is dictated by the array it lives
 * in, so joining two heaps of n elements means rebuilding one of them: O(n),
 * however cheap everything else was. A leftist tree gives up the array, and
 * with it the complete shape, and keeps only the heap-order property — then
 * adds one structural rule that keeps a single path short.
 *
 * Every node carries `s`, its **null-path length**: the number of edges on
 * the shortest path from it to a missing child, counting the missing child.
 * A leaf has s = 1; a null pointer has s = 0. The leftist property is
 *
 *   s(left) ≥ s(right)   at every node
 *
 * so the shortest way out is always to the right. That single rule bounds the
 * right spine: a node with s = k has a complete tree of at least 2^k − 1
 * nodes beneath it, so the right spine of an n-node tree is at most
 * ⌊log₂(n+1)⌋ long — and every operation here works only down the right
 * spines, which is why they are all logarithmic.
 *
 *   tree = { kind: "min" | "max", root }
 *   node = { id, value, left, right, s }
 *
 * Nodes are **immutable**: meld builds new ones along the path it touches and
 * shares everything it doesn't, which is what lets a frame keep a reference
 * to a tree rather than a copy of it. `id` is carried over, so the canvas
 * follows a node from one tree into the next instead of redrawing.
 */

export const LEFTIST_KINDS = [
  {
    key: "min",
    label: "Min Leftist Tree",
    short: "MIN",
    root: "smallest",
    rule: "every parent ≤ its children",
    take: "Delete Min",
  },
  {
    key: "max",
    label: "Max Leftist Tree",
    short: "MAX",
    root: "largest",
    rule: "every parent ≥ its children",
    take: "Delete Max",
  },
];

export const KIND_MAP = Object.fromEntries(LEFTIST_KINDS.map((k) => [k.key, k]));

// Past this the tree stops being readable on screen. A leftist tree has no
// capacity of its own — the operations say so rather than drawing off the edge.
export const MAX_NODES = 24;

export const emptyTree = (kind) => ({ kind, root: null });

/** Null-path length. A missing child is 0, which is what makes a leaf 1. */
export const sOf = (node) => (node ? node.s : 0);

/** Does `a` belong above `b`? */
export const precedes = (a, b, kind) => (kind === "max" ? a >= b : a <= b);

export const nodeOf = (value) => ({ id: nextId(), value, left: null, right: null, s: 1 });

/**
 * A node with these children, leftist-corrected: the taller null-path goes
 * left, and `s` is one more than the right child's.
 *
 * This is the only place the leftist property is established, and every
 * operation goes through it — which is why none of them can forget it.
 */
export function link(node, left, right) {
  const [l, r] = sOf(left) >= sOf(right) ? [left, right] : [right, left];
  return { ...node, left: l, right: r, s: sOf(r) + 1 };
}

export function countNodes(node) {
  return node ? 1 + countNodes(node.left) + countNodes(node.right) : 0;
}

export function heightOf(node) {
  return node ? 1 + Math.max(heightOf(node.left), heightOf(node.right)) : 0;
}

/** The path the operations actually walk: root, root.right, and so on. */
export function rightSpine(node) {
  const out = [];
  for (let n = node; n; n = n.right) out.push(n);
  return out;
}

/** The bound the leftist property buys: ⌊log₂(n+1)⌋. */
export const spineBound = (n) => (n === 0 ? 0 : Math.floor(Math.log2(n + 1)));

/** Is the leftist property intact everywhere? Used by the status query. */
export function isLeftist(node) {
  if (!node) return true;
  if (sOf(node.left) < sOf(node.right)) return false;
  if (node.s !== sOf(node.right) + 1) return false;
  return isLeftist(node.left) && isLeftist(node.right);
}

// ---------------------------------------------------------------------
// melding
// ---------------------------------------------------------------------

/**
 * Meld, with no frames — for shuffles, shared links and the pairwise build's
 * bookkeeping. The two-pass form: merge the right spines by key, then link
 * the merged chain back up from the bottom, correcting as you go.
 */
export function meldSilent(a, b, kind) {
  if (!a) return b;
  if (!b) return a;

  const chain = mergeSpines(a, b, kind).map((entry) => entry.node);
  let result = null;
  for (let i = chain.length - 1; i >= 0; i--) result = link(chain[i], chain[i].left, result);
  return result;
}

/**
 * The right spines of both trees, merged into one key-ordered chain.
 *
 * Each entry keeps its own left subtree untouched — only the right pointers
 * are being rewritten, which is the whole reason the work is bounded by the
 * two spine lengths and not by the tree sizes.
 */
export function mergeSpines(a, b, kind) {
  const left = rightSpine(a);
  const right = rightSpine(b);
  const out = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (precedes(left[i].value, right[j].value, kind)) out.push({ node: left[i++], from: "a" });
    else out.push({ node: right[j++], from: "b" });
  }
  while (i < left.length) out.push({ node: left[i++], from: "a" });
  while (j < right.length) out.push({ node: right[j++], from: "b" });
  return out;
}

/**
 * A meld, plus what it cost — the number of spine nodes it had to walk.
 *
 * The two builds are compared on this figure rather than on frame counts,
 * because frame counts are a property of how much of an operation is worth
 * animating and this is a property of the algorithm.
 */
export function meldCost(a, b, kind) {
  const cost = rightSpine(a).length + rightSpine(b).length;
  return { root: meldSilent(a, b, kind), cost };
}

export function buildSilent(values, kind) {
  let root = null;
  for (const value of values.slice(0, MAX_NODES)) root = meldSilent(root, nodeOf(value), kind);
  return { kind, root };
}

// ---------------------------------------------------------------------
// reading and writing the tree as text
// ---------------------------------------------------------------------

/** Level order, so a shared link rebuilds the same shape by re-melding it. */
export function levelOrder(node) {
  const out = [];
  const queue = node ? [node] : [];
  while (queue.length) {
    const n = queue.shift();
    out.push(n.value);
    if (n.left) queue.push(n.left);
    if (n.right) queue.push(n.right);
  }
  return out;
}

/**
 * Insertion order, not shape: a leftist tree's shape is decided by the order
 * its values were melded in, so the values alone rebuild it — but only if
 * they arrive in the same order. Level order is what a rebuild reproduces,
 * so that is what travels.
 */
export const treeValues = (tree) => levelOrder(tree.root);

export function parseValues(input, limit = MAX_NODES) {
  return String(input || "")
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n))
    .slice(0, limit);
}

export function randomValues() {
  const count = 6 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);
}

export const randomTree = (kind) => buildSilent(randomValues(), kind);

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

/**
 * One frame. `root` is a reference, not a copy — nodes are never mutated, so
 * a frame that holds the root it was taken with holds that whole tree for
 * good.
 *
 *   compare   ids being compared right now
 *   swap      ids whose children this step exchanged
 *   spine     the merged right-spine chain, while one is being built
 *   second    the other operand, drawn beside the first
 */
export function frame(tree, extra = {}) {
  return {
    kind: tree.kind,
    root: tree.root,
    label: "TREE",
    active: [],
    compare: [],
    swap: [],
    onSpine: [],
    spine: null,
    second: null,
    // The queue of not-yet-melded trees, while a pairwise build is running.
    forest: null,
    removing: null,
    message: "",
    ...extra,
  };
}

export const toFrame = (tree, message) => frame(tree, { message });
