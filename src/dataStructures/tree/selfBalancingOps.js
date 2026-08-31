import { cloneTree } from "./helpers";
import {
  freeze,
  randomPriority,
  rbDelete,
  rbInsert,
  splayDelete,
  splayInsert,
  splaySearch,
  treapDelete,
  treapInsert,
} from "./selfBalancing";

/**
 * The bridge between the tree view's operations and the three self-balancing
 * trees, which each want a parent pointer and their own fix-up loop.
 *
 * `insert`, `delete` and `search` call in here first; a null answer means "not
 * one of mine, carry on" and leaves the existing BST/AVL/threaded code exactly
 * as it was.
 */

export const SELF_BALANCING = ["redblack", "splay", "treap"];

export const isSelfBalancing = (treeType) => SELF_BALANCING.includes(treeType);

/** The comparison walk down to where a key belongs, drawn before the real work. */
function descentSteps(root, value, steps, base) {
  const path = [];
  let cur = root;
  while (cur) {
    path.push(cur.id);
    steps.push({ ...base, path: [...path], current: cur.id, message: `Compare ${value} with ${cur.value}` });
    if (value === cur.value) break;
    cur = value < cur.value ? cur.left : cur.right;
  }
  return path;
}

export function selfBalancingInsert(tree, value, treeType) {
  if (!isSelfBalancing(treeType)) return null;
  const before = cloneTree(tree);
  const steps = [];

  if (before.root) descentSteps(before.root, value, steps, before);

  const emit = (mutableRoot, info) => {
    steps.push({ root: freeze(mutableRoot), ...info });
  };

  let finalRoot;
  if (treeType === "redblack") {
    finalRoot = rbInsert(before.root, value, emit);
  } else if (treeType === "splay") {
    finalRoot = splayInsert(before.root, value, emit);
  } else {
    finalRoot = treapInsert(before.root, value, randomPriority(), emit);
  }

  const finalTree = { root: freeze(finalRoot) };
  steps.push({ ...finalTree, active: [], message: summary(treeType, value, "inserted") });
  return { steps, finalTree };
}

export function selfBalancingDelete(tree, value, treeType) {
  if (!isSelfBalancing(treeType)) return null;
  const before = cloneTree(tree);
  const steps = [];

  if (!before.root) {
    steps.push({ ...before, notFound: true, message: "The tree is empty" });
    return { steps, finalTree: before };
  }

  descentSteps(before.root, value, steps, before);

  const emit = (mutableRoot, info) => {
    steps.push({ root: freeze(mutableRoot), ...info });
  };

  let finalRoot;
  let found = true;
  if (treeType === "redblack") {
    // rbDelete reports a miss through `emit` and returns the tree unchanged.
    const exists = (function has(n) {
      let cur = n;
      while (cur) {
        if (cur.value === value) return true;
        cur = value < cur.value ? cur.left : cur.right;
      }
      return false;
    })(before.root);
    found = exists;
    finalRoot = rbDelete(before.root, value, emit);
  } else if (treeType === "splay") {
    const out = splayDelete(before.root, value, emit);
    finalRoot = out.root;
    found = out.found;
  } else {
    const out = treapDelete(before.root, value, emit);
    finalRoot = out.root;
    found = out.found;
  }

  const finalTree = { root: freeze(finalRoot) };
  steps.push({
    ...finalTree,
    notFound: !found,
    message: found ? summary(treeType, value, "removed") : `${value} was not in the tree`,
  });
  return { steps, finalTree };
}

export function selfBalancingSearch(tree, value, treeType) {
  // Only splay searches *change* the tree; red-black and treap searches are
  // ordinary BST descents, which the existing search operation already draws.
  if (treeType !== "splay") return null;
  const before = cloneTree(tree);
  const steps = [];

  if (!before.root) {
    steps.push({ ...before, notFound: true, message: "The tree is empty" });
    return { steps, finalTree: before };
  }

  descentSteps(before.root, value, steps, before);

  const emit = (mutableRoot, info) => {
    steps.push({ root: freeze(mutableRoot), ...info });
  };
  const { root, found } = splaySearch(before.root, value, emit);
  const finalTree = { root: freeze(root) };

  steps.push({
    ...finalTree,
    notFound: !found,
    resultBadge: found ? `FOUND ${value} — NOW AT THE ROOT` : `${value} NOT FOUND`,
    message: found
      ? `${value} is at the root, so finding it again costs one comparison. This is the only search in the app that rewrites the structure it is searching — and it is why a splay tree's guarantees are amortised rather than per-operation.`
      : `${value} is not in the tree. The last node the search touched has been splayed to the root anyway — a splay tree reorganises on every access, hit or miss.`,
  });
  return { steps, finalTree };
}

function summary(treeType, value, what) {
  if (treeType === "redblack") {
    return `${value} ${what}. Every root-to-leaf path still has the same number of black nodes, and no red node has a red parent — which together bound the longest path at twice the shortest.`;
  }
  if (treeType === "splay") {
    return `${value} ${what}. Nothing here is balanced; the tree is simply reshaped around whatever was touched last.`;
  }
  return `${value} ${what}. The keys are still a search tree and the priorities are still a heap — and since the priorities are random, so is the shape.`;
}
