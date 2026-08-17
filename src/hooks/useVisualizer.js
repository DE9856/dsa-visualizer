import { useState, useEffect, useMemo, useCallback } from "react";
import { ALGO_MAP, SORT_KEYS, SEARCH_KEYS, getSteps } from "../algorithms";
import { randomArray } from "../utils/randomArray";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

/**
 * `init` is the setup decoded from a shared link ({ view, algo, values,
 * target }); anything missing or unrecognised falls back to the defaults.
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

  const [category, setCategoryState] = useState(initialCategory);
  const [algo, setAlgo] = useState(initialAlgo);
  const [size, setSize] = useState(init?.values?.length ?? 18);
  const [array, setArray] = useState(() => init?.values ?? randomArray(18));
  const [target, setTarget] = useState(init?.target ?? null);
  const [customInput, setCustomInput] = useState("");

  const meta = ALGO_MAP[algo];

  const steps = useMemo(() => {
    if (meta.category === "searching") {
      const t = target === null ? array[Math.floor(Math.random() * array.length)] : target;
      return getSteps(algo, array, t);
    }
    return getSteps(algo, array);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, array, target]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, pause } = player;

  // Steps here are derived from the algorithm and the data, so restoring the
  // document is enough — the run recomputes itself.
  const history = useHistory(
    () => ({ category, algo, size, array, target }),
    (doc) => {
      setCategoryState(doc.category);
      setAlgo(doc.algo);
      setSize(doc.size);
      setArray(doc.array);
      setTarget(doc.target);
      setPlaying(false);
      setStepIdx(0);
    }
  );

  // A new run (algorithm, array or target change) rewinds to the start.
  useEffect(() => {
    setPlaying(false);
    setStepIdx(0);
  }, [steps, setPlaying, setStepIdx]);

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
    const next = randomArray(size);
    setArray(next);
    if (meta.category === "searching") setTarget(next[Math.floor(Math.random() * next.length)]);
  }, [size, meta.category, history]);

  const handleSizeChange = useCallback(
    (n) => {
      history.record();
      setSize(n);
      const next = randomArray(n);
      setArray(next);
      if (meta.category === "searching") setTarget(next[Math.floor(Math.random() * next.length)]);
    },
    [meta.category, history]
  );

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
      if (meta.category === "searching") setTarget(parsed[Math.floor(Math.random() * parsed.length)]);
    }
    setCustomInput("");
  }, [customInput, meta.category, history]);

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
    customInput,
    setCustomInput,
    steps,
    step,
    displayArr,
    maxVal,
    switchCategory,
    switchAlgo,
    handleShuffle,
    handleSizeChange,
    applyCustomArray,
    setRandomTarget,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
