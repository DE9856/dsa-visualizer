/**
 * B-trees and B+ trees, of any order.
 *
 * A binary search tree makes one comparison per node and then follows a
 * pointer, which is exactly the wrong shape when a "pointer" means reading a
 * disk block: the comparison is free and the read is not. A B-tree fixes the
 * ratio by making nodes wide — order m means up to m children and m−1 keys —
 * so one block read decides between m subtrees instead of two. Height falls to
 * log_m n, and for the orders a real database uses (hundreds) that is three or
 * four levels for millions of keys.
 *
 * Every leaf is at the same depth, always. That is not maintained by rotations
 * but by the shape of the update rules: a node that overflows splits and pushes
 * its median *up*, and a node that underflows borrows from a sibling or merges
 * with one, pulling a separator *down*. The tree only ever gets taller by
 * splitting at the root and only ever shorter by merging into it.
 *
 * The B+ variant moves all the keys into the leaves and keeps only separators
 * upstairs, then links the leaves left to right. That costs a little space and
 * buys two things: a range scan becomes a walk along the leaf chain instead of
 * a tree traversal, and internal nodes hold more separators per block because
 * they carry no payload — which makes the tree shallower still. It is what
 * essentially every relational database index actually is.
 */

let counter = 0;
export const nextId = () => `bt${(counter += 1)}`;

export const ORDERS = [3, 4, 5];
export const MAX_KEYS_TOTAL = 24;

export const VARIANTS = [
  { key: "btree", label: "B-Tree", short: "B-TREE", summary: "Keys live at every level; a key found in an internal node is the answer." },
  { key: "bplus", label: "B+ Tree", short: "B+ TREE", summary: "Every key lives in a leaf; internal nodes only route, and the leaves are linked for range scans." },
];

export const isPlus = (variant) => variant === "bplus";

export const maxKeys = (order) => order - 1;
export const minKeys = (order) => Math.ceil(order / 2) - 1;

export const isLeaf = (node) => !node.children || node.children.length === 0;

export const makeNode = (keys = [], children = []) => ({ id: nextId(), keys, children });

export function cloneNode(node) {
  if (!node) return null;
  return { id: node.id, keys: [...node.keys], children: (node.children || []).map(cloneNode) };
}

export const cloneTree = (root) => cloneNode(root);

/**
 * Which child a key descends into.
 *
 * `plus` matters only when the key equals a separator. A B-tree separator is a
 * key in its own right, with everything strictly smaller to its left. A B+ tree
 * separator is a *copy* of the smallest key of the right subtree, so an equal
 * key lives to the right — routing left there would walk past the leaf holding
 * it and report the key missing.
 */
export function childIndexFor(node, key, plus = false) {
  let i = 0;
  while (i < node.keys.length && (plus ? key >= node.keys[i] : key > node.keys[i])) i += 1;
  return i;
}

export function treeHeight(node) {
  if (!node) return 0;
  return isLeaf(node) ? 1 : 1 + treeHeight(node.children[0]);
}

/**
 * How many keys the tree *holds*. A B+ tree stores its separators twice — once
 * upstairs to route and once in a leaf — so counting every key in every node
 * would report a tree half again as large as the set it represents.
 */
export function countKeys(node, variant) {
  if (!node) return 0;
  if (isLeaf(node)) return node.keys.length;
  const below = node.children.reduce((sum, c) => sum + countKeys(c, variant), 0);
  return isPlus(variant) ? below : below + node.keys.length;
}

/** Leaves left to right — the B+ chain, and the order a scan would read. */
export function leavesOf(node, out = []) {
  if (!node) return out;
  if (isLeaf(node)) {
    out.push(node);
    return out;
  }
  node.children.forEach((c) => leavesOf(c, out));
  return out;
}

/**
 * Every key in order. A B-tree interleaves keys and children; a B+ tree keeps
 * them all in the leaves, so the same walk finds each key exactly once either
 * way — in a B+ tree the internal copies are separators, not entries.
 */
export function inorderKeys(node, variant, out = []) {
  if (!node) return out;
  if (isLeaf(node)) {
    out.push(...node.keys);
    return out;
  }
  if (isPlus(variant)) {
    node.children.forEach((c) => inorderKeys(c, variant, out));
    return out;
  }
  node.children.forEach((c, i) => {
    inorderKeys(c, variant, out);
    if (i < node.keys.length) out.push(node.keys[i]);
  });
  return out;
}

export function findNode(root, key, variant) {
  let node = root;
  while (node) {
    const i = node.keys.indexOf(key);
    // In a B+ tree a hit upstairs is only a separator — the real entry is in a
    // leaf, so the search always runs to the bottom.
    if (i !== -1 && (!isPlus(variant) || isLeaf(node))) return node;
    if (isLeaf(node)) return null;
    node = node.children[childIndexFor(node, key, isPlus(variant))];
  }
  return null;
}

// ---------------------------------------------------------------------
// insert
// ---------------------------------------------------------------------

/**
 * Inserts and returns the new root. `emit(root, info)` is called after each
 * split so the caller can draw it.
 *
 * The recursion returns `{ promoted, right }` when the child it visited split,
 * which the parent then absorbs — pushing the work upward one level at a time.
 */
export function insertKey(root, key, order, variant, emit) {
  if (!root) return makeNode([key]);

  const plus = isPlus(variant);

  const go = (node) => {
    if (isLeaf(node)) {
      if (node.keys.includes(key)) return null;
      const at = childIndexFor(node, key);
      node.keys.splice(at, 0, key);
      return overflow(node);
    }

    const i = childIndexFor(node, key, plus);
    const split = go(node.children[i]);
    if (!split) return null;

    node.keys.splice(i, 0, split.promoted);
    node.children.splice(i + 1, 0, split.right);
    emit?.(root, {
      active: [node.id],
      message: `${split.promoted} moves up into its parent, which now has ${node.keys.length} key${
        node.keys.length === 1 ? "" : "s"
      }${node.keys.length > maxKeys(order) ? " — one too many, so it splits in turn." : "."}`,
    });
    return overflow(node);
  };

  const overflow = (node) => {
    if (node.keys.length <= maxKeys(order)) return null;

    const mid = Math.floor(node.keys.length / 2);
    const promoted = node.keys[mid];
    const leafSplit = isLeaf(node);

    const right = makeNode(
      // A B+ leaf *copies* its median upward and keeps it, because every key
      // must still be findable in a leaf. Everywhere else the median moves.
      plus && leafSplit ? node.keys.slice(mid) : node.keys.slice(mid + 1),
      leafSplit ? [] : node.children.slice(mid + 1)
    );
    node.keys = node.keys.slice(0, mid);
    if (!leafSplit) node.children = node.children.slice(0, mid + 1);

    emit?.(root, {
      active: [node.id, right.id],
      message: `That node holds ${maxKeys(order) + 1} keys and order ${order} allows ${maxKeys(
        order
      )}. Split it: ${promoted} goes up${
        plus && leafSplit ? " as a *copy* — a B+ tree keeps every key in a leaf" : ""
      }, and the halves become two nodes.`,
    });

    return { promoted, right };
  };

  const split = go(root);
  if (!split) return root;

  const newRoot = makeNode([split.promoted], [root, split.right]);
  emit?.(newRoot, {
    active: [newRoot.id],
    message: `The root itself split, so a new root holds ${split.promoted} alone. This is the only way a B-tree ever gets taller — which is why every leaf stays at the same depth.`,
  });
  return newRoot;
}

// ---------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------

/**
 * Removes `key` and repairs any underflow on the way back up, returning the
 * new root (which changes only when the old one is emptied by a merge).
 */
export function deleteKey(root, key, order, variant, emit) {
  if (!root) return { root: null, found: false };
  const plus = isPlus(variant);
  const min = minKeys(order);
  let found = false;

  const fix = (parent, i) => {
    const child = parent.children[i];
    if (child.keys.length >= min) return;

    const leftSib = i > 0 ? parent.children[i - 1] : null;
    const rightSib = i < parent.children.length - 1 ? parent.children[i + 1] : null;

    if (leftSib && leftSib.keys.length > min) {
      // Borrow: the separator comes down into the short node and the sibling's
      // last key goes up to replace it.
      if (isLeaf(child) && plus) {
        child.keys.unshift(leftSib.keys.pop());
        parent.keys[i - 1] = child.keys[0];
      } else {
        child.keys.unshift(parent.keys[i - 1]);
        parent.keys[i - 1] = leftSib.keys.pop();
        if (!isLeaf(child)) child.children.unshift(leftSib.children.pop());
      }
      emit?.(root, {
        active: [child.id, leftSib.id],
        message: `The node is one key short. Its left sibling has one to spare, so borrow: the separator comes down and the sibling's largest key goes up to take its place.`,
      });
      return;
    }

    if (rightSib && rightSib.keys.length > min) {
      if (isLeaf(child) && plus) {
        child.keys.push(rightSib.keys.shift());
        parent.keys[i] = rightSib.keys[0];
      } else {
        child.keys.push(parent.keys[i]);
        parent.keys[i] = rightSib.keys.shift();
        if (!isLeaf(child)) child.children.push(rightSib.children.shift());
      }
      emit?.(root, {
        active: [child.id, rightSib.id],
        message: `The node is one key short and its right sibling has one to spare — borrow across the separator.`,
      });
      return;
    }

    // No sibling can spare a key, so merge with one, pulling the separator
    // down. This is the only thing that ever makes the tree shorter.
    const left = leftSib || child;
    const right = leftSib ? child : rightSib;
    const sepIndex = leftSib ? i - 1 : i;
    const separator = parent.keys[sepIndex];

    if (!(isLeaf(left) && plus)) left.keys.push(separator);
    left.keys.push(...right.keys);
    if (!isLeaf(left)) left.children.push(...right.children);
    parent.keys.splice(sepIndex, 1);
    parent.children.splice(sepIndex + 1, 1);

    emit?.(root, {
      active: [left.id],
      message: `Neither sibling can spare a key, so merge them${
        isLeaf(left) && plus ? "" : ` and pull the separator ${separator} down between them`
      }. The parent just lost a key, so it may underflow in turn.`,
    });
  };

  const go = (node) => {
    const i = node.keys.indexOf(key);

    if (isLeaf(node)) {
      if (i === -1) return;
      node.keys.splice(i, 1);
      found = true;
      emit?.(root, {
        active: [node.id],
        message: `${key} was in a leaf, so it just comes out. ${
          node.keys.length < min ? "That leaves the leaf short, which has to be repaired on the way back up." : ""
        }`,
      });
      return;
    }

    if (i !== -1 && !plus) {
      // An internal key cannot simply be removed — it is a separator. Replace
      // it with its predecessor, which lives in a leaf, and delete that
      // instead. The problem moves down to where it is easy.
      let pred = node.children[i];
      while (!isLeaf(pred)) pred = pred.children[pred.children.length - 1];
      const replacement = pred.keys[pred.keys.length - 1];
      node.keys[i] = replacement;
      emit?.(root, {
        active: [node.id, pred.id],
        message: `${key} sits in an internal node, where it separates two subtrees — it cannot just be deleted. Replace it with its predecessor ${replacement} and delete *that* from the leaf instead.`,
      });
      const child = node.children[i];
      deleteFrom(child, replacement);
      fix(node, i);
      found = true;
      return;
    }

    const idx = childIndexFor(node, key, plus);
    go(node.children[idx]);
    fix(node, idx);
  };

  const deleteFrom = (node, k) => {
    if (isLeaf(node)) {
      const j = node.keys.indexOf(k);
      if (j !== -1) node.keys.splice(j, 1);
      return;
    }
    const j = childIndexFor(node, k, plus);
    deleteFrom(node.children[j], k);
    fix(node, j);
  };

  go(root);

  if (!isLeaf(root) && root.keys.length === 0) {
    emit?.(root.children[0], {
      active: [root.children[0].id],
      message: `The root has no keys left, so its only child becomes the new root — the tree just got one level shorter. That is the only way a B-tree ever shrinks.`,
    });
    return { root: root.children[0], found };
  }
  if (isLeaf(root) && root.keys.length === 0) return { root: null, found };
  return { root, found };
}

// ---------------------------------------------------------------------
// building
// ---------------------------------------------------------------------

export function buildFromValues(values, order, variant) {
  let root = null;
  values.forEach((v) => {
    root = insertKey(root, v, order, variant, null);
  });
  return root;
}

export function parseValueList(input, limit = MAX_KEYS_TOTAL) {
  const seen = new Set();
  return String(input || "")
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
    .filter((n) => (seen.has(n) ? false : seen.add(n)))
    .slice(0, limit);
}

export function randomValues() {
  const count = 8 + Math.floor(Math.random() * 5);
  const seen = new Set();
  while (seen.size < count) seen.add(1 + Math.floor(Math.random() * 60));
  return [...seen];
}
