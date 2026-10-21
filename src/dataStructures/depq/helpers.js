import { nextId } from "../linkedList/nodeId";

/**
 * Priority queues, single- and double-ended.
 *
 * A binary heap answers one question in O(log n): give me the smallest. Ask
 * it for the largest and it has nothing — the maximum of a min heap is
 * somewhere among the leaves, and finding it means looking at all ⌈n/2⌉ of
 * them. A *double-ended* priority queue answers both, in log time, from one
 * structure, and there are two well-known ways to get there:
 *
 *   min-max heap    one array, but the levels alternate. Even levels are min
 *                   levels and odd levels are max levels, so the root is the
 *                   smallest element and the largest is one of its children.
 *                   Comparisons happen against *grandparents*, two levels up,
 *                   because that is the nearest node of the same kind.
 *
 *   interval heap   one array read in pairs. Node k holds items[2k] and
 *                   items[2k+1] as a closed interval [lo, hi]; the lo values
 *                   form a min heap, the hi values form a max heap, and every
 *                   node's interval contains both of its children's. So the
 *                   root holds both answers at once, side by side.
 *
 * All three kinds are stored the same way here — one flat array of entries —
 * which is the point worth seeing: nothing about the *storage* changes, only
 * the invariant laid over it.
 *
 *   queue = { kind: "single" | "minmax" | "interval", items: [{ id, value }] }
 *
 * Entries keep a stable `id` across swaps so the canvas animates a value
 * moving between positions instead of redrawing the level.
 */

export const DEPQ_KINDS = [
  {
    key: "single",
    label: "Min Heap",
    short: "MIN HEAP",
    ends: "single-ended",
    rule: "every parent ≤ both children",
    hint: "the ordinary binary heap, here for the contrast: it finds the minimum in O(1) and has to hunt the leaves for the maximum",
  },
  {
    key: "minmax",
    label: "Min-Max Heap",
    short: "MIN-MAX",
    ends: "double-ended",
    rule: "even levels ≤ their descendants, odd levels ≥ theirs",
    hint: "alternating min and max levels in one array; comparisons reach two levels up, to the grandparent",
  },
  {
    key: "interval",
    label: "Interval Heap",
    short: "INTERVAL",
    ends: "double-ended",
    rule: "each node's [lo, hi] contains both children's intervals",
    hint: "two elements per node: the lo values are a min heap, the hi values a max heap, and the root holds both answers",
  },
];

export const KIND_MAP = Object.fromEntries(DEPQ_KINDS.map((k) => [k.key, k]));

export const isDoubleEnded = (kind) => KIND_MAP[kind].ends === "double-ended";

// An interval heap draws two values per node, so it runs out of width first.
// Both caps are five full levels of tree.
export const MAX_ITEMS = 31;
export const MAX_INTERVAL_ITEMS = 32;

export const capacityOf = (kind) => (kind === "interval" ? MAX_INTERVAL_ITEMS : MAX_ITEMS);

export const emptyQueue = (kind) => ({ kind, items: [] });

export const cloneQueue = (queue) => ({ ...queue, items: [...queue.items] });

export const queueValues = (queue) => queue.items.map((e) => e.value);

export const entry = (value) => ({ id: nextId(), value });

// ---------------------------------------------------------------------
// index arithmetic
// ---------------------------------------------------------------------

export const parentOf = (i) => (i - 1) >> 1;
export const leftOf = (i) => 2 * i + 1;
export const rightOf = (i) => 2 * i + 2;

/** Depth of index i (root = 0), by integer math rather than Math.log2. */
export const depthOf = (i) => 31 - Math.clz32(i + 1);

export const heightOf = (count) => (count === 0 ? -1 : depthOf(count - 1));

/** A min-max heap's even levels are min levels; its odd levels are max. */
export const isMinLevel = (i) => depthOf(i) % 2 === 0;

export const grandparentOf = (i) => {
  const p = parentOf(i);
  return p <= 0 ? -1 : parentOf(p);
};

/**
 * The children and grandchildren of i — the six candidates a min-max
 * trickle-down has to consider. Two levels, because the node two levels down
 * is the nearest one of the *same* kind.
 */
export function descendantsOf(i, n) {
  return [leftOf(i), rightOf(i), leftOf(leftOf(i)), rightOf(leftOf(i)), leftOf(rightOf(i)), rightOf(rightOf(i))].filter(
    (k) => k < n
  );
}

/** Interval heap: which tree node index `i` belongs to, and which end of it. */
export const nodeOfIndex = (i) => i >> 1;
export const isLoEnd = (i) => i % 2 === 0;
export const loIndex = (node) => 2 * node;
export const hiIndex = (node) => 2 * node + 1;

// ---------------------------------------------------------------------
// invariants — used by the status query and by the tests
// ---------------------------------------------------------------------

export function checkSingle(items) {
  for (let i = 1; i < items.length; i++) {
    if (items[parentOf(i)].value > items[i].value) return `index ${i} is smaller than its parent`;
  }
  return null;
}

export function checkMinMax(items) {
  const n = items.length;
  for (let i = 0; i < n; i++) {
    const min = isMinLevel(i);
    // Checking against every descendant rather than only the grandchildren:
    // the property is about all of them, and the grandparent comparisons the
    // algorithms make are only enough *given* that it already held.
    const stack = [leftOf(i), rightOf(i)];
    while (stack.length) {
      const k = stack.pop();
      if (k >= n) continue;
      if (min ? items[k].value < items[i].value : items[k].value > items[i].value) {
        return `index ${k} breaks the ${min ? "min" : "max"} level at index ${i}`;
      }
      stack.push(leftOf(k), rightOf(k));
    }
  }
  return null;
}

export function checkInterval(items) {
  const n = items.length;
  const nodes = Math.ceil(n / 2);
  for (let k = 0; k < nodes; k++) {
    const lo = items[loIndex(k)];
    const hi = items[hiIndex(k)];
    if (hi && lo.value > hi.value) return `node ${k} has lo > hi`;
    if (k === 0) continue;
    const p = parentOf(k);
    const plo = items[loIndex(p)];
    const phi = items[hiIndex(p)];
    if (plo.value > lo.value) return `node ${k}'s lo is below its parent's lo`;
    const top = hi ? hi.value : lo.value;
    if (phi && phi.value < top) return `node ${k}'s hi is above its parent's hi`;
  }
  return null;
}

export function checkInvariant(queue) {
  if (queue.items.length === 0) return null;
  if (queue.kind === "single") return checkSingle(queue.items);
  if (queue.kind === "minmax") return checkMinMax(queue.items);
  return checkInterval(queue.items);
}

// ---------------------------------------------------------------------
// where the two answers live
// ---------------------------------------------------------------------

/** The index holding the smallest element, for any of the three kinds. */
export function minIndex(queue) {
  return queue.items.length === 0 ? -1 : 0;
}

/**
 * The index holding the largest — and the reason the three kinds are here
 * together.
 *
 * A min heap has to search its leaves for it. A min-max heap knows it is one
 * of the root's two children. An interval heap knows it is the root's own
 * second element.
 */
export function maxIndex(queue) {
  const { kind, items } = queue;
  const n = items.length;
  if (n === 0) return -1;
  if (n === 1) return 0;

  if (kind === "interval") return 1;
  if (kind === "minmax") return items[2] !== undefined && items[2].value > items[1].value ? 2 : 1;

  // A min heap's maximum is always a leaf — no leaf can be an ancestor of a
  // larger element — so only the leaves are worth looking at. Still O(n).
  let best = Math.floor(n / 2);
  for (let i = best + 1; i < n; i++) if (items[i].value > items[best].value) best = i;
  return best;
}

/** The indices a min heap has to scan to find its maximum. */
export const leavesOf = (n) => (n <= 1 ? [0].slice(0, n) : rangeFrom(Math.floor(n / 2), n));

const rangeFrom = (from, to) => Array.from({ length: to - from }, (_, k) => from + k);

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

/**
 * One frame. The whole array, plus what this step is doing to it.
 *
 *   compare   indices being compared
 *   swap      indices this step exchanged
 *   scan      indices being searched through — the min heap's leaf hunt
 *   path      the route a sift or trickle has taken
 */
export function frame(queue, extra = {}) {
  return {
    kind: queue.kind,
    items: [...queue.items],
    compare: [],
    swap: [],
    scan: [],
    path: [],
    active: [],
    current: null,
    pending: null,
    removing: null,
    message: "",
    ...extra,
  };
}

export const toFrame = (queue, message) => frame(queue, { message });

// ---------------------------------------------------------------------
// building and parsing
// ---------------------------------------------------------------------

export function parseValues(input, limit = MAX_INTERVAL_ITEMS) {
  return String(input || "")
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n))
    .slice(0, limit);
}

export function randomValues() {
  const count = 8 + Math.floor(Math.random() * 5);
  return Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);
}

export const swapAt = (items, i, j) => {
  const tmp = items[i];
  items[i] = items[j];
  items[j] = tmp;
};
