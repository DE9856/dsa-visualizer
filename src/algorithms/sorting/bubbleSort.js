import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below. Every frame carries the line it is
// executing so the panel can follow along; DONE means the run has finished
// and no line is executing.
const LINE = { COMPARE: 2, SWAP: 3, DONE: null };

// The comparison happens before the frame that shows it, so the counters the
// frame carries include the work it is illustrating. Every sort here follows
// that order.
const { run, count } = makeSort((ctx) => {
  const { n } = ctx;

  for (let i = 0; i < n - 1; i++) {
    let swappedAny = false;
    for (let j = 0; j < n - 1 - i; j++) {
      const outOfOrder = ctx.gt(j, j + 1);
      ctx.emit({ compare: [j, j + 1], line: LINE.COMPARE });
      if (outOfOrder) {
        ctx.swap(j, j + 1);
        ctx.emit({ swap: [j, j + 1], line: LINE.SWAP });
        swappedAny = true;
      }
    }
    ctx.markSorted(n - 1 - i);
    if (!swappedAny) {
      ctx.markRange(0, n - 1 - i);
      break;
    }
  }
  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const bubbleSort = {
  key: "bubble",
  label: "Bubble Sort",
  category: "sorting",
  desc: "Repeatedly walks the array, swapping adjacent elements that are out of order. Each pass bubbles the largest remaining value to its final position.",
  time: { best: "O(n)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Bubble sort is one of the simplest sorting algorithms to understand and implement, which makes it a common teaching tool even though it performs poorly on large datasets compared to more advanced algorithms.",
  howItWorks: [
    "Compare each pair of adjacent elements in the array, starting from the beginning.",
    "If the elements are out of order (left is bigger than right), swap them.",
    "After one full pass, the largest unsorted element has bubbled to its correct position at the end.",
    "Repeat the passes over the remaining unsorted portion until no swaps are needed.",
  ],
  useCases: [
    "Teaching the mechanics of comparisons and swaps to beginners.",
    "Sorting very small or nearly-sorted datasets where simplicity outweighs speed.",
    "Detecting whether a list is already sorted, since it can exit early once a pass makes no swaps.",
  ],
  advantages: [
    "Extremely simple to understand and implement.",
    "Stable sort — equal elements keep their relative order.",
    "In-place — needs only O(1) extra memory.",
    "Can detect an already-sorted array in O(n) time with the early-exit optimization.",
  ],
  disadvantages: [
    "O(n\u00B2) time complexity makes it impractical for large datasets.",
    "Far slower in practice than insertion sort for nearly-sorted data.",
    "Rarely used in production code; mostly of educational value.",
  ],
  pseudocode: [
    "for i in 0..n:",
    "  for j in 0..n-i-1:",
    "    if a[j] > a[j+1]:",
    "      swap(a[j], a[j+1])",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: true,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};
