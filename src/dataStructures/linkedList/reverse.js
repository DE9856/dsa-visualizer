import { cloneNodes, forwardChain } from "./helpers";

export const reverse = {
  key: "reverse",
  label: "Reverse List",
  group: "rearrange",
  fields: [],
  desc: "Walks the list once, flipping each node's pointer to face the previous node instead of the next one, using prev/curr/next pointers.",
  time: "O(n)",
  space: "O(1)",
  run(list, params = {}) {
    const circular = params.listType === "circular";
    const nodes = cloneNodes(list);
    const steps = [];

    if (nodes.length < 2) {
      steps.push({ nodes, headId: nodes[0]?.id ?? null, message: nodes.length === 0 ? "List is empty" : "Single-node list is already reversed" });
      return { steps, finalList: nodes };
    }

    // The pointer-flip walk itself is identical whether or not the list is
    // circular — it's about relinking the internal next pointers. The
    // wraparound (tail -> head) is only relevant to the *final* rendering.
    let pointerMap = forwardChain(nodes, false);
    let prev = null;
    let curr = nodes[0].id;
    const headId = nodes[0].id; // original head stays the pointer-anchor during the walk

    const valueOf = (id) => (id ? nodes.find((n) => n.id === id)?.value : "null");

    while (curr !== null) {
      const next = pointerMap[curr];
      steps.push({
        nodes,
        pointerMap: { ...pointerMap },
        pointers: [
          { label: "prev", id: prev },
          { label: "curr", id: curr },
          { label: "next", id: next },
        ],
        headId,
        message: `At node ${valueOf(curr)}: pointing it back to ${valueOf(prev)}`,
      });
      pointerMap = { ...pointerMap, [curr]: prev };
      prev = curr;
      curr = next;
    }

    const finalList = [...nodes].reverse();
    steps.push({
      nodes: finalList,
      pointerMap: forwardChain(finalList, circular),
      headId: finalList[0].id,
      message: `Reversal complete — new head is ${valueOf(prev)}${circular ? " (tail links back to it)" : ""}`,
    });

    return { steps, finalList };
  },
};