import { useState, useEffect, useCallback } from "react";
import { TWO_THREE_OP_MAP } from "../dataStructures/twoThreeTree";
import { randomTree, parseValueList, buildTreeFromValues } from "../dataStructures/twoThreeTree/helpers";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { root: null, message: "" };

export function useTwoThreeTree() {
  const [tree, setTree] = useState(() => randomTree());

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = TWO_THREE_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ ...tree, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    runOperation,
  };
}
