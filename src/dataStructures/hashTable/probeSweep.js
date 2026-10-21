import {
  HASH_STRATEGIES,
  emptyTable,
  isOpenAddressed,
  loadLimitFor,
  locate,
  placeInto,
  slotCount,
} from "./helpers";
import { makeRng } from "../../utils/rng";

/**
 * Probes against load factor, for every collision strategy at once.
 *
 * The hash table view holds a couple of dozen keys, which is enough to watch a
 * probe sequence walk and nowhere near enough to see the thing that actually
 * decides which strategy you pick: what a lookup costs as the table fills. All
 * six curves are flat and nearly indistinguishable until about α = 0.5, and
 * then they come apart — linear probing's clusters merge into each other,
 * double hashing keeps to the ideal for longer, chaining barely notices, and
 * cuckoo stops accepting keys altogether.
 *
 * Everything here is measured with the same `locate()` the animation walks, so
 * a probe counted in the plot is a bucket the canvas would have lit up.
 */

// Deliberately the app's own accents rather than a new palette, one per
// strategy so a colour means the same thing in the plot and in the legend.
const COLORS = {
  chaining: "var(--green)",
  linear: "var(--primary)",
  quadratic: "var(--blue)",
  double: "var(--purple)",
  robinhood: "var(--yellow)",
  cuckoo: "var(--red)",
};

export const PROBE_SERIES = HASH_STRATEGIES.map((strategy) => ({ ...strategy, color: COLORS[strategy.key] }));
export const PROBE_SERIES_MAP = Object.fromEntries(PROBE_SERIES.map((s) => [s.key, s]));

export const PROBE_MEASURES = [
  {
    key: "hit",
    label: "SUCCESSFUL",
    title: "Slots examined finding a key that is in the table, averaged over every key in it",
  },
  {
    key: "miss",
    label: "UNSUCCESSFUL",
    title: "Slots examined proving a key is absent — what every insert pays before it lands",
  },
  {
    key: "longest",
    label: "LONGEST",
    title:
      "The worst probe sequence in the table. An average of 3 with a worst case of 40 is a latency problem an average cannot show.",
  },
];

export const MEASURE_MAP = Object.fromEntries(PROBE_MEASURES.map((m) => [m.key, m]));

// Primes, because (k mod m) clusters when m shares factors with the keys and
// quadratic probing's guarantee only holds for a prime modulus. These are
// sizes the view's own table grows through, three or four resizes in.
export const CAPACITY_CHOICES = [
  { key: 79, label: "79", desc: "Instant, and noisy — one unlucky deal moves the average visibly." },
  { key: 331, label: "331", desc: "A moment. Smooth enough that the curves separate cleanly." },
  { key: 673, label: "673", desc: "A second or two, and the closest to the theoretical curves." },
];

/** Where the table is sampled. Below 0.5 nothing interesting has happened yet. */
const ALPHAS = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];

export const SWEEP_ALPHAS = ALPHAS;

/** Tables measured per point. Enough that one unlucky deal doesn't set the shape. */
const SAMPLES = 5;

/** Absent keys tried per table, for the unsuccessful-search average. */
const MISSES = 200;

const KEY_RANGE = 1000000;

/**
 * Slots examined looking `key` up.
 *
 * `locate` traces exactly what the animation walks, so this is the count the
 * canvas would light up. Chaining's trace lists only the chain nodes it
 * examined, so the bucket read itself is added back — otherwise a miss on an
 * empty bucket would read as costing nothing at all, and chaining would appear
 * to beat open addressing at α = 0.05 by being free.
 */
function probesFor(table, key) {
  const { trace } = locate(table, key);
  return isOpenAddressed(table.strategy) ? trace.length : trace.length + 1;
}

/**
 * Fills one table to `alpha` and measures it.
 *
 * Returns null when the table refused a key — a probe sequence that ran out of
 * attempts, or a cuckoo eviction chain that closed into a cycle. That is a
 * result rather than an error: it is the load factor the strategy cannot be
 * driven past without growing the table, which is the honest end of its curve.
 */
function measureTable(strategy, capacity, hashFn, alpha, rand) {
  const table = emptyTable(strategy, capacity, hashFn);
  const target = Math.max(1, Math.round(alpha * slotCount(table)));
  const inserted = [];
  const used = new Set();

  while (inserted.length < target) {
    let key = 1 + Math.floor(rand() * KEY_RANGE);
    while (used.has(key)) key = 1 + Math.floor(rand() * KEY_RANGE);
    used.add(key);
    if (!placeInto(table, key)) return null;
    inserted.push(key);
  }

  let hit = 0;
  let longest = 0;
  inserted.forEach((key) => {
    const probes = probesFor(table, key);
    hit += probes;
    if (probes > longest) longest = probes;
  });

  let miss = 0;
  for (let i = 0; i < MISSES; i++) {
    let key = 1 + Math.floor(rand() * KEY_RANGE);
    while (used.has(key)) key = 1 + Math.floor(rand() * KEY_RANGE);
    miss += probesFor(table, key);
  }

  return { hit: hit / inserted.length, miss: miss / MISSES, longest };
}

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * Probe counts for every strategy at growing load factors.
 *
 * The key sequence is seeded from the load factor and the sample number only —
 * never from the strategy — so at any point on the x-axis all six strategies
 * have been handed the same keys in the same order. Comparing them on
 * different deals would be comparing the deals.
 *
 * Runs in chunks on the main thread, yielding between points so the progress
 * bar keeps painting, and checks `token.cancelled` so leaving the view
 * abandons it.
 */
export async function runProbeSweep({ capacity = 331, hashFn = "division", seed = 1, onProgress, token = {} }) {
  const series = {};
  // Where a strategy stopped accepting keys, if it did — the interesting half
  // of cuckoo hashing's result, and of quadratic probing's.
  const limits = {};
  const total = ALPHAS.length * PROBE_SERIES.length;
  let done = 0;

  for (const strategy of PROBE_SERIES) {
    series[strategy.key] = [];

    for (const alpha of ALPHAS) {
      if (token.cancelled) return null;

      const samples = [];
      let refused = false;
      for (let sample = 0; sample < SAMPLES && !refused; sample++) {
        const rand = makeRng((seed >>> 0) + Math.round(alpha * 1000) * 104729 + sample * 7919);
        const measured = measureTable(strategy.key, capacity, hashFn, alpha, rand);
        if (measured) samples.push(measured);
        else refused = true;
      }

      done += 1;
      onProgress?.(done / total, alpha, strategy.key);
      await yieldToUi();

      // One refusal ends the curve. Averaging the deals that happened to fit
      // would report a load factor the strategy only sometimes survives as
      // though it always did.
      if (refused) {
        limits[strategy.key] = { alpha, lastAlpha: series[strategy.key].at(-1)?.alpha ?? null };
        break;
      }

      series[strategy.key].push({
        alpha,
        hit: mean(samples.map((s) => s.hit)),
        miss: mean(samples.map((s) => s.miss)),
        longest: mean(samples.map((s) => s.longest)),
      });
    }
  }

  return { alphas: ALPHAS, series, limits, capacity, hashFn, seed, samples: SAMPLES };
}

/**
 * The textbook curves, per measure.
 *
 * Linear probing and uniform hashing are the two classical results; chaining's
 * is trivial arithmetic (a chain holds α keys on average, and the bucket read
 * is the +1 `probesFor` adds). Double hashing is the strategy that comes
 * closest to uniform hashing in practice, which is exactly what the plot lets
 * you check rather than take on trust.
 *
 * The longest probe has no closed form worth drawing — it is
 * O(log n / log log n) under uniform hashing, with constants that only mean
 * anything asymptotically.
 */
export const PROBE_MODELS = {
  hit: [
    {
      key: "linear",
      label: "linear probing ½(1 + 1/(1−α))",
      color: "var(--primary)",
      f: (a) => 0.5 * (1 + 1 / (1 - a)),
    },
    {
      key: "uniform",
      label: "uniform hashing (1/α)·ln(1/(1−α))",
      color: "var(--purple)",
      f: (a) => Math.log(1 / (1 - a)) / a,
    },
    { key: "chaining", label: "chaining 2 + α/2", color: "var(--green)", f: (a) => 2 + a / 2 },
  ],
  miss: [
    {
      key: "linear",
      label: "linear probing ½(1 + 1/(1−α)²)",
      color: "var(--primary)",
      f: (a) => 0.5 * (1 + 1 / ((1 - a) * (1 - a))),
    },
    { key: "uniform", label: "uniform hashing 1/(1−α)", color: "var(--purple)", f: (a) => 1 / (1 - a) },
    { key: "chaining", label: "chaining 1 + α", color: "var(--green)", f: (a) => 1 + a },
  ],
  longest: [],
};

/** The load factor the app's own table resizes at, per strategy. */
export const limitFor = loadLimitFor;
