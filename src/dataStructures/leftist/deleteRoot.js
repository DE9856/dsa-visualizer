import { KIND_MAP, frame, rightSpine } from "./helpers";
import { meldWithSteps } from "./meldSteps";

export const deleteRoot = {
  key: "deleteRoot",
  label: "Delete Min / Max",
  group: "core",
  fields: [],
  desc: "The root is the answer — it always is, in any heap — so removing it is free. What it leaves behind is two leftist trees, its left and right subtrees, and melding those two *is* the repair. Again there is no sifting: a binary heap has to move its last element to the root and push it back down because the array must stay complete, and a leftist tree has no such obligation. Both subtrees are already leftist and already heap-ordered, so the meld has nothing to fix except the spine it walks.",
  time: "O(log n)",
  space: "O(log n)",

  run(tree) {
    if (!tree.root) {
      return {
        steps: [frame(tree, { notFound: true, underflow: true, message: "The tree is empty — nothing to remove." })],
        finalTree: tree,
      };
    }

    const steps = [];
    const gone = tree.root;
    steps.push(
      frame(tree, {
        removing: gone.id,
        onSpine: rightSpine(tree.root).map((n) => n.id),
        message: `${gone.value} is the ${KIND_MAP[tree.kind].root} value — it is the root, so finding it cost nothing. Remove it and two leftist trees are left behind.`,
      })
    );

    const left = gone.left;
    const right = gone.right;

    if (!left && !right) {
      const next = { ...tree, root: null };
      steps.push(frame(next, { resultBadge: `REMOVED ${gone.value}`, message: `${gone.value} was the only node — the tree is empty.` }));
      return { steps, finalTree: next };
    }

    steps.push(
      frame(
        { kind: tree.kind, root: left },
        {
          label: "LEFT SUBTREE",
          second: { label: "RIGHT SUBTREE", root: right },
          message: "Both subtrees are already leftist trees in their own right, so the repair is one meld of the two.",
        }
      )
    );

    const root = meldWithSteps(left, right, tree.kind, steps, { aLabel: "LEFT SUBTREE", bLabel: "RIGHT SUBTREE" });
    const next = { ...tree, root };

    steps.push(
      frame(next, {
        resultBadge: `REMOVED ${gone.value}`,
        message: `${gone.value} removed; the new ${KIND_MAP[tree.kind].root} value is ${root.value}. Nothing was sifted — the two subtrees were correct before and the meld only rebuilt the spine.`,
      })
    );

    return { steps, finalTree: next };
  },
};
