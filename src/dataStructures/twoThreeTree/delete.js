import { cloneTree, isLeaf, childIndexFor, deleteWithLog } from "./helpers";

export const del = {
  key: "delete",
  label: "Delete",
  group: "build",
  fields: ["value"],
  desc: "Delete first locates the key. If it sits in an internal node, it's swapped with its predecessor (the largest key in the leaf reached by following the left child all the way down), and that predecessor is removed from the leaf instead. Removing a key from a leaf with only 1 key leaves it empty — an underflow. That's fixed by borrowing a key from an adjacent sibling through the parent if one has a spare, or by merging with a sibling and pulling a key down from the parent otherwise. A merge can underflow the parent in turn, so the fix propagates upward, occasionally shrinking the tree by a level at the root.",
  time: "O(log n)",
  space: "O(log n)",
  run(tree, { value }) {
    const before = cloneTree(tree);
    const steps = [];

    if (!before.root) {
      return { steps: [{ root: null, notFound: true, message: "Tree is empty — nothing to delete" }], finalTree: tree };
    }

    let node = before.root;
    const path = [];
    let found = false;
    while (node) {
      path.push(node.id);
      if (node.keys.includes(value)) {
        found = true;
        steps.push({ root: before.root, path: [...path], current: node.id, active: [node.id], message: `Found ${value} at [${node.keys.join(", ")}]` });
        break;
      }
      steps.push({ root: before.root, path: [...path], current: node.id, message: `At [${node.keys.join(", ")}] — looking for ${value}` });
      if (isLeaf(node)) break;
      node = node.children[childIndexFor(node, value)];
    }

    if (!found) {
      steps.push({ root: before.root, path, notFound: true, message: `${value} not found — nothing to delete` });
      return { steps, finalTree: tree };
    }

    const { root: finalRoot, log } = deleteWithLog(before.root, value);
    steps.push({
      root: finalRoot,
      message: log.length ? `Deleted ${value}: ${log.join("; then ")}` : `Deleted ${value} — the leaf had a spare key, no rebalancing needed`,
    });
    return { steps, finalTree: { root: finalRoot } };
  },
};
