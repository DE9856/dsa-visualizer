import { nextId } from "./nodeId";
import { cloneNodes } from "./helpers";

export const insertTail = {
  key: "insertTail",
  label: "Insert at Tail",
  group: "build",
  fields: ["value"],
  desc: "Creates a new node and links it after the current last node. The new node becomes the tail of the list.",
  time: "O(n)",
  space: "O(1)",
  run(list, { value }) {
    const nodes = cloneNodes(list);
    const headId = nodes[0]?.id ?? null;
    const steps = [];

    for (let i = 0; i < nodes.length; i++) {
      steps.push({ nodes, active: [nodes[i].id], headId, message: `Traversing... currently at index ${i} (value ${nodes[i].value})` });
    }

    const newNode = { id: nextId(), value };
    const withNode = [...nodes, newNode];
    steps.push({ nodes: withNode, pending: newNode.id, headId: withNode[0]?.id ?? null, message: `Creating new node (${value})` });
    steps.push({ nodes: withNode, active: [newNode.id], headId: withNode[0]?.id ?? null, message: `Node linked in as the new tail` });

    return { steps, finalList: withNode };
  },
};