import { cloneTree, isLeaf, childIndexFor } from "./helpers";

export const search = {
  key: "search",
  label: "Search",
  group: "query",
  fields: ["value"],
  desc: "Search walks down from the root: at each node it checks whether the value matches one of that node's 1-2 keys, and if not, uses the keys to pick which of the 2-3 children to descend into next — the same way a binary search narrows down a sorted array, generalized to more branches per node.",
  time: "O(log n)",
  space: "O(log n)",
  run(tree, { value }) {
    const t = cloneTree(tree);
    if (!t.root) return { steps: [{ root: null, notFound: true, message: "Tree is empty" }], finalTree: t };

    const steps = [];
    let node = t.root;
    const path = [];
    while (node) {
      path.push(node.id);
      steps.push({ root: t.root, path: [...path], current: node.id, message: `At [${node.keys.join(", ")}] — checking for ${value}` });
      if (node.keys.includes(value)) {
        steps.push({ root: t.root, path, active: [node.id], resultBadge: `FOUND ${value}`, message: `Found ${value}` });
        return { steps, finalTree: t };
      }
      if (isLeaf(node)) break;
      node = node.children[childIndexFor(node, value)];
    }
    steps.push({ root: t.root, path, notFound: true, message: `${value} not found` });
    return { steps, finalTree: t };
  },
};
