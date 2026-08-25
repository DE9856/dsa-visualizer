import { createMetrics } from "./metrics.js";
import { makeRng } from "../utils/rng.js";

/**
 * The working state a sorting algorithm mutates, plus the two things every
 * sort needs to do with it: count what it did, and (optionally) record a
 * frame.
 *
 * One body, two modes. `run()` collects frames for the visualizer; `count()`
 * runs the identical body with `emit` as a no-op, so the empirical-complexity
 * sweep can push n to a few thousand without materializing (or copying the
 * array for) millions of frames. Writing the algorithm once against this
 * context is what keeps the two from drifting apart — the counts a plot shows
 * are produced by the same code the animation runs.
 *
 * `tags` is the second half of the stability demo: it holds, for each slot,
 * the index the element there started at. Every value move goes through
 * `swap`/`put`, which move the tag alongside, so a sort that reorders equal
 * elements shows it in the tags even though the values look identical.
 */
export function createSortContext(input, options = {}, collect = true) {
  const a = [...input];
  const n = a.length;
  const tags = a.map((_, i) => i);
  const m = createMetrics();
  const steps = [];
  const sortedSet = new Set();
  const rand = makeRng(options.seed ?? 1);

  const emit = collect
    ? (fields) => {
        steps.push({
          compare: [],
          swap: [],
          ...fields,
          array: [...a],
          tags: [...tags],
          sorted: [...sortedSet],
          stats: m.snapshot(),
        });
      }
    : () => {};

  return {
    a,
    n,
    tags,
    m,
    rand,
    options,
    collect,
    sortedSet,
    emit,

    markSorted(i) {
      sortedSet.add(i);
    },
    markRange(lo, hi) {
      for (let i = lo; i <= hi; i++) sortedSet.add(i);
    },
    markAll() {
      for (let i = 0; i < n; i++) sortedSet.add(i);
    },

    /** a[i] > a[j] — one comparison, two reads. */
    gt(i, j) {
      m.compare();
      return a[i] > a[j];
    },
    /** a[i] < a[j] — one comparison, two reads. */
    lt(i, j) {
      m.compare();
      return a[i] < a[j];
    },
    /** x <= y for values already read out of the array — comparison only. */
    lteValues(x, y) {
      m.compareValues();
      return x <= y;
    },
    /** x < y for values already read out of the array — comparison only. */
    ltValues(x, y) {
      m.compareValues();
      return x < y;
    },

    swap(i, j) {
      m.swap();
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
      const tt = tags[i];
      tags[i] = tags[j];
      tags[j] = tt;
    },

    /** Writes a value (and the tag that travels with it) into slot i. */
    put(i, value, tag) {
      m.write();
      a[i] = value;
      tags[i] = tag;
    },

    /** What `run` returns; `count` takes just the stats off it. */
    finish() {
      return { steps, stats: m.snapshot(), array: a, tags };
    },
  };
}

/**
 * Wraps an algorithm body into the `run` / `count` pair every sorting module
 * exports. The body gets the context and returns nothing — the frames and
 * counters it produced are read back off the context.
 */
export function makeSort(body) {
  return {
    run(input, options) {
      const ctx = createSortContext(input, options, true);
      body(ctx);
      return ctx.finish().steps;
    },
    count(input, options) {
      const ctx = createSortContext(input, options, false);
      body(ctx);
      return ctx.finish().stats;
    },
  };
}
