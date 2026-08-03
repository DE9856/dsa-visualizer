let nodeCounter = 0;
export function nextNodeId() {
  nodeCounter += 1;
  return `tn${nodeCounter}`;
}

export function cloneNode(node) {
  if (!node) return null;
  return { id: node.id, value: node.value, left: cloneNode(node.left), right: cloneNode(node.right) };
}

export function cloneTree(tree) {
  return { root: cloneNode(tree.root) };
}

export function findNodeById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  return findNodeById(node.left, id) || findNodeById(node.right, id);
}

// Leftmost node of a subtree — the inorder successor's target when deleting
// a two-child node in a BST.
export function findMinNode(node) {
  let cur = node;
  while (cur.left) cur = cur.left;
  return cur;
}

export function treeSize(node) {
  if (!node) return 0;
  return 1 + treeSize(node.left) + treeSize(node.right);
}

// Height of an empty tree is defined as -1, a single node as 0 — the usual
// convention so callers can print a sensible number either way.
export function treeHeight(node) {
  if (!node) return -1;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

// Pure BST insert: returns a NEW tree with `value` inserted, sharing
// untouched subtrees. Duplicate values are ignored (BSTs don't store them).
export function bstInsertByValue(node, value, newId) {
  if (!node) return { id: newId, value, left: null, right: null };
  if (value < node.value) return { ...node, left: bstInsertByValue(node.left, value, newId) };
  if (value > node.value) return { ...node, right: bstInsertByValue(node.right, value, newId) };
  return node;
}

// Pure BST delete (standard three-case algorithm: leaf, one child, two
// children via inorder successor). Returns a NEW tree.
export function bstDeleteByValue(node, value) {
  if (!node) return null;
  if (value < node.value) return { ...node, left: bstDeleteByValue(node.left, value) };
  if (value > node.value) return { ...node, right: bstDeleteByValue(node.right, value) };
  if (!node.left) return node.right;
  if (!node.right) return node.left;
  const successor = findMinNode(node.right);
  return { id: node.id, value: successor.value, left: node.left, right: bstDeleteByValue(node.right, successor.value) };
}

// Pure level-order insert for a plain (unordered) binary tree: places the
// new node in the first open child slot, scanning level by level — keeps
// the shape "complete", like a heap.
export function levelOrderInsert(root, value, newId) {
  const newNode = { id: newId, value, left: null, right: null };
  if (!root) return newNode;
  const clone = cloneNode(root);
  const queue = [clone];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur.left) {
      cur.left = newNode;
      return clone;
    }
    queue.push(cur.left);
    if (!cur.right) {
      cur.right = newNode;
      return clone;
    }
    queue.push(cur.right);
  }
  return clone;
}

// Deepest, rightmost node in level order — the node a plain binary tree
// deletes from (after copying its value into the target being removed).
export function lastLevelOrderNode(root) {
  if (!root) return null;
  let last = root;
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    last = node;
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return last;
}

export function removeNodeById(node, id) {
  if (!node) return null;
  if (node.id === id) return null;
  return { ...node, left: removeNodeById(node.left, id), right: removeNodeById(node.right, id) };
}

export function replaceValueById(node, id, value) {
  if (!node) return null;
  if (node.id === id) return { ...node, value };
  return { ...node, left: replaceValueById(node.left, id, value), right: replaceValueById(node.right, id, value) };
}

// Delete-by-value for a plain (unordered) binary tree: find the target by
// scanning, swap its value with the last level-order node's value, then
// drop that last node — mirrors the classic binary-heap deletion shape.
export function plainDeleteByValue(root, value) {
  if (!root) return root;
  const findTarget = (node) => {
    if (!node) return null;
    if (node.value === value) return node;
    return findTarget(node.left) || findTarget(node.right);
  };
  const target = findTarget(root);
  if (!target) return root;
  const last = lastLevelOrderNode(root);
  if (target.id === last.id) return removeNodeById(root, last.id);
  const withoutLast = removeNodeById(root, last.id);
  return replaceValueById(withoutLast, target.id, last.value);
}

export function parseValueList(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .slice(0, 30);
}

export function buildTreeFromValues(values, treeType) {
  let root = null;
  values.forEach((v) => {
    const id = nextNodeId();
    if (treeType === "bst") root = bstInsertByValue(root, v, id);
    else if (treeType === "avl") root = avlInsertByValue(root, v, id);
    else root = levelOrderInsert(root, v, id);
  });
  return { root };
}

export function randomTree(treeType) {
  const count = 6 + Math.floor(Math.random() * 3);
  const values = new Set();
  while (values.size < count) values.add(1 + Math.floor(Math.random() * 90));
  return buildTreeFromValues([...values], treeType);
}

// ---------------------------------------------------------------------
// AVL helpers
// ---------------------------------------------------------------------

// height(left) - height(right). Outside [-1, 1] means the subtree needs a
// rotation to restore the AVL invariant. Recomputed from scratch each call
// (O(n)) rather than cached on the node — trees here are small (<30 nodes)
// so the simplicity is worth the cost.
export function avlBalanceFactor(node) {
  if (!node) return 0;
  return treeHeight(node.left) - treeHeight(node.right);
}

// Pure single rotations: operate on a node and return a new node. Each
// node keeps its own id — only the parent/child wiring changes — so a
// rotated node stays trackable across steps.
export function rotateRightNode(y) {
  const x = y.left;
  return { ...x, right: { ...y, left: x.right } };
}

export function rotateLeftNode(x) {
  const y = x.right;
  return { ...y, left: { ...x, right: y.left } };
}

// Replaces the subtree rooted at `id` with `newSubtree`, wherever it is.
export function replaceSubtreeById(node, id, newSubtree) {
  if (!node) return null;
  if (node.id === id) return newSubtree;
  return { ...node, left: replaceSubtreeById(node.left, id, newSubtree), right: replaceSubtreeById(node.right, id, newSubtree) };
}

// Whole-subtree post-order rebalance: fixes any node that violates the AVL
// invariant. Applied to an already-valid AVL tree it's a no-op everywhere
// except along the path that just changed, so it's a simple, always-correct
// way to restore balance after a raw BST insert/delete.
export function avlFixupTree(node) {
  if (!node) return null;
  const left = avlFixupTree(node.left);
  const right = avlFixupTree(node.right);
  let current = { ...node, left, right };
  const bf = avlBalanceFactor(current);
  if (bf > 1) {
    if (avlBalanceFactor(current.left) < 0) current = { ...current, left: rotateLeftNode(current.left) };
    return rotateRightNode(current);
  }
  if (bf < -1) {
    if (avlBalanceFactor(current.right) > 0) current = { ...current, right: rotateRightNode(current.right) };
    return rotateLeftNode(current);
  }
  return current;
}

export function avlInsertByValue(root, value, newId) {
  return avlFixupTree(bstInsertByValue(root, value, newId));
}

export function avlDeleteByValue(root, value) {
  return avlFixupTree(bstDeleteByValue(root, value));
}

// Step-generating rebalance: walks the given ancestor path bottom-up,
// emitting one step per node it checks and extra steps for any rotation.
// Only nodes on `path` can have changed height, so this is equivalent to
// avlFixupTree but produces a readable, incremental animation.
export function avlRebalanceWithSteps(rootAfterRawOp, path, steps) {
  let currentRoot = rootAfterRawOp;
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const id = path[i];
    const node = findNodeById(currentRoot, id);
    if (!node) continue;
    const bf = avlBalanceFactor(node);
    if (Math.abs(bf) <= 1) {
      steps.push({ root: currentRoot, current: id, message: `Balance factor at ${node.value} is ${bf} — still balanced` });
      continue;
    }
    let working = node;
    if (bf > 1 && avlBalanceFactor(node.left) < 0) {
      const rotatedChild = rotateLeftNode(node.left);
      currentRoot = replaceSubtreeById(currentRoot, node.left.id, rotatedChild);
      steps.push({ root: currentRoot, active: [rotatedChild.id], message: `Left-Right case at ${node.value} (balance ${bf}) — rotate ${node.left.value} left first` });
      working = findNodeById(currentRoot, id);
    } else if (bf < -1 && avlBalanceFactor(node.right) > 0) {
      const rotatedChild = rotateRightNode(node.right);
      currentRoot = replaceSubtreeById(currentRoot, node.right.id, rotatedChild);
      steps.push({ root: currentRoot, active: [rotatedChild.id], message: `Right-Left case at ${node.value} (balance ${bf}) — rotate ${node.right.value} right first` });
      working = findNodeById(currentRoot, id);
    }
    const rotated = bf > 1 ? rotateRightNode(working) : rotateLeftNode(working);
    currentRoot = replaceSubtreeById(currentRoot, id, rotated);
    steps.push({
      root: currentRoot,
      active: [rotated.id],
      message: `${bf > 1 ? "Left heavy" : "Right heavy"} at ${node.value} (balance ${bf}) — rotate ${bf > 1 ? "right" : "left"}`,
    });
  }
  return currentRoot;
}
