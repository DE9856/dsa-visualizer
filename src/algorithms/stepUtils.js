// Walks a raw step list and attaches cumulative comparison/write counters
// so the UI can show a running "CMP" / "SWP" readout without recomputing
// on every render.
export function annotateSteps(steps) {
  let c = 0;
  let s = 0;
  return steps.map((step) => {
    const hasCompare =
      (step.compare && step.compare.length) ||
      (step.checking !== undefined && step.checking >= 0) ||
      (step.mid !== undefined && step.mid >= 0);
    const hasSwap = step.swap && step.swap.length;
    if (hasCompare) c++;
    if (hasSwap) s++;
    return { ...step, cCount: c, sCount: s };
  });
}
