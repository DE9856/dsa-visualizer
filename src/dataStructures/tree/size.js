import { cloneTree, treeSize } from "./helpers";

export const size = {
  key: "size",
  label: "Size",
  group: "query",
  fields: [],
  desc: "Counts the total number of nodes in the tree by recursively summing 1 (for the current node) plus the size of the left and right subtrees.",
  time: "O(n)",
  space: "O(h)",
  run(tree) {
    const t = cloneTree(tree);
    const n = treeSize(t.root);
    return { steps: [{ ...t, resultBadge: `SIZE: ${n}`, message: `Tree contains ${n} node${n === 1 ? "" : "s"}` }], finalTree: t };
  },
};
