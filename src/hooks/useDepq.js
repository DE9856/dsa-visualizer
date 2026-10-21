import { useCallback, useState } from "react";
import { DEPQ_OP_MAP, KIND_MAP, buildSilent } from "../dataStructures/depq";
import { parseValues, queueValues, randomValues, toFrame } from "../dataStructures/depq/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { kind: "minmax", items: [], compare: [], swap: [], scan: [], path: [], message: "" };

const DEFAULT_VALUES = "40, 15, 70, 5, 55, 90, 30, 22, 61, 8";

/**
 * The priority-queue view's state: the queue, which of the three kinds it is,
 * and the two input boxes.
 *
 * `kind` travels in the snapshot, as the heap's does — but here it matters
 * more, because switching kind rebuilds the array from scratch under a
 * different invariant. Undoing back past a switch has to restore both, or the
 * array on screen and the rule it is being checked against disagree.
 *
 * `init` is the setup decoded from a shared link ({ values, kind }).
 */
export function useDepq(init) {
  const initialKind = init?.kind && KIND_MAP[init.kind] ? init.kind : "minmax";
  const [kind, setKindState] = useState(initialKind);

  const { view, value: queue, apply, load } = useStructureRun({
    initial: () => buildSilent(init?.values || parseValues(DEFAULT_VALUES), initialKind),
    toFrame: (next, message) => toFrame(next, message),
    emptyStep: EMPTY_STEP,
    snapshot: () => ({ kind }),
    restore: (doc) => setKindState(doc.kind),
  });

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("50");
  const [valuesInput, setValuesInput] = useState(DEFAULT_VALUES);

  const opMeta = DEPQ_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const parsed = parseInt(valueInput, 10);
    const { steps: newSteps, finalQueue } = opMeta.run(queue, {
      value: Number.isNaN(parsed) ? 0 : parsed,
      values: parseValues(valuesInput),
    });
    apply(newSteps, finalQueue);
  }, [queue, opMeta, valueInput, valuesInput, apply]);

  /**
   * Switching kind re-inserts the same values in the same order under the new
   * invariant. That is the comparison the view exists for: identical input,
   * three completely different arrays, all three with the same first element.
   */
  const setKind = useCallback(
    (next) => {
      setKindState(next);
      // `load` records first and the snapshot above still reads the previous
      // kind, so undo lands on the kind this switch left.
      load(
        buildSilent(queueValues(queue), next),
        `The same values re-inserted as ${KIND_MAP[next].label.toLowerCase()} — same input, different array`
      );
    },
    [queue, load]
  );

  const shuffle = useCallback(() => {
    const values = randomValues();
    setValuesInput(values.join(", "));
    load(buildSilent(values, kind), "New random queue");
  }, [kind, load]);

  return {
    ...view,
    queue,
    kind,
    setKind,
    values: queueValues(queue),
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    valuesInput,
    setValuesInput,
    shuffle,
    runOperation,
  };
}
