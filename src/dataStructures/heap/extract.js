import { cloneHeap, frame, KIND_MAP, siftDownWithSteps } from "./helpers";

export const extract = {
  key: "extract",
  label: "Extract Root",
  group: "core",
  fields: [],
  desc: "Removes the root — the whole reason to keep a heap. The hole is filled from the end of the array, not from a child, because only that keeps the tree complete. The value that lands on the root almost certainly breaks the property, so it sifts down: swap with the better of its two children until both fall below it. This is one half of heap sort, which is nothing more than extract repeated until the heap is empty.",
  time: "O(log n)",
  space: "O(1)",
  run(heap) {
    const next = cloneHeap(heap);
    const kind = KIND_MAP[next.kind];

    if (next.nodes.length === 0) {
      return {
        steps: [frame(next, { notFound: true, underflow: true, message: "Heap is empty — nothing to extract" })],
        finalHeap: heap,
      };
    }

    const steps = [];
    const rootValue = next.nodes[0].value;

    steps.push(
      frame(next, {
        removing: 0,
        message: `The root holds ${rootValue}, the ${kind.root} value in the heap — that is the one extract returns`,
      })
    );

    if (next.nodes.length === 1) {
      next.nodes.pop();
      steps.push(frame(next, { resultBadge: `EXTRACTED ${rootValue}`, message: `${rootValue} removed — the heap is now empty` }));
      return { steps, finalHeap: next };
    }

    const last = next.nodes[next.nodes.length - 1].value;
    next.nodes[0] = next.nodes[next.nodes.length - 1];
    next.nodes.pop();

    steps.push(
      frame(next, {
        current: 0,
        message: `Move the last value (${last}) into the root and shrink the array — filling the hole from a child instead would leave a gap in the middle`,
      })
    );

    const resting = siftDownWithSteps(next, 0, steps);

    steps.push(
      frame(next, {
        current: resting,
        resultBadge: `EXTRACTED ${rootValue}`,
        message: `${rootValue} extracted — ${last} settled at index ${resting}, and ${next.nodes[0].value} is the new ${kind.root}`,
      })
    );

    return { steps, finalHeap: next };
  },
};
