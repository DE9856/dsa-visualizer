export const clear = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Removes every element from the stack, resetting it to empty in one operation.",
  time: "O(n)",
  space: "O(1)",
  run(stack) {
    if (stack.length === 0) {
      return { steps: [{ nodes: stack, message: "Stack is already empty" }], finalList: stack };
    }
    const steps = [
      { nodes: stack, active: stack.map((n) => n.id), message: "Clearing all elements" },
      { nodes: [], message: "Stack cleared" },
    ];
    return { steps, finalList: [] };
  },
};
