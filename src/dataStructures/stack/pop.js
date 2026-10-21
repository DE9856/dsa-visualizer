export const pop = {
  key: "pop",
  label: "Pop",
  group: "core",
  fields: [],
  desc: "Removes and returns the element currently on top of the stack. Calling pop on an empty stack is a stack underflow and is rejected.",
  time: "O(1)",
  space: "O(1)",
  run(stack) {
    if (stack.length === 0) {
      const steps = [{ nodes: stack, notFound: true, underflow: true, message: "Stack underflow — cannot pop, stack is empty" }];
      return { steps, finalList: stack };
    }

    const top = stack[stack.length - 1];
    const finalList = stack.slice(0, -1);
    const steps = [
      { nodes: stack, active: [top.id], message: `Popping top element (${top.value})` },
      { nodes: stack, removing: top.id, message: `Removing ${top.value} from the top` },
      { nodes: finalList, resultBadge: `POPPED: ${top.value}`, message: `${top.value} popped — stack now has ${finalList.length} item(s)` },
    ];
    return { steps, finalList };
  },
};
