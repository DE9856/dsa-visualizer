import { useState, useCallback } from "react";
import { BTREE_OP_MAP } from "../dataStructures/bTree";
import {
  ORDERS,
  VARIANTS,
  buildFromValues,
  inorderKeys,
  parseValueList,
  randomValues,
} from "../dataStructures/bTree/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { root: null, message: "" };

const validOrder = (n) => (ORDERS.includes(n) ? n : 4);
const validVariant = (v) => (VARIANTS.some((x) => x.key === v) ? v : "btree");

/** `init` is the setup decoded from a shared link ({ values, order, variant }). */
export function useBTree(init) {
  const [order, setOrderState] = useState(() => validOrder(init?.order));
  const [variant, setVariantState] = useState(() => validVariant(init?.variant));

  const { view, value: root, apply, load } = useStructureRun({
    initial: () =>
      buildFromValues(
        init?.values?.length ? init.values : randomValues(),
        validOrder(init?.order),
        validVariant(init?.variant)
      ),
    // The structure here is the root node itself, so it is wrapped as the
    // frame's `root` rather than spread across it.
    toFrame: (next, message) => ({ root: next, message }),
    emptyStep: EMPTY_STEP,
    // Order and variant decide what a given set of keys even looks like, so
    // they are part of the document rather than settings beside it.
    snapshot: () => ({ order, variant }),
    restore: (doc) => {
      setOrderState(doc.order);
      setVariantState(doc.variant);
    },
  });

  const [operation, setOperation] = useState("insert");
  const [valueInput, setValueInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const opMeta = BTREE_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const value = parseInt(valueInput, 10);
    const { steps: newSteps, finalRoot } = opMeta.run(root, {
      value: Number.isNaN(value) ? 0 : value,
      order,
      variant,
    });
    apply(newSteps, finalRoot);
    setValueInput("");
  }, [opMeta, root, order, variant, valueInput, apply]);

  // Order and variant are structural, so changing either rebuilds the tree from
  // the keys it currently holds. Inserting the same keys in the same order into
  // the other shape is the honest comparison, and it keeps the view from ever
  // showing a tree that violates its own order.
  const setOrder = useCallback(
    (next) => {
      const keys = inorderKeys(root, variant);
      setOrderState(next);
      load(buildFromValues(keys, next, variant), `Rebuilt at order ${next} — up to ${next - 1} keys per node`);
    },
    [root, variant, load]
  );

  const setVariant = useCallback(
    (next) => {
      const keys = inorderKeys(root, variant);
      setVariantState(next);
      load(
        buildFromValues(keys, order, next),
        next === "bplus"
          ? "Rebuilt as a B+ tree — every key is now in a leaf, and the keys upstairs are only separators"
          : "Rebuilt as a B-tree — keys now live at every level"
      );
    },
    [root, order, variant, load]
  );

  const applyCustom = useCallback(() => {
    const values = parseValueList(customInput);
    if (values.length === 0) return;
    load(buildFromValues(values, order, variant), `Built from ${values.length} keys`);
    setCustomInput("");
  }, [customInput, order, variant, load]);

  const shuffle = useCallback(
    () => load(buildFromValues(randomValues(), order, variant), "New random tree"),
    [order, variant, load]
  );

  return {
    ...view,
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
    runOperation,
  };
}
