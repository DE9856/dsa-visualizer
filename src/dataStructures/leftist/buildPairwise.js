import { MAX_NODES, countNodes, frame, meldCost, nodeOf, rightSpine } from "./helpers";

export const buildPairwise = {
  key: "buildPairwise",
  label: "Build by Pairwise Melding",
  group: "build",
  fields: ["values"],
  desc: "Make every value a one-node tree, put them all in a queue, then repeatedly take the two at the front, meld them, and put the result at the back. It is the same trick as building a Huffman tree, and it is O(n): the first pass does n/2 melds of trees of size 1, the next n/4 melds of size 2, and so on — the melds get more expensive exactly as fast as they get rarer, so the sum is linear rather than n log n. Inserting one at a time cannot do this, because it always melds a big tree against a tiny one and pays the big tree's spine every single time.",
  time: "O(n)",
  space: "O(n)",

  run(tree, { values = [] }) {
    const list = values.slice(0, MAX_NODES);
    if (list.length === 0) {
      return { steps: [frame(tree, { notFound: true, message: "Type some values to build from." })], finalTree: tree };
    }

    const steps = [];
    let queue = list.map((value) => nodeOf(value));
    let work = 0;
    let melds = 0;

    const forest = () => queue.map((n) => ({ id: n.id, value: n.value, size: countNodes(n) }));

    steps.push(
      frame(
        { kind: tree.kind, root: null },
        {
          forest: forest(),
          message: `${list.length} one-node trees in a queue. Meld the front two, put the result at the back, repeat until one is left.`,
        }
      )
    );

    while (queue.length > 1) {
      const [a, b, ...rest] = queue;
      steps.push(
        frame(
          { kind: tree.kind, root: a },
          {
            label: "FRONT",
            second: { label: "SECOND", root: b },
            forest: forest(),
            message: `Take ${a.value} (${countNodes(a)} node${countNodes(a) === 1 ? "" : "s"}) and ${b.value} (${countNodes(
              b
            )}) off the front and meld them.`,
          }
        )
      );
      const { root, cost } = meldCost(a, b, tree.kind);
      work += cost;
      melds++;
      queue = [...rest, root];
      steps.push(
        frame(
          { kind: tree.kind, root },
          {
            label: "MELDED",
            forest: forest(),
            active: [root.id],
            onSpine: rightSpine(root).map((n) => n.id),
            message: `${cost} spine node${cost === 1 ? "" : "s"} walked, ${work} so far. The result goes to the *back* of the queue, so it will not be melded again until everything else has been — which is what keeps the sizes balanced.`,
          }
        )
      );
    }

    const root = queue[0];
    const next = { ...tree, root };
    steps.push(
      frame(next, {
        onSpine: rightSpine(root).map((n) => n.id),
        resultBadge: `${melds} MELDS · ${work} SPINE NODES`,
        message: `${countNodes(root)} nodes in ${melds} melds and ${work} spine nodes of work. The queue is what makes it linear: no meld ever pays a long spine against a single node.`,
      })
    );

    return { steps, finalTree: next };
  },
};
