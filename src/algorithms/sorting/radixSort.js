import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { PASS: 0, BUCKET: 1, COLLECT: 2, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;
  ctx.emit({ line: LINE.PASS });
  if (n === 0) return;

  // Radix sort works on non-negative digits, so shift everything up if the
  // array contains negative values — the shift is constant, so relative
  // order (and therefore correctness) is preserved.
  ctx.m.read(n);
  const minVal = Math.min(...a);
  const shift = minVal < 0 ? -minVal : 0;
  const maxShifted = Math.max(...a) + shift;
  // Every element sits in some bucket at once, plus the ten bucket headers.
  ctx.m.aux(n + 10);

  let exp = 1;
  while (Math.floor(maxShifted / exp) > 0) {
    const buckets = Array.from({ length: 10 }, () => []);

    // Distribute each element into a bucket based on its current digit. No
    // key comparison happens anywhere in this loop — that is the whole point
    // of a radix sort, and the scoreboard shows it as a flat zero.
    for (let i = 0; i < n; i++) {
      ctx.m.read();
      ctx.emit({ compare: [i], line: LINE.BUCKET });
      const digit = Math.floor((a[i] + shift) / exp) % 10;
      buckets[digit].push([a[i], tags[i]]);
    }

    // Collect the buckets back into the array, in digit order (0-9). Appending
    // within a bucket and walking the buckets in order is what keeps each pass
    // stable, which is what lets a later pass preserve the order an earlier
    // digit established.
    let k = 0;
    for (let d = 0; d < 10; d++) {
      for (const [value, tag] of buckets[d]) {
        ctx.put(k, value, tag);
        ctx.emit({ swap: [k], line: LINE.COLLECT });
        k++;
      }
    }

    exp *= 10;
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const radixSort = {
  key: "radix",
  label: "Radix Sort",
  category: "sorting",
  desc: "A non-comparison sort that repeatedly buckets numbers by one digit at a time, from least to most significant, using a stable pass for each digit.",
  time: { best: "O(nk)", avg: "O(nk)", worst: "O(nk)" },
  space: "O(n + k)",
  overview:
    "Radix sort sidesteps comparisons entirely: it sorts numbers by processing one digit position at a time — starting from the least significant digit — bucketing elements by that digit and collecting them back in order. Repeating this for every digit position leaves the array fully sorted.",
  howItWorks: [
    "Find the maximum number of digits among all elements.",
    "For each digit position, starting from the least significant, place every element into one of 10 buckets (0-9) based on that digit.",
    "Collect the buckets back into the array in order, preserving the relative order of elements with equal digits.",
    "Move to the next digit position and repeat.",
    "Once every digit position has been processed, the array is fully sorted.",
  ],
  useCases: [
    "Sorting large collections of fixed-length integers, such as IDs, postal codes, or timestamps.",
    "Situations where comparison sorts' O(n log n) lower bound is a real bottleneck and keys have bounded digit length.",
    "As a building block in suffix-array construction and other string-processing algorithms.",
  ],
  advantages: [
    "Linear O(nk) time, avoiding the O(n log n) lower bound that comparison sorts are stuck with.",
    "Stable, so equal elements keep their original relative order.",
    "Predictable performance that doesn't depend on the input's initial order.",
  ],
  disadvantages: [
    "Only works directly on integers (or fixed-length keys) rather than arbitrary comparable types.",
    "Requires O(n + k) extra space for the digit buckets.",
    "Performance depends on the number of digits k — not ideal when keys have highly variable length.",
  ],
  pseudocode: [
    "for each digit position (LSD to MSD):",
    "  bucket elements by that digit (0-9)",
    "  collect buckets back into array",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: true,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};