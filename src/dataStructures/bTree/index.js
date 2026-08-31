import {
  childIndexFor,
  cloneTree,
  countKeys,
  deleteKey,
  inorderKeys,
  insertKey,
  isLeaf,
  isPlus,
  leavesOf,
  maxKeys,
  minKeys,
  treeHeight,
} from "./helpers";

const frame = (root, extra = {}) => ({
  root: cloneTree(root),
  path: [],
  active: [],
  visited: [],
  message: "",
  ...extra,
});

/** The comparison walk down to where a key belongs, drawn before the real work. */
function descend(root, key, variant, steps, note) {
  const path = [];
  let node = root;
  while (node) {
    path.push(node.id);
    const i = node.keys.indexOf(key);
    const hit = i !== -1 && (!isPlus(variant) || isLeaf(node));
    steps.push(
      frame(root, {
        path: [...path],
        current: node.id,
        message: hit
          ? `${key} is here, in a node holding [${node.keys.join(", ")}].`
          : `[${node.keys.join(", ")}] — ${note(node, key, variant)}`,
      })
    );
    if (hit) return { path, node };
    if (isLeaf(node)) return { path, node: null };
    node = node.children[childIndexFor(node, key, isPlus(variant))];
  }
  return { path, node: null };
}

const routeNote = (node, key, variant) => {
  const i = childIndexFor(node, key, isPlus(variant));
  if (isLeaf(node)) return `a leaf, and ${key} is not in it`;
  // A B+ separator equal to the key is only a copy of the right subtree's
  // smallest key, so the entry itself is one level further down and to the right.
  if (isPlus(variant) && node.keys.includes(key))
    return `${key} is here, but only as a separator — the entry itself is in a leaf, to the right of it`;
  if (i === 0) return `${key} is below ${node.keys[0]}, so take the first child`;
  if (i === node.keys.length) return `${key} is above ${node.keys[i - 1]}, so take the last child`;
  return `${key} falls between ${node.keys[i - 1]} and ${node.keys[i]}, so take the child between them`;
};

export const insert = {
  key: "insert",
  label: "Insert",
  group: "build",
  fields: ["value"],
  desc: "Descend to the leaf the key belongs in and put it there. If that leaves the node holding more than order−1 keys, it splits: the median key moves up into the parent and the two halves become separate nodes. The parent may then overflow too, so the split can travel all the way to the root — and when the root splits, a new root is made above it. That is the only way a B-tree ever gets taller, which is exactly why every leaf stays at the same depth without any rebalancing rule. In a B+ tree a splitting *leaf* copies its median upward instead of moving it, because every key has to remain findable in a leaf.",
  time: "O(log_m n)",
  space: "O(log_m n) for the recursion",
  run(root, { value, order, variant }) {
    const steps = [];
    if (!root) {
      const next = insertKey(null, value, order, variant, null);
      steps.push(frame(next, { active: [next.id], message: `The tree is empty — ${value} starts the root.` }));
      return { steps, finalRoot: next };
    }

    descend(root, value, variant, steps, routeNote);

    const working = cloneTree(root);
    if (inorderKeys(working, variant).includes(value)) {
      steps.push(frame(root, { notFound: true, message: `${value} is already in the tree.` }));
      return { steps, finalRoot: root };
    }

    const next = insertKey(working, value, order, variant, (r, info) => {
      steps.push(frame(r, info));
    });

    steps.push(
      frame(next, {
        message: `${value} inserted. ${countKeys(next, variant)} keys across ${treeHeight(next)} level${
          treeHeight(next) === 1 ? "" : "s"
        }, and every leaf is still at the same depth.`,
      })
    );
    return { steps, finalRoot: next };
  },
};

export const search = {
  key: "search",
  label: "Search",
  group: "query",
  fields: ["value"],
  desc: "One node read decides between up to m subtrees instead of two, which is the whole reason B-trees exist: when a node is a disk block, comparisons are free and reads are not. In a B-tree a key found in an internal node is the answer and the search stops there. In a B+ tree it never does — a key upstairs is only a separator, and the real entry is always in a leaf, so every search costs the full height. That sounds worse and is usually better, because it makes every search cost the same and puts all the data on one linked level.",
  time: "O(log_m n)",
  space: "O(1)",
  run(root, { value, order, variant }) {
    const steps = [];
    if (!root) {
      steps.push(frame(null, { notFound: true, message: "The tree is empty." }));
      return { steps, finalRoot: root };
    }
    const { path, node } = descend(root, value, variant, steps, routeNote);
    steps.push(
      frame(root, {
        path,
        active: node ? [node.id] : [],
        notFound: !node,
        resultBadge: node ? `FOUND ${value} — ${path.length} NODE${path.length === 1 ? "" : "S"} READ` : `${value} NOT FOUND`,
        message: node
          ? `Found after reading ${path.length} node${path.length === 1 ? "" : "s"}. A binary search tree over ${countKeys(
              root,
              variant
            )} keys would have read about ${Math.max(1, Math.ceil(Math.log2(countKeys(root, variant) + 1)))}.`
          : `${value} is not in the tree — the search reached a leaf without finding it.`,
      })
    );
    return { steps, finalRoot: root };
  },
};

export const del = {
  key: "delete",
  label: "Delete",
  group: "build",
  fields: ["value"],
  desc: "Deleting from a leaf is easy; everything else is arranged to become that case. A key in an internal node is a separator between two subtrees, so it cannot simply be removed — it is replaced by its predecessor, which lives in a leaf, and that copy is deleted instead. A leaf left with fewer than ⌈m/2⌉−1 keys then has to be repaired: borrow a key from a sibling that has one to spare, pulling the separator down and pushing the sibling's key up; or, if neither sibling can spare one, merge with a sibling and pull the separator down into the merged node. A merge costs the parent a key, so the repair can travel all the way to the root — and when the root is emptied, the tree gets one level shorter.",
  time: "O(log_m n)",
  space: "O(log_m n)",
  run(root, { value, order, variant }) {
    const steps = [];
    if (!root) {
      steps.push(frame(null, { notFound: true, message: "The tree is empty." }));
      return { steps, finalRoot: root };
    }

    descend(root, value, variant, steps, routeNote);

    const working = cloneTree(root);
    if (!inorderKeys(working, variant).includes(value)) {
      steps.push(frame(root, { notFound: true, message: `${value} is not in the tree.` }));
      return { steps, finalRoot: root };
    }

    const { root: next } = deleteKey(working, value, order, variant, (r, info) => {
      steps.push(frame(r, info));
    });

    steps.push(
      frame(next, {
        message: next
          ? `${value} removed. ${countKeys(next, variant)} keys across ${treeHeight(next)} level${
              treeHeight(next) === 1 ? "" : "s"
            }, every node between ${minKeys(order)} and ${maxKeys(order)} keys, every leaf at the same depth.`
          : `${value} removed — the tree is now empty.`,
      })
    );
    return { steps, finalRoot: next };
  },
};

export const traverse = {
  key: "traverse",
  label: "Inorder Traversal",
  group: "traverse",
  fields: [],
  desc: "Every key in sorted order. In a B-tree this interleaves children and keys — visit a subtree, emit the separator after it, and so on — so the walk touches every level. In a B+ tree there is nothing to interleave: all the keys are in the leaves, so the traversal is a walk along the linked leaf chain, one level, in order. That is the difference that makes B+ trees the shape of nearly every database index — a range scan does not touch the tree at all after finding where to start.",
  time: "O(n)",
  space: "O(log_m n)",
  run(root, { variant }) {
    const steps = [];
    if (!root) {
      steps.push(frame(null, { notFound: true, message: "The tree is empty." }));
      return { steps, finalRoot: root };
    }

    if (isPlus(variant)) {
      const leaves = leavesOf(root);
      const seen = [];
      const out = [];
      leaves.forEach((leaf, i) => {
        seen.push(leaf.id);
        out.push(...leaf.keys);
        steps.push(
          frame(root, {
            visited: [...seen],
            current: leaf.id,
            leafLinks: true,
            message: `Leaf ${i + 1} of ${leaves.length}: [${leaf.keys.join(", ")}]. ${
              i < leaves.length - 1
                ? "The next leaf is one link away — no need to go back up the tree at all."
                : "End of the chain."
            }`,
          })
        );
      });
      steps.push(
        frame(root, {
          visited: seen,
          leafLinks: true,
          resultBadge: out.join(" → "),
          message: `${out.length} keys in order, read along one level. A range scan in a B+ tree finds its starting leaf and then just walks — which is why database indexes are shaped like this.`,
        })
      );
      return { steps, finalRoot: root };
    }

    const seen = [];
    const out = [];
    const walk = (node) => {
      if (isLeaf(node)) {
        seen.push(node.id);
        out.push(...node.keys);
        steps.push(
          frame(root, { visited: [...seen], current: node.id, message: `Leaf [${node.keys.join(", ")}] — emit all of it.` })
        );
        return;
      }
      node.children.forEach((child, i) => {
        walk(child);
        if (i < node.keys.length) {
          out.push(node.keys[i]);
          if (!seen.includes(node.id)) seen.push(node.id);
          steps.push(
            frame(root, {
              visited: [...seen],
              current: node.id,
              message: `Back up: emit the separator ${node.keys[i]}, which sits between the subtree just finished and the next one.`,
            })
          );
        }
      });
    };
    walk(root);
    steps.push(
      frame(root, {
        visited: seen,
        resultBadge: out.join(" → "),
        message: `${out.length} keys in order. The walk had to climb back up between subtrees to collect the separators — in a B+ tree they would all have been on one level.`,
      })
    );
    return { steps, finalRoot: root };
  },
};

export const clearTree = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Empties the tree.",
  time: "O(1)",
  space: "O(1)",
  run() {
    return { steps: [frame(null, { message: "Tree cleared" })], finalRoot: null };
  },
};

export const BTREE_OPERATIONS = [insert, del, search, traverse, clearTree];
export const BTREE_OP_MAP = Object.fromEntries(BTREE_OPERATIONS.map((op) => [op.key, op]));
export const BTREE_GROUPS = [
  { key: "build", label: "Build" },
  { key: "query", label: "Query" },
  { key: "traverse", label: "Traversal" },
  { key: "utility", label: "Utility" },
];

export {
  ORDERS,
  VARIANTS,
  MAX_KEYS_TOTAL,
  buildFromValues,
  parseValueList,
  randomValues,
  inorderKeys,
  countKeys,
  treeHeight,
  maxKeys,
  minKeys,
  isPlus,
} from "./helpers";
