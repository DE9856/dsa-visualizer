import { useCallback, useEffect, useMemo, useState } from "react";
import { BT_DEFAULT_INPUTS, BT_PROBLEM_MAP, toStrings } from "../algorithms/backtracking";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { board: null, calls: [], callCount: 0, seq: 0, stats: {}, message: "" };

/**
 * The backtracking view's state: which problem, and the raw text in each of
 * its setup boxes.
 *
 * Same shape as `useDp` and for the same reason — a search is a pure function
 * of its setup, there is no structure being mutated, so there is nothing for
 * `useHistory` to restore. Running again *is* the interaction.
 *
 * Unlike the DP view, the inputs are NOT shared across problems: a board size
 * and a sudoku grid have nothing to say to each other, and the one field that
 * two problems do share (`mode`) means the same thing in both.
 *
 * `init` is the setup decoded from a shared link ({ problem, inputs }).
 */
export function useBacktracking(init) {
  const [problem, setProblem] = useState(() =>
    init?.problem && BT_PROBLEM_MAP[init.problem] ? init.problem : "queens"
  );
  const [inputs, setInputs] = useState(() => ({ ...BT_DEFAULT_INPUTS, ...(init?.inputs || {}) }));
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const meta = BT_PROBLEM_MAP[problem];

  const runWith = useCallback(
    (key, raw) => {
      const problemMeta = BT_PROBLEM_MAP[key];
      const parsed = problemMeta.parse(raw);
      if (parsed.error) {
        setError(parsed.error);
        return false;
      }
      setError("");
      // A search can be a few thousand frames, so this is the one place in the
      // app where building the frames is worth noticing. It still runs
      // synchronously: the node budget is what keeps it to well under a second.
      const { steps: next } = problemMeta.run(parsed);
      setSteps(next);
      setStepIdx(0);
      setPlaying(false);
      return true;
    },
    [setStepIdx, setPlaying]
  );

  // Landing on a problem shows its first frame. Nothing plays on its own — a
  // search is hundreds of steps and starting it before you have read the setup
  // would waste the interesting part.
  useEffect(() => {
    runWith(problem, inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  /**
   * A field that changes the shape of the search — the mode toggle, a sudoku
   * preset — re-runs immediately, because they are picked rather than typed
   * and waiting for a second click to see the effect reads as a bug. Text
   * fields wait for the button: a half-typed number list is not a question.
   */
  const setInput = useCallback(
    (field, value) => {
      const next = { ...inputs, [field]: value };
      setInputs(next);
      setError("");
      if (field === "mode" || field === "puzzle") runWith(problem, next);
    },
    [inputs, problem, runWith]
  );

  const runOperation = useCallback(() => {
    runWith(problem, inputs);
  }, [problem, inputs, runWith]);

  const shuffle = useCallback(() => {
    const fresh = toStrings(meta.random());
    const next = { ...inputs, ...fresh };
    setInputs(next);
    runWith(problem, next);
  }, [meta, inputs, problem, runWith]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  const activeInputs = useMemo(
    () => Object.fromEntries(meta.fields.map((field) => [field, inputs[field] ?? ""])),
    [meta, inputs]
  );

  return {
    ...player,
    problem,
    setProblem,
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
