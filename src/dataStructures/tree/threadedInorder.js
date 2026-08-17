import { cloneTree } from "./helpers";
import { leftmostFrom, successorOf } from "./threads";

export const threadedInorder = {
  key: "tinorder",
  label: "Threaded Inorder",
  group: "traverse",
  fields: [],
  types: ["threaded"],
  desc: "Inorder traversal without a stack or recursion. Start at the leftmost node and visit it, then move to the inorder successor: if the node's right pointer is a thread, the successor is one hop away; otherwise it's the leftmost node of the right subtree. Repeat until a node has no right thread at all — that is the last value. An ordinary inorder traversal needs O(h) of stack to remember the ancestors it must come back to; the threads store those return links inside the tree itself, so this walk needs only the pointer it is holding.",
  time: "O(n)",
  space: "O(1)",
  run(tree) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ ...t, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const visited = [];
    const order = [];

    const start = leftmostFrom(t.root);
    start.descent.forEach((node) => {
      steps.push({ ...t, current: node.id, message: `Follow the left child of ${node.value}` });
    });
    steps.push({ ...t, current: start.node.id, message: `${start.node.value} is the leftmost node — the first value in inorder` });

    let cur = start.node;
    while (cur) {
      visited.push(cur.id);
      order.push(cur.value);
      steps.push({ ...t, visited: [...visited], current: cur.id, message: `Visit ${cur.value}` });

      const next = successorOf(t.root, cur);
      if (!next.node) {
        steps.push({
          ...t,
          visited: [...visited],
          current: cur.id,
          message: `${cur.value} has no right thread — it is the last node, so the traversal ends`,
        });
        break;
      }

      if (next.viaThread) {
        steps.push({
          ...t,
          visited: [...visited],
          current: next.node.id,
          threads: [{ from: cur.id, to: next.node.id, side: "right" }],
          message: `${cur.value} has no right child — follow its right thread straight to ${next.node.value}`,
        });
      } else {
        steps.push({
          ...t,
          visited: [...visited],
          current: next.node.id,
          message: next.descent.length
            ? `${cur.value} has a right child — go right, then left ${next.descent.length === 1 ? "once" : `${next.descent.length} times`} to ${next.node.value}`
            : `${cur.value} has a right child — its successor is ${next.node.value}`,
        });
      }
      cur = next.node;
    }

    steps.push({
      ...t,
      visited: [...visited],
      resultBadge: `INORDER: ${order.join(" → ")}`,
      message: "Threaded inorder complete — no stack, no recursion",
    });
    return { steps, finalTree: t };
  },
};
