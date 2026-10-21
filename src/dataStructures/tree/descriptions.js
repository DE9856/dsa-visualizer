/**
 * What `insert`, `delete` and `search` actually do, per tree type.
 *
 * These three operations are shared by all seven types, and they diverge
 * enough between them to be worth describing separately: a splay tree's insert
 * ends by rotating the new node to the root, a treap's by rotating it up until
 * its priority fits, a red-black tree's by recolouring — and none of that is a
 * detail of the BST insert they all start as. One description covering every
 * type would be a paragraph of which six-sevenths is about something that is
 * not on screen.
 *
 * `useTree` resolves whichever function applies before handing `opMeta` on, so
 * everything downstream still sees a plain `desc` string.
 */

/** The part every ordered type shares, and the one type that shares none of it. */
const DESCENT = {
  insert:
    "Insert walks down from the root comparing the new value at each node and stepping left or right until it reaches an empty slot.",
  delete:
    "Delete finds the value by comparison, then handles three cases: a leaf is simply removed, a node with one child is replaced by that child, and a node with two children has its value swapped with its inorder successor — the minimum of its right subtree — before that successor is removed.",
  search:
    "Search exploits the ordering: compare the target with the current node and step left or right, discarding half the remaining tree at each hop.",
};

const BINARY = {
  insert:
    "A plain binary tree has no ordering to follow, so there is nothing to compare and nowhere a value *must* go. Insert scans level by level, as a queue would, and drops the value into the first open child slot it finds — which is what keeps the tree complete rather than what keeps it searchable.",
  delete:
    "With no ordering there is nothing to search by, so delete scans the whole tree breadth-first for the value. The node found is then replaced by the deepest, rightmost node, because that is the only removal that leaves the tree complete — exactly the move a binary heap makes for the same reason.",
  search:
    "A plain binary tree has no ordering, so a comparison at a node says nothing about which way to go. Search has to scan every node — breadth-first here — until it finds a match, which is O(n) and is precisely what the ordering rule of a BST buys you out of.",
};

/**
 * The type-specific half. Each of these follows the descent above and explains
 * what the type does *in addition* — which is the only thing that differs.
 */
const AFTER = {
  bst: {
    insert:
      "Nothing happens on the way back up: a BST maintains its ordering and nothing else. That is the whole of its bargain — inserts are cheap and the shape is whatever the arrival order made it, so keys arriving in sorted order build a linked list and every operation degrades to O(n).",
    delete:
      "Nothing is rebalanced afterwards. Note that the successor swap is not symmetric: always taking the successor rather than alternating with the predecessor is what makes repeated deletions drift the tree leftward over time.",
    search:
      "In a balanced BST that is O(log n), but nothing here keeps it balanced — the cost is the depth of the key, and the depth is whatever the insertion order left behind.",
  },
  avl: {
    insert:
      "Then it walks back up the same path recomputing each ancestor's balance factor, height(left) − height(right). If one falls outside [−1, 1], a single or double rotation restores it — and for an insert exactly one rotation is ever needed, because fixing the lowest unbalanced node restores every height above it.",
    delete:
      "Then it walks back up from the point of removal, rechecking each ancestor's balance factor and rotating wherever it is violated. Unlike an insert, a delete may need a rotation at *every* level on the way up: a rotation can shorten the subtree it fixed, which is a new imbalance for the node above.",
    search:
      "An AVL tree never rebalances on a search — it is a read, and it changes nothing. What the rotations bought is the guarantee behind this walk: the height is at most about 1.44 log₂ n, so the hop count is bounded no matter what order the keys arrived in.",
  },
  threaded: {
    insert:
      "Then it fixes up threads rather than balance. The parent's thread on the side the new node landed becomes a real child link, and the new leaf takes over the thread to the neighbour that pointer used to reach — so the inorder sequence stays walkable without a stack.",
    delete:
      "Removing a node closes a gap in the inorder sequence, so the threads that ran through it are relinked to point straight at its two neighbours. The ordinary child pointers are repaired exactly as in a BST; the threads are the extra bookkeeping threading buys its stack-free traversal with.",
    search:
      "The threads are not used for a search — they run in inorder, and a search runs in tree order. They cost nothing here either, because a thread is stored in a pointer that would otherwise be null and is told apart from a child by a flag.",
  },
  redblack: {
    insert:
      "The new node is added red, so the black-height of every path is unchanged and only one rule can be broken: red must not have a red parent. The fix-up is then a loop of recolourings, each pushing the violation two levels up the tree, and at most *two* rotations at the point where recolouring cannot resolve it. That is the trade against AVL — a looser height bound, in exchange for a constant number of rotations per update.",
    delete:
      "Removing a black node leaves a path one black short, which is the hard case and the reason red-black deletion has a reputation. The repair pushes that deficit upward through recolourings and up to three rotations, borrowing blackness from a sibling where it can and merging where it cannot, until the deficit reaches the root and vanishes.",
    search:
      "Colours play no part in a search — they exist only to bound the height. Every root-to-leaf path holds the same number of black nodes and no two reds are adjacent, which pins the height under 2 log₂(n+1) and makes this walk logarithmic.",
  },
  splay: {
    insert:
      "Then the new node is *splayed to the root* by a chain of zig, zig-zig and zig-zag rotations. A splay tree keeps no balance information at all — no heights, no colours, no priorities — and it makes no worst-case promise about a single operation. What it promises is amortised O(log n), and the mechanism is this: every access pays to move what it touched to the top.",
    delete:
      "The node is first splayed to the root, which makes the removal easy — the root has no parent to repair — and then the two subtrees left behind are joined. The rotations are the point, not overhead: a delete restructures the path it walked, so the next access along it is shorter.",
    search:
      "A splay tree *changes shape on a read*, which is what makes it unlike every other tree here. The node found is rotated all the way to the root, so searching for the same key twice is fast the second time, and a working set of a few hot keys ends up near the top and stays there. Search the same value twice and watch the second run.",
  },
  treap: {
    insert:
      "Then the new node, which was given a random priority when it was created, is rotated upward while its priority beats its parent's. The result is a tree that is a BST by key and a heap by priority — and since the priorities are random, the shape is that of a BST built from a random insertion order, whose expected height is about 1.39 log₂ n. Randomness is doing the work that rotations do in an AVL tree.",
    delete:
      "The node's priority is pushed to the bottom — it is rotated downward, always toward whichever child has the stronger priority, until it becomes a leaf and can simply be dropped. That is the insert run backwards, which is why a treap needs no separate case analysis for one child versus two.",
    search:
      "A treap is an ordinary BST for reading: priorities decide shape, not descent, so the walk compares keys and nothing else. The guarantee behind it is probabilistic rather than structural — no input order can make a treap tall, because the shape depends on the random priorities and not on the order the keys arrived in.",
  },
};

/**
 * A `desc` for one operation, as a function of the setup — the shape
 * `useTree` resolves.
 */
export function treeDesc(op) {
  return ({ treeType }) => {
    if (treeType === "binary") return BINARY[op];
    const after = (AFTER[treeType] || AFTER.bst)[op];
    return `${DESCENT[op]} ${after}`;
  };
}
