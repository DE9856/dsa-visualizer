import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { PICK_PIVOT: 0, COMPARE: 2, LESS: 3, GREATER: 4, EQUAL: 5, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;

  const calls = [];
  const enterCall = (lo, hi, depth, parent) => {
    calls.push({ id: calls.length, parent, range: [lo, hi], depth });
    return calls.length - 1;
  };

  /**
   * The Dutch national flag invariant, drawn as it holds:
   *
   *   [lo, lt)   < pivot      [lt, i)  == pivot
   *   [i, gt]    not yet seen (gt, hi] > pivot
   *
   * The unexamined band shrinks from both ends until it vanishes, which is
   * the whole partition. Emitting it every frame is the point of this sort —
   * on input with many duplicates the equal band swallows the array and the
   * recursion stops, where a two-way partition would keep splitting it.
   */
  const flagBands = (lo, hi, lt, i, gt) => {
    const out = [];
    if (lt > lo) out.push({ from: lo, to: lt - 1, tone: "lt", label: "< P" });
    if (i > lt) out.push({ from: lt, to: i - 1, tone: "eq", label: "= P" });
    if (gt >= i) out.push({ from: i, to: gt, tone: "unseen", label: "?" });
    if (hi > gt) out.push({ from: gt + 1, to: hi, tone: "gt", label: "> P" });
    return out;
  };

  function sort(lo, hi, depth, parent) {
    if (lo > hi) return;
    ctx.m.atDepth(depth);
    const id = enterCall(lo, hi, depth, parent);
    if (lo === hi) {
      ctx.markSorted(lo);
      return;
    }

    // Median-of-three moved to the front, so a sorted input does not
    // degenerate the way a fixed first-element pivot would.
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
    if (trio[1][1] !== lo) {
      ctx.swap(trio[1][1], lo);
      ctx.emit({ swap: [trio[1][1], lo], pivot: lo, range: [lo, hi], depth, callId: id, calls, callCount: calls.length, line: LINE.PICK_PIVOT });
    }

    ctx.m.read();
    const pivotVal = ctx.a[lo];

    let lt = lo;
    let i = lo + 1;
    let gt = hi;

    const at = (fields) =>
      ctx.emit({
        ...fields,
        bands: flagBands(lo, hi, lt, i, gt),
        range: [lo, hi],
        depth,
        callId: id,
        calls,
        callCount: calls.length,
      });

    while (i <= gt) {
      at({ compare: [i], line: LINE.COMPARE });
      ctx.m.read();
      const v = ctx.a[i];
      if (ctx.ltValues(v, pivotVal)) {
        ctx.swap(lt, i);
        lt++;
        i++;
        at({ swap: [lt - 1, i - 1], line: LINE.LESS });
      } else if (ctx.ltValues(pivotVal, v)) {
        ctx.swap(i, gt);
        gt--;
        at({ swap: [i, gt + 1], line: LINE.GREATER });
      } else {
        i++;
        at({ line: LINE.EQUAL });
      }
    }

    // Everything equal to the pivot is already in its final place — that is
    // the payoff, and it is why neither recursive call touches [lt, gt].
    ctx.markRange(lt, gt);
    sort(lo, lt - 1, depth + 1, id);
    sort(gt + 1, hi, depth + 1, id);
  }

  if (n > 0) sort(0, n - 1, 0, null);

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const quickSort3Way = {
  key: "quick3",
  label: "3-Way Quick Sort",
  category: "sorting",
  desc: "Quick sort that partitions into three regions — less than, equal to, and greater than the pivot — so every duplicate of the pivot is finished in one pass and never recursed into.",
  time: { best: "O(n)", avg: "O(n log n)", worst: "O(n\u00B2)" },
  space: "O(log n)",
  overview:
    "Ordinary quick sort partitions into two sides, which means a value equal to the pivot still ends up inside one of them and gets sorted again. Three-way partitioning — Dijkstra's Dutch national flag problem — sweeps the range once and grows three bands instead: smaller, equal, larger. Everything in the equal band is already in its final position, so the recursion skips it entirely. On an array of few distinct values this turns quick sort's worst case into its best: an array where every element is equal is sorted in a single linear pass.",
  howItWorks: [
    "Choose a pivot (median-of-three here) and move it to the front of the range.",
    "Keep three boundaries: everything before 'lt' is smaller than the pivot, everything from 'lt' to 'i' equals it, and everything after 'gt' is larger.",
    "Look at the element at 'i'. If it is smaller, swap it down into the less-than band and advance both boundaries.",
    "If it is larger, swap it up to just below 'gt' and shrink the unexamined band from the right — the element swapped in has not been examined, so 'i' does not move.",
    "If it is equal, just advance 'i'. When the unexamined band empties, the equal band is final; recurse only into the two outer bands.",
  ],
  useCases: [
    "Data with many repeated keys — the case that makes a two-way partition quadratic.",
    "Sorting by a low-cardinality field, such as a status, category, or single character.",
    "The standard three-way string quicksort, where the pivot is one character and ties are extremely common.",
  ],
  advantages: [
    "Linear time on an array with a constant number of distinct values.",
    "Never recurses into elements equal to the pivot, so duplicates cost one pass, not a subtree.",
    "In-place, keeping quick sort's small memory footprint.",
  ],
  disadvantages: [
    "Slightly more work per element than a two-way partition when the data is all distinct.",
    "Not stable — the partition swaps elements across the range.",
    "Still O(n\u00B2) in the worst case if the pivot choice is consistently bad.",
  ],
  pseudocode: [
    "pivot = median-of-three, moved to a[lo]",
    "lt = lo; i = lo+1; gt = hi",
    "while i <= gt:",
    "  a[i] < pivot: swap(lt++, i++)",
    "  a[i] > pivot: swap(i, gt--)",
    "  else: i++",
    "sort(lo, lt-1); sort(gt+1, hi)",
  ],
  stable: false,
  run,
  count,
};
