export const length = {
  key: "length",
  label: "Count Length",
  group: "query",
  fields: [],
  desc: "Walks the list from the head to the end, incrementing a counter at every node, then reports the total number of nodes.",
  time: "O(n)",
  space: "O(1)",
  run(list) {
    const headId = list[0]?.id ?? null;
    const steps = [];

    if (list.length === 0) {
      steps.push({ nodes: list, headId, resultBadge: "LENGTH: 0", message: "List is empty" });
      return { steps, finalList: list };
    }

    for (let i = 0; i < list.length; i++) {
      steps.push({ nodes: list, active: [list[i].id], headId, message: `Counting... currently at index ${i} (count so far: ${i + 1})` });
    }

    steps.push({ nodes: list, headId, resultBadge: `LENGTH: ${list.length}`, message: `Reached the end — list has ${list.length} node${list.length === 1 ? "" : "s"}` });

    return { steps, finalList: list };
  },
};