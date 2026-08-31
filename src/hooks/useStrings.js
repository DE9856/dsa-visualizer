import { useCallback, useEffect, useMemo, useState } from "react";
import { STRING_ALGO_MAP, STRING_DEFAULT_INPUTS, toStrings } from "../algorithms/strings";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { width: 0, rows: [], pointers: [], message: "" };

/**
 * The string algorithms view: which algorithm, and the raw text in its boxes.
 *
 * Same shape as `useDp` and `useBacktracking`, for the same reason — a run is a
 * pure function of its inputs, nothing is mutated, so there is no structure for
 * `useHistory` to restore.
 *
 * The inputs are one flat record shared across algorithms rather than one per
 * algorithm, so switching from KMP to Z-algorithm keeps the text and pattern
 * you were looking at. That is the point of having them side by side: the same
 * search, three ways.
 *
 * `init` is the setup decoded from a shared link ({ algo, inputs }).
 */
export function useStrings(init) {
  const [algo, setAlgo] = useState(() =>
    init?.algo && STRING_ALGO_MAP[init.algo] ? init.algo : "kmp"
  );
  // The merged record holds every field any algorithm can ask for, so where two of
  // them share a field name the last one's default would otherwise win for
  // everybody. The current one's own defaults go on top, and a link's values on
  // top of that.
  const [inputs, setInputs] = useState(() => ({
    ...STRING_DEFAULT_INPUTS,
    ...toStrings(STRING_ALGO_MAP[init?.algo && STRING_ALGO_MAP[init.algo] ? init.algo : "kmp"].defaults),
    ...(init?.inputs || {}),
  }));
  // Whether the input on screen is the user's rather than a default. Switching
  // algorithms keeps what you typed, but replaces an untouched default with the
  // one chosen to show the new algorithm off.
  const [customised, setCustomised] = useState(() => Boolean(init?.inputs));
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const meta = STRING_ALGO_MAP[algo];

  /** `play` separates running the algorithm from choosing which one to run. */
  const runWith = useCallback(
    (key, raw, { play = false } = {}) => {
      const algoMeta = STRING_ALGO_MAP[key];
      const parsed = algoMeta.parse(raw);
      if (parsed.error) {
        setError(parsed.error);
        return false;
      }
      setError("");
      const { steps: next } = algoMeta.run(parsed);
      setSteps(next);
      setStepIdx(0);
      setPlaying(play && next.length > 1);
      return true;
    },
    [setStepIdx, setPlaying]
  );

  // Landing on an algorithm shows its first frame and waits; only the run
  // button starts playback.
  useEffect(() => {
    const next = customised ? inputs : { ...inputs, ...toStrings(meta.defaults) };
    if (!customised) setInputs(next);
    runWith(algo, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo]);

  const setInput = useCallback((field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setCustomised(true);
    setError("");
  }, []);

  const runOperation = useCallback(() => {
    runWith(algo, inputs, { play: true });
  }, [algo, inputs, runWith]);

  const shuffle = useCallback(() => {
    const fresh = toStrings(meta.random());
    const next = { ...inputs, ...fresh };
    setInputs(next);
    setCustomised(true);
    runWith(algo, next, { play: true });
  }, [meta, inputs, algo, runWith]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  const activeInputs = useMemo(
    () => Object.fromEntries(meta.fields.map((field) => [field, inputs[field] ?? ""])),
    [meta, inputs]
  );

  return {
    ...player,
    algo,
    setAlgo,
    meta,
    opMeta: meta,
    inputs,
    activeInputs,
    setInput,
    error,
    steps,
    step,
    runOperation,
    shuffle,
  };
}
