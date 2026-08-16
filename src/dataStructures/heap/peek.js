import { cloneHeap, frame, KIND_MAP } from "./helpers";

export const peek = {
  key: "peek",
  label: "Peek Root",
  group: "access",
  fields: [],
  desc: "Reads the root without removing it. This is the operation a priority queue is built around: the next task to run is always at index 0, found in constant time with no search at all. Everything else about a heap exists to keep this one answer correct as values come and go.",
  time: "O(1)",
  space: "O(1)",
  run(heap) {
    const next = cloneHeap(heap);
    const kind = KIND_MAP[next.kind];

    if (next.nodes.length === 0) {
      return { steps: [frame(next, { notFound: true, message: "Heap is empty — no root to read" })], finalHeap: heap };
    }

    const value = next.nodes[0].value;
    return {
      steps: [
        frame(next, {
          found: 0,
          resultBadge: `${kind.short.split(" ")[0]}: ${value}`,
          message: `The root holds ${value} — the ${kind.root} value, available in O(1) without looking at anything else`,
        }),
      ],
      finalHeap: heap,
    };
  },
};
