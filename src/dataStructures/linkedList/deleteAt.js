import { cloneNodes } from "./helpers";

export const deleteAt = {
  key: "deleteAt",
  label: "Delete at Position",
  group: "build",
  fields: ["position"],
  desc: "Walks the list node by node to the target index and unlinks that node, reconnecting the nodes on either side of it.",
  time: "O(n)",
  space: "O(1)",
  run(list, { position }) {
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

    steps.push({ nodes, removing: nodes[pos].id, headId, message: `Removing node at index ${pos} (value ${nodes[pos].value})` });
    const finalList = nodes.filter((_, i) => i !== pos);
    steps.push({ nodes: finalList, headId: finalList[0]?.id ?? null, message: `Node removed, neighbors reconnected` });

    return { steps, finalList };
  },
};