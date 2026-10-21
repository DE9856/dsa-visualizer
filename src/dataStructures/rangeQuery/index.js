import { buildStructure } from "./build";
import { update } from "./update";
import { query } from "./query";
import { buildFenwick, buildSegmentNodes, combineFor, fenwickSpans, frame, isFenwick, segmentSpans } from "./helpers";

/**
 * Two structures answering the same question, sharing one array and one
 * canvas. Switching KIND rebuilds the other one over the same values, which is
 * the fastest way to see that a Fenwick tree is a segment tree with the
 * pointers thrown away and the arithmetic doing their job.
 */
export const RANGE_OPERATIONS = [buildStructure, update, query];

export const RANGE_OP_MAP = Object.fromEntries(RANGE_OPERATIONS.map((op) => [op.key, op]));

export const RANGE_GROUPS = [
  { key: "build", label: "Build & Update" },
  { key: "query", label: "Query" },
];

/** The structure as it stands, with nothing highlighted — the resting frame. */
export function restingFrame(values, kind, combine, message = "Ready") {
  if (!values.length) return frame([], [], { message: "The array is empty — load some values." });
  if (isFenwick(kind)) return frame(values, fenwickSpans(buildFenwick(values)), { message });
  const { nodes } = buildSegmentNodes(values, combineFor(kind, combine));
  return frame(values, segmentSpans(nodes), { message });
}

export { KINDS, KIND_MAP, COMBINES, COMBINE_MAP, MAX_N, parseValues, randomValues } from "./helpers";
