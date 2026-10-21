import { nextId } from "./nodeId";
import { cloneNodes } from "./helpers";

export const concatenate = {
  key: "concatenate",
  label: "Concatenate Lists",
  group: "combine",
  fields: ["secondList"],
  desc: "Traverses to the tail of the current list and links it directly to the head of a second list, joining the two into one.",
  time: "O(n)",
  space: "O(1)",
  run(list, { secondList = [] }) {
    const nodes = cloneNodes(list);
    const headId = nodes[0]?.id ?? null;
    const steps = [];

    if (secondList.length === 0) {
      steps.push({ nodes, headId, message: "Second list is empty — nothing to concatenate" });
      return { steps, finalList: nodes };
    }

    const secondNodes = secondList.map((value) => ({ id: nextId(), value }));

    if (nodes.length === 0) {
      steps.push({ nodes: secondNodes, headId: secondNodes[0].id, message: "First list is empty — result is just the second list" });
      return { steps, finalList: secondNodes };
    }

    for (let i = 0; i < nodes.length; i++) {
      steps.push({ nodes, active: [nodes[i].id], headId, message: `Traversing to the tail... currently at index ${i} (value ${nodes[i].value})` });
    }

    steps.push({
      nodes: [...nodes, ...secondNodes],
      active: [nodes[nodes.length - 1].id],
      pending: secondNodes[0].id,
      headId,
      message: `Linking tail (${nodes[nodes.length - 1].value}) to the head of the second list (${secondNodes[0].value})`,
    });

    const finalList = [...nodes, ...secondNodes];
    steps.push({ nodes: finalList, headId: finalList[0].id, message: "Lists concatenated" });

    return { steps, finalList };
  },
};