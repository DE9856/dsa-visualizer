import { cloneNodes } from "./helpers";

export const deleteValue = {
  key: "deleteValue",
  label: "Delete by Value",
  group: "build",
  fields: ["value"],
  desc: "Traverses the list comparing each node's value to the target. When a match is found, the node is unlinked and its neighbors reconnected.",
  time: "O(n)",
  space: "O(1)",
  run(list, { value }) {
    const nodes = cloneNodes(list);
    const headId = nodes[0]?.id ?? null;
    const steps = [];

    if (nodes.length === 0) {
      steps.push({ nodes, notFound: true, message: "List is empty" });
      return { steps, finalList: nodes };
    }

    let foundIdx = -1;
    for (let i = 0; i < nodes.length; i++) {
      steps.push({ nodes, active: [nodes[i].id], headId, message: `Comparing node value ${nodes[i].value} with ${value}` });
      if (nodes[i].value === value) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx === -1) {
      steps.push({ nodes, notFound: true, headId, message: `Value ${value} was not found in the list` });
      return { steps, finalList: nodes };
    }

    steps.push({ nodes, removing: nodes[foundIdx].id, headId, message: `Removing node with value ${value}` });
    const finalList = nodes.filter((_, i) => i !== foundIdx);
    steps.push({ nodes: finalList, headId: finalList[0]?.id ?? null, message: `Node removed, neighbors reconnected` });

    return { steps, finalList };
  },
};