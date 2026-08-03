export const size = {
  key: "size",
  label: "Size",
  group: "status",
  fields: [],
  desc: "Counts the number of elements currently stored in the queue, from front to rear.",
  time: "O(n)",
  space: "O(1)",
  run(queue) {
    const steps = [];

    if (queue.length === 0) {
      steps.push({ nodes: queue, resultBadge: "SIZE: 0", message: "Queue is empty" });
      return { steps, finalList: queue };
    }

    for (let i = 0; i < queue.length; i++) {
      steps.push({ nodes: queue, active: [queue[i].id], message: `Counting... element at position ${i + 1} from the front (count so far: ${i + 1})` });
    }

    steps.push({ nodes: queue, resultBadge: `SIZE: ${queue.length}`, message: `Queue holds ${queue.length} element(s)` });
    return { steps, finalList: queue };
  },
};
