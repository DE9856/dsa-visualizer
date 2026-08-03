export const peek = {
  key: "peek",
  label: "Peek / Front",
  group: "access",
  fields: [],
  desc: "Returns the value of the front element without removing it from the queue. Reports underflow if the queue is empty.",
  time: "O(1)",
  space: "O(1)",
  run(queue) {
    if (queue.length === 0) {
      const steps = [{ nodes: queue, notFound: true, underflow: true, message: "Queue is empty — nothing to peek" }];
      return { steps, finalList: queue };
    }

    const front = queue[0];
    const steps = [
      { nodes: queue, active: [front.id], message: "Checking the front element" },
      { nodes: queue, found: front.id, resultBadge: `FRONT: ${front.value}`, message: `Front element is ${front.value}` },
    ];
    return { steps, finalList: queue };
  },
};
