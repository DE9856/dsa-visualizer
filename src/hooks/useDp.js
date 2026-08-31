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
  // The merged record holds every field any problem can ask for, so where two of
  // them share a field name the last one's default would otherwise win for
  // everybody. The current one's own defaults go on top, and a link's values on
  // top of that.
  const [inputs, setInputs] = useState(() => ({
    ...DP_DEFAULT_INPUTS,
    ...toStrings(DP_PROBLEM_MAP[init?.problem && DP_PROBLEM_MAP[init.problem] ? init.problem : "lcs"].defaults),
    ...(init?.inputs || {}),
  }));
  // Whether the input on screen is the user's rather than a default. Switching
  // problems keeps what you typed, but replaces an untouched default with the
  // one chosen to show the new problem off.
  const [customised, setCustomised] = useState(() => Boolean(init?.inputs));
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const meta = DP_PROBLEM_MAP[problem];

  /**
   * Fills the table for `key` from `raw`, or reports why it can't.
   *
   * `play` is what separates filling the table from choosing what to fill.
   * Pressing FILL THE TABLE starts the animation — the button says so, and it
   * is what every other view's run button does. Landing on a problem only
   * builds the frames and waits, because having the table half-filled before
   * you have read what the problem is helps nobody.
   */
  const runWith = useCallback(
    (key, raw, { play = false } = {}) => {
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
      setPlaying(play && next.length > 1);
      return true;
    },
    [setStepIdx, setPlaying]
  );

  // Landing on a problem shows its table straight away, at step 0, and waits.
  // Typing in a box deliberately does not re-run — a half-typed sequence is not
  // a question anyone asked.
  useEffect(() => {
    const next = customised ? inputs : { ...inputs, ...toStrings(meta.defaults) };
    if (!customised) setInputs(next);
    runWith(problem, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  const setInput = useCallback((field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setCustomised(true);
    setError("");
  }, []);

  const runOperation = useCallback(() => {
    runWith(problem, inputs, { play: true });
  }, [problem, inputs, runWith]);

  /** A fresh example for the current problem, run immediately. */
  const shuffle = useCallback(() => {
    const fresh = toStrings(meta.random());
    const next = { ...inputs, ...fresh };
    setInputs(next);
    setCustomised(true);
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
