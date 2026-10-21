import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { SCATTER: 0, SORT_BUCKET: 2, GATHER: 3, DONE: null };

// How many buckets, as a function of n. Bucket sort is linear only when the
// elements spread evenly, and the bucket count is the knob that decides how
// forgiving that assumption is.
const BUCKET_COUNTS = {
  n: (n) => n,
  half: (n) => Math.max(1, Math.floor(n / 2)),
  few: () => 4,
};

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;
  if (n === 0) {
    ctx.emit({ line: LINE.DONE });
    return;
  }

  const sizeFor = BUCKET_COUNTS[ctx.options.buckets] || BUCKET_COUNTS.half;
  const k = Math.max(1, sizeFor(n));

  ctx.m.read(n);
  const min = Math.min(...a);
  const max = Math.max(...a);
  // A constant array would put everything in bucket 0 and divide by zero
  // otherwise; spreading over a range of at least 1 keeps the map total.
  const span = max - min + 1;

  const buckets = Array.from({ length: k }, () => []);
  // Only built when frames are being collected — see the note in countingSort:
  // an O(k) argument to a no-op emit still costs O(k).
  const auxOf = (active, label) =>
    ctx.collect
      ? { label, active, cells: buckets.map((b, i) => ({ label: `b${i}`, value: b.length })) }
      : undefined;

  ctx.m.aux(n + k);

  // Scatter: each element goes to the bucket its value falls in. No
  // comparison happens here — the bucket is computed arithmetically, which is
  // why the distribution of the data, not its size, decides the cost.
  for (let i = 0; i < n; i++) {
    ctx.m.read();
    const index = Math.min(k - 1, Math.floor(((a[i] - min) / span) * k));
    buckets[index].push([a[i], tags[i]]);
    ctx.emit({ compare: [i], aux: auxOf(index, "BUCKET SIZES"), line: LINE.SCATTER });
  }

  // Gather: sort each bucket and write it back. Because the buckets are
  // visited in order and each is sorted stably, the array comes out sorted
  // and equal elements keep their original order.
  let write = 0;
  for (let b = 0; b < k; b++) {
    const bucket = buckets[b];
    if (bucket.length === 0) continue;
    const from = write;
    const to = write + bucket.length - 1;
    const bands = [{ from, to, tone: "bucket", label: `bucket ${b}` }];

    // Insertion sort inside the bucket: buckets are meant to be short, and on
    // a short nearly-arbitrary list nothing beats it.
    for (let i = 1; i < bucket.length; i++) {
      const held = bucket[i];
      let j = i - 1;
      ctx.emit({ aux: auxOf(b, "BUCKET SIZES"), bands, line: LINE.SORT_BUCKET });
      while (j >= 0 && ctx.ltValues(held[0], bucket[j][0])) {
        bucket[j + 1] = bucket[j];
        j--;
      }
      bucket[j + 1] = held;
    }

    for (const [value, tag] of bucket) {
      ctx.put(write, value, tag);
      ctx.markSorted(write);
      ctx.emit({ swap: [write], aux: auxOf(b, "BUCKET SIZES"), bands, line: LINE.GATHER });
      write++;
    }
  }

  ctx.markAll();
  ctx.emit({ line: LINE.DONE });
});

export const bucketSort = {
  key: "bucket",
  label: "Bucket Sort",
  category: "sorting",
  desc: "Scatters elements into buckets by value range, sorts each small bucket, then concatenates them — linear when the data spreads evenly, quadratic when it all lands in one bucket.",
  time: { best: "O(n + k)", avg: "O(n + k)", worst: "O(n²)" },
  space: "O(n + k)",
  overview:
    "Bucket sort divides the value range into equal intervals, drops each element into the interval it belongs to, sorts each bucket, and reads the buckets back in order. If the values are spread evenly, every bucket holds a constant number of elements and sorting them all costs O(n) — the sort is linear. The assumption is doing all the work, and it is falsifiable: skew the data so every element lands in one bucket and the inner insertion sort is handed the entire array, which is the O(n²) worst case. Choosing fewer buckets makes that collapse easy to reproduce.",
  howItWorks: [
    "Find the range of the values and divide it into k equal intervals, one per bucket.",
    "Compute each element's bucket arithmetically and append it there — no comparisons in this pass.",
    "Sort each bucket independently, usually with insertion sort since buckets are expected to be short.",
    "Concatenate the buckets in order; because the intervals are ordered, the result is sorted.",
    "Appending within a bucket and visiting buckets in order keeps the whole sort stable.",
  ],
  useCases: [
    "Values known to be uniformly distributed over a range, such as sampled floats in [0, 1).",
    "External sorting, where each bucket is sized to fit in memory and sorted separately.",
    "A parallel first pass: buckets are independent, so they can be sorted on different cores.",
  ],
  advantages: [
    "Linear average time when the data really is evenly spread.",
    "Stable, and the buckets are independent so it parallelises cleanly.",
    "The scatter pass makes no comparisons at all.",
  ],
  disadvantages: [
    "O(n²) when the data is skewed and one bucket takes everything — the linear claim is an assumption about the input, not a guarantee.",
    "Needs O(n + k) extra memory for the buckets.",
    "Requires values that can be mapped to an interval, and a sensible choice of k.",
  ],
  pseudocode: [
    "for x in a: bucket[floor((x-min)/span * k)].push(x)",
    "for each bucket:",
    "  insertion sort it",
    "  append it to the output",
  ],
  stable: true,
  variants: [
    {
      key: "buckets",
      label: "BUCKETS",
      default: "half",
      options: [
        { key: "half", label: "n/2", desc: "About two elements per bucket when the data is even — the usual choice." },
        { key: "n", label: "n", desc: "One bucket per element. Most buckets end up empty or hold one item." },
        { key: "few", label: "4", desc: "Four buckets whatever the size. Try the FEW UNIQUE input shape to watch one bucket take everything and the inner insertion sort go quadratic." },
      ],
    },
  ],
  run,
  count,
};
