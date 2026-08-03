import { cloneTree, isLeaf, childIndexFor, findNodeById, findDescentPath, insertWithLog, makeLeaf } from "./helpers";

export const insert = {
  key: "insert",
  label: "Insert",
  group: "build",
  fields: ["value"],
  desc: "Insert walks down from the root, comparing the value against each node's keys to pick a branch, until it reaches a leaf. The value is added to that leaf in sorted order. If the leaf now holds 3 keys, it overflows: it splits into two 1-key leaves and the middle key is promoted into the parent. If the parent then overflows too, the split cascades upward the same way, possibly all the way to the root — which is how a 2-3 tree grows taller (always from the root, keeping every leaf at the same depth).",
  time: "O(log n)",
  space: "O(log n)",
  run(tree, { value }) {
    const before = cloneTree(tree);
    const steps = [];

    if (!before.root) {
      const leaf = makeLeaf([value]);
      steps.push({ root: leaf, active: [leaf.id], message: `Tree is empty — ${value} becomes the root leaf` });
      return { steps, finalTree: { root: leaf } };
    }

    const path = findDescentPath(before.root, value);
    path.forEach((id, i) => {
      const node = findNodeById(before.root, id);
      if (node.keys.includes(value)) {
        steps.push({ root: before.root, path: path.slice(0, i + 1), current: id, notFound: true, message: `${value} already exists at [${node.keys.join(", ")}] — 2-3 trees don't store duplicates` });
        return;
      }
      steps.push({
        root: before.root,
        path: path.slice(0, i + 1),
        current: id,
        message: isLeaf(node)
          ? `At leaf [${node.keys.join(", ")}] — insert ${value} here`
          : `At [${node.keys.join(", ")}] — ${value} goes to child ${childIndexFor(node, value)}`,
      });
    });

    const { root: finalRoot, log, duplicate } = insertWithLog(before.root, value);
    if (duplicate) return { steps, finalTree: before };

    if (log.length === 0) {
      steps.push({ root: finalRoot, path, active: [path[path.length - 1]], message: `Inserted ${value} — the leaf had room, no split needed` });
    } else {
      steps.push({ root: finalRoot, message: `Inserted ${value}: ${log.join("; then ")}` });
    }
    return { steps, finalTree: { root: finalRoot } };
  },
};
