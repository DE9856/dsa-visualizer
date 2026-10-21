import { cloneTree, isLeaf } from "./helpers";

export const inorder = {
  key: "inorder",
  label: "Inorder",
  group: "traverse",
  fields: [],
  desc: "Inorder traversal visits, for each key, everything in the child subtree to its left, then the key itself, then (for the last key) the child subtree to its right — the multiway generalization of left-root-right for binary trees. Because a 2-3 tree keeps its keys sorted this way, inorder traversal always produces the values in ascending order.",
  time: "O(n)",
  space: "O(log n)",
  run(tree) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ root: null, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    const visited = [];
    const order = [];

    function walk(node) {
      if (isLeaf(node)) {
        node.keys.forEach((k) => {
          visited.push(node.id);
          order.push(k);
          steps.push({ root: t.root, visited: [...visited], current: node.id, message: `Visit ${k}` });
        });
        return;
      }
      node.keys.forEach((k, i) => {
        walk(node.children[i]);
        visited.push(node.id);
        order.push(k);
        steps.push({ root: t.root, visited: [...visited], current: node.id, message: `Visit ${k}` });
      });
      walk(node.children[node.children.length - 1]);
    }
    walk(t.root);

    steps.push({ root: t.root, visited, resultBadge: `INORDER: ${order.join(" \u2192 ")}`, message: "Inorder traversal complete (ascending order)" });
    return { steps, finalTree: t };
  },
};
