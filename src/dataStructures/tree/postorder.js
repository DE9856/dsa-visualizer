import { cloneTree } from "./helpers";

export const postorder = {
  key: "postorder",
  label: "Postorder",
  group: "traverse",
  fields: [],
  desc: "Recursively visits the left subtree, then the right subtree, then the current node (Left \u2192 Right \u2192 Node). Because every node is visited only after both of its children, postorder is the natural order for safely deleting a tree or evaluating an expression tree bottom-up.",
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
      visit(node.right);
      visited.push(node.id);
      order.push(node.value);
      steps.push({ ...t, visited: [...visited], current: node.id, message: `Visit ${node.value}` });
    };
    visit(t.root);

    steps.push({ ...t, visited, resultBadge: `POSTORDER: ${order.join(" \u2192 ")}`, message: "Postorder traversal complete" });
    return { steps, finalTree: t };
  },
};
