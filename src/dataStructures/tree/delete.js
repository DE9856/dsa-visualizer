import { cloneTree, bstDeleteByValue, plainDeleteByValue, findMinNode, lastLevelOrderNode, avlRebalanceWithSteps, isOrderedTree } from "./helpers";
import { inorderNodes, inorderIndex, computeThreads } from "./threads";
import { selfBalancingDelete } from "./selfBalancingOps";

export const del = {
  key: "delete",
  label: "Delete",
  group: "build",
  fields: ["value"],
  desc: "In a BST, AVL or threaded tree, delete finds the value by comparison, then handles three cases: a leaf is simply removed, a node with one child is replaced by that child, and a node with two children has its value swapped with its inorder successor (the minimum of its right subtree) before that successor is removed. An AVL tree then walks back up from the point of removal, rechecking each ancestor's balance factor and rotating wherever it's violated. In a threaded tree the removal closes a gap in the inorder sequence, so the threads that ran through the deleted node are relinked to point at its two neighbours directly. A plain binary tree has no ordering to search by, so it scans for the value, swaps it with the deepest, right-most node in level order, and drops that node — the same shape used to delete from a binary heap.",
  time: "O(log n) for a BST/AVL average case, O(h) worst-case for a BST, O(log n) guaranteed for AVL",
  space: "O(h)",
  run(tree, { value, treeType, threadMode }) {
    // Red-black, splay and treap run their own fix-up loops and draw their own
    // frames; a null answer means this is not one of them.
    const balanced = selfBalancingDelete(tree, value, treeType);
    if (balanced) return balanced;

    const before = cloneTree(tree);
    const steps = [];

    if (!before.root) {
      return { steps: [{ ...before, notFound: true, message: "Tree is empty — nothing to delete" }], finalTree: tree };
    }

    if (isOrderedTree(treeType)) {
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

      // Removing a node closes a gap in the inorder sequence: whatever linked
      // its two neighbours through it — a thread, a child pointer, or both —
      // now links them to each other.
      if (treeType === "threaded") {
        const { seq, posById } = inorderIndex(before.root);
        const i = posById[found.id];
        const afterSeq = inorderNodes(rawAfter.root);
        const neighbour = (n) => (n ? afterSeq.find((a) => a.value === n.value) : undefined);
        const pred = neighbour(seq[i - 1]);
        const succ = neighbour(seq[i + 1]);
        const ids = [pred?.id, succ?.id].filter(Boolean);
        const links = computeThreads(rawAfter.root, threadMode).filter((t) => ids.includes(t.from) && ids.includes(t.to));
        const pair = pred && succ ? `${pred.value} and ${succ.value} are` : `${(pred || succ)?.value ?? "the tree"} is`;
        steps.push({
          ...rawAfter,
          threads: links,
          active: ids,
          message: links.length
            ? `${pair} now inorder neighbours — the thread that ran through ${value} points straight across`
            : `${pair} now inorder neighbours, joined by a child pointer instead of a thread`,
        });
        return { steps, finalTree: rawAfter };
      }

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
