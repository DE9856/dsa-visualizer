import { cloneTree, nextNodeId, bstInsertByValue, levelOrderInsert, findNodeById, avlRebalanceWithSteps, isOrderedTree } from "./helpers";
import { threadsFrom } from "./threads";

export const insert = {
  key: "insert",
  label: "Insert",
  group: "build",
  fields: ["value"],
  desc: "In a BST, AVL or threaded tree, insert walks down from the root comparing the new value at each node and stepping left or right until an empty slot is found. An AVL tree then walks back up the same path recomputing each ancestor's balance factor (height(left) - height(right)); if it falls outside [-1, 1], a single or double rotation restores it. A threaded tree instead fixes up pointers: the parent's thread on the side the new node landed becomes a real child link, and the new leaf takes over the thread to the neighbour that pointer used to reach. A plain binary tree has no ordering to follow, so insert instead scans level by level (like a queue) and places the value in the first open child slot, keeping the tree's shape complete.",
  time: "O(log n) for a BST/AVL average case, O(h) worst-case for a BST, O(log n) guaranteed for AVL",
  space: "O(h)",
  run(tree, { value, treeType, threadMode }) {
    const before = cloneTree(tree);
    const steps = [];

    if (!before.root) {
      const newNode = { id: nextNodeId(), value, left: null, right: null };
      const after = { root: newNode };
      steps.push({ ...after, active: [newNode.id], message: `Tree is empty — ${value} becomes the root` });
      return { steps, finalTree: after };
    }

    if (isOrderedTree(treeType)) {
      let cur = before.root;
      const path = [];
      let duplicate = false;

      while (true) {
        path.push(cur.id);
        steps.push({ ...before, path: [...path], current: cur.id, message: `Compare ${value} with ${cur.value}` });

        if (value === cur.value) {
          duplicate = true;
          steps.push({ ...before, path, notFound: true, message: `${value} already exists — duplicates aren't stored` });
          break;
        }

        const goLeft = value < cur.value;
        const next = goLeft ? cur.left : cur.right;
        if (!next) {
          steps.push({
            ...before,
            path,
            current: cur.id,
            message: `${value} ${goLeft ? "<" : ">"} ${cur.value} — insert as ${goLeft ? "left" : "right"} child`,
          });
          break;
        }
        cur = next;
      }

      if (duplicate) return { steps, finalTree: tree };

      const newId = nextNodeId();
      const rawAfter = { root: bstInsertByValue(before.root, value, newId) };
      steps.push({ ...rawAfter, path, active: [newId], message: `Inserted ${value}` });

      // A new leaf inherits the threads of the pointer it replaced: the parent's
      // thread on that side becomes a real child link, and the new node takes
      // over pointing at the neighbour it used to reach.
      if (treeType === "threaded") {
        const links = threadsFrom(rawAfter.root, newId, threadMode);
        const valueOf = (id) => findNodeById(rawAfter.root, id).value;
        const parts = links.map((t) => `${t.side} thread → ${valueOf(t.to)}`);
        const side = value < cur.value ? "left" : "right";
        steps.push({
          ...rawAfter,
          path,
          active: [newId],
          threads: links,
          message: parts.length
            ? `${cur.value}'s ${side} pointer is now a real child; ${value}'s spare pointers become its ${parts.join(" and ")}`
            : `${cur.value}'s ${side} pointer is now a real child; ${value} sits at the end of the traversal, so its threads point to the header`,
        });
        return { steps, finalTree: rawAfter };
      }

      if (treeType !== "avl") return { steps, finalTree: rawAfter };

      const rebalancedRoot = avlRebalanceWithSteps(rawAfter.root, path, steps);
      const finalAfter = { root: rebalancedRoot };
      if (rebalancedRoot !== rawAfter.root) {
        steps.push({ ...finalAfter, active: [newId], message: `${value} inserted — AVL tree rebalanced` });
      }
      return { steps, finalTree: finalAfter };
    }

    // Plain binary tree: scan level by level for the first open child slot.
    const queue = [before.root];
    const visited = [];
    while (queue.length) {
      const cur = queue.shift();
      visited.push(cur.id);
      steps.push({ ...before, visited: [...visited], current: cur.id, message: `Check ${cur.value} for an open child slot` });
      if (!cur.left || !cur.right) break;
      queue.push(cur.left);
      queue.push(cur.right);
    }

    const newId = nextNodeId();
    const after = { root: levelOrderInsert(before.root, value, newId) };
    const parent = findNodeById(after.root, visited[visited.length - 1]);
    const side = parent.left && parent.left.id === newId ? "left" : "right";
    steps.push({
      ...after,
      visited,
      active: [newId],
      message: `Placed ${value} as the ${side} child of ${parent.value} (first open slot, level order)`,
    });
    return { steps, finalTree: after };
  },
};
