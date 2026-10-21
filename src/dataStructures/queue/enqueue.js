import { nextId } from "../linkedList/nodeId";
import { cloneNodes, QUEUE_CAPACITY } from "./helpers";

// Queue is stored as an array where index 0 is the FRONT and the last
// index is the REAR. enqueue() appends to the rear end of the array.
export const enqueue = {
  key: "enqueue",
  label: "Enqueue",
  group: "core",
  fields: ["value"],
  desc: "Adds a new element at the rear of the queue. If the queue is already at capacity, the enqueue is rejected (queue overflow) — this is the First-In-First-Out (FIFO) insert operation.",
  time: "O(1)",
  space: "O(1)",
  run(queue, { value }) {
    if (queue.length >= QUEUE_CAPACITY) {
      const steps = [
        { nodes: queue, notFound: true, overflow: true, message: `Queue overflow — capacity (${QUEUE_CAPACITY}) reached, cannot enqueue ${value}` },
      ];
      return { steps, finalList: queue };
    }

    const newNode = { id: nextId(), value };
    const withNode = [...cloneNodes(queue), newNode];
    const steps = [
      { nodes: withNode, pending: newNode.id, message: `Creating new element (${value})` },
      { nodes: withNode, active: [newNode.id], message: `${value} enqueued — now at the rear of the queue` },
    ];
    return { steps, finalList: withNode };
  },
};
