import { cloneHeap, emptyHeap, frame } from "./helpers";

export const clearHeap = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Empties the heap in one operation. Nothing has to be unlinked or rebalanced — the array is simply discarded.",
  time: "O(1)",
  space: "O(1)",
  run(heap) {
    const next = cloneHeap(heap);

    if (next.nodes.length === 0) {
      return { steps: [frame(next, { message: "Heap is already empty" })], finalHeap: heap };
    }

    const steps = [
      frame(next, { active: next.nodes.map((_, i) => i), message: "Dropping every value" }),
      frame(emptyHeap(next.kind), { message: "Heap cleared" }),
    ];
    return { steps, finalHeap: emptyHeap(next.kind) };
  },
};
