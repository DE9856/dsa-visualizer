import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { CHECK: 0, HEAP: 1, PARTITION: 3, COMPARE: 4, SWAP: 5, INSERTION: 6, DONE: null };

// Ranges this small are left to the final insertion pass. libstdc++ uses 16;
// the exact number matters less than the fact that there is one — insertion
// sort wins on short ranges because its constant factor is tiny.
const SMALL = 8;

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;

  const calls = [];
  const enterCall = (lo, hi, depth, parent) => {
    calls.push({ id: calls.length, parent, range: [lo, hi], depth });
    return calls.length - 1;
  };

  const band = (lo, hi, tone, label) => [{ from: lo, to: hi, tone, label }];

  const at = (fields, lo, hi, depth, id, tone, label) =>
    ctx.emit({
      ...fields,
      bands: band(lo, hi, tone, label),
      range: [lo, hi],
      depth,
      callId: id,
      calls,
      callCount: calls.length,
    });

  /** Sift-down restricted to [lo, hi], so heap sort can run on a subrange. */
  function siftDown(lo, hi, start, depth, id) {
    const len = hi - lo + 1;
    let root = start;
    while (2 * root + 1 < len) {
      let child = 2 * root + 1;
      if (child + 1 < len) {
        at({ compare: [lo + child, lo + child + 1], line: LINE.HEAP }, lo, hi, depth, id, "heap", "heap sort");
        if (ctx.gt(lo + child + 1, lo + child)) child++;
      }
      at({ compare: [lo + root, lo + child], line: LINE.HEAP }, lo, hi, depth, id, "heap", "heap sort");
      if (!ctx.lt(lo + root, lo + child)) return;
      ctx.swap(lo + root, lo + child);
      at({ swap: [lo + root, lo + child], line: LINE.HEAP }, lo, hi, depth, id, "heap", "heap sort");
      root = child;
    }
  }

  /** The depth-limit escape hatch: guarantees O(n log n) instead of O(n squared). */
  function heapSortRange(lo, hi, depth, id) {
    const len = hi - lo + 1;
    for (let i = Math.floor(len / 2) - 1; i >= 0; i--) siftDown(lo, hi, i, depth, id);
    for (let end = hi; end > lo; end--) {
      ctx.swap(lo, end);
      at({ swap: [lo, end], line: LINE.HEAP }, lo, hi, depth, id, "heap", "heap sort");
      siftDown(lo, end - 1, 0, depth, id);
    }
  }

  function partition(lo, hi, depth, id) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.m.read(3);
    ctx.m.compareValues();
    ctx.m.compareValues();
    ctx.m.compareValues();
    const trio = [
      [ctx.a[lo], lo],
      [ctx.a[mid], mid],
      [ctx.a[hi], hi],
    ].sort((x, y) => x[0] - y[0]);
    if (trio[1][1] !== hi) {
      ctx.swap(trio[1][1], hi);
      at({ swap: [trio[1][1], hi], pivot: hi, line: LINE.PARTITION }, lo, hi, depth, id, "quick", "quick sort");
    }
    ctx.m.read();
    const pivotVal = ctx.a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      ctx.m.read();
      const below = ctx.ltValues(ctx.a[j], pivotVal);
      at({ compare: [j, hi], pivot: hi, line: LINE.COMPARE }, lo, hi, depth, id, "quick", "quick sort");
      if (below) {
        i++;
        ctx.swap(i, j);
        at({ swap: [i, j], pivot: hi, line: LINE.SWAP }, lo, hi, depth, id, "quick", "quick sort");
      }
    }
    ctx.swap(i + 1, hi);
    at({ swap: [i + 1, hi], line: LINE.SWAP }, lo, hi, depth, id, "quick", "quick sort");
    return i + 1;
  }

  /**
   * Quick sort until it misbehaves, then heap sort. The depth limit is what
   * makes the name honest: quick sort's quadratic case is a recursion that
   * goes n deep, so capping the depth at 2·log2(n) and switching to heap sort
   * the moment the cap is hit buys a hard O(n log n) ceiling while keeping
   * quick sort's speed on every input that does not misbehave.
   */
  function introsort(lo, hi, limit, depth, parent) {
    while (hi - lo + 1 > SMALL) {
      ctx.m.atDepth(depth);
      const id = enterCall(lo, hi, depth, parent);
      if (limit === 0) {
        heapSortRange(lo, hi, depth, id);
        return;
      }
      limit--;
      const p = partition(lo, hi, depth, id);
      // Recurse into the smaller side and loop on the larger, so the stack
      // stays O(log n) whichever way the partition falls.
      if (p - lo < hi - p) {
        introsort(lo, p - 1, limit, depth + 1, id);
        lo = p + 1;
      } else {
        introsort(p + 1, hi, limit, depth + 1, id);
        hi = p - 1;
      }
      parent = id;
    }
  }

  if (n > 1) {
    const depthLimit = 2 * Math.floor(Math.log2(n));
    introsort(0, n - 1, depthLimit, 0, null);

    // Every remaining range is shorter than SMALL and already close to home,
    // so one insertion pass over the whole array finishes them all — cheaper
    // than paying insertion sort's setup once per leftover range.
    for (let i = 1; i < n; i++) {
      ctx.m.read();
      const value = ctx.a[i];
      const tag = ctx.tags[i];
      let j = i - 1;
      ctx.emit({ compare: [i], bands: band(0, n - 1, "ins", "insertion pass"), line: LINE.INSERTION });
      while (j >= 0) {
        ctx.m.read();
        if (!ctx.ltValues(value, ctx.a[j])) break;
        ctx.put(j + 1, ctx.a[j], ctx.tags[j]);
        ctx.emit({ swap: [j, j + 1], bands: band(0, n - 1, "ins", "insertion pass"), line: LINE.INSERTION });
        j--;
      }
      ctx.put(j + 1, value, tag);
    }
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const introSort = {
  key: "intro",
  label: "Introsort",
  category: "sorting",
  desc: "The sort real standard libraries ship: quick sort for speed, heap sort as a hard fallback when the recursion goes too deep, and one insertion pass at the end for the leftovers.",
  time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)" },
  space: "O(log n)",
  overview:
    "Introsort — introspective sort — is what C++'s std::sort actually is. Quick sort is the fastest comparison sort in practice but has an O(n²) worst case an adversary can trigger on purpose. Heap sort has a guaranteed O(n log n) bound but a worse constant factor. Introsort watches its own recursion depth: it runs quick sort, and if the depth passes 2·log₂n — which only happens when the partitions are going badly — it abandons quick sort for that range and heap sorts it instead. Ranges shorter than a small threshold are left alone and cleaned up by a single insertion pass at the end.",
  howItWorks: [
    "Compute a depth limit of 2·log₂n before starting.",
    "Partition the range with quick sort, using a median-of-three pivot, and recurse into the smaller side while looping on the larger.",
    "Each level of recursion spends one unit of the depth limit.",
    "If the limit reaches zero the partitions are clearly degenerating, so heap sort that range instead — the switch is what caps the worst case.",
    "Stop recursing once a range is shorter than the threshold, and finish with one insertion sort pass over the whole array.",
  ],
  useCases: [
    "General-purpose library sorting — this is std::sort in the C++ standard library.",
    "Anywhere untrusted input could otherwise be crafted to trigger quick sort's quadratic case.",
    "Systems that need quick sort's average speed but cannot accept its worst case.",
  ],
  advantages: [
    "O(n log n) worst case, unlike plain quick sort.",
    "Keeps quick sort's speed and cache behaviour on ordinary input — the fallback rarely fires.",
    "In-place, with O(log n) stack depth thanks to recursing into the smaller side.",
  ],
  disadvantages: [
    "Not stable — neither quick sort nor heap sort preserves the order of equal elements.",
    "Considerably more code than any of the three sorts it is made of.",
    "The thresholds are tuned constants, not derived ones, so it is fast in practice rather than optimal in theory.",
  ],
  pseudocode: [
    "if size <= SMALL: leave it for the final insertion pass",
    "if depthLimit == 0: heapSort(lo, hi); return",
    "depthLimit--",
    "p = partition(lo, hi)",
    "  compare a[j] with pivot",
    "  swap into place",
    "finally: one insertion sort pass over the whole array",
  ],
  stable: false,
  run,
  count,
};
