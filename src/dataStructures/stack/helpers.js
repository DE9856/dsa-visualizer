// A fixed capacity keeps the visualization meaningful and lets us
// demonstrate the classic "stack overflow" case from the stack ADT.
export const STACK_CAPACITY = 8;

export function cloneNodes(nodes) {
  return nodes.map((n) => ({ ...n }));
}
