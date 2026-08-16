import { useState, useEffect, useCallback } from "react";
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
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { nodes: [], kind: "max", message: "" };

/** `init` is the setup decoded from a shared link ({ values, kind }). */
export function useHeap(init) {
  const initialKind = init?.kind ?? "max";
  const [kind, setKindState] = useState(initialKind);
  const [heap, setHeap] = useState(() =>
    init?.values ? buildHeapSilent(init.values, initialKind) : randomHeap(initialKind)
  );

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("50");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = HEAP_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ ...heap, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(
    (newSteps, finalHeap) => {
      setSteps(newSteps);
      setStepIdx(0);
      setHeap(finalHeap);
      setPlaying(newSteps.length > 1);
    },
    [setStepIdx, setPlaying]
  );

  const runOperation = useCallback(() => {
    const parsed = parseInt(valueInput, 10);
    const { steps: newSteps, finalHeap } = opMeta.run(heap, { value: Number.isNaN(parsed) ? 0 : parsed });
    play(newSteps, finalHeap);
  }, [heap, opMeta, valueInput, play]);

  // New values arrive as a plain array and are *watched* becoming a heap —
  // the bottom-up build is the most interesting thing a heap does, and it
  // would otherwise only ever happen off-screen.
  const loadValues = useCallback(
    (values) => {
      const { steps: newSteps, finalHeap } = buildHeap.run(rawHeap(values, kind));
      play(newSteps, finalHeap);
    },
    [kind, play]
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
      play(labelled, finalHeap);
    },
    [heap, play]
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    steps,
    step,
    runOperation,
  };
}
