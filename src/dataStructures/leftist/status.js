import { KIND_MAP, countNodes, frame, heightOf, isLeftist, rightSpine, sOf, spineBound } from "./helpers";

export const status = {
  key: "status",
  label: "Spine & Bound",
  group: "status",
  fields: [],
  desc: "Reads the tree back and checks the claim the whole structure rests on. A node whose null-path length is s has a complete binary tree of at least 2^s − 1 nodes beneath it, because every path out of it is at least s long. So an n-node tree cannot contain a node with s greater than log₂(n+1) — and since s(root) is exactly the length of the right spine, that spine is bounded by ⌊log₂(n+1)⌋. That is the entire argument, and it is why the tree's height being unbounded does not matter: no operation here ever walks the height.",
  time: "O(1) to read, O(n) to verify",
  space: "O(1)",

  run(tree) {
    const n = countNodes(tree.root);
    if (n === 0) {
      return { steps: [frame(tree, { message: "The tree is empty.", resultBadge: "0 NODES" })], finalTree: tree };
    }

    const spine = rightSpine(tree.root);
    const bound = spineBound(n);
    const height = heightOf(tree.root);

    return {
      steps: [
        frame(tree, {
          onSpine: spine.map((node) => node.id),
          active: [tree.root.id],
          resultBadge: `SPINE ${spine.length} ≤ ${bound} · HEIGHT ${height}`,
          message: `${n} nodes. s(root) = ${sOf(tree.root)}, so the right spine is ${spine.length} long against a bound of ⌊log₂(${
            n + 1
          })⌋ = ${bound}. The tree's actual height is ${height}${
            height > bound ? ", taller than that bound — and it does not matter, because nothing walks it" : ""
          }. ${KIND_MAP[tree.kind].rule}${isLeftist(tree.root) ? ", and s(left) ≥ s(right) at every node" : ""}.`,
        }),
      ],
      finalTree: tree,
    };
  },
};
