export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["value"],
  desc: "Scans the queue starting from the front and working toward the rear, reporting the 1-based distance from the front at which the value is found.",
  time: "O(n)",
  space: "O(1)",
  run(queue, { value }) {
    const steps = [];

    if (queue.length === 0) {
      steps.push({ nodes: queue, notFound: true, message: "Queue is empty" });
      return { steps, finalList: queue };
    }

    for (let i = 0; i < queue.length; i++) {
      const distanceFromFront = i + 1;
      steps.push({ nodes: queue, active: [queue[i].id], message: `Checking element ${distanceFromFront} from the front (value ${queue[i].value})` });
      if (queue[i].value === value) {
        steps.push({ nodes: queue, found: queue[i].id, resultBadge: `FOUND — ${distanceFromFront} from front`, message: `Found ${value}, ${distanceFromFront} element(s) from the front` });
        return { steps, finalList: queue };
      }
    }

    steps.push({ nodes: queue, notFound: true, message: `Value ${value} was not found in the queue` });
    return { steps, finalList: queue };
  },
};
