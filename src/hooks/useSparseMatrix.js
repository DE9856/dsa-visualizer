import { useCallback, useMemo, useState } from "react";
import { SPARSE_OP_MAP } from "../dataStructures/sparseMatrix";
import {
  DEFAULT_MATRIX,
  DEFAULT_SECOND,
  formatMatrix,
  parseMatrix,
  randomMatrix,
  toFrame,
} from "../dataStructures/sparseMatrix/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { rows: 0, cols: 0, dense: [], triples: [], active: [], message: "" };

/**
 * The sparse matrix view's state: the matrix itself, the text of the second
 * operand, and the cell an access is aimed at.
 *
 * The typed matrix travels in the snapshot for the same reason the
 * polynomial's text does — a transpose replaces the matrix, and undoing back
 * past it has to put the text that produced the old one back too, or the box
 * and the grid describe different matrices.
 *
 * `init` is the setup decoded from a shared link ({ matrix }).
 */
export function useSparseMatrix(init) {
  // A shared link separates rows with `;` so it stays one hash field. The box
  // accepts that, but reads as one long line — so it is normalised back to one
  // row per line, which is what APPLY would have left behind.
  const initialMatrix = (init?.matrix && parseMatrix(init.matrix)) || parseMatrix(DEFAULT_MATRIX) || randomMatrix();
  const [matrixInput, setMatrixInput] = useState(() => formatMatrix(initialMatrix));

  const { view, value: matrix, apply, load } = useStructureRun({
    initial: () => initialMatrix,
    toFrame: (next, message) => toFrame(next, message),
    emptyStep: EMPTY_STEP,
    snapshot: () => ({ matrixInput }),
    restore: (doc) => setMatrixInput(doc.matrixInput),
  });

  const [operation, setOperation] = useState("build");
  const [secondInput, setSecondInput] = useState(DEFAULT_SECOND);
  const [rowInput, setRowInput] = useState("1");
  const [colInput, setColInput] = useState("4");

  const opMeta = SPARSE_OP_MAP[operation];

  // Parsed as you type so the sidebar can say what shape B is, which is the
  // one thing that decides whether an add or a multiply is legal at all.
  const secondMatrix = useMemo(() => parseMatrix(secondInput), [secondInput]);

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalMatrix } = opMeta.run(matrix, {
      secondMatrix,
      row: parseInt(rowInput, 10) || 0,
      col: parseInt(colInput, 10) || 0,
    });
    apply(newSteps, finalMatrix);
    // A transpose or a product replaces the matrix, so the box has to follow
    // it — otherwise APPLY would silently undo the operation just watched.
    if (finalMatrix !== matrix) setMatrixInput(formatMatrix(finalMatrix));
  }, [matrix, opMeta, secondMatrix, rowInput, colInput, apply]);

  const applyMatrix = useCallback(() => {
    const parsed = parseMatrix(matrixInput);
    if (!parsed) return;
    load(parsed, "Matrix loaded");
  }, [matrixInput, load]);

  const shuffle = useCallback(() => {
    const next = randomMatrix(5, 5, 0.2);
    setMatrixInput(formatMatrix(next));
    load(next, "New random sparse matrix");
  }, [load]);

  const randomSecond = useCallback(() => {
    setSecondInput(formatMatrix(randomMatrix(matrix.cols, matrix.rows, 0.2)));
  }, [matrix.cols, matrix.rows]);

  return {
    ...view,
    matrix,
    operation,
    setOperation,
    opMeta,
    matrixInput,
    setMatrixInput,
    applyMatrix,
    secondInput,
    setSecondInput,
    secondMatrix,
    randomSecond,
    rowInput,
    setRowInput,
    colInput,
    setColInput,
    shuffle,
    runOperation,
  };
}
