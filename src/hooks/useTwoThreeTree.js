import { useState, useCallback } from "react";
import { TWO_THREE_OP_MAP } from "../dataStructures/twoThreeTree";
import { randomTree, parseValueList, buildTreeFromValues } from "../dataStructures/twoThreeTree/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { root: null, message: "" };

/** `init` is the setup decoded from a shared link ({ values }). */
export function useTwoThreeTree(init) {
  const { view, value: tree, apply, load } = useStructureRun({
    initial: () => (init?.values ? buildTreeFromValues(init.values) : randomTree()),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
  });

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const opMeta = TWO_THREE_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const parsed = parseInt(valueInput, 10);
    const { steps: newSteps, finalTree } = opMeta.run(tree, { value: Number.isNaN(parsed) ? 0 : parsed });
    apply(newSteps, finalTree);
    setValueInput("");
  }, [tree, opMeta, valueInput, apply]);

  const applyCustomTree = useCallback(() => {
    const values = parseValueList(customInput);
    if (values.length === 0) return;
    load(buildTreeFromValues(values), "Custom tree loaded");
    setCustomInput("");
  }, [customInput, load]);

  const shuffle = useCallback(() => load(randomTree(), "New random tree"), [load]);

  return {
    ...view,
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
    runOperation,
  };
}
