import { useState, useEffect, useCallback } from "react";
import { TREE_OP_MAP } from "../dataStructures/tree";
import { randomTree, parseValueList, buildTreeFromValues } from "../dataStructures/tree/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

const EMPTY_STEP = { root: null, message: "" };

/** `init` is the setup decoded from a shared link ({ values, treeType }). */
export function useTree(init) {
  const initialType = init?.treeType ?? "bst";
  const [treeType, setTreeTypeState] = useState(initialType);
  const [tree, setTree] = useState(() =>
    init?.values ? buildTreeFromValues(init.values, initialType) : randomTree(initialType)
  );

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = TREE_OP_MAP[operation];

  const history = useHistory(
    () => ({ tree, treeType }),
    (doc, message) => {
      setTree(doc.tree);
      setTreeTypeState(doc.treeType);
      setSteps([{ ...doc.tree, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ ...tree, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runWith = useCallback(
    (opKey, params) => {
      const meta = TREE_OP_MAP[opKey];
      const { steps: newSteps, finalTree } = meta.run(tree, { treeType, ...params });
      history.record();
      setSteps(newSteps);
      setStepIdx(0);
      setTree(finalTree);
      setPlaying(newSteps.length > 1);
    },
    [tree, treeType, history]
  );

  const runOperation = useCallback(() => {
    const value = parseInt(valueInput, 10);
    runWith(operation, { value: Number.isNaN(value) ? 0 : value });
    setValueInput("");
  }, [operation, valueInput, runWith]);

  const applyCustomTree = useCallback(() => {
    const values = parseValueList(customInput);
    if (values.length === 0) return;
    const next = buildTreeFromValues(values, treeType);
    history.record();
    setTree(next);
    setSteps([{ ...next, message: "Custom tree loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, treeType, history]);

  const shuffle = useCallback(() => {
    const next = randomTree(treeType);
    history.record();
    setTree(next);
    setSteps([{ ...next, message: "New random tree" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [treeType, history]);

  // Switching between a plain binary tree and a BST rebuilds a fresh tree,
  // since the two have different shape/ordering rules.
  const setTreeType = useCallback((next) => {
    history.record();
    setTreeTypeState(next);
    const rebuilt = randomTree(next);
    setTree(rebuilt);
    setSteps([{ ...rebuilt, message: `Switched to ${next === "bst" ? "Binary Search Tree" : "Binary Tree"}` }]);
    setStepIdx(0);
    setPlaying(false);
  }, [history]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    tree,
    treeType,
    setTreeType,
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
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
