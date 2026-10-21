/**
 * Threads for a threaded binary tree.
 *
 * A thread is a null child pointer reused to point at an inorder neighbour:
 * a null right becomes a link to the inorder successor, a null left to the
 * inorder predecessor. Which node each one points at is decided entirely by
 * the tree's shape, so threads are *derived* here rather than stored on the
 * node — insert, delete, cloning and link serialization keep working on the
 * same plain `{ id, value, left, right }` nodes a BST uses, and a thread can
 * never fall out of sync with the tree it belongs to.
 *
 * A real implementation stores a boolean flag per pointer (`lthread`,
 * `rthread`) so it can tell a thread from a child in O(1); the flag is what
 * `hasRightThread`-style checks below stand in for.
 */

/** Double threading uses both null pointers; single threading only the right. */
export const isDoubleThreaded = (threadMode) => threadMode !== "single";

export function inorderNodes(node, out = []) {
  if (!node) return out;
  inorderNodes(node.left, out);
  out.push(node);
  inorderNodes(node.right, out);
  return out;
}

/** The inorder sequence plus each node's position in it. */
export function inorderIndex(root) {
  const seq = inorderNodes(root);
  const posById = {};
  seq.forEach((node, i) => {
    posById[node.id] = i;
  });
  return { seq, posById };
}

/**
 * Every thread in the tree, as `{ id, from, to, side }`. The first node has no
 * predecessor and the last no successor — in a real threaded tree those two
 * point at a dummy header node, which has nothing to draw here, so they are
 * simply absent.
 */
export function computeThreads(root, threadMode = "double") {
  const { seq } = inorderIndex(root);
  const threads = [];
  seq.forEach((node, i) => {
    if (!node.right && seq[i + 1]) {
      threads.push({ id: `thr-${node.id}`, from: node.id, to: seq[i + 1].id, side: "right" });
    }
    if (isDoubleThreaded(threadMode) && !node.left && seq[i - 1]) {
      threads.push({ id: `thl-${node.id}`, from: node.id, to: seq[i - 1].id, side: "left" });
    }
  });
  return threads;
}

/** The threads leaving one node — what that node's null pointers were spent on. */
export function threadsFrom(root, id, threadMode) {
  return computeThreads(root, threadMode).filter((t) => t.from === id);
}

/**
 * The inorder successor of `node`, and how it was reached: `viaThread` when the
 * right pointer was a thread (O(1), no climbing), otherwise the leftmost node of
 * the right subtree. `descent` lists the nodes walked through to get there.
 */
export function successorOf(root, node) {
  if (node.right) {
    const descent = [];
    let cur = node.right;
    while (cur.left) {
      descent.push(cur);
      cur = cur.left;
    }
    return { node: cur, viaThread: false, descent };
  }
  const { seq, posById } = inorderIndex(root);
  return { node: seq[posById[node.id] + 1] || null, viaThread: true, descent: [] };
}

/** Mirror of successorOf: left thread, or the rightmost node of the left subtree. */
export function predecessorOf(root, node) {
  if (node.left) {
    const descent = [];
    let cur = node.left;
    while (cur.right) {
      descent.push(cur);
      cur = cur.right;
    }
    return { node: cur, viaThread: false, descent };
  }
  const { seq, posById } = inorderIndex(root);
  return { node: seq[posById[node.id] - 1] || null, viaThread: true, descent: [] };
}

/** Leftmost node of a subtree — where a threaded inorder traversal starts. */
export function leftmostFrom(node) {
  const descent = [];
  let cur = node;
  while (cur.left) {
    descent.push(cur);
    cur = cur.left;
  }
  return { node: cur, descent };
}

/** Rightmost node — where a reverse threaded traversal starts. */
export function rightmostFrom(node) {
  const descent = [];
  let cur = node;
  while (cur.right) {
    descent.push(cur);
    cur = cur.right;
  }
  return { node: cur, descent };
}
