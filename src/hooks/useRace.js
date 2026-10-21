import { useCallback, useEffect, useMemo, useState } from "react";
import { ALGO_MAP, SORT_KEYS, getSteps, resolveVariants, finalStats } from "../algorithms";
import { operationCount } from "../algorithms/metrics.js";
import { checkStability } from "../algorithms/stability.js";
import { buildInput, DISTRIBUTION_MAP, DISTRIBUTION_KEYS } from "../utils/distributions.js";
import { randomSeed } from "../utils/rng.js";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

export const MIN_LANES = 2;
export const MAX_LANES = 4;
export const SYNC_MODES = [
  {
    key: "frame",
    label: "BY FRAME",
    desc: "One tick advances every lane by one frame. Simple, but not a fair race: a bubble sort frame is one comparison while a merge sort frame can be a whole write, so the lanes are measuring different things.",
  },
  {
    key: "op",
    label: "BY WORK",
    desc: "One tick spends the same number of operations (comparisons + writes) in every lane. This is the honest race \u2014 lanes advance at the rate they actually cost, and the one that finishes first genuinely did less work.",
  },
];

const DEFAULT_ALGOS = ["insertion", "merge", "quick"];

// Only sorts can race: a search doesn't rearrange anything, so there would be
// nothing to watch side by side.
const RACEABLE = SORT_KEYS.filter((key) => ALGO_MAP[key].count);

function sanitizeAlgos(list) {
  const seen = [];
  for (const key of list || []) {
    if (RACEABLE.includes(key) && !seen.includes(key)) seen.push(key);
  }
  const out = seen.slice(0, MAX_LANES);
  while (out.length < MIN_LANES) {
    out.push(DEFAULT_ALGOS.find((k) => !out.includes(k)) || RACEABLE.find((k) => !out.includes(k)));
  }
  return out;
}

/** The index of the last frame whose cumulative op count fits the budget. */
function frameForBudget(opsAt, budget) {
  let lo = 0;
  let hi = opsAt.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (opsAt[mid] <= budget) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/**
 * Several sorting algorithms on the same input, side by side, under one
 * transport.
 *
 * `init` is the setup decoded from a shared link; anything missing or
 * unrecognised falls back to the defaults.
 */
export function useRace(init) {
  const [algos, setAlgosState] = useState(() => sanitizeAlgos(init?.algos || DEFAULT_ALGOS));
  const [size, setSize] = useState(init?.size ?? 24);
  const [distribution, setDistributionState] = useState(() =>
    DISTRIBUTION_KEYS.includes(init?.distribution) ? init.distribution : "random"
  );
  const [seed, setSeed] = useState(init?.seed ?? 7);
  const [variants, setVariantsState] = useState(() => init?.variants || {});
  const [syncMode, setSyncModeState] = useState(() =>
    SYNC_MODES.some((m) => m.key === init?.syncMode) ? init.syncMode : "op"
  );
  const [showTags, setShowTags] = useState(init?.showTags ?? false);

  const array = useMemo(() => buildInput(distribution, size, seed), [distribution, size, seed]);

  // Every lane sorts the same array — that is the entire point, so the input
  // is built once here rather than per lane.
  const lanes = useMemo(
    () =>
      algos.map((key) => {
        const opts = { ...resolveVariants(key, variants[key]), seed };
        const steps = getSteps(key, array, undefined, opts);
        const opsAt = steps.map((s) => operationCount(s.stats));
        return {
          key,
          meta: ALGO_MAP[key],
          steps,
          opsAt,
          options: opts,
          stats: finalStats(steps),
          totalOps: opsAt[opsAt.length - 1] || 0,
          stability: checkStability(steps[steps.length - 1]),
        };
      }),
    [algos, array, variants, seed]
  );

  const maxFrames = Math.max(1, ...lanes.map((l) => l.steps.length));
  const maxOps = Math.max(1, ...lanes.map((l) => l.totalOps));

  // Both modes drive the same number of transport ticks, so switching between
  // them doesn't change how far the timeline scrubs — only what a tick buys.
  const player = useStepPlayer(maxFrames);
  const { setStepIdx, setPlaying, pause } = player;

  const history = useHistory(
    () => ({ algos, size, distribution, seed, variants, syncMode, showTags }),
    (doc) => {
      setAlgosState(doc.algos);
      setSize(doc.size);
      setDistributionState(doc.distribution);
      setSeed(doc.seed);
      setVariantsState(doc.variants);
      setSyncModeState(doc.syncMode);
      setShowTags(doc.showTags);
      setPlaying(false);
      setStepIdx(0);
    }
  );

  // A new race (different lanes, data or variants) rewinds to the start.
  useEffect(() => {
    setPlaying(false);
    setStepIdx(0);
  }, [lanes, setPlaying, setStepIdx]);

  const tick = Math.min(player.stepIdx, maxFrames - 1);
  // In work mode a tick is a slice of the total budget; the frame each lane
  // shows is the last one it had reached by the time it had spent that much.
  const budget = maxFrames > 1 ? (tick / (maxFrames - 1)) * maxOps : maxOps;

  const lanesNow = useMemo(
    () =>
      lanes.map((lane) => {
        const idx =
          syncMode === "op" ? frameForBudget(lane.opsAt, budget) : Math.min(tick, lane.steps.length - 1);
        // Shorter runs freeze on their last frame rather than disappearing or
        // looping — a finished sort staying put is the result you want to see.
        return {
          ...lane,
          idx,
          step: lane.steps[idx] || {},
          finished: idx >= lane.steps.length - 1,
          spent: lane.opsAt[idx] || 0,
        };
      }),
    [lanes, syncMode, budget, tick]
  );

  // The lane that finished in the fewest operations. A tie (all-equal input,
  // say) leaves no winner rather than picking one arbitrarily.
  const leader = useMemo(() => {
    const ranked = [...lanes].sort((a, b) => a.totalOps - b.totalOps);
    if (ranked.length < 2 || ranked[0].totalOps === ranked[1].totalOps) return null;
    return ranked[0].key;
  }, [lanes]);

  const record = history.record;

  const setAlgos = useCallback(
    (next) => {
      record();
      pause();
      setAlgosState(sanitizeAlgos(next));
    },
    [record, pause]
  );

  const toggleAlgo = useCallback(
    (key) => {
      if (!RACEABLE.includes(key)) return;
      const has = algos.includes(key);
      // The lane count is clamped rather than the click ignored silently —
      // the sidebar disables the rows that would break the range.
      if (has && algos.length <= MIN_LANES) return;
      if (!has && algos.length >= MAX_LANES) return;
      setAlgos(has ? algos.filter((k) => k !== key) : [...algos, key]);
    },
    [algos, setAlgos]
  );

  const setDistribution = useCallback(
    (key) => {
      record();
      pause();
      setDistributionState(key);
    },
    [record, pause]
  );

  const setSyncMode = useCallback(
    (key) => {
      record();
      setSyncModeState(key);
    },
    [record]
  );

  const setVariant = useCallback(
    (algoKey, variantKey, value) => {
      record();
      pause();
      setVariantsState((prev) => ({
        ...prev,
        [algoKey]: { ...(prev[algoKey] || {}), [variantKey]: value },
      }));
    },
    [record, pause]
  );

  const handleSizeChange = useCallback(
    (n) => {
      record();
      pause();
      setSize(n);
    },
    [record, pause]
  );

  const shuffle = useCallback(() => {
    record();
    pause();
    setSeed(randomSeed());
  }, [record, pause]);

  const toggleTags = useCallback(() => {
    record();
    setShowTags((s) => !s);
  }, [record]);

  return {
    ...player,
    algos,
    raceable: RACEABLE,
    lanes: lanesNow,
    array,
    size,
    distribution,
    distributionMeta: DISTRIBUTION_MAP[distribution],
    seed,
    variants,
    syncMode,
    showTags,
    leader,
    maxOps,
    budget,
    // The transport counts ticks, not frames of any one lane, so it gets a
    // list of that length and reads only `.length` off it.
    steps: new Array(maxFrames),
    step: lanesNow[0]?.step || {},
    setAlgos,
    toggleAlgo,
    setDistribution,
    setSyncMode,
    setVariant,
    handleSizeChange,
    shuffle,
    toggleTags,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
