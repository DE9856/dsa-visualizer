import { insert } from "./insert";
import { search } from "./search";
import { del } from "./delete";
import { keys } from "./keys";
import { stats } from "./stats";
import { clearTable } from "./clear";
import { BUCKET_SIZE, DYNAMIC_KINDS, KIND_MAP, MAX_KEYS, SPLIT_LIMIT } from "./helpers";

// Dynamic hashing's ADT is the same as any hash table's — the interest is all
// in what insert does when a bucket fills up, and in the depths and pointers
// that decide it, which is what the status operation reads out.
export const DYNAMIC_OPERATIONS = [insert, search, del, stats, keys, clearTable];

export const DYNAMIC_OP_MAP = Object.fromEntries(DYNAMIC_OPERATIONS.map((op) => [op.key, op]));

export const DYNAMIC_GROUPS = [
  { key: "core", label: "Core (Insert / Delete)" },
  { key: "search", label: "Search" },
  { key: "status", label: "Status" },
  { key: "traverse", label: "Traversal" },
  { key: "utility", label: "Utility" },
];

export { DYNAMIC_KINDS, KIND_MAP, BUCKET_SIZE, SPLIT_LIMIT, MAX_KEYS };
