import { MAX_NODES, countNodes, frame, nodeOf } from "./helpers";
import { meldWithSteps } from "./meldSteps";

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["value"],
  desc: "There is no separate insert. A single value is a one-node leftist tree — s = 1, no children — so inserting it is melding the tree with that, and the whole of the work is the meld. Notice what does not happen: nothing is placed at the bottom and sifted up, because there is no 'bottom' here. A leftist tree has no fixed shape to preserve, only heap order and the null-path rule, and the new node enters wherever the key order puts it on the right spine.",
  time: "O(log n)",
  space: "O(log n)",

  run(tree, { value }) {
    if (countNodes(tree.root) >= MAX_NODES) {
      return {
        steps: [
          frame(tree, {
            notFound: true,
            overflow: true,
            message: `This visualizer stops at ${MAX_NODES} nodes so the tree stays readable — a leftist tree has no capacity.`,
          }),
        ],
        finalTree: tree,
      };
    }

    const steps = [];
    const fresh = nodeOf(value);
    steps.push(
      frame(tree, {
        second: { label: `NEW: ${value}`, root: fresh, active: [fresh.id] },
        message: `${value} on its own is already a leftist tree: one node, no children, s = 1. Insert is meld.`,
      })
    );

    const root = meldWithSteps(tree.root, fresh, tree.kind, steps, { bLabel: `NEW: ${value}` });
    const next = { ...tree, root };

    steps.push(
      frame(next, {
        active: [fresh.id],
        message: `${value} inserted — one meld, ${steps.length} steps, and no part of the tree away from the right spine was touched.`,
      })
    );

    return { steps, finalTree: next };
  },
};
