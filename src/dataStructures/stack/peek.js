export const peek = {
  key: "peek",
  label: "Peek / Top",
  group: "access",
  fields: [],
  desc: "Returns the value of the top element without removing it from the stack. Reports underflow if the stack is empty.",
  time: "O(1)",
  space: "O(1)",
  run(stack) {
    if (stack.length === 0) {
      const steps = [{ nodes: stack, notFound: true, underflow: true, message: "Stack is empty — nothing to peek" }];
      return { steps, finalList: stack };
    }

    const top = stack[stack.length - 1];
    const steps = [
      { nodes: stack, active: [top.id], message: "Checking the top element" },
      { nodes: stack, found: top.id, resultBadge: `TOP: ${top.value}`, message: `Top element is ${top.value}` },
    ];
    return { steps, finalList: stack };
  },
};
