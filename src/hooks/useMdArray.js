import { useCallback, useState } from "react";
import { MD_OP_MAP, operationsFor } from "../dataStructures/mdArray";
import {
  MAX_DIM,
  inputFor,
  isSquare,
  parseDims,
  parseIndex,
  shapeFor,
  toFrame,
} from "../dataStructures/mdArray/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { dims: [], memory: [], formula: [], visited: new Set(), message: "" };

const DEFAULT_DIMS = [3, 4];

/**
 * The multidimensional array view's state: the shape, the layout, and the
 * index being addressed.
 *
 * The shape is the structure and the layout is a setting on it — but they are
 * not independent, because the packed layouts are square by definition. So
 * switching to one reshapes the array, which makes the layout part of the
 * document rather than a view option, and it travels in the snapshot for the
 * same reason the heap's max/min does.
 *
 * `init` is the setup decoded from a shared link ({ dims, layout }).
 */
export function useMdArray(init) {
  const initialLayout = init?.layout || "rowmajor";
  const initialDims = shapeFor(initialLayout, init?.dims || DEFAULT_DIMS);

  const [layout, setLayoutState] = useState(initialLayout);
  const [dimsInput, setDimsInput] = useState(inputFor(initialLayout, initialDims));

  const { view, value: dims, apply, load } = useStructureRun({
    initial: () => initialDims,
    toFrame: (next, message) => toFrame(next, layout, message),
    emptyStep: EMPTY_STEP,
    readyMessage: "Ready — pick an operation",
    snapshot: () => ({ layout, dimsInput }),
    restore: (doc) => {
      setLayoutState(doc.layout);
      setDimsInput(doc.dimsInput);
    },
  });

  const [operation, setOperation] = useState("layout");
  const [indexInput, setIndexInput] = useState("1, 2");

  const opMeta = MD_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalDims } = opMeta.run(dims, {
      layout,
      index: parseIndex(indexInput, dims),
    });
    apply(newSteps, finalDims);
  }, [dims, opMeta, layout, indexInput, apply]);

  const applyDims = useCallback(() => {
    const parsed = parseDims(dimsInput);
    if (!parsed) return;
    const shaped = shapeFor(layout, parsed);
    setDimsInput(inputFor(layout, shaped));
    load(shaped, `A ${shaped.join(" × ")} array`);
  }, [dimsInput, layout, load]);

  /**
   * Switching layout can change the shape — a packed layout is square — and
   * can leave the current operation inapplicable, so both follow it.
   */
  const setLayout = useCallback(
    (next) => {
      const shaped = shapeFor(next, dims);
      const available = operationsFor(next);
      setLayoutState(next);
      if (!available.some((op) => op.key === operation)) setOperation(available[0].key);
      setDimsInput(inputFor(next, shaped));
      // `load` records first, and the snapshot above still reads the previous
      // layout — the setter has not re-rendered yet — so undo lands on the
      // layout this switch left rather than the one it arrived at.
      load(shaped, isSquare(next) ? `A ${shaped[0]}×${shaped[0]} matrix, stored packed` : `Stored ${next}`);
    },
    [dims, operation, load]
  );

  const shuffle = useCallback(() => {
    const next = isSquare(layout)
      ? [4 + Math.floor(Math.random() * 3)]
      : Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => 2 + Math.floor(Math.random() * (MAX_DIM - 2)));
    const shaped = shapeFor(layout, next);
    setDimsInput(inputFor(layout, shaped));
    load(shaped, `A ${shaped.join(" × ")} array`);
  }, [layout, load]);

  return {
    ...view,
    dims,
    layout,
    setLayout,
    operation,
    setOperation,
    opMeta,
    dimsInput,
    setDimsInput,
    applyDims,
    indexInput,
    setIndexInput,
    shuffle,
    runOperation,
  };
}
