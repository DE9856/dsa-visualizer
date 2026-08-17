import { useState, useEffect, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { STACK_OP_MAP } from "../dataStructures/stack";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

function randomStack(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ values }). */
export function useStack(init) {
  const [stack, setStack] = useState(() =>
    init?.values ? init.values.map((value) => ({ id: nextId(), value })) : randomStack(4)
  );
  const [operation, setOperation] = useState("push");
  const [valueInput, setValueInput] = useState("42");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP, nodes: [] }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = STACK_OP_MAP[operation];

  const history = useHistory(
    () => ({ stack }),
    (doc, message) => {
      setStack(doc.stack);
      setSteps([{ nodes: doc.stack, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ nodes: stack, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const params = { value: parseInt(valueInput, 10) || 0 };
    const { steps: newSteps, finalList } = opMeta.run(stack, params);
    // Recorded even when the operation turns out to be read-only (peek, size):
    // an undo that lands on an identical stack is harmless, and deciding which
    // ops mutate would mean keeping a second list in step with the first.
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setStack(finalList);
    setPlaying(newSteps.length > 1);
  }, [stack, opMeta, valueInput, history]);

  const applyCustomStack = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    history.record();
    setStack(parsed);
    setSteps([{ nodes: parsed, message: "Custom stack loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, history]);

  const shuffle = useCallback(() => {
    const next = randomStack(3 + Math.floor(Math.random() * 3));
    history.record();
    setStack(next);
    setSteps([{ nodes: next, message: "New random stack" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [history]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    steps,
    step,
    runOperation,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
