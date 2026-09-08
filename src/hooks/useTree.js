import { useState, useCallback } from "react";
import { TREE_OP_MAP, TREE_TYPES, treeOpAvailable } from "../dataStructures/tree";
import { randomTree, parseValueList, buildTreeFromValues } from "../dataStructures/tree/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { root: null, message: "" };

const labelForType = (key) => TREE_TYPES.find((t) => t.key === key)?.label ?? key;

/** `init` is the setup decoded from a shared link ({ values, treeType, threadMode }). */
export function useTree(init) {
  const initialType = init?.treeType ?? "bst";
  const [treeType, setTreeTypeState] = useState(initialType);
  const [threadMode, setThreadModeState] = useState(init?.threadMode ?? "double");

  const { view, value: tree, apply, load } = useStructureRun({
    initial: () => (init?.values ? buildTreeFromValues(init.values, initialType) : randomTree(initialType)),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
    // A tree means different things depending on which kind it is and how it
    // is threaded, so both travel with it through undo.
    snapshot: () => ({ treeType, threadMode }),
    restore: (doc) => {
      setTreeTypeState(doc.treeType);
      setThreadModeState(doc.threadMode);
    },
  });

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  // The thread-walking operations only exist for a threaded tree, so switching
  // type (or undoing back to another one) can leave a selection that no longer
  // applies. Falling back here rather than resetting the state on every switch
  // keeps the selection if the user switches straight back.
  const activeOperation = treeOpAvailable(TREE_OP_MAP[operation], { treeType, threadMode }) ? operation : "insert";
  const opMeta = TREE_OP_MAP[activeOperation];

  const runWith = useCallback(
    (opKey, params) => {
      const meta = TREE_OP_MAP[opKey];
      const { steps: newSteps, finalTree } = meta.run(tree, { treeType, threadMode, ...params });
      apply(newSteps, finalTree);
    },
    [tree, treeType, threadMode, apply]
  );

  const runOperation = useCallback(() => {
    const value = parseInt(valueInput, 10);
    runWith(activeOperation, { value: Number.isNaN(value) ? 0 : value });
    setValueInput("");
  }, [activeOperation, valueInput, runWith]);

  // What a gesture on the canvas runs. It goes straight to the operation
  // rather than through `runOperation`, because a tap on a node names a value
  // outright — there is nothing in the sidebar's input for it to agree with,
  // and making the gesture depend on which operation happens to be selected
  // would mean the same tap did different things at different times.
  const insertValue = useCallback((value) => runWith("insert", { value }), [runWith]);
  const deleteValue = useCallback((value) => runWith("delete", { value }), [runWith]);

  const applyCustomTree = useCallback(() => {
    const values = parseValueList(customInput);
    if (values.length === 0) return;
    load(buildTreeFromValues(values, treeType), "Custom tree loaded");
    setCustomInput("");
  }, [customInput, treeType, load]);

  const shuffle = useCallback(() => load(randomTree(treeType), "New random tree"), [treeType, load]);

  // Switching between a plain binary tree and an ordered one rebuilds a fresh
  // tree, since the two have different shape/ordering rules.
  const setTreeType = useCallback(
    (next) => {
      setTreeTypeState(next);
      load(randomTree(next), `Switched to ${labelForType(next)}`);
    },
    [load]
  );

  // Threading is a property of the pointers, not of the tree's shape, so the
  // tree itself survives a switch between single and double threading. It is
  // still `load` rather than a bare redraw: the document changed even though
  // the tree did not, so the switch has to be undoable.
  const setThreadMode = useCallback(
    (next) => {
      setThreadModeState(next);
      load(
        tree,
        next === "single"
          ? "Right (single) threading — only null right pointers are threads"
          : "Double threading — both null pointers are threads"
      );
    },
    [tree, load]
  );

  return {
    ...view,
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
    runOperation,
    insertValue,
    deleteValue,
  };
}
