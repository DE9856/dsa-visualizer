import { nextId } from "../linkedList/nodeId";
import { cloneNodes, STACK_CAPACITY } from "./helpers";

// Stack is stored as an array where index 0 is the BASE and the last
// index is the TOP. push() appends to the end of the array.
export const push = {
  key: "push",
  label: "Push",
  group: "core",
  fields: ["value"],
  desc: "Adds a new element on top of the stack. If the stack is already at capacity, the push is rejected (stack overflow) — this is the classic Last-In-First-Out (LIFO) insert operation.",
  time: "O(1)",
  space: "O(1)",
  run(stack, { value }) {
    if (stack.length >= STACK_CAPACITY) {
      const steps = [
        { nodes: stack, notFound: true, overflow: true, message: `Stack overflow — capacity (${STACK_CAPACITY}) reached, cannot push ${value}` },
      ];
      return { steps, finalList: stack };
    }

    const newNode = { id: nextId(), value };
    const withNode = [...cloneNodes(stack), newNode];
    const steps = [
      { nodes: withNode, pending: newNode.id, message: `Creating new element (${value})` },
      { nodes: withNode, active: [newNode.id], message: `${value} pushed — now on top of the stack` },
    ];
    return { steps, finalList: withNode };
  },
};
