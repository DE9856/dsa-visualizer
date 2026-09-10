import { buildTree } from "./buildTree";
import { output } from "./output";
import { mergeAll } from "./mergeAll";
import { status } from "./status";
import { KIND_MAP, MAX_RUNS, MAX_RUN_LENGTH, MIN_RUNS, SELECTION_KINDS } from "./helpers";

export const SELECTION_OPERATIONS = [buildTree, output, mergeAll, status];

export const SELECTION_OP_MAP = Object.fromEntries(SELECTION_OPERATIONS.map((op) => [op.key, op]));

export const SELECTION_GROUPS = [
  { key: "build", label: "Build" },
  { key: "merge", label: "Merge" },
  { key: "status", label: "Cost" },
];

export { KIND_MAP, MAX_RUNS, MAX_RUN_LENGTH, MIN_RUNS, SELECTION_KINDS };
