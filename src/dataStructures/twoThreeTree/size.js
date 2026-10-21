import { cloneTree, treeSize } from "./helpers";

export const size = {
  key: "size",
  label: "Size",
  group: "query",
  fields: [],
  desc: "Counts the total number of keys stored in the tree by summing each node's key count (1 or 2) across every node.",
  time: "O(n)",
  space: "O(log n)",
  run(tree) {
    const t = cloneTree(tree);
    const n = treeSize(t.root);
    return { steps: [{ root: t.root, resultBadge: `SIZE: ${n}`, message: `Tree contains ${n} key${n === 1 ? "" : "s"}` }], finalTree: t };
  },
};
