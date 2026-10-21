import { cloneTree } from "./helpers";

export const preorder = {
  key: "preorder",
  label: "Preorder",
  group: "traverse",
  fields: [],
  desc: "Recursively visits the current node first, then the left subtree, then the right subtree (Node \u2192 Left \u2192 Right). Because a parent always appears before its children, preorder is the natural way to copy or serialize a tree so it can be rebuilt in the same shape.",
  time: "O(n)",
  space: "O(h)",
  run(tree) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ ...t, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const visited = [];
    const order = [];

    const visit = (node) => {
      if (!node) return;
      visited.push(node.id);
      order.push(node.value);
      steps.push({ ...t, visited: [...visited], current: node.id, message: `Visit ${node.value}` });
      visit(node.left);
      visit(node.right);
    };
    visit(t.root);

    steps.push({ ...t, visited, resultBadge: `PREORDER: ${order.join(" \u2192 ")}`, message: "Preorder traversal complete" });
    return { steps, finalTree: t };
  },
};
