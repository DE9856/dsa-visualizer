// A fixed capacity keeps the visualization meaningful and lets us
// demonstrate the classic "queue overflow" case from the queue ADT.
export const QUEUE_CAPACITY = 8;

export function cloneNodes(nodes) {
  return nodes.map((n) => ({ ...n }));
}
