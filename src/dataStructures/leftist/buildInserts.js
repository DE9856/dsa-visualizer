import { MAX_NODES, countNodes, frame, meldCost, nodeOf, rightSpine, spineBound } from "./helpers";

export const buildInserts = {
  key: "buildInserts",
  label: "Build by Inserting",
  group: "build",
  fields: ["values"],
  desc: "The obvious way to build one: start empty and insert each value in turn. Each insert is a meld against a tree that has grown by one, so the ith costs O(log i) and the whole build is O(n log n). Worth running against Build by Pairwise Melding on the same values — the trees come out different shapes, both perfectly legal, and the total spine work differs. Watch the right-spine length as it goes: it never exceeds the bound, and it is the leftist property that makes that a guarantee rather than a hope.",
  time: "O(n log n)",
  space: "O(log n)",

  run(tree, { values = [] }) {
    const list = values.slice(0, MAX_NODES);
    if (list.length === 0) {
      return { steps: [frame(tree, { notFound: true, message: "Type some values to build from." })], finalTree: tree };
    }

    const steps = [];
    let root = null;
    let work = 0;

    steps.push(
      frame(
        { kind: tree.kind, root: null },
        { message: `${list.length} values, one meld each, starting from nothing: ${list.join(", ")}.` }
      )
    );

    // One frame per value rather than the whole meld each time: what matters
    // here is the running total, and the meld has an operation of its own.
    list.forEach((value, i) => {
      const fresh = nodeOf(value);
      const { root: next, cost } = meldCost(root, fresh, tree.kind);
      work += cost;
      root = next;
      steps.push(
        frame(
          { kind: tree.kind, root },
          {
            active: [fresh.id],
            onSpine: rightSpine(root).map((n) => n.id),
            message: `Insert ${value} — meld ${i + 1}, ${cost} spine node${cost === 1 ? "" : "s"} walked, ${work} so far. The right spine is ${
              rightSpine(root).length
            } long; the bound for ${countNodes(root)} nodes is ${spineBound(countNodes(root))}.`,
          }
        )
      );
    });

    const next = { ...tree, root };
    steps.push(
      frame(next, {
        onSpine: rightSpine(root).map((n) => n.id),
        resultBadge: `${work} SPINE NODES WALKED`,
        message: `${countNodes(root)} nodes from ${list.length} melds, ${work} spine nodes of work. Every meld here put a single node against the whole tree and paid the whole tree's spine for it — pairwise melding does not, and builds the same set for less.`,
      })
    );

    return { steps, finalTree: next };
  },
};
