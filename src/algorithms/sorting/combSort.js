import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { GAP: 0, COMPARE: 2, SWAP: 3, DONE: null };

/**
 * The shrink factor is the whole algorithm. Bubble sort's problem is a small
 * value near the end — a "turtle" — which can only crawl one place per pass;
 * comparing across a gap lets it move far in one swap instead. 1.3 is the
 * empirically chosen factor from the original paper: large enough to kill
 * turtles quickly, small enough that the gap sequence still ends in enough
 * gap-1 passes to finish the job.
 */
const SHRINK = { "1.3": 1.3, "1.25": 1.25, "2": 2 };

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;
  const shrink = SHRINK[ctx.options.shrink] || SHRINK["1.3"];

  let gap = n;
  let swapped = true;

  ctx.emit({ line: LINE.GAP, gap });

  // The loop cannot stop merely because the gap reached 1: a gap-1 pass is an
  // ordinary bubble pass, and one of those proves nothing until it manages a
  // full sweep without swapping.
  while (gap > 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / shrink));
    swapped = false;

    for (let i = 0; i + gap < n; i++) {
      ctx.emit({ compare: [i, i + gap], gap, line: LINE.COMPARE });
      if (ctx.gt(i, i + gap)) {
        ctx.swap(i, i + gap);
        ctx.emit({ swap: [i, i + gap], gap, line: LINE.SWAP });
        swapped = true;
      }
    }
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const combSort = {
  key: "comb",
  label: "Comb Sort",
  category: "sorting",
  desc: "Bubble sort with a shrinking gap: it first compares elements far apart so small values stranded near the end can travel in one swap, then finishes with ordinary adjacent passes.",
  time: { best: "O(n log n)", avg: "O(n\u00B2/2^p)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Comb sort is bubble sort with one change: instead of always comparing neighbours, it compares elements a shrinking gap apart. Bubble sort's weakness is a small value near the end of the array — a turtle — which moves left only one position per pass. A large gap lets that value jump most of the way home in a single swap, and by the time the gap shrinks to 1 the array is nearly ordered, so the final bubble passes have almost nothing left to do.",
  howItWorks: [
    "Start with a gap equal to the array length.",
    "Divide the gap by the shrink factor (1.3 in the original paper) and floor it, to at least 1.",
    "Sweep the array once, comparing each element with the one 'gap' positions ahead and swapping them if they are out of order.",
    "Repeat with a smaller gap each time.",
    "Once the gap reaches 1 the passes are ordinary bubble passes; keep going until a full pass makes no swaps at all.",
  ],
  useCases: [
    "A drop-in improvement when bubble sort is already in the code and the array is large enough for its O(n\u00B2) behaviour to hurt.",
    "Teaching why turtles, not rabbits, are what makes bubble sort slow.",
    "Memory-constrained settings that want better-than-quadratic typical behaviour without recursion or extra storage.",
  ],
  advantages: [
    "Dramatically faster than bubble sort in practice for almost no extra code.",
    "In-place and non-recursive, needing O(1) extra space.",
    "Adaptive in the sense that a nearly sorted array finishes in few passes.",
  ],
  disadvantages: [
    "Still O(n\u00B2) in the worst case, so it loses to merge or quick sort on large inputs.",
    "Not stable — a gapped swap can jump one element past an equal one.",
    "Performance depends on the shrink factor, which is an empirical constant rather than a derived one.",
  ],
  pseudocode: [
    "gap = n; swapped = true",
    "while gap > 1 or swapped:",
    "  gap = max(1, gap / shrink); swapped = false",
    "  for i in 0..n-gap: if a[i] > a[i+gap]: swap; swapped = true",
  ],
  stable: false,
  variants: [
    {
      key: "shrink",
      label: "SHRINK",
      default: "1.3",
      options: [
        { key: "1.3", label: "1.3", desc: "The factor from the original paper — the empirical sweet spot." },
        { key: "1.25", label: "1.25", desc: "Shrinks more slowly: more passes, each doing less." },
        { key: "2", label: "2", desc: "Halving. Reaches gap 1 fastest and so leaves the most work for the bubble passes." },
      ],
    },
  ],
  run,
  count,
};
