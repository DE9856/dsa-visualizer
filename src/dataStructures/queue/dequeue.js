export const dequeue = {
  key: "dequeue",
  label: "Dequeue",
  group: "core",
  fields: [],
  desc: "Removes and returns the element currently at the front of the queue. Calling dequeue on an empty queue is a queue underflow and is rejected.",
  time: "O(1)",
  space: "O(1)",
  run(queue) {
    if (queue.length === 0) {
      const steps = [{ nodes: queue, notFound: true, underflow: true, message: "Queue underflow — cannot dequeue, queue is empty" }];
      return { steps, finalList: queue };
    }

    const front = queue[0];
    const finalList = queue.slice(1);
    const steps = [
      { nodes: queue, active: [front.id], message: `Dequeuing front element (${front.value})` },
      { nodes: queue, removing: front.id, message: `Removing ${front.value} from the front` },
      { nodes: finalList, resultBadge: `DEQUEUED: ${front.value}`, message: `${front.value} dequeued — queue now has ${finalList.length} item(s)` },
    ];
    return { steps, finalList };
  },
};
