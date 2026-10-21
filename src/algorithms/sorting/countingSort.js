import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { TALLY: 0, PREFIX: 1, PLACE: 2, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;
  if (n === 0) {
    ctx.emit({ line: LINE.DONE });
    return;
  }

  ctx.m.read(n);
  const min = Math.min(...a);
  const max = Math.max(...a);
  const k = max - min + 1;

  // The counting array is indexed by *key*, not by position, which is the
  // whole trick and also the whole cost: it is sized by the range of the
  // values, so a single outlier makes it enormous no matter how few elements
  // there are.
  const counts = new Array(k).fill(0);

  // Built only when frames are being collected. `emit` is a no-op under
  // count(), but its arguments are still evaluated, and this one is O(k) —
  // leaving it unguarded made the complexity sweep O(n·k) instead of O(n+k),
  // which is the very claim the sweep exists to plot.
  const auxOf = (active, label) =>
    ctx.collect
      ? { label, active, cells: counts.map((value, i) => ({ label: String(min + i), value })) }
      : undefined;

  ctx.m.aux(n + k);

  for (let i = 0; i < n; i++) {
    ctx.m.read();
    counts[a[i] - min]++;
    ctx.m.write();
    ctx.emit({ compare: [i], aux: auxOf(a[i] - min, "COUNT OF EACH VALUE"), line: LINE.TALLY });
  }

  // Turning the tallies into running totals turns "how many of this value"
  // into "one past the last slot this value owns", which is what lets the
  // placement pass put an element straight into its final index.
  for (let i = 1; i < k; i++) {
    counts[i] += counts[i - 1];
    ctx.m.read();
    ctx.m.write();
    ctx.emit({ aux: auxOf(i, "RUNNING TOTAL: LAST SLOT EACH VALUE OWNS"), line: LINE.PREFIX });
  }

  // Reading from a snapshot lets each element be written straight into its
  // final slot in the live array, so the bars land where they belong instead
  // of being copied back from a second array afterwards.
  const srcValues = [...a];
  const srcTags = [...tags];

  // Walking the input backwards is what makes this stable: the last copy of a
  // value claims the last slot that value owns, so equal elements keep their
  // original order.
  for (let i = n - 1; i >= 0; i--) {
    const value = srcValues[i];
    const slot = --counts[value - min];
    ctx.m.write();
    ctx.put(slot, value, srcTags[i]);
    ctx.markSorted(slot);
    ctx.emit({ swap: [slot], aux: auxOf(value - min, "RUNNING TOTAL: LAST SLOT EACH VALUE OWNS"), line: LINE.PLACE });
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const countingSort = {
  key: "counting",
  label: "Counting Sort",
  category: "sorting",
  desc: "A non-comparison sort that tallies how many times each value occurs, turns those tallies into running totals, and uses them to write every element straight into its final index.",
  time: { best: "O(n + k)", avg: "O(n + k)", worst: "O(n + k)" },
  space: "O(n + k)",
  overview:
    "Counting sort never compares two elements. It counts how many times each distinct value appears, converts those counts into running totals — so each value knows exactly which block of indices it owns — and then walks the input backwards, dropping each element into the last free slot of its block. Its running time is O(n + k) where k is the range of the values, which beats the O(n log n) comparison bound because it is not a comparison sort at all. The catch is in the k: sorting three numbers that happen to span a million needs a million counters.",
  howItWorks: [
    "Find the minimum and maximum, and make a counter for every value in that range.",
    "Walk the array once, incrementing the counter for each element's value.",
    "Convert the counters to running totals, so each entry holds one past the last index that value owns.",
    "Walk the input backwards; for each element, decrement its counter and write the element at that index.",
    "Going backwards is what makes the sort stable — the last equal element claims the last slot.",
  ],
  useCases: [
    "Sorting integers from a small, known range — ages, exam scores, byte values, pixel intensities.",
    "As the stable inner pass of radix sort, which is what makes radix sort work at all.",
    "Histogram and frequency work, where the counting array is useful in its own right.",
  ],
  advantages: [
    "Linear in n when the value range is comparable to the number of elements.",
    "Stable, which is what lets radix sort chain it across digit positions.",
    "No comparisons at all, so it sidesteps the O(n log n) comparison lower bound.",
  ],
  disadvantages: [
    "Memory and time both scale with the range of the values, not just their count — one outlier is enough to ruin it.",
    "Only works on keys that can index an array: integers, or things mappable to them.",
    "Needs O(n + k) extra space, so it is not in-place.",
  ],
  pseudocode: [
    "for x in a: count[x]++",
    "for i in 1..k: count[i] += count[i-1]",
    "for i = n-1 down to 0: out[--count[a[i]]] = a[i]",
  ],
  stable: true,
  run,
  count,
};
