import { insert } from "./insert";
import { deleteRoot } from "./deleteRoot";
import { meld } from "./meld";
import { buildInserts } from "./buildInserts";
import { buildPairwise } from "./buildPairwise";
import { status } from "./status";
import { clearTree } from "./clear";
import { LEFTIST_KINDS, KIND_MAP, MAX_NODES } from "./helpers";

// Every one of these is a meld underneath — insert melds with a single node,
// delete melds the root's two children, and both builds are sequences of
// melds. The group labels say so, because it is the whole point.
export const LEFTIST_OPERATIONS = [insert, deleteRoot, meld, buildInserts, buildPairwise, status, clearTree];

export const LEFTIST_OP_MAP = Object.fromEntries(LEFTIST_OPERATIONS.map((op) => [op.key, op]));

export const LEFTIST_GROUPS = [
  { key: "core", label: "Core (both are melds)" },
  { key: "combine", label: "Meld" },
  { key: "build", label: "Build — two ways" },
  { key: "status", label: "Status" },
  { key: "utility", label: "Utility" },
];

export { LEFTIST_KINDS, KIND_MAP, MAX_NODES };
