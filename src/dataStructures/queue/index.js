import { enqueue } from "./enqueue";
import { dequeue } from "./dequeue";
import { peek } from "./peek";
import { isEmpty } from "./isEmpty";
import { isFull } from "./isFull";
import { size } from "./size";
import { search } from "./search";
import { clear } from "./clear";
import { QUEUE_CAPACITY } from "./helpers";

// The full Queue ADT: FIFO insert/remove, non-destructive access,
// capacity/emptiness checks, search, and a bulk reset.
export const QUEUE_OPERATIONS = [enqueue, dequeue, peek, isEmpty, isFull, size, search, clear];

export const QUEUE_OP_MAP = Object.fromEntries(QUEUE_OPERATIONS.map((op) => [op.key, op]));

export const QUEUE_GROUPS = [
  { key: "core", label: "Core (Enqueue / Dequeue)" },
  { key: "access", label: "Access" },
  { key: "status", label: "Status" },
  { key: "search", label: "Search" },
  { key: "utility", label: "Utility" },
];

export { QUEUE_CAPACITY };
