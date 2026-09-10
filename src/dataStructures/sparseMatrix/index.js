import { buildTriples } from "./buildTriples";
import { transposeSimple } from "./transposeSimple";
import { transposeFast } from "./transposeFast";
import { addMatrices } from "./addMatrices";
import { multiplyMatrices } from "./multiplyMatrices";
import { lookup } from "./lookup";
import { MAX_DIM, MAX_TERMS } from "./helpers";

// The two transposes sit next to each other on purpose: they produce the
// identical result and the whole lesson is in the step counts.
export const SPARSE_OPERATIONS = [buildTriples, transposeSimple, transposeFast, addMatrices, multiplyMatrices, lookup];

export const SPARSE_OP_MAP = Object.fromEntries(SPARSE_OPERATIONS.map((op) => [op.key, op]));

export const SPARSE_GROUPS = [
  { key: "represent", label: "Represent" },
  { key: "transform", label: "Transpose" },
  { key: "combine", label: "Combine" },
  { key: "status", label: "Access" },
];

export { MAX_DIM, MAX_TERMS };
