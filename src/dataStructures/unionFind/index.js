import { union } from "./union";
import { find } from "./find";
import { connected } from "./connected";
import { components } from "./components";
import { addElement } from "./addElement";
import { reset } from "./reset";
import { MAX_ELEMENTS, makeUnionFind } from "./helpers";

// The disjoint-set ADT: the two operations it is named after, the queries
// built on them, and make-set. Kruskal's MST uses the same structure through
// makeUnionFind() — one implementation, two front ends.
export const UF_OPERATIONS = [union, find, connected, components, addElement, reset];

export const UF_OP_MAP = Object.fromEntries(UF_OPERATIONS.map((op) => [op.key, op]));

export const UF_GROUPS = [
  { key: "core", label: "Core (Union / Find)" },
  { key: "query", label: "Query" },
  { key: "utility", label: "Utility" },
];

export { MAX_ELEMENTS, makeUnionFind };
