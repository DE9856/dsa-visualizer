import { useCallback, useEffect, useMemo, useState } from "react";
import { GREEDY_ALGO_MAP, GREEDY_DEFAULT_INPUTS, GREEDY_KEYS, toStrings } from "../algorithms/greedy";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { width: 0, rows: [], pointers: [], message: "" };

/**
 * The greedy and number-theory view: which algorithm, and the raw text in its
 * boxes.
 *
 * Same shape as `useStrings`, `useDp` and `useBacktracking`, for the same
 * reason — a run is a pure function of its inputs and nothing is mutated, so
 * there is no structure for `useHistory` to restore.
 *
 * `init` is the setup decoded from a shared link ({ algo, inputs }).
 */
export function useGreedy(init) {
  const [algo, setAlgo] = useState(() =>
    init?.algo && GREEDY_ALGO_MAP[init.algo] ? init.algo : GREEDY_KEYS[0]
  );
  // One flat record holding every field any algorithm can ask for. Two of them
  // would otherwise fight over a shared name, so the current algorithm's own
  // defaults go on top, and a link's values on top of that.
  const [inputs, setInputs] = useState(() => ({
    ...GREEDY_DEFAULT_INPUTS,
    ...toStrings(GREEDY_ALGO_MAP[init?.algo && GREEDY_ALGO_MAP[init.algo] ? init.algo : GREEDY_KEYS[0]].defaults),
    ...(init?.inputs || {}),
  }));
  // Whether what is on screen is the user's input rather than a default.
  // Switching algorithms keeps what you typed, but replaces an untouched
  // default with the one chosen to show the new algorithm off.
  const [customised, setCustomised] = useState(() => Boolean(init?.inputs));
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const meta = GREEDY_ALGO_MAP[algo];

  /** `play` separates running the algorithm from choosing which one to run. */
  const runWith = useCallback(
    (key, raw, { play = false } = {}) => {
      const algoMeta = GREEDY_ALGO_MAP[key];
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
