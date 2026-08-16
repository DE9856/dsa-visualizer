import { cloneHeap, frame } from "./helpers";

export const size = {
  key: "size",
  label: "Size",
  group: "status",
  fields: [],
  desc: "The number of values in the heap. Because a heap is a complete tree packed into an array with no gaps, the size is just the array length — no traversal, no counter to maintain, unlike a linked structure where counting means walking every node.",
  time: "O(1)",
  space: "O(1)",
  run(heap) {
    const next = cloneHeap(heap);
    const n = next.nodes.length;

    if (n === 0) {
      return { steps: [frame(next, { resultBadge: "SIZE: 0", message: "Heap is empty" })], finalHeap: heap };
    }

    const steps = [
      frame(next, {
        active: next.nodes.map((_, i) => i),
        message: "The array is packed with no gaps, so every slot from 0 to the end holds a value",
      }),
      frame(next, { resultBadge: `SIZE: ${n}`, message: `Heap holds ${n} value${n === 1 ? "" : "s"} — read straight off the array length` }),
    ];

    return { steps, finalHeap: heap };
  },
};
