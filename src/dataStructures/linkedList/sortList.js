import { cloneNodes } from "./helpers";

export const sortList = {
  key: "sort",
  label: "Sort List",
  group: "rearrange",
  fields: [],
  desc: "Repeatedly walks the list comparing neighboring nodes and swapping their values whenever they're out of order (bubble sort), until no swaps are needed.",
  time: "O(n\u00b2)",
  space: "O(1)",
  run(list) {
    const nodes = cloneNodes(list);
    const steps = [];
    const n = nodes.length;
    const headId = nodes[0]?.id ?? null;

    if (n < 2) {
      steps.push({ nodes, headId, message: n === 0 ? "List is empty" : "Single-node list is already sorted" });
      return { steps, finalList: nodes };
    }

    for (let i = 0; i < n - 1; i++) {
      let swappedAny = false;
      for (let j = 0; j < n - 1 - i; j++) {
        steps.push({
          nodes,
          active: [nodes[j].id, nodes[j + 1].id],
          headId: nodes[0].id,
          message: `Comparing ${nodes[j].value} and ${nodes[j + 1].value}`,
        });
        if (nodes[j].value > nodes[j + 1].value) {
          const a = nodes[j];
          const b = nodes[j + 1];
          nodes[j] = b;
          nodes[j + 1] = a;
          swappedAny = true;
          steps.push({
            nodes: [...nodes],
            swap: [a.id, b.id],
            headId: nodes[0].id,
            message: `Swapping — relinking so ${b.value} comes before ${a.value}`,
          });
        }
      }
      if (!swappedAny) break;
    }

    steps.push({ nodes, headId: nodes[0].id, message: "List is sorted" });
    return { steps, finalList: nodes };
  },
};