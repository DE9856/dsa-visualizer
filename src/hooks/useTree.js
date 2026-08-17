import { useState, useEffect, useCallback } from "react";
import { TREE_OP_MAP, TREE_TYPES, treeOpAvailable } from "../dataStructures/tree";
import { randomTree, parseValueList, buildTreeFromValues } from "../dataStructures/tree/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

const EMPTY_STEP = { root: null, message: "" };

const labelForType = (key) => TREE_TYPES.find((t) => t.key === key)?.label ?? key;

/** `init` is the setup decoded from a shared link ({ values, treeType, threadMode }). */
export function useTree(init) {
  const initialType = init?.treeType ?? "bst";
  const [treeType, setTreeTypeState] = useState(initialType);
  const [threadMode, setThreadModeState] = useState(init?.threadMode ?? "double");
  const [tree, setTree] = useState(() =>
    init?.values ? buildTreeFromValues(init.values, initialType) : randomTree(initialType)
  );

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  // The thread-walking operations only exist for a threaded tree, so switching
  // type (or undoing back to another one) can leave a selection that no longer
  // applies. Falling back here rather than resetting the state on every switch
  // keeps the selection if the user switches straight back.
  const activeOperation = treeOpAvailable(TREE_OP_MAP[operation], { treeType, threadMode }) ? operation : "insert";
  const opMeta = TREE_OP_MAP[activeOperation];

  const history = useHistory(
    () => ({ tree, treeType, threadMode }),
    (doc, message) => {
      setTree(doc.tree);
      setTreeTypeState(doc.treeType);
      setThreadModeState(doc.threadMode);
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
      const { steps: newSteps, finalTree } = meta.run(tree, { treeType, threadMode, ...params });
      history.record();
      setSteps(newSteps);
      setStepIdx(0);
      setTree(finalTree);
      setPlaying(newSteps.length > 1);
    },
    [tree, treeType, threadMode, history]
  );

  const runOperation = useCallback(() => {
    const value = parseInt(valueInput, 10);
    runWith(activeOperation, { value: Number.isNaN(value) ? 0 : value });
    setValueInput("");
  }, [activeOperation, valueInput, runWith]);

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

  // Switching between a plain binary tree and an ordered one rebuilds a fresh
  // tree, since the two have different shape/ordering rules.
  const setTreeType = useCallback((next) => {
    history.record();
    setTreeTypeState(next);
    const rebuilt = randomTree(next);
    setTree(rebuilt);
    setSteps([{ ...rebuilt, message: `Switched to ${labelForType(next)}` }]);
    setStepIdx(0);
    setPlaying(false);
  }, [history]);

  // Threading is a property of the pointers, not of the tree's shape, so the
  // tree itself survives a switch between single and double threading.
  const setThreadMode = useCallback((next) => {
    history.record();
    setThreadModeState(next);
    setSteps([{ ...tree, message: next === "single" ? "Right (single) threading — only null right pointers are threads" : "Double threading — both null pointers are threads" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [tree, history]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    tree,
    treeType,
    setTreeType,
    threadMode,
    setThreadMode,
    operation: activeOperation,
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
