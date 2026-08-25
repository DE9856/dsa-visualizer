/**
 * Whether a run kept equal elements in their original relative order.
 *
 * Every frame carries a `tags` array: the index each element started at. Two
 * elements with the same value are indistinguishable by value alone, so the
 * tags are the only way to see that a sort moved one past the other — which
 * is exactly what "stable" means and exactly what a bar chart of numbers
 * cannot show on its own.
 *
 * The check works run by run: within a stretch of equal values, a stable sort
 * must leave the tags in ascending order, so every slot whose tag isn't the
 * one ascending order would put there is a displaced element. Counting
 * adjacent descents instead would be much cheaper and much too forgiving — a
 * thoroughly shuffled run of thirty equal keys can contain a single descent.
 */
export function checkStability(step) {
  const values = step?.array;
  const tags = step?.tags;
  if (!values || !tags || values.length !== tags.length) {
    return { stable: true, breaks: [], ties: 0 };
  }

  const breaks = [];
  let ties = 0;
  let lo = 0;
  while (lo < values.length) {
    let hi = lo;
    while (hi + 1 < values.length && values[hi + 1] === values[lo]) hi++;
    if (hi > lo) {
      ties += hi - lo + 1;
      const stableOrder = tags.slice(lo, hi + 1).sort((a, b) => a - b);
      for (let i = lo; i <= hi; i++) {
        if (tags[i] !== stableOrder[i - lo]) breaks.push(i);
      }
    }
    lo = hi + 1;
  }
  return { stable: breaks.length === 0, breaks, ties };
}

/**
 * A hue for an element's original position, so duplicates that look identical
 * as bars are still told apart. Spread by the golden angle rather than along a
 * ramp: neighbouring originals need to be distinguishable, and a gradient
 * would make the two halves of a merge look like one blur.
 */
export function tagHue(tag, total) {
  if (!Number.isFinite(tag) || !total) return 0;
  return Math.round((tag * 360 * 0.618) % 360);
}
