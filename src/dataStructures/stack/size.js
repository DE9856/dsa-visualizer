export const size = {
  key: "size",
  label: "Size",
  group: "status",
  fields: [],
  desc: "Counts the number of elements currently stored on the stack, from the base up to the top.",
  time: "O(n)",
  space: "O(1)",
  run(stack) {
    const steps = [];

    if (stack.length === 0) {
      steps.push({ nodes: stack, resultBadge: "SIZE: 0", message: "Stack is empty" });
      return { steps, finalList: stack };
    }

    for (let i = 0; i < stack.length; i++) {
      steps.push({ nodes: stack, active: [stack[i].id], message: `Counting... element at height ${i + 1} (count so far: ${i + 1})` });
    }

    steps.push({ nodes: stack, resultBadge: `SIZE: ${stack.length}`, message: `Stack holds ${stack.length} element(s)` });
    return { steps, finalList: stack };
  },
};
