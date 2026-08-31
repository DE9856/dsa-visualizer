import { useCallback, useEffect, useState } from "react";
import {
  MAX_N,
  RANGE_OP_MAP,
  parseValues,
  randomValues,
  restingFrame,
} from "../dataStructures/rangeQuery";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

/**
 * The range-query view's state: an array, and which structure is drawn over it.
 *
 * Unlike the DP and string views there *is* a structure here — the array
 * persists across operations and a point update changes it — so this follows
 * the data-structure pattern instead, `useHistory` and all.
 *
 * Switching KIND rebuilds the other structure over the same values rather than
 * starting over, exactly as switching a hash table's collision strategy
 * replays the same keys. That is the fastest way to see that the two are
 * answering one question two ways.
 *
 * `init` is the setup decoded from a shared link ({ values, kind, combine }).
 */
export function useRangeQuery(init) {
  const [values, setValues] = useState(() =>
    init?.values?.length ? init.values.slice(0, MAX_N) : [5, 2, 9, 1, 7, 3, 8, 4]
  );
  const [kind, setKind] = useState(init?.kind === "fenwick" ? "fenwick" : "segment");
  const [combine, setCombine] = useState(init?.combine || "sum");

  const [operation, setOperation] = useState("build");
  const [indexInput, setIndexInput] = useState("2");
  const [valueInput, setValueInput] = useState("10");
  const [fromInput, setFromInput] = useState("1");
  const [toInput, setToInput] = useState("5");
  const [customInput, setCustomInput] = useState("");

  const [steps, setSteps] = useState(() => [restingFrame(values, kind, combine)]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = RANGE_OP_MAP[operation];

  const history = useHistory(
    () => ({ values }),
    (doc, message) => {
      setValues(doc.values);
      setSteps([restingFrame(doc.values, kind, combine, message)]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  const settle = useCallback(
    (nextValues, nextKind, nextCombine, message) => {
      setSteps([restingFrame(nextValues, nextKind, nextCombine, message)]);
      setStepIdx(0);
      setPlaying(false);
    },
    [setStepIdx, setPlaying]
  );

  // Changing the structure or the combine redraws the same array under the new
  // rules — no run, because nothing has been asked yet.
  useEffect(() => {
    settle(values, kind, combine, "Ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, combine]);

  const runOperation = useCallback(() => {
    const params = {
      kind,
      combine,
      index: parseInt(indexInput, 10) || 0,
      value: parseInt(valueInput, 10) || 0,
      from: parseInt(fromInput, 10) || 0,
      to: parseInt(toInput, 10) || 0,
    };
    const { steps: next, finalValues } = opMeta.run(values, params);
    history.record();
    setSteps(next);
    setStepIdx(0);
    setValues(finalValues);
    setPlaying(next.length > 1);
  }, [opMeta, values, kind, combine, indexInput, valueInput, fromInput, toInput, history, setStepIdx, setPlaying]);

  const applyCustom = useCallback(() => {
    const parsed = parseValues(customInput);
    if (!parsed.length) return;
    history.record();
    setValues(parsed);
    settle(parsed, kind, combine, "Custom array loaded");
    setCustomInput("");
  }, [customInput, history, kind, combine, settle]);

  const shuffle = useCallback(() => {
    const next = randomValues();
    history.record();
    setValues(next);
    settle(next, kind, combine, "New random array");
  }, [history, kind, combine, settle]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || steps[0];

  return {
    ...player,
    values,
    kind,
    setKind,
    combine,
    setCombine,
    operation,
    setOperation,
    opMeta,
    indexInput,
    setIndexInput,
    valueInput,
    setValueInput,
    fromInput,
    setFromInput,
    toInput,
    setToInput,
    customInput,
    setCustomInput,
    applyCustom,
    shuffle,
    steps,
    step,
    runOperation,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
