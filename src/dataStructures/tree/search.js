import { cloneTree, isOrderedTree } from "./helpers";
import { selfBalancingSearch } from "./selfBalancingOps";

export const search = {
  key: "search",
  label: "Search",
  group: "query",
  fields: ["value"],
  desc: "In a BST, AVL or threaded tree, search exploits the ordering: compare the target with the current node and step left or right, discarding half the remaining tree at each hop. A plain binary tree has no such ordering, so search instead has to scan every node (breadth-first here) until it finds a match.",
  time: "O(log n) avg / O(h) worst-case for a BST, O(n) for a plain binary tree",
  space: "O(h)",
  run(tree, { value, treeType }) {
    // A splay tree's search rewrites the tree, so it needs its own frames.
    const splayed = selfBalancingSearch(tree, value, treeType);
    if (splayed) return splayed;

    const t = cloneTree(tree);
    if (!t.root) {
      return { steps: [{ ...t, notFound: true, message: "Tree is empty" }], finalTree: t };
    }

    const steps = [];

    if (isOrderedTree(treeType)) {
      let cur = t.root;
      const path = [];
      while (cur) {
        path.push(cur.id);
        steps.push({ ...t, path: [...path], current: cur.id, message: `Compare ${value} with ${cur.value}` });
        if (value === cur.value) {
          steps.push({ ...t, path, active: [cur.id], resultBadge: `FOUND ${value}`, message: `Found ${value}` });
          return { steps, finalTree: t };
        }
        cur = value < cur.value ? cur.left : cur.right;
      }
      steps.push({ ...t, path, notFound: true, message: `${value} not found` });
      return { steps, finalTree: t };
    }

    const queue = [t.root];
    const visited = [];
    while (queue.length) {
      const node = queue.shift();
      visited.push(node.id);
      steps.push({ ...t, visited: [...visited], current: node.id, message: `Check ${node.value}` });
      if (node.value === value) {
        steps.push({ ...t, visited, active: [node.id], resultBadge: `FOUND ${value}`, message: `Found ${value}` });
        return { steps, finalTree: t };
      }
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    steps.push({ ...t, visited, notFound: true, message: `${value} not found` });
    return { steps, finalTree: t };
  },
};
