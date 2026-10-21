export const isEmpty = {
  key: "isEmpty",
  label: "isEmpty",
  group: "status",
  fields: [],
  desc: "Checks whether the queue currently holds any elements, returning true only when the queue has zero items.",
  time: "O(1)",
  space: "O(1)",
  run(queue) {
    const empty = queue.length === 0;
    const steps = [
      { nodes: queue, resultBadge: empty ? "TRUE — queue is empty" : "FALSE — queue is not empty", message: empty ? "No elements in the queue" : `Queue holds ${queue.length} element(s)` },
    ];
    return { steps, finalList: queue };
  },
};
