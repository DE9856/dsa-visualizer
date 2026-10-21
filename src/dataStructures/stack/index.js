import { push } from "./push";
import { pop } from "./pop";
import { peek } from "./peek";
import { isEmpty } from "./isEmpty";
import { isFull } from "./isFull";
import { size } from "./size";
import { search } from "./search";
import { clear } from "./clear";
import { STACK_CAPACITY } from "./helpers";

// The full Stack ADT: LIFO insert/remove, non-destructive access,
// capacity/emptiness checks, search, and a bulk reset.
export const STACK_OPERATIONS = [push, pop, peek, isEmpty, isFull, size, search, clear];

export const STACK_OP_MAP = Object.fromEntries(STACK_OPERATIONS.map((op) => [op.key, op]));

export const STACK_GROUPS = [
  { key: "core", label: "Core (Push / Pop)" },
  { key: "access", label: "Access" },
  { key: "status", label: "Status" },
  { key: "search", label: "Search" },
  { key: "utility", label: "Utility" },
];

export { STACK_CAPACITY };
