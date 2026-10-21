import { useCallback, useState } from "react";
import { KIND_MAP, LEFTIST_OP_MAP } from "../dataStructures/leftist";
import {
  buildSilent,
  parseValues,
  randomValues,
  toFrame,
  treeValues,
} from "../dataStructures/leftist/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { kind: "min", root: null, active: [], compare: [], swap: [], onSpine: [], message: "" };

const DEFAULT_SECOND = "35, 8, 60, 25";
const DEFAULT_VALUES = "40, 15, 70, 5, 55, 90, 30";

/**
 * The leftist tree view's state: the tree, min or max, and the two value
 * boxes (the second tree to meld with, and the list to build from).
 *
 * `kind` travels in the snapshot for the same reason the heap's does: undoing
 * back past a flip has to put the order back too, or the tree and the label
 * disagree about which end the root is.
 *
 * `init` is the setup decoded from a shared link ({ values, kind }).
 */
export function useLeftist(init) {
  const initialKind = init?.kind === "max" ? "max" : "min";
  const [kind, setKindState] = useState(initialKind);

  const { view, value: tree, apply, load } = useStructureRun({
    initial: () => buildSilent(init?.values || parseValues(DEFAULT_VALUES), initialKind),
    toFrame: (next, message) => toFrame(next, message),
    emptyStep: EMPTY_STEP,
    snapshot: () => ({ kind }),
    restore: (doc) => setKindState(doc.kind),
  });

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("22");
  const [secondInput, setSecondInput] = useState(DEFAULT_SECOND);
  const [valuesInput, setValuesInput] = useState(DEFAULT_VALUES);

  const opMeta = LEFTIST_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const parsed = parseInt(valueInput, 10);
    const { steps: newSteps, finalTree } = opMeta.run(tree, {
      value: Number.isNaN(parsed) ? 0 : parsed,
      secondValues: parseValues(secondInput),
      values: parseValues(valuesInput),
    });
    apply(newSteps, finalTree);
  }, [tree, opMeta, valueInput, secondInput, valuesInput, apply]);

  /**
   * Flipping min/max re-melds the same values in the same order, which is the
   * clearest way to see that the two orders are one algorithm with one
   * comparison reversed — and that the *shape* is not the same, because the
   * comparison is what decided it.
   */
  const setKind = useCallback(
    (next) => {
      setKindState(next);
      // `load` records first, and the snapshot above still reads the previous
      // kind, so undo lands on the order this flip left.
      load(
        buildSilent(treeValues(tree), next),
        `Same values, re-melded as a ${KIND_MAP[next].label.toLowerCase()} — note the shape is not a mirror image`
      );
    },
    [tree, load]
  );

  const shuffle = useCallback(() => {
    const values = randomValues();
    setValuesInput(values.join(", "));
    load(buildSilent(values, kind), "New random leftist tree");
  }, [kind, load]);

  return {
    ...view,
    tree,
    kind,
    setKind,
    values: treeValues(tree),
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    secondInput,
    setSecondInput,
    valuesInput,
    setValuesInput,
    shuffle,
    runOperation,
  };
}
