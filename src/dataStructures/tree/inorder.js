import { cloneTree } from "./helpers";

export const inorder = {
  key: "inorder",
  label: "Inorder",
  group: "traverse",
  fields: [],
  desc: "Recursively visits the left subtree, then the current node, then the right subtree (Left \u2192 Node \u2192 Right). For a BST this always produces values in ascending sorted order \u2014 one of the main reasons BSTs are useful.",
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
      visit(node.left);
      visited.push(node.id);
      order.push(node.value);
      steps.push({ ...t, visited: [...visited], current: node.id, message: `Visit ${node.value}` });
      visit(node.right);
    };
    visit(t.root);

    steps.push({ ...t, visited, resultBadge: `INORDER: ${order.join(" \u2192 ")}`, message: "Inorder traversal complete" });
    return { steps, finalTree: t };
  },
};
