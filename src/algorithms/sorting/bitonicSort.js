import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { SORT: 0, MERGE: 2, COMPARE: 3, SWAP: 4, DONE: null };

/** The largest power of two strictly less than n. */
function halfPowerOfTwo(n) {
  let k = 1;
  while (k < n) k *= 2;
  return k / 2;
}

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;

  // A bitonic network is normally defined only for n a power of two. Padding
  // the array with sentinels would mean drawing bars that are not in the
  // input, so this uses the arbitrary-n formulation instead: split at the
  // largest power of two below n rather than at the midpoint, which keeps
  // every comparator inside the real array.
  const band = (lo, hi, ascending) => ({
    from: lo,
    to: hi,
    tone: ascending ? "asc" : "desc",
    label: ascending ? "\u25B2" : "\u25BC",
  });

  function compareAndSwap(i, j, ascending, lo, hi, depth) {
    const bands = [band(lo, hi, ascending)];
    ctx.emit({ compare: [i, j], bands, range: [lo, hi], depth, line: LINE.COMPARE });
    // One comparator: keep the pair in the direction this sub-network sorts.
    const outOfOrder = ascending ? ctx.gt(i, j) : ctx.lt(i, j);
    if (outOfOrder) {
      ctx.swap(i, j);
      ctx.emit({ swap: [i, j], bands, range: [lo, hi], depth, line: LINE.SWAP });
    }
  }

  /**
   * Merges a bitonic sequence — one that rises then falls — into a sorted
   * one. Every comparator at this level is independent of every other, which
   * is exactly why the network parallelises; here they simply run in order.
   */
  function bitonicMerge(lo, len, ascending, depth) {
    if (len <= 1) return;
    ctx.m.atDepth(depth);
    const m = halfPowerOfTwo(len);
    ctx.emit({
      bands: [band(lo, lo + len - 1, ascending)],
      range: [lo, lo + len - 1],
      depth,
      line: LINE.MERGE,
    });
    for (let i = lo; i < lo + len - m; i++) {
      compareAndSwap(i, i + m, ascending, lo, lo + len - 1, depth);
    }
    bitonicMerge(lo, m, ascending, depth + 1);
    bitonicMerge(lo + m, len - m, ascending, depth + 1);
  }

  /** Sorts one half up and the other down, making a bitonic sequence to merge. */
  function bitonicSortRange(lo, len, ascending, depth) {
    if (len <= 1) return;
    ctx.m.atDepth(depth);
    const m = Math.floor(len / 2);
    ctx.emit({
      bands: [band(lo, lo + len - 1, ascending)],
      range: [lo, lo + len - 1],
      depth,
      line: LINE.SORT,
    });
    bitonicSortRange(lo, m, !ascending, depth + 1);
    bitonicSortRange(lo + m, len - m, ascending, depth + 1);
    bitonicMerge(lo, len, ascending, depth);
  }

  if (n > 1) bitonicSortRange(0, n, true, 0);

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const bitonicSort = {
  key: "bitonic",
  label: "Bitonic Sort",
  category: "sorting",
  desc: "A sorting network: a fixed pattern of compare-and-swap pairs that is the same for every input of a given size, which is what lets it run entirely in parallel.",
  time: { best: "O(n log\u00B2 n)", avg: "O(n log\u00B2 n)", worst: "O(n log\u00B2 n)" },
  space: "O(1)",
  overview:
    "Bitonic sort is a sorting network rather than an ordinary algorithm: the sequence of comparisons is decided in advance by the size of the input and never by its contents. It builds a bitonic sequence — one that rises and then falls — by sorting one half upward and the other downward, then merges it with a cascade of comparators. Because every comparator at a level touches a disjoint pair, an entire level can run at once, which is why this is the sort that GPUs and hardware actually use even though its operation count is worse than merge sort's.",
  howItWorks: [
    "Sort the first half of the range ascending and the second half descending, recursively — the result is a bitonic sequence.",
    "Merge it: compare each element with the one a fixed distance ahead and swap any pair that is in the wrong direction.",
    "That single pass leaves every element of the lower half smaller than every element of the upper half, and both halves still bitonic.",
    "Recurse into each half with the same merge, halving the distance each time.",
    "Because the comparator positions never depend on the values, the same network sorts every input of that size in the same number of steps.",
  ],
  useCases: [
    "GPU and SIMD sorting, where a fixed, data-independent comparison pattern is worth more than a lower operation count.",
    "Hardware sorting networks, where the comparators are physical and must be laid out ahead of time.",
    "Constant-time-by-construction settings, including cryptographic code that must not branch on data.",
  ],
  advantages: [
    "Fully parallelisable — each level of the network is a set of independent comparisons.",
    "Runs in the same number of steps regardless of input, so its timing leaks nothing about the data.",
    "In-place, with no extra array required.",
  ],
  disadvantages: [
    "O(n log\u00B2 n) comparisons, a log factor worse than merge or quick sort when run sequentially.",
    "Not stable — comparators exchange equal elements across long distances.",
    "Classically defined only for power-of-two sizes; other lengths need the split-at-a-power-of-two formulation used here.",
  ],
  pseudocode: [
    "sort(lo, len, dir): sort(lo, len/2, !dir); sort(lo+len/2, ..., dir)",
    "                    merge(lo, len, dir)",
    "merge(lo, len, dir): m = largest power of 2 < len",
    "  for i in lo..lo+len-m: if (a[i] > a[i+m]) == dir: swap",
    "  merge(lo, m, dir); merge(lo+m, len-m, dir)",
  ],
  stable: false,
  run,
  count,
};
