import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { FIND_RUN: 0, REVERSE: 1, EXTEND: 2, PUSH: 3, MERGE: 5, DONE: null };

/**
 * The real rule: pick a minimum run length in [32, 64] such that n/minrun is
 * a power of two or just under it, which is what keeps the merge tree
 * balanced. For n < 64 it returns n — the whole array is one run, and Timsort
 * is exactly a binary insertion sort. That is true and it is also why the
 * RUN LENGTH control exists: at the array sizes that fit on screen, the real
 * rule leaves nothing to merge.
 */
function minRunLength(n) {
  let r = 0;
  let x = n;
  while (x >= 64) {
    r |= x & 1;
    x >>= 1;
  }
  return x + r;
}

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;
  if (n < 2) {
    ctx.markAll();
    ctx.emit({ line: LINE.DONE });
    return;
  }

  const chosen = ctx.options.minrun;
  const minrun =
    chosen === "auto" || chosen === undefined
      ? minRunLength(n)
      : Math.max(2, Math.min(n, parseInt(chosen, 10) || 8));

  // The run stack: each entry is a [start, length] pair of a sorted stretch.
  // Drawing it every frame is the point — the invariants below exist to keep
  // these lengths balanced, and you can watch a merge fire the moment one is
  // violated.
  const stack = [];
  const bandsOf = (extra = []) => [
    ...stack.map((r, i) => ({
      from: r.start,
      to: r.start + r.len - 1,
      tone: i % 2 === 0 ? "runA" : "runB",
      label: `run ${r.len}`,
    })),
    ...extra,
  ];

  /**
   * The length of the already-ordered stretch starting at `lo`. A strictly
   * descending stretch counts too and is reversed in place — reversing only
   * on *strict* descent is what keeps the sort stable, since equal elements
   * are never turned around.
   */
  function countRun(lo) {
    if (lo === n - 1) return 1;
    let hi = lo + 1;
    ctx.emit({ compare: [lo, hi], bands: bandsOf(), line: LINE.FIND_RUN });
    if (ctx.lt(hi, lo)) {
      while (hi + 1 < n) {
        ctx.emit({ compare: [hi, hi + 1], bands: bandsOf(), line: LINE.FIND_RUN });
        if (!ctx.lt(hi + 1, hi)) break;
        hi++;
      }
      for (let i = lo, j = hi; i < j; i++, j--) {
        ctx.swap(i, j);
        ctx.emit({ swap: [i, j], bands: bandsOf(), line: LINE.REVERSE });
      }
    } else {
      while (hi + 1 < n) {
        ctx.emit({ compare: [hi, hi + 1], bands: bandsOf(), line: LINE.FIND_RUN });
        if (ctx.lt(hi + 1, hi)) break;
        hi++;
      }
    }
    return hi - lo + 1;
  }

  /** Insertion-sorts a[lo..hi], given a[lo..start-1] is already ordered. */
  function extendRun(lo, hi, start) {
    for (let i = start; i <= hi; i++) {
      ctx.m.read();
      const value = a[i];
      const tag = tags[i];
      let j = i - 1;
      ctx.emit({ compare: [i], bands: bandsOf([{ from: lo, to: hi, tone: "extend", label: "extending" }]), line: LINE.EXTEND });
      while (j >= lo) {
        ctx.m.read();
        if (!ctx.ltValues(value, a[j])) break;
        ctx.put(j + 1, a[j], tags[j]);
        ctx.emit({ swap: [j, j + 1], bands: bandsOf([{ from: lo, to: hi, tone: "extend", label: "extending" }]), line: LINE.EXTEND });
        j--;
      }
      ctx.put(j + 1, value, tag);
    }
  }

  /** Merges the two adjacent runs at stack positions i and i+1. */
  function mergeAt(i) {
    const left = stack[i];
    const right = stack[i + 1];
    const lo = left.start;
    const hi = right.start + right.len - 1;

    // Only the left run is copied out; the right one is merged in place from
    // the front, so the extra memory is the length of one run, not the array.
    ctx.m.read(left.len);
    ctx.m.aux(left.len);
    const buffer = [];
    for (let k = 0; k < left.len; k++) buffer.push([a[lo + k], tags[lo + k]]);

    let p = 0;
    let q = right.start;
    let dest = lo;
    const mergeBands = () => [{ from: lo, to: hi, tone: "merge", label: `merge ${left.len}+${right.len}` }];

    while (p < buffer.length && q <= hi) {
      ctx.m.read();
      ctx.emit({ compare: [q], bands: mergeBands(), line: LINE.MERGE });
      // <= keeps the left run first on a tie, which is the whole of Timsort's
      // stability guarantee.
      if (ctx.lteValues(buffer[p][0], a[q])) {
        ctx.put(dest, buffer[p][0], buffer[p][1]);
        p++;
      } else {
        ctx.put(dest, a[q], tags[q]);
        q++;
      }
      ctx.emit({ swap: [dest], bands: mergeBands(), line: LINE.MERGE });
      dest++;
    }
    while (p < buffer.length) {
      ctx.put(dest, buffer[p][0], buffer[p][1]);
      ctx.emit({ swap: [dest], bands: mergeBands(), line: LINE.MERGE });
      p++;
      dest++;
    }

    stack.splice(i, 2, { start: lo, len: left.len + right.len });
    ctx.m.aux(0);
  }

  /**
   * The invariants that keep merges balanced: for the top three runs X, Y, Z
   * (deepest first), X > Y + Z and Y > Z. Restoring them merges the smaller
   * neighbour, so runs are combined at similar sizes rather than one giant
   * run repeatedly absorbing a tiny one.
   */
  function collapse() {
    while (stack.length > 1) {
      let i = stack.length - 2;
      if (i > 0 && stack[i - 1].len <= stack[i].len + stack[i + 1].len) {
        if (stack[i - 1].len < stack[i + 1].len) i--;
      } else if (stack[i].len > stack[i + 1].len) {
        break;
      }
      mergeAt(i);
      ctx.emit({ bands: bandsOf(), line: LINE.PUSH });
    }
  }

  let lo = 0;
  while (lo < n) {
    let len = countRun(lo);
    // A natural run shorter than minrun is padded out by insertion sort, so
    // the merge tree never has to deal with dozens of tiny runs.
    if (len < minrun) {
      const hi = Math.min(n - 1, lo + minrun - 1);
      extendRun(lo, hi, lo + len);
      len = hi - lo + 1;
    }
    stack.push({ start: lo, len });
    ctx.emit({ bands: bandsOf(), line: LINE.PUSH });
    collapse();
    lo += len;
  }

  // Whatever the invariants left standing gets merged from the top down.
  while (stack.length > 1) {
    mergeAt(stack.length - 2);
    ctx.emit({ bands: bandsOf(), line: LINE.MERGE });
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const timSort = {
  key: "tim",
  label: "Timsort",
  category: "sorting",
  desc: "The sort Python and Java ship: it finds the runs already present in the data, pads the short ones with insertion sort, and merges them in an order chosen to keep the merges balanced.",
  time: { best: "O(n)", avg: "O(n log n)", worst: "O(n log n)" },
  space: "O(n)",
  overview:
    "Timsort starts from an observation about real data: it is rarely random. Logs, records and user input arrive in stretches that are already ordered, and Timsort finds those stretches — runs — instead of ignoring them. It scans for a run, reverses it if it is descending, pads it to a minimum length with insertion sort, and pushes it on a stack. Runs are merged only when doing so keeps the stack balanced, enforced by two size invariants. An already sorted array is one run and costs a single linear scan, which is why sorted and nearly sorted input is where Timsort pulls away from merge sort.",
  howItWorks: [
    "Scan forward from the current position for the longest already-ordered run; if it is strictly descending, reverse it in place.",
    "If that run is shorter than minrun, extend it to minrun with a binary insertion sort.",
    "Push the run onto a stack of pending runs.",
    "After each push, merge while the top runs violate the invariants X > Y + Z and Y > Z, which keeps merged runs at comparable sizes.",
    "When the scan reaches the end, merge whatever runs are left until one remains.",
  ],
  useCases: [
    "The default sort in Python (list.sort, sorted) and in Java for objects.",
    "Data that arrives partly ordered — appended logs, timestamps, records re-sorted on a second key.",
    "Anywhere stability is required, since a stable sort lets you sort by one key and then another.",
  ],
  advantages: [
    "Linear time on sorted or reverse-sorted input, and genuinely faster on the partly ordered data that occurs in practice.",
    "Stable, so equal elements keep their original relative order.",
    "O(n log n) worst case — it never degenerates.",
  ],
  disadvantages: [
    "Needs O(n) auxiliary memory in the worst case for the merge buffer.",
    "By far the most complicated sort here; the run-stack invariants are subtle enough that the original implementation shipped with a bug in them for years.",
    "The bookkeeping costs more than a plain merge sort on uniformly random data, where there are no natural runs to exploit.",
  ],
  pseudocode: [
    "run = longest ordered stretch at lo (reverse if descending)",
    "  ...",
    "if run < minrun: insertion sort up to minrun",
    "push run; while invariants violated: merge",
    "",
    "merge adjacent runs, taking the left one on ties",
  ],
  // Ties are only ever broken toward the left run, and descending runs are
  // reversed only on strict descent, so equal elements never cross.
  stable: true,
  variants: [
    {
      key: "minrun",
      label: "RUN LENGTH",
      default: "8",
      options: [
        { key: "8", label: "8", desc: "Short enough that several runs exist at these array sizes, so the stack and its merges are visible." },
        { key: "4", label: "4", desc: "More, smaller runs — the merge tree gets deeper and the invariants fire more often." },
        { key: "auto", label: "Real rule", desc: "What Timsort actually computes: 32-64, or n itself when n < 64. At the sizes that fit on screen that means one run and a single insertion sort — correct, but nothing to watch." },
      ],
    },
  ],
  run,
  count,
};
