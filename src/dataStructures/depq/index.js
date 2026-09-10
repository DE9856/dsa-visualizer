import { build, clearQueue, deleteMax, deleteMin, insert, peek, status } from "./operations";
import { DEPQ_KINDS, KIND_MAP, MAX_INTERVAL_ITEMS, MAX_ITEMS, capacityOf, isDoubleEnded } from "./helpers";

export const DEPQ_OPERATIONS = [insert, deleteMin, deleteMax, build, peek, status, clearQueue];

export const DEPQ_OP_MAP = Object.fromEntries(DEPQ_OPERATIONS.map((op) => [op.key, op]));

export const DEPQ_GROUPS = [
  { key: "core", label: "Core (both ends)" },
  { key: "build", label: "Build" },
  { key: "access", label: "Access & Check" },
  { key: "utility", label: "Utility" },
];

export { DEPQ_KINDS, KIND_MAP, MAX_ITEMS, MAX_INTERVAL_ITEMS, capacityOf, isDoubleEnded };
export { buildSilent } from "./operations";
