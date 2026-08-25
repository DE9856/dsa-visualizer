let nodeCounter = 0;
export function nextNodeId() {
  nodeCounter += 1;
  return `tt${nodeCounter}`;
}

// A 2-3 tree node holds 1 or 2 sorted keys and, if internal, keys.length + 1
// children (0 children means it's a leaf). All leaves sit at the same depth.
export function makeLeaf(keys, id) {
  return { id: id || nextNodeId(), keys, children: [] };
}

export function isLeaf(node) {
  return !node.children || node.children.length === 0;
}

export function cloneNode(node) {
  if (!node) return null;
  return { id: node.id, keys: [...node.keys], children: node.children.map(cloneNode) };
}

export function cloneTree(tree) {
  return { root: cloneNode(tree.root) };
}

export function findNodeById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const c of node.children) {
    const found = findNodeById(c, id);
    if (found) return found;
  }
  return null;
}

// Which child branch a value falls into, given a node's sorted keys.
export function childIndexFor(node, value) {
  let i = 0;
  while (i < node.keys.length && value > node.keys[i]) i += 1;
  return i;
}

// Every leaf is at the same depth in a valid 2-3 tree, so height only needs
// to follow one path down.
export function treeHeight(node) {
  if (!node) return -1;
  if (isLeaf(node)) return 0;
  return 1 + treeHeight(node.children[0]);
}

export function treeSize(node) {
  if (!node) return 0;
  return node.keys.length + node.children.reduce((sum, c) => sum + treeSize(c), 0);
}

export function collectInorder(node, out = []) {
  if (!node) return out;
  if (isLeaf(node)) {
    out.push(...node.keys);
    return out;
  }
  node.keys.forEach((k, i) => {
    collectInorder(node.children[i], out);
    out.push(k);
  });
  collectInorder(node.children[node.children.length - 1], out);
  return out;
}

export function minLeafKey(node) {
  let cur = node;
  while (!isLeaf(cur)) cur = cur.children[0];
  return cur.keys[0];
}

export function maxLeafKey(node) {
  let cur = node;
  while (!isLeaf(cur)) cur = cur.children[cur.children.length - 1];
  return cur.keys[cur.keys.length - 1];
}

export function findDescentPath(root, value) {
  const path = [];
  let node = root;
  while (node) {
    path.push(node.id);
    if (node.keys.includes(value) || isLeaf(node)) break;
    node = node.children[childIndexFor(node, value)];
  }
  return path;
}

// ---------------------------------------------------------------------
// Insert: recursive descent to a leaf, then splits propagate back up
// whenever a node temporarily holds 3 keys. `log` collects a human
// readable line per split so callers can build a step message.
// ---------------------------------------------------------------------
// `counts`, when given, is mutated with the number of node splits and how
// many of those were root splits (the only way a 2-3 tree ever gets taller).
// The comparison view needs those numbers; nothing else does, so it is an
// optional out-parameter rather than a change to what this returns.
export function insertWithLog(root, value, counts) {
  const log = [];
  const countSplit = () => {
    if (counts) counts.splits += 1;
  };

  function rec(node) {
    if (isLeaf(node)) {
      if (node.keys.includes(value)) return { node, split: null, duplicate: true };
      const newKeys = [...node.keys, value].sort((a, b) => a - b);
      if (newKeys.length <= 2) return { node: { ...node, keys: newKeys }, split: null };
      const [a, mid, b] = newKeys;
      log.push(`leaf [${newKeys.join(", ")}] overflowed — split into [${a}] and [${b}], promote ${mid}`);
      countSplit();
      return { node: null, split: { promoted: mid, left: makeLeaf([a]), right: makeLeaf([b]) } };
    }

    if (node.keys.includes(value)) return { node, split: null, duplicate: true };

    const idx = childIndexFor(node, value);
    const result = rec(node.children[idx]);
    if (result.duplicate) return result;
    if (!result.split) {
      const children = [...node.children];
      children[idx] = result.node;
      return { node: { ...node, children }, split: null };
    }

    const keys = [...node.keys.slice(0, idx), result.split.promoted, ...node.keys.slice(idx)];
    const children = [...node.children.slice(0, idx), result.split.left, result.split.right, ...node.children.slice(idx + 1)];
    if (keys.length <= 2) return { node: { ...node, keys, children }, split: null };

    const [k0, k1, k2] = keys;
    log.push(`internal node [${keys.join(", ")}] overflowed — split, promote ${k1}`);
    countSplit();
    return {
      node: null,
      split: {
        promoted: k1,
        left: { id: nextNodeId(), keys: [k0], children: [children[0], children[1]] },
        right: { id: nextNodeId(), keys: [k2], children: [children[2], children[3]] },
      },
    };
  }

  if (!root) return { root: makeLeaf([value]), log, duplicate: false };
  const result = rec(root);
  if (result.duplicate) return { root, log: [], duplicate: true };
  if (result.split) {
    log.push(`root split — new root [${result.split.promoted}], tree grows one level taller`);
    if (counts) counts.rootSplits += 1;
    return {
      root: { id: nextNodeId(), keys: [result.split.promoted], children: [result.split.left, result.split.right] },
      log,
      duplicate: false,
    };
  }
  return { root: result.node, log, duplicate: false };
}

// ---------------------------------------------------------------------
// Delete: find the key (swapping an internal key for its predecessor
// first), remove it from the leaf it ends up in, then fix any underflow
// on the way back up by borrowing from a sibling or merging with one.
// ---------------------------------------------------------------------
function mergeOrBorrow(parent, idx, log) {
  const child = parent.children[idx];
  const leftSib = idx > 0 ? parent.children[idx - 1] : null;
  const rightSib = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;

  if (leftSib && leftSib.keys.length === 2) {
    const borrowed = leftSib.keys[leftSib.keys.length - 1];
    const movedChild = isLeaf(leftSib) ? null : leftSib.children[leftSib.children.length - 1];
    const newLeftSib = { ...leftSib, keys: leftSib.keys.slice(0, -1), children: isLeaf(leftSib) ? [] : leftSib.children.slice(0, -1) };
    const newChild = {
      ...child,
      keys: [parent.keys[idx - 1], ...child.keys],
      children: movedChild ? [movedChild, ...child.children] : [],
    };
    const newParentKeys = [...parent.keys];
    newParentKeys[idx - 1] = borrowed;
    const newChildren = [...parent.children];
    newChildren[idx - 1] = newLeftSib;
    newChildren[idx] = newChild;
    log.push(`borrowed ${borrowed} from the left sibling through parent key ${parent.keys[idx - 1]}`);
    return { ...parent, keys: newParentKeys, children: newChildren };
  }

  if (rightSib && rightSib.keys.length === 2) {
    const borrowed = rightSib.keys[0];
    const movedChild = isLeaf(rightSib) ? null : rightSib.children[0];
    const newRightSib = { ...rightSib, keys: rightSib.keys.slice(1), children: isLeaf(rightSib) ? [] : rightSib.children.slice(1) };
    const newChild = {
      ...child,
      keys: [...child.keys, parent.keys[idx]],
      children: movedChild ? [...child.children, movedChild] : [],
    };
    const newParentKeys = [...parent.keys];
    newParentKeys[idx] = borrowed;
    const newChildren = [...parent.children];
    newChildren[idx] = newChild;
    newChildren[idx + 1] = newRightSib;
    log.push(`borrowed ${borrowed} from the right sibling through parent key ${parent.keys[idx]}`);
    return { ...parent, keys: newParentKeys, children: newChildren };
  }

  if (leftSib) {
    const mergedKeys = [...leftSib.keys, parent.keys[idx - 1], ...child.keys];
    const mergedChildren = isLeaf(child) ? [] : [...leftSib.children, ...child.children];
    const merged = { id: nextNodeId(), keys: mergedKeys, children: mergedChildren };
    const newKeys = parent.keys.filter((_, i) => i !== idx - 1);
    const newChildren = [...parent.children.slice(0, idx - 1), merged, ...parent.children.slice(idx + 1)];
    log.push(`merged with the left sibling and parent key ${parent.keys[idx - 1]} → [${mergedKeys.join(", ")}]`);
    return { ...parent, keys: newKeys, children: newChildren };
  }

  const mergedKeys = [...child.keys, parent.keys[idx], ...rightSib.keys];
  const mergedChildren = isLeaf(child) ? [] : [...child.children, ...rightSib.children];
  const merged = { id: nextNodeId(), keys: mergedKeys, children: mergedChildren };
  const newKeys = parent.keys.filter((_, i) => i !== idx);
  const newChildren = [...parent.children.slice(0, idx), merged, ...parent.children.slice(idx + 2)];
  log.push(`merged with the right sibling and parent key ${parent.keys[idx]} → [${mergedKeys.join(", ")}]`);
  return { ...parent, keys: newKeys, children: newChildren };
}

export function deleteWithLog(root, value) {
  const log = [];
  if (!root) return { root: null, log, notFound: true };

  function rec(node) {
    if (isLeaf(node)) {
      const i = node.keys.indexOf(value);
      if (i === -1) return { node, notFound: true };
      const newKeys = node.keys.filter((k) => k !== value);
      return { node: { ...node, keys: newKeys }, underflow: newKeys.length === 0 };
    }

    const i = node.keys.indexOf(value);
    if (i !== -1) {
      const pred = maxLeafKey(node.children[i]);
      const res = rec2(node.children[i], pred);
      const children = [...node.children];
      children[i] = res.node;
      const keys = [...node.keys];
      keys[i] = pred;
      let current = { ...node, keys, children };
      log.push(`replaced ${value} with its predecessor ${pred}, then removed ${pred} from the leaf`);
      if (res.underflow) current = mergeOrBorrow(current, i, log);
      return { node: current, underflow: current.keys.length === 0 };
    }

    const idx = childIndexFor(node, value);
    const res = rec(node.children[idx]);
    if (res.notFound) return res;
    const children = [...node.children];
    children[idx] = res.node;
    let current = { ...node, children };
    if (res.underflow) current = mergeOrBorrow(current, idx, log);
    return { node: current, underflow: current.keys.length === 0 };
  }

  // Delete `target` from the subtree rooted at `node`, used for the
  // predecessor-swap case where the value being physically removed
  // differs from the key the user asked to delete.
  function rec2(node, target) {
    if (isLeaf(node)) {
      const newKeys = node.keys.filter((k) => k !== target);
      return { node: { ...node, keys: newKeys }, underflow: newKeys.length === 0 };
    }
    const idx = childIndexFor(node, target);
    const res = rec2(node.children[idx], target);
    const children = [...node.children];
    children[idx] = res.node;
    let current = { ...node, children };
    if (res.underflow) current = mergeOrBorrow(current, idx, log);
    return { node: current, underflow: current.keys.length === 0 };
  }

  const res = rec(root);
  if (res.notFound) return { root, log: [], notFound: true };

  let finalRoot = res.node;
  if (finalRoot.keys.length === 0) {
    finalRoot = finalRoot.children.length ? finalRoot.children[0] : null;
    log.push(finalRoot ? "root emptied — its only child becomes the new root, tree shrinks one level" : "last key removed — tree is now empty");
  }
  return { root: finalRoot, log, notFound: false };
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

export function buildTreeFromValues(values) {
  let root = null;
  values.forEach((v) => {
    const result = insertWithLog(root, v);
    if (!result.duplicate) root = result.root;
  });
  return { root };
}

export function randomTree() {
  const count = 6 + Math.floor(Math.random() * 4);
  const values = new Set();
  while (values.size < count) values.add(1 + Math.floor(Math.random() * 90));
  return buildTreeFromValues([...values]);
}
