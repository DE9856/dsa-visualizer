/**
 * Explicit operation counters for sorting runs.
 *
 * The old `annotateSteps` guessed at counts by looking at what a frame
 * happened to highlight, which meant an algorithm that wrote without drawing
 * a swap (merge sort, radix sort) under-reported, and one that drew a frame
 * per comparison counted the frame rather than the comparison. Every sorting
 * algorithm now calls these methods as it works, so the numbers are what the
 * algorithm actually did — which is what makes racing two of them fair.
 *
 * Counting convention, applied uniformly so cross-algorithm numbers mean
 * something:
 *
 *   compare()      one key comparison, plus the two array reads it implies
 *   compareValues()one key comparison between values already read
 *   read(k)        k array reads that aren't part of a comparison
 *   write(k)       k array writes
 *   swap()         2 reads + 2 writes (the exchange itself)
 *   aux(n)         auxiliary storage currently held, in elements
 *   atDepth(d)     recursion depth d (root is 0)
 */
export function createMetrics() {
  let comparisons = 0;
  let reads = 0;
  let writes = 0;
  let aux = 0;
  let auxPeak = 0;
  let depth = 0;

  return {
    compare() {
      comparisons++;
      reads += 2;
    },
    compareValues() {
      comparisons++;
    },
    read(k = 1) {
      reads += k;
    },
    write(k = 1) {
      writes += k;
    },
    swap() {
      reads += 2;
      writes += 2;
    },
    // High-water mark, not a running total: "how much extra memory did this
    // need at once" is the number that separates an in-place sort from one
    // that copies the array.
    aux(n) {
      aux = n;
      if (n > auxPeak) auxPeak = n;
    },
    atDepth(d) {
      // Depth is reported as a count of stack frames, so a non-recursive
      // sort reports 0 and a single top-level call reports 1.
      if (d + 1 > depth) depth = d + 1;
    },
    /** Cumulative counts as of right now. Frames each keep their own copy. */
    snapshot() {
      return { comparisons, reads, writes, aux: auxPeak, depth };
    },
  };
}

export const EMPTY_STATS = { comparisons: 0, reads: 0, writes: 0, aux: 0, depth: 0 };

/**
 * The single number used to line two runs up "by work done" and to plot
 * empirical complexity. Reads are excluded deliberately: they scale with the
 * same loops as comparisons and would just double-count them, while writes
 * are what separates selection sort (few) from bubble sort (many).
 */
export function operationCount(stats) {
  if (!stats) return 0;
  return stats.comparisons + stats.writes;
}

/** The metric keys the scoreboard shows, in the order it shows them. */
export const STAT_COLUMNS = [
  { key: "comparisons", label: "CMP", title: "Key comparisons", color: "var(--blue)" },
  { key: "reads", label: "RD", title: "Array reads", color: "var(--text-dim)" },
  { key: "writes", label: "WR", title: "Array writes", color: "var(--red)" },
  { key: "aux", label: "AUX", title: "Auxiliary memory high-water mark, in elements", color: "var(--yellow)" },
  { key: "depth", label: "DEP", title: "Maximum recursion depth", color: "var(--purple)" },
];
