import { useState, useEffect, useRef, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { QUEUE_OP_MAP } from "../dataStructures/queue";

function randomQueue(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

export function useQueue() {
  const [queue, setQueue] = useState(() => randomQueue(4));
  const [operation, setOperation] = useState("enqueue");
  const [valueInput, setValueInput] = useState("42");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP, nodes: [] }]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const intervalRef = useRef(null);

  const opMeta = QUEUE_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ nodes: queue, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playing) {
      const delay = 720 - speed * 6;
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(40, delay));
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps]);

  const runOperation = useCallback(() => {
    const params = { value: parseInt(valueInput, 10) || 0 };
    const { steps: newSteps, finalList } = opMeta.run(queue, params);
    setSteps(newSteps);
    setStepIdx(0);
    setQueue(finalList);
    setPlaying(newSteps.length > 1);
  }, [queue, opMeta, valueInput]);

  const applyCustomQueue = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    setQueue(parsed);
    setSteps([{ nodes: parsed, message: "Custom queue loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput]);

  const shuffle = useCallback(() => {
    const next = randomQueue(3 + Math.floor(Math.random() * 3));
    setQueue(next);
    setSteps([{ nodes: next, message: "New random queue" }]);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const atEnd = stepIdx >= steps.length - 1;
      if (atEnd) {
        setStepIdx(0);
        return true;
      }
      return !p;
    });
  }, [stepIdx, steps.length]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;
  const atEnd = stepIdx >= steps.length - 1;

  return {
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
    stepIdx,
    setStepIdx,
    playing,
    speed,
    setSpeed,
    atEnd,
    runOperation,
    togglePlay,
  };
}
