import { insert } from "./insert";
import { search } from "./search";
import { del } from "./delete";
import { load } from "./loadFactor";
import { keys } from "./keys";
import { resize } from "./resize";
import { clearTable } from "./clear";
import {
  DEFAULT_HASH_FN,
  HASH_FN_MAP,
  HASH_FUNCTIONS,
  HASH_STRATEGIES,
  INITIAL_CAPACITY,
  MAX_KEYS,
  STRATEGY_MAP,
} from "./helpers";

// The full hash table ADT: build (insert/delete), lookup, the load-factor
// read-out that drives resizing, an enumeration, and the two utilities.
export const HASH_OPERATIONS = [insert, search, del, load, keys, resize, clearTable];

export const HASH_OP_MAP = Object.fromEntries(HASH_OPERATIONS.map((op) => [op.key, op]));

export const HASH_GROUPS = [
  { key: "core", label: "Core (Insert / Delete)" },
  { key: "search", label: "Search" },
  { key: "status", label: "Status" },
  { key: "traverse", label: "Traversal" },
  { key: "utility", label: "Utility" },
];

export { HASH_STRATEGIES, STRATEGY_MAP, HASH_FUNCTIONS, HASH_FN_MAP, DEFAULT_HASH_FN, INITIAL_CAPACITY, MAX_KEYS };
