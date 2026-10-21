import { cloneTree } from "./helpers";
import { successorOf } from "./threads";

export const threadedSuccessor = {
  key: "tsuccessor",
  label: "Inorder Successor",
  group: "query",
  fields: ["value"],
  types: ["threaded"],
  desc: "Finds the value that would come immediately after a given one in an inorder traversal. In an unthreaded tree a node whose right pointer is null has to climb back up through its parents to find its successor — which is why such trees usually carry parent pointers. Here the right thread already holds the answer, so the successor of such a node is a single hop. Only a node that has a real right child does any work: its successor is the leftmost node of that subtree.",
  time: "O(1) along a thread, O(h) through a right subtree",
  space: "O(1)",
  run(tree, { value }) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ ...t, notFound: true, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const path = [];
    let cur = t.root;
    while (cur) {
      path.push(cur.id);
      steps.push({ ...t, path: [...path], current: cur.id, message: `Compare ${value} with ${cur.value}` });
      if (value === cur.value) break;
      cur = value < cur.value ? cur.left : cur.right;
    }

    if (!cur) {
      steps.push({ ...t, path: [...path], notFound: true, message: `${value} is not in the tree` });
      return { steps, finalTree: t };
    }

    const found = cur;
    const next = successorOf(t.root, found);

    if (!next.node) {
      steps.push({
        ...t,
        active: [found.id],
        notFound: true,
        message: `${value} is the largest value — its right thread points to the header, so it has no successor`,
      });
      return { steps, finalTree: t };
    }

    if (next.viaThread) {
      steps.push({
        ...t,
        active: [found.id],
        current: next.node.id,
        threads: [{ from: found.id, to: next.node.id, side: "right" }],
        resultBadge: `SUCCESSOR OF ${value}: ${next.node.value}`,
        message: `${value} has no right child — its right thread points at ${next.node.value} (one hop, no climbing)`,
      });
      return { steps, finalTree: t };
    }

    steps.push({
      ...t,
      active: [found.id],
      current: found.right.id,
      message: `${value} has a right child — the successor is the smallest value in that subtree`,
    });
    next.descent.forEach((node) => {
      steps.push({ ...t, active: [found.id], current: node.id, message: `Follow the left child of ${node.value}` });
    });
    steps.push({
      ...t,
      active: [found.id],
      current: next.node.id,
      resultBadge: `SUCCESSOR OF ${value}: ${next.node.value}`,
      message: `${next.node.value} is the leftmost node of the right subtree — the successor of ${value}`,
    });
    return { steps, finalTree: t };
  },
};
