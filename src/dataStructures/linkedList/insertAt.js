import { nextId } from "./nodeId";
import { cloneNodes } from "./helpers";

export const insertAt = {
  key: "insertAt",
  label: "Insert at Position",
  group: "build",
  fields: ["value", "position"],
  desc: "Walks the list node by node to the target index, then splices a new node in between the node before it and the node after it.",
  time: "O(n)",
  space: "O(1)",
  run(list, { value, position }) {
    const nodes = cloneNodes(list);
    const pos = Math.max(0, Math.min(position, nodes.length));
    const steps = [];
    const headId = nodes[0]?.id ?? null;

    for (let i = 0; i < pos; i++) {
      steps.push({ nodes, active: [nodes[i].id], headId, message: `Traversing... currently at index ${i} (value ${nodes[i].value})` });
    }

    const newNode = { id: nextId(), value };
    const withNode = [...nodes.slice(0, pos), newNode, ...nodes.slice(pos)];

    steps.push({ nodes: withNode, pending: newNode.id, headId: withNode[0]?.id ?? null, message: `Creating new node (${value}) at index ${pos}` });
    steps.push({ nodes: withNode, active: [newNode.id], headId: withNode[0]?.id ?? null, message: `Node linked in at index ${pos}` });

    return { steps, finalList: withNode };
  },
};