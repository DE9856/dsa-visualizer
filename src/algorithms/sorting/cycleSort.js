import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { START: 0, COUNT: 2, SKIP_DUPES: 3, WRITE: 4, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;

  /**
   * Where `value` belongs: the number of elements smaller than it. Counting
   * is the only way cycle sort ever locates a destination, which is why it
   * costs O(n²) comparisons — and why it can then write each element exactly
   * once, straight into its final slot.
   */
  const destinationOf = (value, from, cycleStart) => {
    let pos = cycleStart;
    for (let i = from; i < n; i++) {
      ctx.m.read();
      ctx.emit({ compare: [i], hold: value, line: LINE.COUNT });
      if (ctx.ltValues(a[i], value)) pos++;
    }
    return pos;
  };

  // Equal elements must not displace each other, or the write would land on a
  // slot already holding the same value and the cycle would never close.
  const skipDuplicates = (value, pos) => {
    let p = pos;
    ctx.m.read();
    while (p < n && a[p] === value) {
      ctx.m.compareValues();
      ctx.emit({ compare: [p], hold: value, line: LINE.SKIP_DUPES });
      p++;
      ctx.m.read();
    }
    return p;
  };

  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    ctx.m.read();
    let value = a[cycleStart];
    let tag = tags[cycleStart];

    ctx.emit({ compare: [cycleStart], hold: value, line: LINE.START });

    let pos = destinationOf(value, cycleStart + 1, cycleStart);
    // Already home — no cycle to rotate.
    if (pos === cycleStart) continue;

    pos = skipDuplicates(value, pos);

    // Drop the held element into its slot and pick up whoever was there. That
    // displaced element is the next link of the cycle.
    ctx.m.read();
    let evictedValue = a[pos];
    let evictedTag = tags[pos];
    ctx.put(pos, value, tag);
    ctx.markSorted(pos);
    ctx.emit({ swap: [pos], hold: evictedValue, line: LINE.WRITE });
    value = evictedValue;
    tag = evictedTag;

    // Follow the cycle until it returns to where it started.
    while (pos !== cycleStart) {
      pos = destinationOf(value, cycleStart + 1, cycleStart);
      pos = skipDuplicates(value, pos);
      ctx.m.read();
      evictedValue = a[pos];
      evictedTag = tags[pos];
      ctx.put(pos, value, tag);
      ctx.markSorted(pos);
      ctx.emit({ swap: [pos], hold: evictedValue, line: LINE.WRITE });
      value = evictedValue;
      tag = evictedTag;
    }
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const cycleSort = {
  key: "cycle",
  label: "Cycle Sort",
  category: "sorting",
  desc: "The sort that writes least: it works out exactly where each element belongs by counting smaller elements, then rotates cycles so every element is written to its final position exactly once.",
  time: { best: "O(n\u00B2)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Cycle sort is built around a single guarantee: no element is ever written twice. It finds where an element belongs by counting how many elements are smaller than it, places it there, picks up whatever it displaced, and repeats — following a permutation cycle until it closes. The comparison count is quadratic and never improves, but the write count is the theoretical minimum, which matters when a write is expensive: flash memory wears out per erase, and EEPROM has a finite number of writes per cell.",
  howItWorks: [
    "Take the element at the current cycle start and hold it.",
    "Count how many elements after it are smaller — that count is the index where it belongs.",
    "If the destination equals the current position the element is already home, so move on.",
    "Skip past any equal elements at the destination, so duplicates do not displace each other.",
    "Write the held element into its destination and pick up the element that was there; repeat until the cycle returns to its starting index.",
  ],
  useCases: [
    "Storage where writing is far more expensive than reading — EEPROM and flash, where every write consumes limited endurance.",
    "Situations where the number of memory writes is the metric being optimised rather than wall-clock time.",
    "Teaching the permutation-cycle view of sorting: a sort as a product of disjoint cycles.",
  ],
  advantages: [
    "Provably minimal number of writes — each element is written at most once.",
    "In-place, needing O(1) extra memory.",
    "The write count is easy to reason about and bounded by n.",
  ],
  disadvantages: [
    "Always O(n\u00B2) comparisons, even on an already sorted array — it is not adaptive at all.",
    "Not stable — equal elements are reordered by the cycle rotations.",
    "Far slower than the O(n log n) sorts whenever writes are not the bottleneck.",
  ],
  pseudocode: [
    "for cycleStart in 0..n-2:",
    "  item = a[cycleStart]",
    "  pos = cycleStart + count of a[i] < item, i > cycleStart",
    "  while a[pos] == item: pos++",
    "  write item at pos, pick up what was there; repeat until cycle closes",
  ],
  stable: false,
  run,
  count,
};
