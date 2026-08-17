import { cloneTree } from "./helpers";
import { rightmostFrom, predecessorOf } from "./threads";

export const threadedReverseInorder = {
  key: "treverse",
  label: "Reverse Inorder",
  group: "traverse",
  fields: [],
  types: ["threaded"],
  threadModes: ["double"],
  desc: "The mirror image of the threaded inorder walk, and the reason to spend the left pointers too: start at the rightmost node and repeatedly step to the inorder predecessor — one hop along a left thread, or the rightmost node of the left subtree. It yields the values in descending order. A single-threaded tree cannot do this, because it kept its null left pointers instead of threading them.",
  time: "O(n)",
  space: "O(1)",
  run(tree) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ ...t, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const visited = [];
    const order = [];

    const start = rightmostFrom(t.root);
    start.descent.forEach((node) => {
      steps.push({ ...t, current: node.id, message: `Follow the right child of ${node.value}` });
    });
    steps.push({ ...t, current: start.node.id, message: `${start.node.value} is the rightmost node — the largest value` });

    let cur = start.node;
    while (cur) {
      visited.push(cur.id);
      order.push(cur.value);
      steps.push({ ...t, visited: [...visited], current: cur.id, message: `Visit ${cur.value}` });

      const prev = predecessorOf(t.root, cur);
      if (!prev.node) {
        steps.push({
          ...t,
          visited: [...visited],
          current: cur.id,
          message: `${cur.value} has no left thread — it is the smallest value, so the traversal ends`,
        });
        break;
      }

      if (prev.viaThread) {
        steps.push({
          ...t,
          visited: [...visited],
          current: prev.node.id,
          threads: [{ from: cur.id, to: prev.node.id, side: "left" }],
          message: `${cur.value} has no left child — follow its left thread straight to ${prev.node.value}`,
        });
      } else {
        steps.push({
          ...t,
          visited: [...visited],
          current: prev.node.id,
          message: prev.descent.length
            ? `${cur.value} has a left child — go left, then right ${prev.descent.length === 1 ? "once" : `${prev.descent.length} times`} to ${prev.node.value}`
            : `${cur.value} has a left child — its predecessor is ${prev.node.value}`,
        });
      }
      cur = prev.node;
    }

    steps.push({
      ...t,
      visited: [...visited],
      resultBadge: `REVERSE INORDER: ${order.join(" → ")}`,
      message: "Reverse inorder complete — descending order, still O(1) space",
    });
    return { steps, finalTree: t };
  },
};
