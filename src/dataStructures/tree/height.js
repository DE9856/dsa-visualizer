import { cloneTree, treeHeight } from "./helpers";

export const height = {
  key: "height",
  label: "Height",
  group: "query",
  fields: [],
  desc: "The height of a tree is the number of edges on the longest path from the root down to a leaf. An empty tree has height -1 and a single-node tree has height 0. Computed by recursively taking 1 + the max height of the left and right subtrees.",
  time: "O(n)",
  space: "O(h)",
  run(tree) {
    const t = cloneTree(tree);
    const h = treeHeight(t.root);
    return {
      steps: [{ ...t, resultBadge: `HEIGHT: ${h}`, message: t.root ? `Tree height is ${h}` : "Tree is empty (height is -1 by convention)" }],
      finalTree: t,
    };
  },
};
