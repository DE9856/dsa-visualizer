import { bstInsertByValue, avlInsertByValue, nextNodeId, treeHeight } from "./helpers";
import {
  insertWithLog,
  childIndexFor,
  isLeaf,
  treeHeight as twoThreeHeight,
} from "../twoThreeTree/helpers";
import { makeRng } from "../../utils/rng";

/**
 * BST vs AVL vs 2-3 tree, over the same keys in the same order.
 *
 * The comparison only means anything if the order is the variable, because
 * that is the whole story: a binary search tree's shape is decided entirely by
 * the sequence its keys arrive in, and the two balanced structures exist to
 * make that stop mattering. Feed all three the numbers 1…n in order and the
 * BST is a linked list of height n−1 while the AVL tree sits at ⌈log₂ n⌉ and
 * the 2-3 tree lower still.
 *
 * Every structure here is built with the same functions the tree views use, so
 * a shape measured here is the shape the canvas would draw.
 */

const permutation = (n) => Array.from({ length: n }, (_, i) => i + 1);

/** Recursive midpoint order: the sequence that builds a perfectly balanced BST. */
function medianOrder(lo, hi, out = []) {
  if (lo > hi) return out;
  const mid = Math.floor((lo + hi) / 2);
  out.push(mid);
  medianOrder(lo, mid - 1, out);
  medianOrder(mid + 1, hi, out);
  return out;
}

export const INSERT_ORDERS = [
  {
    key: "sorted",
    label: "Sorted (1…n)",
    desc: "The classic degenerate case. Every key is larger than everything already in the tree, so an unbalanced BST never branches left and becomes a linked list of height n−1.",
    build: (n) => permutation(n),
  },
  {
    key: "reversed",
    label: "Reversed (n…1)",
    desc: "The mirror image, and just as bad for a plain BST — a left spine instead of a right one.",
    build: (n) => permutation(n).reverse(),
  },
  {
    key: "random",
    label: "Random",
    desc: "A uniform shuffle. A BST built this way has expected height about 4.3 log₂ n — much better than the worst case, and still visibly worse than either balanced structure.",
    build: (n, seed) => {
      const rand = makeRng(seed);
      const values = permutation(n);
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      return values;
    },
  },
  {
    key: "zigzag",
    label: "Alternating ends",
    desc: "1, n, 2, n−1, … Each key is an extreme of what's left, so the BST alternates sides and still degenerates — a reminder that 'not sorted' is not the same as 'random'.",
    build: (n) => {
      const out = [];
      let lo = 1;
      let hi = n;
      while (lo <= hi) {
        out.push(lo++);
        if (lo <= hi) out.push(hi--);
      }
      return out;
    },
  },
  {
    key: "median",
    label: "Median-first",
    desc: "The midpoint of each remaining range, recursively. This is the order that builds a perfectly balanced BST without any rebalancing at all — the best case, and the one where AVL's rotations are pure overhead.",
    build: (n) => medianOrder(1, n),
  },
  {
    key: "sawtooth",
    label: "Sawtooth",
    desc: "Short ascending runs repeated across the range. Locally sorted, globally not — each run adds another right spine to whichever subtree it lands in.",
    build: (n) => {
      const teeth = Math.max(2, Math.round(Math.sqrt(n)));
      const out = [];
      for (let start = 0; start < teeth; start++) {
        for (let k = start; k < n; k += teeth) out.push(k + 1);
      }
      return out;
    },
  },
];

export const ORDER_MAP = Object.fromEntries(INSERT_ORDERS.map((o) => [o.key, o]));
export const ORDER_KEYS = INSERT_ORDERS.map((o) => o.key);

export function buildInsertOrder(key, n, seed) {
  const order = ORDER_MAP[key] || ORDER_MAP.sorted;
  return order.build(n, seed >>> 0 || 1);
}

export const TREE_KINDS = [
  {
    key: "bst",
    label: "Binary Search Tree",
    short: "BST",
    color: "var(--primary)",
    restructureLabel: "ROT",
    claim: "height O(n) worst case, O(log n) expected on random keys",
  },
  {
    key: "avl",
    label: "AVL Tree",
    short: "AVL",
    color: "var(--blue)",
    restructureLabel: "ROT",
    claim: "height ≤ 1.44 log₂(n+2), guaranteed",
  },
  {
    key: "twothree",
    label: "2-3 Tree",
    short: "2-3",
    color: "var(--green)",
    restructureLabel: "SPL",
    claim: "height between log₃ n and log₂ n, guaranteed",
  },
];

export const KIND_MAP = Object.fromEntries(TREE_KINDS.map((k) => [k.key, k]));

// ---------------------------------------------------------------------
// counting the descent
// ---------------------------------------------------------------------

/**
 * Key comparisons on the way down to where a key belongs.
 *
 * One three-way comparison per node for the binary trees — that is what
 * `value < node.value` followed by `value > node.value` amounts to, and
 * counting it as one keeps a BST node and a 2-3 node with a single key
 * costing the same thing. A 2-3 node with two keys costs two, which is
 * exactly the price it pays for being shorter.
 */
function binaryDescentComparisons(root, value) {
  let comparisons = 0;
  let node = root;
  while (node) {
    comparisons += 1;
    if (value < node.value) node = node.left;
    else if (value > node.value) node = node.right;
    else break;
  }
  return comparisons;
}

function twoThreeDescentComparisons(root, value) {
  let comparisons = 0;
  let node = root;
  while (node) {
    const idx = childIndexFor(node, value);
    // childIndexFor evaluates `value > keys[i]` once per step, plus the test
    // that stopped it — unless it ran off the end of the keys.
    comparisons += idx === node.keys.length ? node.keys.length : idx + 1;
    if (node.keys.includes(value) || isLeaf(node)) break;
    node = node.children[idx];
  }
  return comparisons;
}

// ---------------------------------------------------------------------
// running the inserts
// ---------------------------------------------------------------------

/**
 * Inserts `keys` one at a time into one structure.
 *
 * `collect` decides whether every intermediate tree is kept. The comparison
 * view keeps them, because a lane has to draw the tree after k inserts; the
 * height-vs-n sweep does not, because at n = 2000 that would be two thousand
 * whole trees to hold on to and nothing would ever look at them. One body
 * either way, so the plotted heights are the heights the canvas would draw.
 */
export function runInserts(kind, keys, collect = true) {
  const counts = { rotations: 0, splits: 0, rootSplits: 0 };
  let comparisons = 0;
  let root = null;
  const states = [];

  const heightOf = () => (kind === "twothree" ? twoThreeHeight(root) : treeHeight(root));

  // Which node the canvas should light up: the one the key just inserted
  // ended up in. A binary node keeps its id through any rotation, so the id
  // handed out at insert still finds it; a 2-3 key can be carried upward by a
  // split, so its node is found by descending to it afterwards.
  const activeFor = (key, insertedId) => {
    if (key === null) return [];
    if (kind !== "twothree") return [insertedId];
    let node = root;
    while (node) {
      if (node.keys.includes(key)) return [node.id];
      if (isLeaf(node)) return [node.id];
      node = node.children[childIndexFor(node, key)];
    }
    return [];
  };

  const record = (key, index, insertedId) => {
    if (!collect) return;
    states.push({
      root,
      inserted: index,
      lastKey: key,
      active: activeFor(key, insertedId),
      height: heightOf(),
      comparisons,
      restructures: kind === "twothree" ? counts.splits : counts.rotations,
    });
  };

  record(null, 0);

  keys.forEach((key, i) => {
    let insertedId = null;
    if (kind === "twothree") {
      comparisons += twoThreeDescentComparisons(root, key);
      root = insertWithLog(root, key, counts).root;
    } else {
      comparisons += binaryDescentComparisons(root, key);
      insertedId = nextNodeId();
      root =
        kind === "avl"
          ? avlInsertByValue(root, key, insertedId, counts)
          : bstInsertByValue(root, key, insertedId);
    }
    record(key, i + 1, insertedId);
  });

  return {
    kind,
    root,
    states,
    stats: {
      height: heightOf(),
      size: keys.length,
      comparisons,
      restructures: kind === "twothree" ? counts.splits : counts.rotations,
      rootSplits: counts.rootSplits,
    },
  };
}

/** Final numbers only — the fast path the height sweep calls. */
export function measureInserts(kind, keys) {
  return runInserts(kind, keys, false).stats;
}

// ---------------------------------------------------------------------
// the height sweep
// ---------------------------------------------------------------------

// Geometric, so the log axis is evenly sampled. A degenerate BST is a chain
// of this depth, and both the height walk and the insert recurse down it, so
// the top size is chosen to stay well inside the JS call stack.
const ALL_SIZES = [10, 25, 50, 100, 200, 400, 800, 1600];

export const SWEEP_SIZES = ALL_SIZES;

export const MAX_N_CHOICES = [
  { key: 100, label: "100", desc: "Instant." },
  { key: 400, label: "400", desc: "A moment. Enough for the three curves to separate clearly." },
  { key: 1600, label: "1600", desc: "A second or two — a sorted BST at this size is a chain 1599 deep." },
];

export const sizesUpTo = (maxN) => {
  const sizes = ALL_SIZES.filter((n) => n <= maxN);
  return sizes.length ? sizes : [ALL_SIZES[0]];
};

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Heights (and comparison counts) for all three structures at growing n, on
 * one insertion order. Runs in chunks on the main thread, yielding between
 * points so the progress bar keeps painting, and checks `token.cancelled` so
 * leaving the view abandons it.
 */
export async function runHeightSweep({ order = "sorted", seed = 1, maxN = 400, onProgress, token = {} }) {
  const sizes = sizesUpTo(maxN);
  const series = Object.fromEntries(TREE_KINDS.map((k) => [k.key, []]));
  const total = sizes.length * TREE_KINDS.length;
  let done = 0;

  for (const n of sizes) {
    // One key sequence per size, shared by all three structures — the whole
    // point is to compare structures, so the input must not vary between them.
    const keys = buildInsertOrder(order, n, seed);
    for (const kind of TREE_KINDS) {
      if (token.cancelled) return null;
      const stats = measureInserts(kind.key, keys);
      series[kind.key].push({ n, ...stats });
      done += 1;
      onProgress?.(done / total, n, kind.key);
      await yieldToUi();
    }
  }

  return { sizes, series, order, seed };
}

/** The reference curves the height plot draws: log₂ n, log₃ n and n itself. */
export const HEIGHT_MODELS = [
  { key: "log2", label: "log\u2082 n", color: "var(--blue)", f: (n) => Math.log2(Math.max(2, n)) },
  { key: "log3", label: "log\u2083 n", color: "var(--green)", f: (n) => Math.log(Math.max(2, n)) / Math.log(3) },
  { key: "n", label: "n", color: "var(--red)", f: (n) => n },
];
