export const search = {
  key: "search",
  label: "Search / Traverse",
  group: "build",
  fields: ["value"],
  desc: "Walks the list from the head, checking each node's value against the target, and reports where (or whether) it was found.",
  time: "O(n)",
  space: "O(1)",
  run(list, { value }) {
    const headId = list[0]?.id ?? null;
    const steps = [];

    if (list.length === 0) {
      steps.push({ nodes: list, notFound: true, message: "List is empty" });
      return { steps, finalList: list };
    }

    for (let i = 0; i < list.length; i++) {
      steps.push({ nodes: list, active: [list[i].id], headId, message: `Checking index ${i} (value ${list[i].value})` });
      if (list[i].value === value) {
        steps.push({ nodes: list, found: list[i].id, headId, message: `Found ${value} at index ${i}` });
        return { steps, finalList: list };
      }
    }

    steps.push({ nodes: list, notFound: true, headId, message: `Value ${value} was not found in the list` });
    return { steps, finalList: list };
  },
};