import { useState, useEffect, useCallback } from "react";
import { BTREE_OP_MAP } from "../dataStructures/bTree";
import {
  ORDERS,
  VARIANTS,
  buildFromValues,
  inorderKeys,
  parseValueList,
  randomValues,
} from "../dataStructures/bTree/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

const EMPTY_STEP = { root: null, message: "" };

const validOrder = (n) => (ORDERS.includes(n) ? n : 4);
const validVariant = (v) => (VARIANTS.some((x) => x.key === v) ? v : "btree");

/** `init` is the setup decoded from a shared link ({ values, order, variant }). */
export function useBTree(init) {
  const [order, setOrderState] = useState(() => validOrder(init?.order));
  const [variant, setVariantState] = useState(() => validVariant(init?.variant));
  const [root, setRoot] = useState(() =>
    buildFromValues(init?.values?.length ? init.values : randomValues(), validOrder(init?.order), validVariant(init?.variant))
  );

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = BTREE_OP_MAP[operation];

  const history = useHistory(
    () => ({ root, order, variant }),
    (doc, message) => {
      setRoot(doc.root);
      setOrderState(doc.order);
      setVariantState(doc.variant);
      setSteps([{ root: doc.root, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ root, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = useCallback(
    (next, message) => {
      history.record();
      setRoot(next);
      setSteps([{ root: next, message }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [history, setStepIdx, setPlaying]
  );

  const runOperation = useCallback(() => {
    const value = parseInt(valueInput, 10);
    const { steps: newSteps, finalRoot } = opMeta.run(root, {
      value: Number.isNaN(value) ? 0 : value,
      order,
      variant,
    });
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setRoot(finalRoot);
    setPlaying(newSteps.length > 1);
    setValueInput("");
  }, [opMeta, root, order, variant, valueInput, history, setStepIdx, setPlaying]);

  // Order and variant are structural, so changing either rebuilds the tree from
  // the keys it currently holds. Inserting the same keys in the same order into
  // the other shape is the honest comparison, and it keeps the view from ever
  // showing a tree that violates its own order.
  const setOrder = useCallback(
    (next) => {
      const keys = inorderKeys(root, variant);
      setOrderState(next);
      settle(buildFromValues(keys, next, variant), `Rebuilt at order ${next} — up to ${next - 1} keys per node`);
    },
    [root, variant, settle]
  );

  const setVariant = useCallback(
    (next) => {
      const keys = inorderKeys(root, variant);
      setVariantState(next);
      settle(
        buildFromValues(keys, order, next),
        next === "bplus"
          ? "Rebuilt as a B+ tree — every key is now in a leaf, and the keys upstairs are only separators"
          : "Rebuilt as a B-tree — keys now live at every level"
      );
    },
    [root, order, variant, settle]
  );

  const applyCustom = useCallback(() => {
    const values = parseValueList(customInput);
    if (values.length === 0) return;
    settle(buildFromValues(values, order, variant), `Built from ${values.length} keys`);
    setCustomInput("");
  }, [customInput, order, variant, settle]);

  const shuffle = useCallback(() => {
    settle(buildFromValues(randomValues(), order, variant), "New random tree");
  }, [order, variant, settle]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    root,
    order,
    setOrder,
    variant,
    setVariant,
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    customInput,
    setCustomInput,
    applyCustom,
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
