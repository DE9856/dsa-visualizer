import { makeSort } from "../sortContext.js";

// Comparison-based Counting Sort: instead of tallying frequencies by value
// (which needs a range-sized aux array), for each element we *count* how many
// elements are smaller than it via direct comparisons — that count is exactly
// the final index of the element in the sorted output. Ties are broken by
// original position so equal elements keep stable order.
// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { COUNT: 3, PLACE: 6, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;
  const counts = new Array(n).fill(0);
  // The rank array and the output array, both n long, are live at the same
  // time during the placement phase.
  ctx.m.aux(2 * n);

  // Phase 1: for every element, compare it against every other element to
  // work out how many belong before it in the final sorted order.
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      // Tie-breaking on the original index costs no key comparison, so only
      // the value test is counted.
      const before = ctx.lt(j, i) || (a[j] === a[i] && j < i);
      ctx.emit({ compare: [i, j], line: LINE.COUNT });
      if (before) counts[i]++;
    }
  }

  // Phase 2: place every element directly at its computed index.
  const outputV = new Array(n);
  const outputT = new Array(n);
  ctx.m.read(n);
  for (let i = 0; i < n; i++) {
    outputV[counts[i]] = a[i];
    outputT[counts[i]] = tags[i];
  }
  for (let k = 0; k < n; k++) {
    ctx.put(k, outputV[k], outputT[k]);
    ctx.markSorted(k);
    ctx.emit({ swap: [k], line: LINE.PLACE });
  }

  ctx.emit({ line: LINE.DONE });
});

export const comparisonCountingSort = {
  key: "comparisonCounting",
  label: "Counting Sort (Comparison)",
  category: "sorting",
  desc: "A comparison-based variant of counting sort: for each element, count how many other elements are smaller than it (ties broken by original index) \u2014 that count is its final position \u2014 then place every element straight into an output array at that index.",
  time: { best: "O(n\u00B2)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(n)",
  overview:
    "This is a comparison-based variant of counting sort: instead of counting occurrences of values like classic counting sort does, it counts, for every element, how many other elements are smaller than it — and that count directly gives the element's final sorted position.",
  howItWorks: [
    "For each element, compare it against every other element in the array.",
    "Count how many elements are smaller, breaking ties using original index to keep the sort stable.",
    "That count is exactly the index the element belongs at in the sorted output.",
    "Place every element directly into an output array at its computed position.",
  ],
  useCases: [
    "Teaching the relationship between comparisons and final sorted position.",
    "Small datasets where an easy-to-reason-about, stable sort is more valuable than speed.",
  ],
  advantages: [
    "Conceptually simple — each element's rank directly determines its destination.",
    "Stable when ties are broken by original index.",
    "Easy to parallelize since each element's position can be computed independently.",
  ],
  disadvantages: [
    "O(n\u00B2) comparisons, since every element is compared against every other.",
    "Requires O(n) extra space for the output array.",
    "Not suitable for large datasets.",
  ],
  pseudocode: [
    "for i in 0..n:",
    "  count[i] = 0",
    "  for j in 0..n:",
    "    if a[j] < a[i] or (a[j]==a[i] and j<i):",
    "      count[i]++",
    "for i in 0..n:",
    "  output[count[i]] = a[i]",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: true,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};
