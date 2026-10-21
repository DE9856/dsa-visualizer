import { address } from "./address";
import { layoutWalk } from "./layoutWalk";
import { walkByRows, walkByColumns } from "./walkOrder";
import { savings } from "./savings";
import { LAYOUTS, LAYOUT_GROUPS, LAYOUT_MAP, MAX_DIM, MAX_N, MAX_RANK } from "./helpers";

export const MD_OPERATIONS = [address, layoutWalk, walkByRows, walkByColumns, savings];

export const MD_OP_MAP = Object.fromEntries(MD_OPERATIONS.map((op) => [op.key, op]));

export const MD_GROUPS = [
  { key: "address", label: "Addressing" },
  { key: "locality", label: "Traversal & Cost" },
];

/**
 * The operations that apply to a layout. The two traversal walks only mean
 * anything where every cell has an address of its own, and "what the shape
 * saves" only means anything where it doesn't — so each says which kind it
 * is for, and the sidebar shows nothing that would just refuse.
 */
export function operationsFor(layout) {
  const kind = LAYOUT_MAP[layout].kind;
  return MD_OPERATIONS.filter((op) => op.layouts === "all" || op.layouts === kind);
}

export { LAYOUTS, LAYOUT_GROUPS, LAYOUT_MAP, MAX_DIM, MAX_N, MAX_RANK };
