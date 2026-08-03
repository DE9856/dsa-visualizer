import { insertHead } from "./insertHead";
import { insertTail } from "./insertTail";
import { insertAt } from "./insertAt";
import { updateNode } from "./updateNode";
import { deleteValue } from "./deleteValue";
import { deleteAt } from "./deleteAt";
import { clearList } from "./clearList";
import { search } from "./search";
import { length } from "./length";
import { reverse } from "./reverse";
import { sortList } from "./sortList";
import { concatenate } from "./concatenate";
import { merge } from "./merge";
import { forwardChain, backwardChain } from "./helpers";

export const LL_OPERATIONS = [
  insertHead,
  insertTail,
  insertAt,
  updateNode,
  deleteValue,
  deleteAt,
  clearList,
  search,
  length,
  reverse,
  sortList,
  concatenate,
  merge,
];

export const LL_OP_MAP = Object.fromEntries(LL_OPERATIONS.map((op) => [op.key, op]));

// Determines the sidebar section ordering / headings. Operations are
// grouped by what they do rather than shown as one long flat list.
export const LL_GROUPS = [
  { key: "build", label: "Build" },
  { key: "modify", label: "Modify" },
  { key: "query", label: "Query" },
  { key: "rearrange", label: "Rearrange" },
  { key: "combine", label: "Combine" },
];

export const LL_TYPES = [
  { key: "singly", label: "Singly" },
  { key: "doubly", label: "Doubly" },
  { key: "circular", label: "Circular" },
];

export { forwardChain, backwardChain };