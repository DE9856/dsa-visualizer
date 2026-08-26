import { useCallback, useEffect, useMemo, useState } from "react";
import { DP_DEFAULT_INPUTS, DP_PROBLEM_MAP, toStrings } from "../algorithms/dp";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { rows: [], cols: [], table: [], deps: [], path: [], message: "" };

/**
 * The dynamic programming view's state: which problem, and the raw text in
 * each of its input boxes.
 *
 * There is no structure to keep here — a DP run is a pure function of its
 * inputs, and the table only exists inside the frames it produced. That is why
 * this hook has no `useHistory`: undo restores a structure you mutated, and
 * nothing here is mutated. Re-running with different inputs *is* the
 * interaction, and the previous run is one FILL THE TABLE away.
 *
 * The inputs are one flat record of raw strings covering every field any
 * problem asks for, rather than one per problem, so switching from LCS to edit
 * distance keeps the two strings you were looking at. That is deliberate:
 * those two problems are the same table read two ways, and seeing the same
 * input under both is the fastest way to notice it.
 *
 * `init` is the setup decoded from a shared link ({ problem, inputs }).
 */
export function useDp(init) {
  const [problem, setProblem] = useState(() =>
    init?.problem && DP_PROBLEM_MAP[init.problem] ? init.problem : "lcs"
  );
  const [inputs, setInputs] = useState(() => ({ ...DP_DEFAULT_INPUTS, ...(init?.inputs || {}) }));
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const meta = DP_PROBLEM_MAP[problem];

  /**
   * Fills the table for `key` from `raw`, or reports why it can't.
   *
   * Nothing plays automatically: a fill is dozens of steps and starting it the
   * moment you land on a problem would have the table half-built before you
   * had read what the problem was. The transport is one key away.
   */
  const runWith = useCallback(
    (key, raw) => {
      const problemMeta = DP_PROBLEM_MAP[key];
      const parsed = problemMeta.parse(raw);
      if (parsed.error) {
        setError(parsed.error);
        return false;
      }
      setError("");
      const { steps: next } = problemMeta.run(parsed);
      setSteps(next);
      setStepIdx(0);
      setPlaying(false);
      return true;
    },
    [setStepIdx, setPlaying]
  );

  // Landing on a problem shows its table straight away, at step 0. Typing in a
  // box deliberately does not re-run — a half-typed sequence is not a question
  // anyone asked.
  useEffect(() => {
    runWith(problem, inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  const setInput = useCallback((field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  const runOperation = useCallback(() => {
    runWith(problem, inputs);
  }, [problem, inputs, runWith]);

  /** A fresh example for the current problem, run immediately. */
  const shuffle = useCallback(() => {
    const fresh = toStrings(meta.random());
    const next = { ...inputs, ...fresh };
    setInputs(next);
    runWith(problem, next);
  }, [meta, inputs, problem, runWith]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  // Only the fields the current problem actually reads, which is what the
  // shared link carries — a link to LCS has no business naming a bag capacity.
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
