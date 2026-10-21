export const isEmpty = {
  key: "isEmpty",
  label: "isEmpty",
  group: "status",
  fields: [],
  desc: "Checks whether the stack currently holds any elements, returning true only when the stack has zero items.",
  time: "O(1)",
  space: "O(1)",
  run(stack) {
    const empty = stack.length === 0;
    const steps = [
      { nodes: stack, resultBadge: empty ? "TRUE — stack is empty" : "FALSE — stack is not empty", message: empty ? "No elements on the stack" : `Stack holds ${stack.length} element(s)` },
    ];
    return { steps, finalList: stack };
  },
};
