import { useState, useEffect, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { QUEUE_OP_MAP } from "../dataStructures/queue";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

function randomQueue(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ values }). */
export function useQueue(init) {
  const [queue, setQueue] = useState(() =>
    init?.values ? init.values.map((value) => ({ id: nextId(), value })) : randomQueue(4)
  );
  const [operation, setOperation] = useState("enqueue");
  const [valueInput, setValueInput] = useState("42");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP, nodes: [] }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = QUEUE_OP_MAP[operation];

  const history = useHistory(
    () => ({ queue }),
    (doc, message) => {
      setQueue(doc.queue);
      setSteps([{ nodes: doc.queue, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ nodes: queue, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const params = { value: parseInt(valueInput, 10) || 0 };
    const { steps: newSteps, finalList } = opMeta.run(queue, params);
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setQueue(finalList);
    setPlaying(newSteps.length > 1);
  }, [queue, opMeta, valueInput, history]);

  const applyCustomQueue = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    history.record();
    setQueue(parsed);
    setSteps([{ nodes: parsed, message: "Custom queue loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, history]);

  const shuffle = useCallback(() => {
    const next = randomQueue(3 + Math.floor(Math.random() * 3));
    history.record();
    setQueue(next);
    setSteps([{ nodes: next, message: "New random queue" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [history]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    steps,
    step,
    runOperation,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
