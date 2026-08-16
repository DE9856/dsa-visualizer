import { cloneHeap, frame, heightOf } from "./helpers";

export const height = {
  key: "height",
  label: "Height",
  group: "status",
  fields: [],
  desc: "A heap is a complete tree — every level is full except possibly the last, which fills left to right — so its height is forced: ⌊log₂ n⌋, with no way for it to degenerate the way an unbalanced BST can. That is why insert and extract can promise O(log n) without any rebalancing machinery. It also means the height can be computed from the array length alone; walking the levels here is only for show.",
  time: "O(1)",
  space: "O(1)",
  run(heap) {
    const next = cloneHeap(heap);
    const n = next.nodes.length;
    const steps = [];

    if (n === 0) {
      return { steps: [frame(next, { resultBadge: "HEIGHT: -1", message: "Heap is empty" })], finalHeap: heap };
    }

    const h = heightOf(n);

    for (let d = 0; d <= h; d++) {
      const start = 2 ** d - 1;
      const end = Math.min(2 ** (d + 1) - 2, n - 1);
      const level = [];
      for (let i = start; i <= end; i++) level.push(i);
      const capacity = 2 ** d;
      steps.push(
        frame(next, {
          active: level,
          message: `Level ${d}: indices ${start}–${end}, ${level.length} of ${capacity} slot${capacity === 1 ? "" : "s"} filled`,
        })
      );
    }

    steps.push(
      frame(next, {
        resultBadge: `HEIGHT: ${h}`,
        message: `Height ${h} = ⌊log₂ ${n}⌋ — a complete tree has no other option, which is where the O(log n) guarantee comes from`,
      })
    );

    return { steps, finalHeap: heap };
  },
};
