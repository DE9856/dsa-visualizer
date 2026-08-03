import { useState, useEffect, useRef, useCallback } from "react";
import { TWO_THREE_OP_MAP } from "../dataStructures/twoThreeTree";
import { randomTree, parseValueList, buildTreeFromValues } from "../dataStructures/twoThreeTree/helpers";

const EMPTY_STEP = { root: null, message: "" };

export function useTwoThreeTree() {
  const [tree, setTree] = useState(() => randomTree());

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const intervalRef = useRef(null);

  const opMeta = TWO_THREE_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ ...tree, message: "Ready" }]);
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

  const runWith = useCallback(
    (opKey, params) => {
      const meta = TWO_THREE_OP_MAP[opKey];
      const { steps: newSteps, finalTree } = meta.run(tree, params);
      setSteps(newSteps);
      setStepIdx(0);
      setTree(finalTree);
      setPlaying(newSteps.length > 1);
    },
    [tree]
  );

  const runOperation = useCallback(() => {
    const value = parseInt(valueInput, 10);
    runWith(operation, { value: Number.isNaN(value) ? 0 : value });
    setValueInput("");
  }, [operation, valueInput, runWith]);

  const applyCustomTree = useCallback(() => {
    const values = parseValueList(customInput);
    if (values.length === 0) return;
    const next = buildTreeFromValues(values);
    setTree(next);
    setSteps([{ ...next, message: "Custom tree loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput]);

  const shuffle = useCallback(() => {
    const next = randomTree();
    setTree(next);
    setSteps([{ ...next, message: "New random tree" }]);
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
    tree,
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    customInput,
    setCustomInput,
    applyCustomTree,
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
