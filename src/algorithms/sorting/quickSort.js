import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { PICK_PIVOT: 1, COMPARE: 4, SWAP: 5, PLACE_PIVOT: 6, DONE: null };

/**
 * Where the pivot comes from, given the inclusive range [l, r]. Lomuto
 * partitioning below always partitions around a[r], so each strategy just
 * says which index should be moved there first — one partition body, four
 * wildly different curves.
 */
export const PIVOT_STRATEGIES = {
  last: () => (ctx, l, r) => r,
  first: () => (ctx, l, r) => l,
  // The classic defence against sorted input: the median of three samples is
  // very unlikely to be an extreme, so the partition rarely degenerates.
  median3: () => (ctx, l, r) => {
    const mid = Math.floor((l + r) / 2);
    const a = ctx.a;
    ctx.m.read(3);
    const trio = [
      [a[l], l],
      [a[mid], mid],
      [a[r], r],
    ];
    // Three comparisons to order three samples.
    ctx.m.compareValues();
    ctx.m.compareValues();
    ctx.m.compareValues();
    trio.sort((x, y) => x[0] - y[0]);
    return trio[1][1];
  },
  // Randomising the pivot makes the O(n²) case depend on the seed rather
  // than on the input, which is why it survives adversarial data.
  random: () => (ctx, l, r) => l + Math.floor(ctx.rand() * (r - l + 1)),
};

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;
  const choosePivot = (PIVOT_STRATEGIES[ctx.options.pivot] || PIVOT_STRATEGIES.last)();

  // Every qs() call is recorded as it is entered, so the UI can draw the
  // recursion tree. One array, shared by reference across every frame;
  // `callCount` is how much of it exists at that point in the run. Unlike
  // merge sort's, this shape depends on where the pivots land.
  const calls = [];
  const enterCall = (lo, hi, depth, parent) => {
    calls.push({ id: calls.length, parent, range: [lo, hi], depth });
    return calls.length - 1;
  };

  // Frames name the subrange (inclusive) and depth of the call they came
  // from, which is what lets the bars outside it dim.
  const at = (fields, l, r, depth, callId) =>
    ctx.emit({ ...fields, range: [l, r], depth, callId, calls, callCount: calls.length });

  /**
   * The partition is driven from an explicit stack rather than the JavaScript
   * call stack. Quick sort's degenerate case is not hypothetical here — it is
   * the lesson: a last-element pivot on sorted input splits into n-1 and 0
   * every single time, so the recursive form nests n deep. That is fine at the
   * forty bars the animation draws, and fatal at the n = 5000 the empirical
   * complexity sweep reaches, where it threw RangeError and killed the sweep.
   *
   * Popping the left side first and pushing the right side before it means
   * ranges are visited in exactly the pre-order the two recursive calls
   * produced, so the frames, the call ids and the tree the recursion panel
   * draws are all unchanged — the only thing that moved is where the pending
   * ranges are stored. `depth` is still the depth in the conceptual tree, so a
   * degenerate run looks and counts as deep as it really is.
   */
  const pending = [{ l: 0, r: n - 1, depth: 0, parent: null }];
  while (pending.length) {
    const { l, r, depth, parent } = pending.pop();
    // An empty side of a partition isn't a call worth drawing.
    if (l > r) continue;
    ctx.m.atDepth(depth);
    const id = enterCall(l, r, depth, parent);
    if (l === r) {
      ctx.markSorted(l);
      continue;
    }

    const chosen = choosePivot(ctx, l, r);
    if (chosen !== r) {
      ctx.swap(chosen, r);
      at({ swap: [chosen, r], pivot: r, line: LINE.PICK_PIVOT }, l, r, depth, id);
    }

    ctx.m.read();
    const pivotVal = ctx.a[r];
    let i = l - 1;
    for (let j = l; j < r; j++) {
      ctx.m.read();
      const below = ctx.ltValues(ctx.a[j], pivotVal);
      at({ compare: [j, r], pivot: r, line: LINE.COMPARE }, l, r, depth, id);
      if (below) {
        i++;
        ctx.swap(i, j);
        at({ swap: [i, j], pivot: r, line: LINE.SWAP }, l, r, depth, id);
      }
    }
    ctx.swap(i + 1, r);
    at({ swap: [i + 1, r], line: LINE.PLACE_PIVOT }, l, r, depth, id);
    ctx.markSorted(i + 1);
    pending.push({ l: i + 2, r, depth: depth + 1, parent: id });
    pending.push({ l, r: i, depth: depth + 1, parent: id });
  }
  ctx.markAll();
  // The run is over: the whole array is the active range again, so nothing
  // is left dimmed.
  at({ line: LINE.DONE }, 0, n - 1, 0, 0);
});

export const quickSort = {
  key: "quick",
  label: "Quick Sort",
  category: "sorting",
  desc: "Picks a pivot, partitions the array so smaller values sit left and larger sit right of it, then recurses on each side.",
  time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n\u00B2)" },
  space: "O(log n)",
  overview:
    "Quicksort is another divide-and-conquer algorithm that, on average, is one of the fastest general-purpose sorting algorithms in practice, despite having a worst case of O(n\u00B2).",
  howItWorks: [
    "Choose a pivot element from the array.",
    "Partition the remaining elements into those less than the pivot and those greater than it.",
    "Recursively apply the same process to each partition.",
    "Combine the results — no explicit merge step is needed since partitioning happens in place.",
  ],
  useCases: [
    "General-purpose sorting in many standard libraries, often combined with insertion sort for small partitions.",
    "In-memory sorting where average-case speed matters more than worst-case guarantees.",
    "Situations where in-place sorting with low memory overhead is important.",
  ],
  advantages: [
    "Very fast in practice — O(n log n) average case with small constant factors.",
    "In-place, needing only O(log n) additional memory for recursion.",
    "Cache-friendly due to its access patterns.",
  ],
  disadvantages: [
    "Worst-case O(n\u00B2) time, e.g. on already-sorted data with a naive pivot choice.",
    "Not stable in its typical implementation.",
    "Performance is sensitive to the pivot selection strategy.",
  ],
  pseudocode: [
    "quickSort(l, r):",
    "  swap(choosePivot(l, r), r)",
    "  pivot = a[r]; i = l-1",
    "  for j in l..r:",
    "    if a[j] < pivot:",
    "      i++; swap(a[i], a[j])",
    "  swap(a[i+1], a[r])",
    "  quickSort(l, i); quickSort(i+2, r)",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: false,
  variants: [
    {
      key: "pivot",
      label: "PIVOT",
      default: "last",
      options: [
        { key: "last", label: "Last", desc: "Lomuto's textbook pivot. Degenerates to O(n²) on sorted or reversed input." },
        { key: "first", label: "First", desc: "The mirror image of Last, and just as fragile on ordered input." },
        { key: "median3", label: "Median of 3", desc: "Median of first, middle and last. Turns the sorted-input worst case back into O(n log n)." },
        { key: "random", label: "Random", desc: "Drawn from the run's seed, so the worst case depends on the seed rather than the data." },
      ],
    },
  ],
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};
