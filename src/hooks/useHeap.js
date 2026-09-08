import { useState, useCallback } from "react";
import { HEAP_OP_MAP, KIND_MAP } from "../dataStructures/heap";
import { buildHeap } from "../dataStructures/heap/buildHeap";
import {
  buildHeapSilent,
  heapValues,
  parseHeapValues,
  randomHeap,
  randomValues,
  rawHeap,
} from "../dataStructures/heap/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { nodes: [], kind: "max", message: "" };

/** `init` is the setup decoded from a shared link ({ values, kind }). */
export function useHeap(init) {
  const initialKind = init?.kind ?? "max";
  const [kind, setKindState] = useState(initialKind);

  const { view, value: heap, apply } = useStructureRun({
    initial: () => (init?.values ? buildHeapSilent(init.values, initialKind) : randomHeap(initialKind)),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
    // Max/min travels with the heap it describes: undoing back past a flip
    // has to put the order back too, or the values and the label disagree.
    snapshot: () => ({ kind }),
    restore: (doc) => setKindState(doc.kind),
  });

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("50");
  const [customInput, setCustomInput] = useState("");

  const opMeta = HEAP_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const parsed = parseInt(valueInput, 10);
    const { steps: newSteps, finalHeap } = opMeta.run(heap, { value: Number.isNaN(parsed) ? 0 : parsed });
    apply(newSteps, finalHeap);
  }, [heap, opMeta, valueInput, apply]);

  // New values arrive as a plain array and are *watched* becoming a heap —
  // the bottom-up build is the most interesting thing a heap does, and it
  // would otherwise only ever happen off-screen. That is why this plays a run
  // rather than loading a still frame the way the other structures do.
  const loadValues = useCallback(
    (values) => {
      const { steps: newSteps, finalHeap } = buildHeap.run(rawHeap(values, kind));
      apply(newSteps, finalHeap);
    },
    [kind, apply]
  );

  const applyCustomHeap = useCallback(() => {
    const values = parseHeapValues(customInput);
    if (values.length === 0) return;
    loadValues(values);
    setCustomInput("");
  }, [customInput, loadValues]);

  const shuffle = useCallback(() => loadValues(randomValues()), [loadValues]);

  // Flipping max/min keeps the same values and re-heapifies them, which is the
  // clearest way to see that the two orders are the same machinery.
  const setKind = useCallback(
    (next) => {
      setKindState(next);
      const { steps: newSteps, finalHeap } = buildHeap.run({ kind: next, nodes: [...heap.nodes] });
      const labelled = newSteps.length
        ? [
            { ...newSteps[0], message: `Same values, rebuilt as a ${KIND_MAP[next].label.toLowerCase()}` },
            ...newSteps.slice(1),
          ]
        : newSteps;
      // `apply` records first, and the snapshot above still reads the previous
      // `kind` — `setKindState` has not re-rendered yet — so undo lands on the
      // order this flip left, not the one it arrived at.
      apply(labelled, finalHeap);
    },
    [heap, apply]
  );

  return {
    ...view,
    heap,
    kind,
    setKind,
    values: heapValues(heap),
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    customInput,
    setCustomInput,
    applyCustomHeap,
    shuffle,
    runOperation,
  };
}
