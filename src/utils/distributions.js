import { makeRng } from "./rng.js";

/**
 * Input shapes to sort.
 *
 * The interesting comparisons between sorting algorithms almost never show up
 * on uniformly random data — that is where every O(n log n) sort looks the
 * same and every O(n²) sort looks equally bad. The differences live at the
 * edges: insertion sort beating quick sort on nearly-sorted input, Lomuto
 * quick sort collapsing to O(n²) on data that is *already sorted*, selection
 * sort not caring what shape the input is at all.
 *
 * Every builder is a pure function of (n, seed), so a distribution named in a
 * shared link rebuilds byte-for-byte in someone else's tab.
 *
 * Values span 1..max(99, n). Capping the span at 99 for small arrays keeps the
 * bars looking like the ones the sorting view has always drawn; letting it
 * grow with n for large ones keeps duplicates rare, which matters because a
 * sea of equal keys is its own (separately available) distribution.
 */

const spanFor = (n) => Math.max(99, n);

// The i-th value of a sorted array of n distinct values.
const ramp = (i, n) => 1 + Math.round((i / Math.max(1, n - 1)) * (spanFor(n) - 1));

function shuffle(values, rand) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

const ascending = (n) => Array.from({ length: n }, (_, i) => ramp(i, n));

export const DISTRIBUTIONS = [
  {
    key: "random",
    label: "Random",
    desc: "A uniform shuffle. The average case every textbook quotes, and the one where the O(n log n) sorts are hardest to tell apart.",
    build: (n, seed) => shuffle(ascending(n), makeRng(seed)),
  },
  {
    key: "nearly",
    label: "Nearly sorted",
    desc: "Sorted, then a handful of elements nudged a few places out of position. Adaptive sorts (insertion, bubble with early exit) approach O(n) here; the divide-and-conquer sorts get no discount at all.",
    build: (n, seed) => {
      const rand = makeRng(seed);
      const values = ascending(n);
      // Local disorder, not global: each disturbed element moves at most three
      // slots, which is what insertion sort is built to fix cheaply.
      const swaps = Math.max(1, Math.round(n / 20));
      for (let k = 0; k < swaps; k++) {
        const i = Math.floor(rand() * n);
        const j = Math.min(n - 1, Math.max(0, i + 1 + Math.floor(rand() * 3)));
        [values[i], values[j]] = [values[j], values[i]];
      }
      return values;
    },
  },
  {
    key: "sorted",
    label: "Already sorted",
    desc: "The best case for the adaptive sorts — and the worst case for quick sort with a first- or last-element pivot, where every partition is maximally lopsided.",
    build: (n) => ascending(n),
  },
  {
    key: "reversed",
    label: "Reversed",
    desc: "Descending. Every adjacent pair is out of order, so insertion and bubble sort hit their full O(n²), and a naive quick sort pivot degenerates again.",
    build: (n) => ascending(n).reverse(),
  },
  {
    key: "fewUnique",
    label: "Few unique",
    desc: "Only a handful of distinct values, repeated. Ties are where a partitioning scheme shows its quality and where stability becomes observable.",
    build: (n, seed) => {
      const rand = makeRng(seed);
      const distinct = Math.max(2, Math.min(5, n));
      const palette = Array.from({ length: distinct }, (_, k) => ramp(k, distinct));
      return Array.from({ length: n }, () => palette[Math.floor(rand() * distinct)]);
    },
  },
  {
    key: "allEqual",
    label: "All equal",
    desc: "Every element identical. Nothing needs to move, which makes it a pure measure of how many comparisons an algorithm performs regardless of the answer.",
    build: (n) => new Array(n).fill(ramp(Math.floor(n / 2), n)),
  },
  {
    key: "sawtooth",
    label: "Sawtooth",
    desc: "Short ascending runs repeated end to end. Run-aware sorts would exploit these; the ones here mostly can't, which is the point of the comparison.",
    build: (n) => {
      const teeth = Math.max(2, Math.round(Math.sqrt(n)));
      return Array.from({ length: n }, (_, i) => ramp(i % teeth, teeth));
    },
  },
  {
    key: "organPipe",
    label: "Organ pipe",
    desc: "Ascends to the middle, then mirrors back down. Half the array is in order and half is exactly reversed, which splits the adaptive sorts down the middle.",
    build: (n) => {
      const half = Math.ceil(n / 2);
      return Array.from({ length: n }, (_, i) => ramp(i < half ? i : n - 1 - i, half));
    },
  },
];

export const DISTRIBUTION_MAP = Object.fromEntries(DISTRIBUTIONS.map((d) => [d.key, d]));
export const DISTRIBUTION_KEYS = DISTRIBUTIONS.map((d) => d.key);

/** Builds an input array, falling back to a plain shuffle for a name we don't know. */
export function buildInput(key, n, seed) {
  const dist = DISTRIBUTION_MAP[key] || DISTRIBUTION_MAP.random;
  return dist.build(n, seed >>> 0 || 1);
}
