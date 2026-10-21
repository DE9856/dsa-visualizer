import { cloneTree, treeHeight } from "./helpers";

export const height = {
  key: "height",
  label: "Height",
  group: "query",
  fields: [],
  desc: "Since every leaf in a 2-3 tree sits at the same depth, height only needs to follow one path down from the root, counting edges. An empty tree has height -1, a single leaf has height 0.",
  time: "O(log n)",
  space: "O(1)",
  run(tree) {
    const t = cloneTree(tree);
    const h = treeHeight(t.root);
    return { steps: [{ root: t.root, resultBadge: `HEIGHT: ${h}`, message: t.root ? `Tree height is ${h}` : "Tree is empty (height is -1 by convention)" }], finalTree: t };
  },
};
