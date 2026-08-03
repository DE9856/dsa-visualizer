import { cloneTree, bstDeleteByValue, plainDeleteByValue, findMinNode, lastLevelOrderNode, avlRebalanceWithSteps } from "./helpers";

export const del = {
  key: "delete",
  label: "Delete",
  group: "build",
  fields: ["value"],
  desc: "In a BST or AVL tree, delete finds the value by comparison, then handles three cases: a leaf is simply removed, a node with one child is replaced by that child, and a node with two children has its value swapped with its inorder successor (the minimum of its right subtree) before that successor is removed. An AVL tree then walks back up from the point of removal, rechecking each ancestor's balance factor and rotating wherever it's violated. A plain binary tree has no ordering to search by, so it scans for the value, swaps it with the deepest, right-most node in level order, and drops that node — the same shape used to delete from a binary heap.",
  time: "O(log n) for a BST/AVL average case, O(h) worst-case for a BST, O(log n) guaranteed for AVL",
  space: "O(h)",
  run(tree, { value, treeType }) {
    const before = cloneTree(tree);
    const steps = [];

    if (!before.root) {
      return { steps: [{ ...before, notFound: true, message: "Tree is empty — nothing to delete" }], finalTree: tree };
    }

    if (treeType === "bst" || treeType === "avl") {
      let cur = before.root;
      const path = [];
      let found = null;
      while (cur) {
        path.push(cur.id);
        steps.push({ ...before, path: [...path], current: cur.id, message: `Compare ${value} with ${cur.value}` });
        if (value === cur.value) {
          found = cur;
          break;
        }
        cur = value < cur.value ? cur.left : cur.right;
      }

      if (!found) {
        steps.push({ ...before, path, notFound: true, message: `${value} not found — nothing to delete` });
        return { steps, finalTree: tree };
      }

      if (found.left && found.right) {
        const successor = findMinNode(found.right);
        steps.push({
          ...before,
          path,
          current: found.id,
          active: [successor.id],
          message: `${value} has two children — its inorder successor is ${successor.value} (min of the right subtree)`,
        });
        // The physically removed node is the successor, further down the
        // right subtree — extend the path so AVL rebalancing checks it too.
        let s = found.right;
        while (s) {
          path.push(s.id);
          if (s.id === successor.id) break;
          s = s.left;
        }
      } else {
        steps.push({ ...before, path, current: found.id, message: `${value} has ${found.left || found.right ? "one child" : "no children"} — remove it directly` });
      }

      const rawAfter = { root: bstDeleteByValue(before.root, value) };
      steps.push({ ...rawAfter, message: `Deleted ${value}` });

      if (treeType !== "avl") return { steps, finalTree: rawAfter };

      const rebalancedRoot = avlRebalanceWithSteps(rawAfter.root, path, steps);
      const finalAfter = { root: rebalancedRoot };
      if (rebalancedRoot !== rawAfter.root) {
        steps.push({ ...finalAfter, message: `${value} deleted — AVL tree rebalanced` });
      }
      return { steps, finalTree: finalAfter };
    }

    // Plain binary tree: scan for the value since there's no ordering.
    const queue = [before.root];
    const visited = [];
    let found = null;
    while (queue.length) {
      const node = queue.shift();
      visited.push(node.id);
      steps.push({ ...before, visited: [...visited], current: node.id, message: `Check ${node.value}` });
      if (node.value === value) {
        found = node;
        break;
      }
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    if (!found) {
      steps.push({ ...before, visited, notFound: true, message: `${value} not found — nothing to delete` });
      return { steps, finalTree: tree };
    }

    const last = lastLevelOrderNode(before.root);
    if (last.id !== found.id) {
      steps.push({
        ...before,
        visited,
        current: found.id,
        active: [last.id],
        message: `Swap ${value} with the last node in level order (${last.value}), then remove that node`,
      });
    } else {
      steps.push({ ...before, visited, current: found.id, message: `${value} is the last node in level order — remove it directly` });
    }

    const after = { root: plainDeleteByValue(before.root, value) };
    steps.push({ ...after, message: `Deleted ${value}` });
    return { steps, finalTree: after };
  },
};
