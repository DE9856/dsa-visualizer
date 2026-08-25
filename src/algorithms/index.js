import { sortingAlgorithms } from "./sorting";
import { searchingAlgorithms } from "./searching";
import { annotateSteps } from "./stepUtils";
import { EMPTY_STATS } from "./metrics.js";

export const ALGORITHMS = [...sortingAlgorithms, ...searchingAlgorithms];

export const ALGO_MAP = Object.fromEntries(ALGORITHMS.map((a) => [a.key, a]));

export const SORT_KEYS = sortingAlgorithms.map((a) => a.key);
export const SEARCH_KEYS = searchingAlgorithms.map((a) => a.key);

/**
 * The variant settings an algorithm will actually honour, given whatever was
 * asked for. Anything unrecognised (a stale shared link, a variant that
 * belongs to a different algorithm) falls back to the declared default, so a
 * hand-edited link can only ever produce a run the app could have set up
 * itself.
 */
export function resolveVariants(key, chosen) {
  const algo = ALGO_MAP[key];
  const out = {};
  for (const variant of algo?.variants || []) {
    const wanted = chosen?.[variant.key];
    out[variant.key] = variant.options.some((o) => o.key === wanted) ? wanted : variant.default;
  }
  return out;
}

/** A short human label for a variant choice, e.g. "median-of-3 pivot". */
export function variantSummary(key, chosen) {
  const algo = ALGO_MAP[key];
  const resolved = resolveVariants(key, chosen);
  return (algo?.variants || [])
    .map((variant) => variant.options.find((o) => o.key === resolved[variant.key])?.label)
    .filter(Boolean)
    .join(" · ");
}

/**
 * Runs the algorithm and attaches per-frame stats plus the cumulative
 * comparison/write counters the transport bar reads.
 *
 * `options` carries the variant choices (quick sort's pivot rule, shell
 * sort's gap sequence) and the seed anything random draws from, so the same
 * options always produce the same run.
 */
export function getSteps(key, array, target, options) {
  const algo = ALGO_MAP[key];
  const rawSteps =
    algo.category === "searching"
      ? algo.run(array, target)
      : algo.run(array, { ...resolveVariants(key, options), seed: options?.seed ?? 1 });
  return annotateSteps(rawSteps);
}

/**
 * The totals for a run, without building a single frame. This is the fast
 * path the empirical-complexity sweep uses: same algorithm body, frame
 * recording switched off, so n can reach a few thousand instead of the forty
 * the canvas can draw. Returns null for an algorithm that has no counting
 * path (the searches).
 */
export function countRun(key, array, options) {
  const algo = ALGO_MAP[key];
  if (!algo?.count) return null;
  return algo.count(array, { ...resolveVariants(key, options), seed: options?.seed ?? 1 });
}

/** The stats of the last frame of a step list — the totals for the run. */
export function finalStats(steps) {
  return steps[steps.length - 1]?.stats || EMPTY_STATS;
}
