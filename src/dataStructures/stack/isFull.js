import { STACK_CAPACITY } from "./helpers";

export const isFull = {
  key: "isFull",
  label: "isFull",
  group: "status",
  fields: [],
  desc: `Checks whether the stack has reached its capacity (${STACK_CAPACITY} elements in this visualizer). A bounded/array-based stack implementation needs this check before every push.`,
  time: "O(1)",
  space: "O(1)",
  run(stack) {
    const full = stack.length >= STACK_CAPACITY;
    const steps = [
      { nodes: stack, resultBadge: full ? "TRUE — stack is full" : "FALSE — room available", message: full ? `Stack is at capacity (${STACK_CAPACITY})` : `Stack has ${STACK_CAPACITY - stack.length} slot(s) free` },
    ];
    return { steps, finalList: stack };
  },
};
