import { cloneNodes } from "./helpers";

export const updateNode = {
  key: "updateNode",
  label: "Update Node",
  group: "modify",
  fields: ["position", "value"],
  desc: "Walks the list node by node to the target index, then overwrites that node's value in place — the links around it are untouched.",
  time: "O(n)",
  space: "O(1)",
  run(list, { position, value }) {
    const nodes = cloneNodes(list);
    const headId = nodes[0]?.id ?? null;
    const steps = [];

    if (nodes.length === 0) {
      steps.push({ nodes, notFound: true, message: "List is empty" });
      return { steps, finalList: nodes };
    }

    const pos = Math.max(0, Math.min(position, nodes.length - 1));

    for (let i = 0; i <= pos; i++) {
      steps.push({ nodes, active: [nodes[i].id], headId, message: `Traversing... currently at index ${i} (value ${nodes[i].value})` });
    }

    const target = nodes[pos];
    const oldValue = target.value;
    steps.push({ nodes, updating: target.id, headId, message: `Updating node at index ${pos}: ${oldValue} → ${value}` });

    const finalList = nodes.map((n, i) => (i === pos ? { ...n, value } : n));
    steps.push({ nodes: finalList, active: [target.id], headId, message: `Node at index ${pos} is now ${value}` });

    return { steps, finalList };
  },
};