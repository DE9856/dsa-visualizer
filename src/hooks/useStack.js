import { useState, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { STACK_OP_MAP } from "../dataStructures/stack";
import { useStructureRun } from "./useStructureRun.js";

function randomStack(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ values }). */
export function useStack(init) {
  const { view, value: stack, apply, load } = useStructureRun({
    initial: () => (init?.values ? init.values.map((value) => ({ id: nextId(), value })) : randomStack(4)),
    // The stack *is* the node list, so it becomes the frame's `nodes` rather
    // than being spread the way the object-shaped structures are.
    toFrame: (nodes, message) => ({ nodes, message }),
    emptyStep: EMPTY_STEP,
  });

  const [operation, setOperation] = useState("push");
  const [valueInput, setValueInput] = useState("42");
  const [customInput, setCustomInput] = useState("");

  const opMeta = STACK_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalList } = opMeta.run(stack, { value: parseInt(valueInput, 10) || 0 });
    // Recorded even when the operation turns out to be read-only (peek, size):
    // an undo that lands on an identical stack is harmless, and deciding which
    // ops mutate would mean keeping a second list in step with the first.
    apply(newSteps, finalList);
  }, [stack, opMeta, valueInput, apply]);

  const applyCustomStack = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    load(parsed, "Custom stack loaded");
    setCustomInput("");
  }, [customInput, load]);

  const shuffle = useCallback(
    () => load(randomStack(3 + Math.floor(Math.random() * 3)), "New random stack"),
    [load]
  );

  return {
    ...view,
    stack,
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    customInput,
    setCustomInput,
    applyCustomStack,
    shuffle,
    runOperation,
  };
}
