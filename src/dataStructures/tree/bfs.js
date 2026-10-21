import { cloneTree } from "./helpers";

export const bfs = {
  key: "bfs",
  label: "BFS (Level Order)",
  group: "traverse",
  fields: [],
  desc: "Breadth-First Search visits the tree one level at a time using a queue: enqueue the root, then repeatedly dequeue a node, visit it, and enqueue its children left-to-right. This is also called level-order traversal, since it processes every node at depth 0, then depth 1, and so on.",
  time: "O(n)",
  space: "O(n)",
  run(tree) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ ...t, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const visited = [];
    const order = [];
    const queue = [t.root];

    steps.push({ ...t, message: `Enqueue root ${t.root.value}` });

    while (queue.length) {
      const node = queue.shift();
      visited.push(node.id);
      order.push(node.value);
      steps.push({ ...t, visited: [...visited], current: node.id, message: `Dequeue and visit ${node.value}` });

      if (node.left) {
        queue.push(node.left);
        steps.push({ ...t, visited: [...visited], current: node.id, active: [node.left.id], message: `Enqueue left child ${node.left.value}` });
      }
      if (node.right) {
        queue.push(node.right);
        steps.push({ ...t, visited: [...visited], current: node.id, active: [node.right.id], message: `Enqueue right child ${node.right.value}` });
      }
    }

    steps.push({ ...t, visited, resultBadge: `BFS ORDER: ${order.join(" \u2192 ")}`, message: "BFS (level-order) traversal complete" });
    return { steps, finalTree: t };
  },
};
