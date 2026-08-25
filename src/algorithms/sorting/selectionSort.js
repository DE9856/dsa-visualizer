import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { COMPARE: 3, SWAP: 4, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      const smaller = ctx.lt(j, minIdx);
      ctx.emit({ compare: [minIdx, j], pivot: minIdx, line: LINE.COMPARE });
      if (smaller) minIdx = j;
    }
    if (minIdx !== i) {
      ctx.swap(i, minIdx);
      ctx.emit({ swap: [i, minIdx], line: LINE.SWAP });
    }
    ctx.markSorted(i);
  }
  ctx.markSorted(n - 1);
  ctx.emit({ line: LINE.DONE });
});

export const selectionSort = {
  key: "selection",
  label: "Selection Sort",
  category: "sorting",
  desc: "Scans the unsorted region each pass to find the minimum, then swaps it into place at the front of that region.",
  time: { best: "O(n\u00B2)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Selection sort divides the array into a sorted and unsorted region and repeatedly selects the smallest remaining element to extend the sorted region.",
  howItWorks: [
    "Scan the unsorted portion of the array to find the minimum value.",
    "Swap that minimum value into the first position of the unsorted portion.",
    "Shrink the unsorted portion by one element.",
    "Repeat until the entire array is sorted.",
  ],
  useCases: [
    "Situations where the cost of swaps is much higher than comparisons, since it performs at most n swaps.",
    "Teaching selection-based sorting logic.",
    "Small datasets where simplicity matters more than speed.",
  ],
  advantages: [
    "Performs at most O(n) swaps, useful when writes are expensive (e.g. flash memory).",
    "Simple and in-place.",
    "Performance doesn't depend on the initial order of the data.",
  ],
  disadvantages: [
    "O(n\u00B2) time complexity even on already-sorted input — it doesn't adapt.",
    "Not stable in its typical implementation.",
    "Generally outperformed by insertion sort in practice.",
  ],
  pseudocode: [
    "for i in 0..n:",
    "  min = i",
    "  for j in i+1..n:",
    "    if a[j] < a[min]: min = j",
    "  swap(a[i], a[min])",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: false,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};
