import { countRun } from "./index.js";
import { operationCount } from "./metrics.js";
import { buildInput } from "../utils/distributions.js";

/**
 * Empirical complexity: run the sorts for real at growing n and plot what
 * they actually cost.
 *
 * A metadata field saying "O(n log n)" asserts a growth rate. This measures
 * one. It works because every sorting algorithm exports `count()` — the same
 * body as `run()` with frame recording switched off — so a sweep can push n
 * into the thousands without building (or copying the array for) millions of
 * frames it would only throw away.
 *
 * The sweep runs on the main thread in chunks, yielding between points, so
 * the UI keeps painting its progress bar. A worker would avoid the pauses
 * entirely, but at these sizes each point is tens of milliseconds and the
 * added build surface isn't worth it.
 */

/** Geometric sizes: evenly spaced on a log axis, which is where power laws are straight lines. */
const ALL_SIZES = [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5000];

export const MAX_N_CHOICES = [
  { key: 320, label: "320", desc: "Instant, even with three quadratic sorts selected." },
  { key: 1280, label: "1280", desc: "A second or two. Enough for the curves to separate clearly." },
  { key: 5000, label: "5000", desc: "Tens of seconds if a quadratic sort is in the mix \u2014 25M operations is the point." },
];

export function sizesUpTo(maxN) {
  const sizes = ALL_SIZES.filter((n) => n <= maxN);
  return sizes.length ? sizes : [ALL_SIZES[0]];
}

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Runs every selected algorithm at every size and returns
 * `{ [algoKey]: [{ n, ops, comparisons, reads, writes, aux, depth }] }`.
 *
 * `token.cancelled` is checked between points, so switching away mid-sweep
 * abandons it instead of finishing work nobody is waiting for.
 */
export async function runSweep({
  algos,
  distribution = "random",
  seed = 1,
  maxN = 1280,
  variants = {},
  onProgress,
  token = {},
}) {
  const sizes = sizesUpTo(maxN);
  const series = Object.fromEntries(algos.map((key) => [key, []]));
  const total = algos.length * sizes.length;
  let done = 0;

  for (const n of sizes) {
    // One input per size, shared by every algorithm at that size: the whole
    // point is to compare algorithms, so the data must not vary between them.
    const input = buildInput(distribution, n, seed);
    for (const key of algos) {
      if (token.cancelled) return null;
      const stats = countRun(key, input, { ...(variants[key] || {}), seed });
      if (stats) series[key].push({ n, ops: operationCount(stats), ...stats });
      done++;
      onProgress?.(done / total, n, key);
      await yieldToUi();
    }
  }

  return { sizes, series };
}

// ---------------------------------------------------------------------
// fitting reference curves
// ---------------------------------------------------------------------

export const MODELS = [
  { key: "n", label: "n", f: (n) => n, color: "var(--green)" },
  { key: "nlogn", label: "n log n", f: (n) => n * Math.log2(Math.max(2, n)), color: "var(--blue)" },
  { key: "n2", label: "n\u00B2", f: (n) => n * n, color: "var(--red)" },
];

/**
 * Least-squares scale for `c * f(n)` against the measured points, plus the
 * relative error that scaling leaves behind.
 *
 * Fitting only the constant is the honest test: the shape is fixed by the
 * model, so a model that matches lands on the data at every n, and one that
 * doesn't can't be rescued by the constant. Error is measured in log space —
 * on a curve spanning six orders of magnitude, a plain residual would be
 * decided entirely by the largest n.
 */
export function fitModel(points, f) {
  let num = 0;
  let den = 0;
  for (const p of points) {
    const x = f(p.n);
    num += p.ops * x;
    den += x * x;
  }
  const scale = den === 0 ? 0 : num / den;

  let error = 0;
  let counted = 0;
  for (const p of points) {
    const predicted = scale * f(p.n);
    if (predicted <= 0 || p.ops <= 0) continue;
    error += Math.abs(Math.log(p.ops / predicted));
    counted++;
  }
  return { scale, error: counted ? error / counted : Infinity };
}

/** The reference model that tracks a series most closely. */
export function bestModel(points) {
  if (!points || points.length < 3) return null;
  let best = null;
  for (const model of MODELS) {
    const fit = fitModel(points, model.f);
    if (!best || fit.error < best.error) best = { ...model, ...fit };
  }
  return best;
}

/**
 * The measured growth exponent: the slope of log(ops) against log(n), by
 * least squares. On random data this comes out near 1 for a linear sort, near
 * 1.1 for an n log n one at these sizes, and near 2 for a quadratic one — the
 * number the whole view exists to produce.
 */
export function growthExponent(points) {
  const usable = (points || []).filter((p) => p.n > 0 && p.ops > 0);
  if (usable.length < 3) return null;
  const xs = usable.map((p) => Math.log(p.n));
  const ys = usable.map((p) => Math.log(p.ops));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}
