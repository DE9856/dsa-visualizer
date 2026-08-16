import { nextId } from "../linkedList/nodeId";
import { cloneHeap, frame, KIND_MAP, MAX_NODES, siftUpWithSteps } from "./helpers";

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["value"],
  desc: "Puts the new value in the only slot that keeps the tree complete — the end of the array — and then sifts it up: compare with the parent, swap if it outranks it, repeat. Because the tree is complete its height is ⌊log₂ n⌋, so the value can only travel that far. Note how little checking happens: a heap never compares siblings, only a node against its parent, which is exactly why it is cheaper to maintain than a search tree and why it cannot answer ordered queries.",
  time: "O(log n)",
  space: "O(1)",
  run(heap, { value }) {
    const next = cloneHeap(heap);

    if (next.nodes.length >= MAX_NODES) {
      return {
        steps: [
          frame(next, {
            notFound: true,
            overflow: true,
            message: `This visualizer stops at ${MAX_NODES} nodes (5 full levels) so the tree stays readable — a real heap has no capacity`,
          }),
        ],
        finalHeap: heap,
      };
    }

    const entry = { id: nextId(), value };
    next.nodes.push(entry);
    const index = next.nodes.length - 1;
    const steps = [];

    steps.push(
      frame(next, {
        pending: index,
        pendingId: entry.id,
        message: `Place ${value} at index ${index}, the next free slot — the array has to stay complete, so there is nowhere else it could go`,
      })
    );

    if (index === 0) {
      steps.push(frame(next, { current: 0, message: `${value} is the first value — it is the root` }));
      return { steps, finalHeap: next };
    }

    const resting = siftUpWithSteps(next, index, steps, { pendingId: entry.id });

    steps.push(
      frame(next, {
        current: resting,
        active: [resting],
        message: `${value} inserted at index ${resting} — ${KIND_MAP[next.kind].rule}, so the heap property is restored`,
      })
    );

    return { steps, finalHeap: next };
  },
};
