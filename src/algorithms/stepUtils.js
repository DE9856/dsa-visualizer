import { EMPTY_STATS } from "./metrics.js";

/**
 * Gives every frame a `stats` object and the two short counters the transport
 * bar reads (`cCount` / `sCount`).
 *
 * Sorting algorithms count their own work as they go and arrive here with
 * `stats` already attached — those frames pass through untouched apart from
 * the short counters being derived from them. Searching algorithms don't
 * carry counters of their own, so their frames are still counted the old
 * heuristic way: one comparison per frame that highlights something being
 * looked at, one write per frame that highlights something being moved. That
 * is exact for a linear scan and close enough for the range searches, whose
 * whole cost *is* the frames they draw.
 */
export function annotateSteps(steps) {
  let c = 0;
  let s = 0;
  return steps.map((step) => {
    if (step.stats) {
      return { ...step, cCount: step.stats.comparisons, sCount: step.stats.writes };
    }
    const hasCompare =
      (step.compare && step.compare.length) ||
      (step.checking !== undefined && step.checking >= 0) ||
      (step.mid !== undefined && step.mid >= 0);
    const hasSwap = step.swap && step.swap.length;
    if (hasCompare) c++;
    if (hasSwap) s++;
    return {
      ...step,
      cCount: c,
      sCount: s,
      stats: { ...EMPTY_STATS, comparisons: c, reads: 2 * c, writes: s },
    };
  });
}
