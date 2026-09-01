import { useState, useEffect, useMemo, useCallback } from "react";
import { ALGO_MAP, SORT_KEYS, SEARCH_KEYS, getSteps, resolveVariants } from "../algorithms";
import { buildInput, DISTRIBUTION_KEYS, DISTRIBUTION_MAP } from "../utils/distributions.js";
import { randomSeed } from "../utils/rng.js";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

// A hand-typed array isn't any of the named shapes, so it gets its own label
// rather than leaving the picker claiming something untrue.
export const CUSTOM_DISTRIBUTION = "custom";

/**
 * `init` is the setup decoded from a shared link ({ view, algo, values,
 * target, distribution, seed, variants }); anything missing or unrecognised
 * falls back to the defaults.
 */
export function useVisualizer(init) {
  const initialCategory = init?.view === "searching" ? "searching" : "sorting";
  // A link can name any algorithm; only honour one the registry actually has.
  const initialAlgo =
    init?.algo && ALGO_MAP[init.algo]?.category === initialCategory
      ? init.algo
      : initialCategory === "searching"
        ? SEARCH_KEYS[0]
        : SORT_KEYS[0];
  const initialSeed = init?.seed ?? 7;
  const initialSize = init?.values?.length ?? 18;
  // Values in the link win: they are the exact array someone meant to share,
  // which a distribution name plus a seed only approximates.
  const initialDistribution = init?.values
    ? CUSTOM_DISTRIBUTION
    : DISTRIBUTION_KEYS.includes(init?.distribution)
      ? init.distribution
      : "random";

  const [category, setCategoryState] = useState(initialCategory);
  const [algo, setAlgo] = useState(initialAlgo);
  const [size, setSize] = useState(initialSize);
  const [seed, setSeed] = useState(initialSeed);
  const [distribution, setDistributionState] = useState(initialDistribution);
  const [variants, setVariantsState] = useState(() => init?.variants || {});
  const [showTags, setShowTags] = useState(init?.showTags ?? false);
  const [array, setArray] = useState(
    () => init?.values ?? buildInput(initialDistribution, initialSize, initialSeed)
  );
  const [target, setTarget] = useState(init?.target ?? null);
  const [customInput, setCustomInput] = useState("");

  const meta = ALGO_MAP[algo];
  const options = useMemo(
    () => ({ ...resolveVariants(algo, variants[algo]), seed }),
    [algo, variants, seed]
  );

  const steps = useMemo(() => {
    if (meta.category === "searching") {
      const t = target === null ? array[Math.floor(Math.random() * array.length)] : target;
      return getSteps(algo, array, t, options);
    }
    return getSteps(algo, array, undefined, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, array, target, options]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, pause } = player;

  // Steps here are derived from the algorithm and the data, so restoring the
  // document is enough — the run recomputes itself.
  const history = useHistory(
    () => ({ category, algo, size, array, target, seed, distribution, variants, showTags }),
    (doc) => {
      setCategoryState(doc.category);
      setAlgo(doc.algo);
      setSize(doc.size);
      setArray(doc.array);
      setTarget(doc.target);
      setSeed(doc.seed);
      setDistributionState(doc.distribution);
      setVariantsState(doc.variants);
      setShowTags(doc.showTags);
      setPlaying(false);
      setStepIdx(0);
    }
  );

  // A new run (algorithm, array or target change) rewinds to the start.
  useEffect(() => {
    setPlaying(false);
    setStepIdx(0);
  }, [steps, setPlaying, setStepIdx]);

  // Every path that builds fresh data goes through here, so the distribution,
  // the size and the target can never disagree with the array on screen.
  const regenerate = useCallback(
    (nextSize, nextDistribution, nextSeed) => {
      const next = buildInput(nextDistribution, nextSize, nextSeed);
      setArray(next);
      if (ALGO_MAP[algo].category === "searching") {
        setTarget(next[Math.floor(Math.random() * next.length)]);
      }
      return next;
    },
    [algo]
  );

  const switchCategory = useCallback(
    (cat) => {
      history.record();
      setCategoryState(cat);
      pause();
      const first = cat === "sorting" ? SORT_KEYS[0] : SEARCH_KEYS[0];
      setAlgo(first);
      if (cat === "searching") setTarget(array[Math.floor(Math.random() * array.length)]);
    },
    [array, pause, history]
  );

  const switchAlgo = useCallback(
    (key) => {
      history.record();
      pause();
      setAlgo(key);
      if (ALGO_MAP[key].category === "searching") {
        setTarget(array[Math.floor(Math.random() * array.length)]);
      }
    },
    [array, pause, history]
  );

  const handleShuffle = useCallback(() => {
    history.record();
    const nextSeed = randomSeed();
    setSeed(nextSeed);
    // Re-rolling a hand-typed array can only mean "give me random data
    // again" — a custom array has no shape to re-roll.
    const shape = distribution === CUSTOM_DISTRIBUTION ? "random" : distribution;
    if (shape !== distribution) setDistributionState(shape);
    regenerate(size, shape, nextSeed);
  }, [size, distribution, regenerate, history]);

  const handleSizeChange = useCallback(
    (n) => {
      history.record();
      setSize(n);
      const shape = distribution === CUSTOM_DISTRIBUTION ? "random" : distribution;
      if (shape !== distribution) setDistributionState(shape);
      regenerate(n, shape, seed);
    },
    [distribution, seed, regenerate, history]
  );

  const setDistribution = useCallback(
    (key) => {
      if (!DISTRIBUTION_KEYS.includes(key)) return;
      history.record();
      pause();
      setDistributionState(key);
      regenerate(size, key, seed);
    },
    [size, seed, regenerate, pause, history]
  );

  const setVariant = useCallback(
    (variantKey, value) => {
      history.record();
      pause();
      setVariantsState((prev) => ({ ...prev, [algo]: { ...(prev[algo] || {}), [variantKey]: value } }));
    },
    [algo, pause, history]
  );

  const toggleTags = useCallback(() => {
    history.record();
    setShowTags((s) => !s);
  }, [history]);

  const applyCustomArray = useCallback(() => {
    const parsed = customInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n))
      .slice(0, 40);
    if (parsed.length >= 2) {
      history.record();
      setArray(parsed);
      setSize(parsed.length);
      setDistributionState(CUSTOM_DISTRIBUTION);
      if (meta.category === "searching") setTarget(parsed[Math.floor(Math.random() * parsed.length)]);
    }
    setCustomInput("");
  }, [customInput, meta.category, history]);

  /**
   * The array as the run *starts* — what direct editing edits. Mid-run the
   * canvas is showing a partly sorted picture, and for the searches that sort
   * a copy it is showing an order the base array never had, so an edit has to
   * be expressed against a frame both sides agree on.
   */
  const baseArray = steps[0]?.array || array;

  /** Commit a hand-edited array: it is nobody's named shape any more. */
  const editArray = useCallback(
    (next) => {
      history.record();
      pause();
      setStepIdx(0);
      setArray(next);
      setDistributionState(CUSTOM_DISTRIBUTION);
      if (ALGO_MAP[algo].category === "searching" && !next.includes(target)) {
        setTarget(next[Math.floor(Math.random() * next.length)]);
      }
    },
    [algo, target, pause, setStepIdx, history]
  );

  const setRandomTarget = useCallback(
    (inArray) => {
      const arr = steps[Math.min(player.stepIdx, steps.length - 1)]?.array || array;
      if (inArray) setTarget(arr[Math.floor(Math.random() * arr.length)]);
      else setTarget(Math.max(...arr) + Math.floor(Math.random() * 20) + 1);
    },
    [array, steps, player.stepIdx]
  );

  const step = steps[Math.min(player.stepIdx, steps.length - 1)] || {};
  const displayArr = step.array || array;
  const maxVal = Math.max(...displayArr, 1);

  return {
    ...player,
    category,
    algo,
    meta,
    size,
    array,
    target,
    seed,
    distribution,
    distributionMeta: DISTRIBUTION_MAP[distribution],
    variants,
    options,
    showTags,
    customInput,
    setCustomInput,
    steps,
    step,
    displayArr,
    baseArray,
    maxVal,
    editArray,
    switchCategory,
    switchAlgo,
    handleShuffle,
    handleSizeChange,
    setDistribution,
    setVariant,
    toggleTags,
    applyCustomArray,
    setRandomTarget,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
