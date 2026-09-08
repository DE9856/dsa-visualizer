import { useState, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { QUEUE_OP_MAP } from "../dataStructures/queue";
import { useStructureRun } from "./useStructureRun.js";

function randomQueue(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ values }). */
export function useQueue(init) {
  const { view, value: queue, apply, load } = useStructureRun({
    initial: () => (init?.values ? init.values.map((value) => ({ id: nextId(), value })) : randomQueue(4)),
    toFrame: (nodes, message) => ({ nodes, message }),
    emptyStep: EMPTY_STEP,
  });

  const [operation, setOperation] = useState("enqueue");
  const [valueInput, setValueInput] = useState("42");
  const [customInput, setCustomInput] = useState("");

  const opMeta = QUEUE_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalList } = opMeta.run(queue, { value: parseInt(valueInput, 10) || 0 });
    apply(newSteps, finalList);
  }, [queue, opMeta, valueInput, apply]);

  const applyCustomQueue = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    load(parsed, "Custom queue loaded");
    setCustomInput("");
  }, [customInput, load]);

  const shuffle = useCallback(
    () => load(randomQueue(3 + Math.floor(Math.random() * 3)), "New random queue"),
    [load]
  );

  return {
    ...view,
    queue,
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    customInput,
    setCustomInput,
    applyCustomQueue,
    shuffle,
    runOperation,
  };
}
