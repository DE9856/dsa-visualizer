export const clear = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Removes every element from the queue, resetting it to empty in one operation.",
  time: "O(n)",
  space: "O(1)",
  run(queue) {
    if (queue.length === 0) {
      return { steps: [{ nodes: queue, message: "Queue is already empty" }], finalList: queue };
    }
    const steps = [
      { nodes: queue, active: queue.map((n) => n.id), message: "Clearing all elements" },
      { nodes: [], message: "Queue cleared" },
    ];
    return { steps, finalList: [] };
  },
};
