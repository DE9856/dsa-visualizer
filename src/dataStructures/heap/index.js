import { insert } from "./insert";
import { extract } from "./extract";
import { peek } from "./peek";
import { buildHeap } from "./buildHeap";
import { search } from "./search";
import { height } from "./height";
import { size } from "./size";
import { clearHeap } from "./clear";
import { HEAP_KINDS, KIND_MAP, MAX_NODES } from "./helpers";

// The binary heap ADT: the two sifting operations (insert / extract), constant
// -time access to the root, the bottom-up build, and the queries.
export const HEAP_OPERATIONS = [insert, extract, peek, buildHeap, search, height, size, clearHeap];

export const HEAP_OP_MAP = Object.fromEntries(HEAP_OPERATIONS.map((op) => [op.key, op]));

export const HEAP_GROUPS = [
  { key: "core", label: "Core (Insert / Extract)" },
  { key: "access", label: "Access" },
  { key: "build", label: "Build" },
  { key: "search", label: "Search" },
  { key: "status", label: "Status" },
  { key: "utility", label: "Utility" },
];

export { HEAP_KINDS, KIND_MAP, MAX_NODES };
