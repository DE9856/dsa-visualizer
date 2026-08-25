import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { GAP: 0, COMPARE: 2, SWAP: 3, DONE: null };

/**
 * The gap sequence is the whole algorithm: shell sort is a gapped insertion
 * sort, and which gaps you pick is what moves its worst case between O(n²)
 * and O(n^4/3). Each entry returns gaps in descending order, always ending
 * at 1 — the final pass has to be an ordinary insertion sort or the array
 * isn't sorted.
 */
export const GAP_SEQUENCES = {
  // Shell's original: halve until 1. Simple, and the one with the O(n²)
  // worst case, because the gaps share factors and early passes can leave
  // whole interleaved subsequences untouched by each other.
  shell: (n) => {
    const out = [];
    for (let g = Math.floor(n / 2); g > 0; g = Math.floor(g / 2)) out.push(g);
    return out;
  },
  // Knuth's 1, 4, 13, 40, ... (h = 3h + 1). Coprime-ish gaps mix the
  // subsequences much better; O(n^3/2) worst case.
  knuth: (n) => {
    const out = [];
    for (let h = 1; h < n; h = 3 * h + 1) out.push(h);
    return out.reverse();
  },
  // Sedgewick's 1, 5, 19, 41, 109, 209, 505, ... — the best-known worst case
  // here at O(n^4/3), from interleaving two formulas by the parity of k.
  sedgewick: (n) => {
    const out = [];
    for (let k = 0; k < 32; k++) {
      const gap =
        k % 2 === 0
          ? 9 * (2 ** k - 2 ** (k / 2)) + 1
          : 8 * 2 ** k - 6 * 2 ** ((k + 1) / 2) + 1;
      // The first gap is already >= n for n of 1 or 2, so one is kept
      // regardless: a sequence with no gap of 1 wouldn't sort at all.
      if (gap >= n && out.length) break;
      out.push(gap);
    }
    return out.reverse();
  },
};

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;
  const sequence = GAP_SEQUENCES[ctx.options.gaps] || GAP_SEQUENCES.shell;
  const gaps = sequence(n).filter((g) => g > 0 && g < Math.max(n, 2));

  ctx.emit({ line: LINE.GAP, gap: gaps[0] ?? 1 });

  for (const gap of gaps) {
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap && ctx.gt(j - gap, j)) {
        ctx.emit({ compare: [j - gap, j], gap, line: LINE.COMPARE });
        ctx.swap(j - gap, j);
        ctx.emit({ swap: [j - gap, j], gap, line: LINE.SWAP });
        j -= gap;
      }
    }
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const shellSort = {
  key: "shell",
  label: "Shell Sort",
  category: "sorting",
  desc: "A generalization of insertion sort that first compares far-apart elements using a shrinking gap sequence, moving elements closer to their final position before finishing with a normal gap-1 insertion pass.",
  time: { best: "O(n log n)", avg: "O(n^1.3)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Shell sort improves on insertion sort by comparing and moving elements that are far apart first, using a shrinking gap sequence, which lets out-of-place elements travel toward their final position in bigger jumps before the array is fine-tuned with a standard insertion sort at gap 1.",
  howItWorks: [
    "Start with a gap, typically n/2.",
    "Compare elements that are 'gap' positions apart and swap them if out of order, like a gapped insertion sort.",
    "Shrink the gap, usually by halving it, and repeat the gapped comparisons.",
    "Continue shrinking the gap until it reaches 1, performing a final ordinary insertion sort pass.",
    "The array is fully sorted once the gap-1 pass completes.",
  ],
  useCases: [
    "Medium-sized arrays where insertion sort's O(n\u00B2) behavior is too slow but the overhead of merge/quick sort isn't justified.",
    "Embedded or memory-constrained systems, since it sorts in place with O(1) extra space.",
    "As a simpler alternative to more complex O(n log n) sorts when average-case performance is good enough.",
  ],
  advantages: [
    "Noticeably faster than plain insertion sort in practice, especially on partially ordered data.",
    "In-place — needs no extra memory beyond the input array.",
    "Simple to implement, with no recursion required.",
  ],
  disadvantages: [
    "Worst-case time complexity depends heavily on the chosen gap sequence, and can be O(n\u00B2).",
    "Not stable — equal elements can be reordered relative to each other.",
    "More complex to analyze than basic O(n\u00B2) sorts.",
  ],
  pseudocode: [
    "for gap in sequence (descending, ending at 1):",
    "  for i in gap..n:",
    "    while j>=gap and a[j-gap]>a[j]:",
    "      swap(a[j-gap], a[j]); j -= gap",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: false,
  variants: [
    {
      key: "gaps",
      label: "GAPS",
      default: "shell",
      options: [
        { key: "shell", label: "Shell n/2", desc: "The original halving sequence. O(n²) worst case — the gaps share factors, so early passes barely help each other." },
        { key: "knuth", label: "Knuth 3h+1", desc: "1, 4, 13, 40, … O(n^3/2) worst case." },
        { key: "sedgewick", label: "Sedgewick", desc: "1, 5, 19, 41, 109, … O(n^4/3) worst case, the best known of the three." },
      ],
    },
  ],
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};