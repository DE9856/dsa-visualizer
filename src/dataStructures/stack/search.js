export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["value"],
  desc: "Scans the stack starting from the top and working down to the base, reporting the 1-based distance from the top at which the value is found.",
  time: "O(n)",
  space: "O(1)",
  run(stack, { value }) {
    const steps = [];

    if (stack.length === 0) {
      steps.push({ nodes: stack, notFound: true, message: "Stack is empty" });
      return { steps, finalList: stack };
    }

    for (let i = stack.length - 1; i >= 0; i--) {
      const distanceFromTop = stack.length - i;
      steps.push({ nodes: stack, active: [stack[i].id], message: `Checking element ${distanceFromTop} from the top (value ${stack[i].value})` });
      if (stack[i].value === value) {
        steps.push({ nodes: stack, found: stack[i].id, resultBadge: `FOUND — ${distanceFromTop} from top`, message: `Found ${value}, ${distanceFromTop} element(s) from the top` });
        return { steps, finalList: stack };
      }
    }

    steps.push({ nodes: stack, notFound: true, message: `Value ${value} was not found in the stack` });
    return { steps, finalList: stack };
  },
};
