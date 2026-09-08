import { useCallback, useEffect, useState } from "react";
import {
  MAX_N,
  RANGE_OP_MAP,
  parseValues,
  randomValues,
  restingFrame,
} from "../dataStructures/rangeQuery";
import { useStructureRun } from "./useStructureRun.js";

/**
 * The range-query view's state: an array, and which structure is drawn over it.
 *
 * Unlike the DP and string views there *is* a structure here — the array
 * persists across operations and a point update changes it — so this follows
 * the data-structure pattern instead, `useStructureRun` and all.
 *
 * Switching KIND rebuilds the other structure over the same values rather than
 * starting over, exactly as switching a hash table's collision strategy
 * replays the same keys. That is the fastest way to see that the two are
 * answering one question two ways.
 *
 * `init` is the setup decoded from a shared link ({ values, kind, combine }).
 */
export function useRangeQuery(init) {
  const [kind, setKind] = useState(init?.kind === "fenwick" ? "fenwick" : "segment");
  const [combine, setCombine] = useState(init?.combine || "sum");

  const { view, value: values, apply, load, reframe } = useStructureRun({
    initial: () => (init?.values?.length ? init.values.slice(0, MAX_N) : [5, 2, 9, 1, 7, 3, 8, 4]),
    // Read fresh every time, so a frame drawn after a KIND or COMBINE switch
    // is drawn under the new rules without the structure having changed.
    toFrame: (vals, message) => restingFrame(vals, kind, combine, message),
    emptyStep: restingFrame([], "segment", "sum"),
  });

  const [operation, setOperation] = useState("build");
  const [indexInput, setIndexInput] = useState("2");
  const [valueInput, setValueInput] = useState("10");
  const [fromInput, setFromInput] = useState("1");
  const [toInput, setToInput] = useState("5");
  const [customInput, setCustomInput] = useState("");

  const opMeta = RANGE_OP_MAP[operation];

  // Changing the structure or the combine redraws the same array under the new
  // rules — no run, because nothing has been asked yet, and no history entry,
  // because the array it is drawing is the one it was already drawing.
  useEffect(() => {
    reframe("Ready");
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
    apply(next, finalValues);
  }, [opMeta, values, kind, combine, indexInput, valueInput, fromInput, toInput, apply]);

  const applyCustom = useCallback(() => {
    const parsed = parseValues(customInput);
    if (!parsed.length) return;
    load(parsed, "Custom array loaded");
    setCustomInput("");
  }, [customInput, load]);

  const shuffle = useCallback(() => load(randomValues(), "New random array"), [load]);

  return {
    ...view,
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
    runOperation,
  };
}
