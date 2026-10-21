import { insert } from "./insert";
import { del } from "./delete";
import { search } from "./search";
import { inorder } from "./inorder";
import { height } from "./height";
import { size } from "./size";
import { clearTree } from "./clear";

export const TWO_THREE_OPERATIONS = [insert, del, search, inorder, height, size, clearTree];

export const TWO_THREE_OP_MAP = Object.fromEntries(TWO_THREE_OPERATIONS.map((op) => [op.key, op]));

export const TWO_THREE_GROUPS = [
  { key: "build", label: "Build" },
  { key: "query", label: "Query" },
  { key: "traverse", label: "Traversal" },
  { key: "utility", label: "Utility" },
];
