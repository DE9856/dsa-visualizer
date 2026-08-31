/**
 * Segment trees and Fenwick trees — two ways to answer questions about ranges
 * of an array without walking the range.
 *
 * The problem both solve: given an array that keeps changing, answer "what is
 * the sum of positions 3 to 9?" quickly. A plain array answers the query in
 * O(n) and the update in O(1); an array of prefix sums swaps that round, O(1)
 * to query and O(n) to update. Both structures here get O(log n) for both, by
 * storing partial answers over *ranges* rather than over positions.
 *
 *   segment tree  a binary tree over the array: the root covers everything,
 *                 each node splits its range in half, leaves are single cells.
 *                 Any range is a handful of whole nodes glued together.
 *   Fenwick       no tree at all, just an array where index i quietly stands
 *                 for the range (i − lowbit(i), i]. Those ranges nest exactly
 *                 the way binary counting does, which is why walking them is
 *                 arithmetic rather than pointer-chasing.
 *
 * They draw the same way, and that is the point of putting them together: a
 * row of array cells with *spans* underneath, each span a stored partial
 * answer covering some stretch of the array. Spans on one row never overlap —
 * for the segment tree a row is a depth, and for Fenwick it is a lowbit class,
 * which cannot overlap for the same reason. Seeing a query light up three or
 * four spans that happen to tile the range is the whole idea, in both.
 */

export const MAX_N = 12;
export const MAX_VALUE = 99;

export const KINDS = [
  {
    key: "segment",
    label: "Segment Tree",
    short: "SEGMENT",
    summary: "An explicit binary tree of ranges. Handles any associative combine, not just addition.",
  },
  {
    key: "fenwick",
    label: "Fenwick Tree",
    short: "FENWICK",
    summary: "No tree — an array whose indices stand for ranges, walked by adding and subtracting the lowest set bit.",
  },
];

export const KIND_MAP = Object.fromEntries(KINDS.map((k) => [k.key, k]));

export const isFenwick = (kind) => kind === "fenwick";

/**
 * A Fenwick tree can only do this with an operation that has an inverse — a
 * range sum is prefix(r) − prefix(l−1), and there is no such trick for min.
 * A segment tree needs only associativity, which is why it takes all three.
 */
export const COMBINES = [
  { key: "sum", label: "SUM", identity: 0, fn: (a, b) => a + b, symbol: "+" },
  { key: "min", label: "MIN", identity: Infinity, fn: (a, b) => Math.min(a, b), symbol: "min" },
  { key: "max", label: "MAX", identity: -Infinity, fn: (a, b) => Math.max(a, b), symbol: "max" },
];

export const COMBINE_MAP = Object.fromEntries(COMBINES.map((c) => [c.key, c]));

export const combineFor = (kind, combine) =>
  COMBINE_MAP[isFenwick(kind) ? "sum" : combine] || COMBINE_MAP.sum;

export const show = (v) => (v === Infinity ? "∞" : v === -Infinity ? "−∞" : String(v));

// ---------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------

export function parseValues(text, limit = MAX_N) {
  return String(text || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n))
    .map((n) => Math.max(-MAX_VALUE, Math.min(MAX_VALUE, n)))
    .slice(0, limit);
}

export function parseIndex(text, n, fallback = 0) {
  const i = parseInt(String(text || "").trim(), 10);
  if (Number.isNaN(i)) return fallback;
  return Math.max(0, Math.min(n - 1, i));
}

export const randomValues = () =>
  Array.from({ length: 6 + Math.floor(Math.random() * 3) }, () => 1 + Math.floor(Math.random() * 20));

// ---------------------------------------------------------------------
// the segment tree
// ---------------------------------------------------------------------

/**
 * Nodes as a flat list of `{ id, lo, hi, depth, value }`, built recursively.
 * `id` is the usual 1-based heap index, so a node's children are 2i and 2i+1 —
 * which is what lets an update walk back up by halving.
 */
export function buildSegmentNodes(values, combine, onCombine) {
  const nodes = new Map();
  const { fn, identity } = combine;

  const build = (id, lo, hi, depth) => {
    if (lo === hi) {
      const node = { id, lo, hi, depth, value: values[lo] };
      nodes.set(id, node);
      onCombine?.(node, null, null);
      return node;
    }
    const mid = Math.floor((lo + hi) / 2);
    const left = build(id * 2, lo, mid, depth + 1);
    const right = build(id * 2 + 1, mid + 1, hi, depth + 1);
    const node = { id, lo, hi, depth, value: fn(left.value, right.value) };
    nodes.set(id, node);
    onCombine?.(node, left, right);
    return node;
  };

  if (values.length) build(1, 0, values.length - 1, 0);
  else return { nodes, identity };
  return { nodes, identity };
}

/** Every node as a span the canvas can draw, deepest row last. */
export const segmentSpans = (nodes, tones = {}) =>
  [...nodes.values()].map((n) => ({
    id: `s${n.id}`,
    row: n.depth,
    lo: n.lo,
    hi: n.hi,
    label: show(n.value),
    tone: tones[n.id] || null,
  }));

// ---------------------------------------------------------------------
// the Fenwick tree
// ---------------------------------------------------------------------

/** The lowest set bit — the width of the range index i is responsible for. */
export const lowbit = (i) => i & -i;

/** 1-based tree array. bit[i] holds the sum of (i − lowbit(i), i]. */
export function buildFenwick(values, onStep) {
  const n = values.length;
  const bit = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    bit[i] += values[i - 1];
    const parent = i + lowbit(i);
    if (parent <= n) bit[parent] += bit[i];
    onStep?.(i, parent <= n ? parent : null, [...bit]);
  }
  return bit;
}

/**
 * Fenwick index i covers array positions (i − lowbit(i), i] in 1-based terms,
 * which is [i − lowbit(i), i − 1] in the 0-based array the canvas draws.
 */
export const fenwickRange = (i) => ({ lo: i - lowbit(i), hi: i - 1 });

/**
 * Rows grouped by lowbit, so a row holds only ranges of one width and they
 * cannot overlap — the same reason a segment tree's depth cannot overlap.
 */
export const fenwickRow = (i) => Math.log2(lowbit(i));

export const fenwickSpans = (bit, tones = {}) =>
  bit
    .map((value, i) => {
      if (i === 0) return null;
      const { lo, hi } = fenwickRange(i);
      return { id: `f${i}`, row: fenwickRow(i), lo, hi, label: show(value), tone: tones[i] || null, index: i };
    })
    .filter(Boolean);

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

export function frame(values, spans, extra = {}) {
  return {
    n: values.length,
    array: values.map((v) => ({ text: show(v) })),
    spans,
    message: "",
    line: null,
    ...extra,
  };
}

/** Tone one array cell without disturbing the others. */
export function toneArray(values, tones = {}) {
  return values.map((v, i) => ({ text: show(v), tone: tones[i] || null }));
}
