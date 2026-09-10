import { MAX_NODES, countNodes, frame, buildSilent, rightSpine } from "./helpers";
import { meldWithSteps } from "./meldSteps";

export const meld = {
  key: "meld",
  label: "Meld With B",
  group: "combine",
  fields: ["secondValues"],
  desc: "The operation the structure exists for. Melding two binary heaps of n elements each means throwing one away and re-heapifying — O(n) — because a binary heap's shape is the array it lives in and two arrays cannot be joined without moving one. A leftist tree melds in O(log n₁ + log n₂), because the only pointers that change are on the two right spines, and the leftist property guarantees both are short. Every other operation here is a call to this one.",
  time: "O(log n₁ + log n₂)",
  space: "O(log n)",

  run(tree, { secondValues = [] }) {
    const other = buildSilent(secondValues, tree.kind);

    if (!other.root) {
      return {
        steps: [frame(tree, { notFound: true, message: "Type some values for the second tree." })],
        finalTree: tree,
      };
    }
    if (countNodes(tree.root) + countNodes(other.root) > MAX_NODES) {
      return {
        steps: [
          frame(tree, {
            notFound: true,
            overflow: true,
            second: { label: "B", root: other.root },
            message: `Together that is more than ${MAX_NODES} nodes, which is where this visualizer stops drawing.`,
          }),
        ],
        finalTree: tree,
      };
    }

    const steps = [];
    const before = { a: rightSpine(tree.root).length, b: rightSpine(other.root).length };
    const root = meldWithSteps(tree.root, other.root, tree.kind, steps, { aLabel: "A", bLabel: "B" });
    const next = { ...tree, root };

    steps.push(
      frame(next, {
        onSpine: rightSpine(root).map((n) => n.id),
        resultBadge: `${countNodes(root)} NODES · SPINE ${rightSpine(root).length}`,
        message: `${countNodes(tree.root)} + ${countNodes(other.root)} = ${countNodes(
          root
        )} nodes, and the work was the ${before.a} + ${before.b} = ${
          before.a + before.b
        } spine nodes — not the node count. A binary heap would have had to re-heapify the whole thing.`,
      })
    );

    return { steps, finalTree: next };
  },
};
