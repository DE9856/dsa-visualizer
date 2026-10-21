import { cloneTree } from "./helpers";

export const dfs = {
  key: "dfs",
  label: "DFS",
  group: "traverse",
  fields: [],
  desc: "Depth-First Search dives as deep as possible down one branch before backtracking, using an explicit stack: push the root, then repeatedly pop a node, visit it, and push its right child before its left child (so the left is popped \u2014 and visited \u2014 first). This produces the same order as a recursive preorder traversal, but makes the backtracking mechanism explicit.",
  time: "O(n)",
  space: "O(h)",
  run(tree) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ ...t, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const visited = [];
    const order = [];
    const stack = [t.root];

    steps.push({ ...t, message: `Push root ${t.root.value} onto the stack` });

    while (stack.length) {
      const node = stack.pop();
      visited.push(node.id);
      order.push(node.value);
      steps.push({ ...t, visited: [...visited], current: node.id, message: `Pop ${node.value} and visit it` });

      if (node.right) {
        stack.push(node.right);
        steps.push({ ...t, visited: [...visited], current: node.id, active: [node.right.id], message: `Push right child ${node.right.value}` });
      }
      if (node.left) {
        stack.push(node.left);
        steps.push({ ...t, visited: [...visited], current: node.id, active: [node.left.id], message: `Push left child ${node.left.value}` });
      }
    }

    steps.push({ ...t, visited, resultBadge: `DFS ORDER: ${order.join(" \u2192 ")}`, message: "DFS traversal complete" });
    return { steps, finalTree: t };
  },
};
