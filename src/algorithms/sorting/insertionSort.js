import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { OUTER: 0, COMPARE: 2, SWAP: 3 };

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;
  ctx.markSorted(0);
  ctx.emit({ line: LINE.OUTER });

  for (let i = 1; i < n; i++) {
    let j = i;
    // The guard comparison that ends the while loop is a real comparison and
    // is counted, which is exactly why insertion sort reports ~n on sorted
    // input instead of 0.
    while (j > 0 && ctx.gt(j - 1, j)) {
      ctx.emit({ compare: [j - 1, j], line: LINE.COMPARE });
      ctx.swap(j - 1, j);
      ctx.emit({ swap: [j - 1, j], line: LINE.SWAP });
      j--;
    }
    // Element i has landed; the next outer iteration picks up the one after.
    ctx.markRange(0, i);
    ctx.emit({ line: LINE.OUTER });
  }
});

export const insertionSort = {
  key: "insertion",
  label: "Insertion Sort",
  category: "sorting",
  desc: "Builds a sorted region one element at a time, shifting each new value backward until it lands in its correct spot.",
  time: { best: "O(n)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Insertion sort builds the final sorted array one element at a time, in much the same way many people sort a hand of playing cards.",
  howItWorks: [
    "Start with the second element, treating the first as a sorted region of size one.",
    "Take the next unsorted element and compare it backward against the sorted region.",
    "Shift larger elements one position to the right to make room.",
    "Insert the element into its correct position within the sorted region.",
    "Repeat until every element has been inserted.",
  ],
  useCases: [
    "Sorting small arrays or arrays that are already nearly sorted.",
    "As the final pass in hybrid algorithms like Timsort and introsort, once sub-arrays become small.",
    "Online sorting, where data arrives one item at a time.",
  ],
  advantages: [
    "Very efficient on small or nearly-sorted inputs, close to O(n).",
    "Simple, in-place, and stable.",
    "Adaptive — running time shrinks as the input becomes more sorted.",
    "Works well as an online algorithm since it can sort data as it arrives.",
  ],
  disadvantages: [
    "O(n\u00B2) worst-case time makes it unsuitable for large, unsorted datasets.",
    "Shifting elements is costly for array-based implementations.",
  ],
  pseudocode: [
    "for i in 1..n:",
    "  j = i",
    "  while j>0 and a[j-1]>a[j]:",
    "    swap(a[j-1], a[j]); j--",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: true,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};
