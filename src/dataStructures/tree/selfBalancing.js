import { nextNodeId } from "./helpers";

/**
 * Red-black trees, splay trees and treaps — three answers to the same problem.
 *
 * A plain binary search tree has no shape of its own: feed it sorted keys and
 * it degenerates into a linked list. AVL fixes that by measuring height and
 * rotating whenever it slips. These three fix it differently:
 *
 *   red-black  colours nodes and keeps every root-to-leaf path within a factor
 *              of two of every other, which is a weaker promise than AVL's and
 *              buys markedly less restructuring per update
 *   splay      makes no promise about shape at all, and instead moves whatever
 *              you just touched to the root. Nothing is balanced; everything is
 *              *amortised*, and recently used keys end up cheap to reach again
 *   treap      gives each key a random priority and keeps a heap on those. The
 *              shape is whatever a random insertion order would have produced,
 *              because that is literally what it is
 *
 * All three want a parent pointer — rotations and fix-up walk upward — while
 * the rest of the app models nodes as immutable objects with no parent link.
 * So each algorithm converts to a mutable form, works there, and freezes the
 * result on the way out. That is also what makes red-black *deletion* tractable
 * to write correctly: the double-black cases are hard enough without also
 * rebuilding the spine on every step.
 */

export const RED = "R";
export const BLACK = "B";

// ---------------------------------------------------------------------
// mutable <-> immutable
// ---------------------------------------------------------------------

function toMutable(node, parent = null) {
  if (!node) return null;
  const copy = { ...node, parent };
  copy.left = toMutable(node.left, copy);
  copy.right = toMutable(node.right, copy);
  return copy;
}

/** Back to the plain immutable node the canvas draws — no parent links. */
export function freeze(node) {
  if (!node) return null;
  const { parent, ...rest } = node;
  return { ...rest, left: freeze(node.left), right: freeze(node.right) };
}

// ---------------------------------------------------------------------
// rotations, on the mutable form
// ---------------------------------------------------------------------

/** Returns the new root of the whole tree, since a rotation at the top changes it. */
function rotateLeft(root, x) {
  const y = x.right;
  x.right = y.left;
  if (y.left) y.left.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.left) x.parent.left = y;
  else x.parent.right = y;
  y.left = x;
  x.parent = y;
  return root;
}

function rotateRight(root, x) {
  const y = x.left;
  x.left = y.right;
  if (y.right) y.right.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.right) x.parent.right = y;
  else x.parent.left = y;
  y.right = x;
  x.parent = y;
  return root;
}

const isRed = (n) => !!n && n.color === RED;

// ---------------------------------------------------------------------
// red-black
// ---------------------------------------------------------------------

/**
 * `emit(root, info)` is called with the mutable root after every step worth
 * drawing. The caller freezes it.
 */
export function rbInsert(immutableRoot, value, emit) {
  let root = toMutable(immutableRoot);

  let parent = null;
  let cur = root;
  while (cur) {
    parent = cur;
    if (value === cur.value) {
      emit(root, { active: [cur.id], message: `${value} is already in the tree — a set, so nothing to do.` });
      return root;
    }
    cur = value < cur.value ? cur.left : cur.right;
  }

  const node = { id: nextNodeId(), value, left: null, right: null, color: RED, parent };
  if (!parent) root = node;
  else if (value < parent.value) parent.left = node;
  else parent.right = node;

  emit(root, {
    active: [node.id],
    message: `Insert ${value} as a red leaf. Red because a new black node would change the black-height of that path and break the rule immediately — red only risks the weaker "no two reds in a row".`,
  });

  // Fix-up: the only violation a red insert can cause is a red node with a red
  // parent, and there are exactly three shapes of that.
  let z = node;
  while (z.parent && isRed(z.parent)) {
    const grandparent = z.parent.parent;
    if (!grandparent) break;
    const parentIsLeft = z.parent === grandparent.left;
    const uncle = parentIsLeft ? grandparent.right : grandparent.left;

    if (isRed(uncle)) {
      z.parent.color = BLACK;
      uncle.color = BLACK;
      grandparent.color = RED;
      emit(root, {
        active: [z.parent.id, uncle.id, grandparent.id],
        message: `${z.value} and its parent are both red, and so is the uncle. Recolour both to black and the grandparent to red — every path through here keeps the same number of blacks, and the problem moves two levels up.`,
      });
      z = grandparent;
    } else {
      if (parentIsLeft && z === z.parent.right) {
        z = z.parent;
        root = rotateLeft(root, z);
        emit(root, { active: [z.id], message: `Red parent, black uncle, and ${z.value} is the inner grandchild — rotate left first to straighten the zig-zag into a line.` });
      } else if (!parentIsLeft && z === z.parent.left) {
        z = z.parent;
        root = rotateRight(root, z);
        emit(root, { active: [z.id], message: `Red parent, black uncle, and ${z.value} is the inner grandchild — rotate right first to straighten the zig-zag into a line.` });
      }
      z.parent.color = BLACK;
      grandparent.color = RED;
      root = parentIsLeft ? rotateRight(root, grandparent) : rotateLeft(root, grandparent);
      emit(root, {
        active: [z.parent.id],
        message: `Now it is a straight line: recolour and rotate the grandparent. The subtree's root is black again, so nothing above it can still be violated — the fix-up ends here.`,
      });
      break;
    }
  }

  if (root.color !== BLACK) {
    root.color = BLACK;
    emit(root, { active: [root.id], message: `The root is always black. Painting it black adds one to the black-height of every path at once, so no rule is broken by doing it.` });
  }
  return root;
}

/** Transplant `v` into `u`'s place. Returns the (possibly new) root. */
function rbTransplant(root, u, v) {
  if (!u.parent) root = v;
  else if (u === u.parent.left) u.parent.left = v;
  else u.parent.right = v;
  if (v) v.parent = u.parent;
  return root;
}

const minimum = (n) => {
  let cur = n;
  while (cur.left) cur = cur.left;
  return cur;
};

export function rbDelete(immutableRoot, value, emit) {
  let root = toMutable(immutableRoot);

  let z = root;
  while (z && z.value !== value) z = value < z.value ? z.left : z.right;
  if (!z) {
    emit(root, { notFound: true, message: `${value} is not in the tree.` });
    return root;
  }

  emit(root, { active: [z.id], message: `Found ${value}. Deleting a red node is free; deleting a black one removes a black from every path through it, and that is what the fix-up has to repair.` });

  let y = z;
  let yOriginalColor = y.color;
  let x = null;
  let xParent = null;

  if (!z.left) {
    x = z.right;
    xParent = z.parent;
    root = rbTransplant(root, z, z.right);
  } else if (!z.right) {
    x = z.left;
    xParent = z.parent;
    root = rbTransplant(root, z, z.left);
  } else {
    // Two children: the successor takes its place and its own colour, so the
    // colour that actually leaves the tree is the successor's.
    y = minimum(z.right);
    yOriginalColor = y.color;
    x = y.right;
    if (y.parent === z) {
      xParent = y;
      if (x) x.parent = y;
    } else {
      xParent = y.parent;
      root = rbTransplant(root, y, y.right);
      y.right = z.right;
      y.right.parent = y;
    }
    root = rbTransplant(root, z, y);
    y.left = z.left;
    y.left.parent = y;
    y.color = z.color;
    emit(root, { active: [y.id], message: `${value} had two children, so its inorder successor ${y.value} moves into its place and takes its colour. The node that physically leaves is ${y.value}'s old slot.` });
  }

  if (yOriginalColor === BLACK) {
    emit(root, { message: `A black node left the tree, so every path through that spot is one black short. Rebalancing that shortfall is the whole of the delete fix-up.` });
    root = rbDeleteFixup(root, x, xParent, emit);
  } else {
    emit(root, { message: `The node removed was red, so no path changed its black count — nothing to repair.` });
  }

  if (root) root.color = BLACK;
  return root;
}

function rbDeleteFixup(root, x, parent, emit) {
  // `x` carries an extra "black" that has to be pushed somewhere legal. It can
  // be null, which is why the parent is tracked separately.
  while (x !== root && !isRed(x)) {
    if (!parent) break;
    if (x === parent.left) {
      let w = parent.right;
      if (isRed(w)) {
        w.color = BLACK;
        parent.color = RED;
        root = rotateLeft(root, parent);
        w = parent.right;
        emit(root, { active: [parent.id], message: `The sibling is red, which means the real sibling is one of its black children — rotate to bring that one up and carry on with the black-sibling cases.` });
      }
      if (!isRed(w?.left) && !isRed(w?.right)) {
        if (w) w.color = RED;
        emit(root, { active: w ? [w.id] : [], message: `Both of the sibling's children are black, so the sibling can afford to give up a black: paint it red and move the shortfall up to the parent.` });
        x = parent;
        parent = x.parent;
      } else {
        if (!isRed(w?.right)) {
          if (w?.left) w.left.color = BLACK;
          if (w) w.color = RED;
          root = rotateRight(root, w);
          w = parent.right;
          emit(root, { active: w ? [w.id] : [], message: `The sibling's far child is black but the near one is red — rotate the sibling so the red child ends up on the far side, where a single rotation can use it.` });
        }
        if (w) w.color = parent.color;
        parent.color = BLACK;
        if (w?.right) w.right.color = BLACK;
        root = rotateLeft(root, parent);
        emit(root, { active: [parent.id], message: `The sibling has a red child on the far side, which is the one case that can be finished outright: recolour and rotate, and the missing black is restored.` });
        x = root;
        parent = null;
      }
    } else {
      let w = parent.left;
      if (isRed(w)) {
        w.color = BLACK;
        parent.color = RED;
        root = rotateRight(root, parent);
        w = parent.left;
        emit(root, { active: [parent.id], message: `The sibling is red — rotate to bring a black sibling up and continue.` });
      }
      if (!isRed(w?.left) && !isRed(w?.right)) {
        if (w) w.color = RED;
        emit(root, { active: w ? [w.id] : [], message: `Both of the sibling's children are black: paint the sibling red and push the shortfall up to the parent.` });
        x = parent;
        parent = x.parent;
      } else {
        if (!isRed(w?.left)) {
          if (w?.right) w.right.color = BLACK;
          if (w) w.color = RED;
          root = rotateLeft(root, w);
          w = parent.left;
          emit(root, { active: w ? [w.id] : [], message: `Rotate the sibling so its red child ends up on the far side.` });
        }
        if (w) w.color = parent.color;
        parent.color = BLACK;
        if (w?.left) w.left.color = BLACK;
        root = rotateRight(root, parent);
        emit(root, { active: [parent.id], message: `Red child on the far side — recolour and rotate, and the black count is restored.` });
        x = root;
        parent = null;
      }
    }
  }
  if (x) x.color = BLACK;
  return root;
}

// ---------------------------------------------------------------------
// splay
// ---------------------------------------------------------------------

/** Moves `node` to the root by rotations, in the zig / zig-zig / zig-zag pattern. */
function splayToRoot(root, node, emit) {
  while (node.parent) {
    const parent = node.parent;
    const grand = parent.parent;
    if (!grand) {
      root = node === parent.left ? rotateRight(root, parent) : rotateLeft(root, parent);
      emit?.(root, { active: [node.id], message: `Zig: ${node.value}'s parent is the root, so one rotation finishes the job.` });
    } else if ((node === parent.left) === (parent === grand.left)) {
      // Same side twice. Rotating the grandparent FIRST is what makes splaying
      // amortised rather than merely moving the node up — it halves the depth
      // of everything on the path instead of just relocating one node.
      root = node === parent.left ? rotateRight(root, grand) : rotateLeft(root, grand);
      root = node === parent.left ? rotateRight(root, parent) : rotateLeft(root, parent);
      emit?.(root, { active: [node.id], message: `Zig-zig: ${node.value}, its parent and its grandparent lean the same way. Rotate the grandparent first — that is what halves the depth of the whole path rather than just lifting one node.` });
    } else {
      root = node === parent.left ? rotateRight(root, parent) : rotateLeft(root, parent);
      root = node === grand.left ? rotateRight(root, grand) : rotateLeft(root, grand);
      emit?.(root, { active: [node.id], message: `Zig-zag: ${node.value} bends the other way from its parent, so rotate twice in opposite directions.` });
    }
  }
  return root;
}

export function splayInsert(immutableRoot, value, emit) {
  let root = toMutable(immutableRoot);
  if (!root) {
    root = { id: nextNodeId(), value, left: null, right: null, parent: null };
    emit(root, { active: [root.id], message: `${value} is the first key, so it is the root.` });
    return root;
  }

  let parent = null;
  let cur = root;
  while (cur) {
    parent = cur;
    if (value === cur.value) {
      emit(root, { active: [cur.id], message: `${value} is already here — splay it to the root anyway, because touching a key is what moves it.` });
      return splayToRoot(root, cur, emit);
    }
    cur = value < cur.value ? cur.left : cur.right;
  }

  const node = { id: nextNodeId(), value, left: null, right: null, parent };
  if (value < parent.value) parent.left = node;
  else parent.right = node;

  emit(root, { active: [node.id], message: `Insert ${value} where an ordinary BST would put it — then splay it all the way to the root.` });
  return splayToRoot(root, node, emit);
}

export function splaySearch(immutableRoot, value, emit) {
  let root = toMutable(immutableRoot);
  if (!root) return { root, found: false };

  let cur = root;
  let last = root;
  while (cur) {
    last = cur;
    if (value === cur.value) break;
    cur = value < cur.value ? cur.left : cur.right;
  }

  const found = !!cur;
  emit(root, {
    active: [last.id],
    message: found
      ? `Found ${value}. Now splay it to the root — a splay tree pays for a search by rearranging itself, so looking this up again is cheap.`
      : `${value} is not here; the search stopped at ${last.value}. Splay *that* to the root instead — even a failed search reorganises the tree.`,
  });

  root = splayToRoot(root, last, emit);
  return { root, found };
}

export function splayDelete(immutableRoot, value, emit) {
  const { root: splayed, found } = splaySearch(immutableRoot, value, emit);
  if (!found) return { root: splayed, found: false };

  // The key is now the root, so removing it leaves two subtrees. Splay the
  // largest key of the left one to its root and it has no right child by
  // definition, which is exactly where the right subtree goes.
  let root = splayed;
  const left = root.left;
  const right = root.right;
  if (left) left.parent = null;
  if (right) right.parent = null;

  if (!left) {
    root = right;
  } else {
    let biggest = left;
    while (biggest.right) biggest = biggest.right;
    root = splayToRoot(left, biggest, null);
    root.right = right;
    if (right) right.parent = root;
  }
  if (root) root.parent = null;
  return { root, found: true };
}

// ---------------------------------------------------------------------
// treap
// ---------------------------------------------------------------------

export const randomPriority = () => Math.floor(Math.random() * 99) + 1;

export function treapInsert(immutableRoot, value, priority, emit) {
  let root = toMutable(immutableRoot);

  let parent = null;
  let cur = root;
  while (cur) {
    parent = cur;
    if (value === cur.value) {
      emit(root, { active: [cur.id], message: `${value} is already in the treap.` });
      return root;
    }
    cur = value < cur.value ? cur.left : cur.right;
  }

  const node = { id: nextNodeId(), value, priority, left: null, right: null, parent };
  if (!parent) root = node;
  else if (value < parent.value) parent.left = node;
  else parent.right = node;

  emit(root, {
    active: [node.id],
    message: `Insert ${value} in BST position with a random priority of ${priority}. The keys obey the search-tree rule; the priorities have to obey the heap rule, and right now they may not.`,
  });

  // Rotate upward while the child outranks its parent. The result is exactly
  // the tree a random insertion order would have built, which is why the
  // expected height is O(log n) with no balancing rule anywhere.
  while (node.parent && node.priority > node.parent.priority) {
    const above = node.parent;
    root = node === above.left ? rotateRight(root, above) : rotateLeft(root, above);
    emit(root, {
      active: [node.id],
      message: `${node.priority} outranks its parent's ${above.priority}, so rotate ${
        node === above.right ? "left" : "right"
      } — the key order is untouched by a rotation, so only the heap gets fixed.`,
    });
  }

  return root;
}

export function treapDelete(immutableRoot, value, emit) {
  let root = toMutable(immutableRoot);

  let node = root;
  while (node && node.value !== value) node = value < node.value ? node.left : node.right;
  if (!node) {
    emit(root, { notFound: true, message: `${value} is not in the treap.` });
    return { root, found: false };
  }

  emit(root, { active: [node.id], message: `Found ${value}. Rather than untangle its children, rotate it *down* until it is a leaf — then it just falls off.` });

  while (node.left || node.right) {
    // Rotate the higher-priority child up, which keeps the heap property
    // among everything left behind.
    const takeLeft = !node.right || (node.left && node.left.priority > node.right.priority);
    const child = takeLeft ? node.left : node.right;
    root = takeLeft ? rotateRight(root, node) : rotateLeft(root, node);
    emit(root, {
      active: [node.id],
      message: `Its ${takeLeft ? "left" : "right"} child ${child.value} has the higher priority (${
        child.priority
      }), so that one comes up and ${value} sinks a level.`,
    });
  }

  if (!node.parent) root = null;
  else if (node === node.parent.left) node.parent.left = null;
  else node.parent.right = null;

  return { root, found: true };
}
