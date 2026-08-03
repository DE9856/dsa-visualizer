import { nextId } from "./nodeId";
import { cloneNodes } from "./helpers";

export const insertHead = {
  key: "insertHead",
  label: "Insert at Head",
  group: "build",
  fields: ["value"],
  desc: "Creates a new node and links it in front of the current head. The new node becomes the head of the list.",
  time: "O(1)",
  space: "O(1)",
  run(list, { value }) {
    const newNode = { id: nextId(), value };
    const withNode = [newNode, ...cloneNodes(list)];
    const steps = [
      { nodes: withNode, pending: newNode.id, headId: list[0]?.id ?? null, message: `Creating new node (${value})` },
      { nodes: withNode, active: [newNode.id], headId: newNode.id, message: `Node linked in as the new head` },
    ];
    return { steps, finalList: withNode };
  },
};