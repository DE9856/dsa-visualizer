import { QUEUE_CAPACITY } from "./helpers";

export const isFull = {
  key: "isFull",
  label: "isFull",
  group: "status",
  fields: [],
  desc: `Checks whether the queue has reached its capacity (${QUEUE_CAPACITY} elements in this visualizer). A bounded/array-based queue implementation needs this check before every enqueue.`,
  time: "O(1)",
  space: "O(1)",
  run(queue) {
    const full = queue.length >= QUEUE_CAPACITY;
    const steps = [
      { nodes: queue, resultBadge: full ? "TRUE — queue is full" : "FALSE — room available", message: full ? `Queue is at capacity (${QUEUE_CAPACITY})` : `Queue has ${QUEUE_CAPACITY - queue.length} slot(s) free` },
    ];
    return { steps, finalList: queue };
  },
};
