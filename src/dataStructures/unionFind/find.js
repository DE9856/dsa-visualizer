import { cloneUnionFind, findWithSteps, frame, labelOf, pathToRoot } from "./helpers";

export const find = {
  key: "find",
  label: "Find",
  group: "core",
  fields: ["a"],
  desc: "Walks up the parent chain until it reaches an element that is its own parent — that root is the name of the set. Then it does the thing that makes union-find fast: path compression. Every element the walk passed is re-pointed straight at the root, so the same walk never has to happen twice. The trees flatten as a side effect of being queried, which is why the amortized cost is α(n) — the inverse Ackermann function, under 5 for any n that fits in the universe.",
  time: "O(α(n)) amortized",
  space: "O(1)",
  run(uf, { a }) {
    const next = cloneUnionFind(uf);

    if (a < 0) {
      return { steps: [frame(next, { message: "Pick an element to find the root of" })], finalUf: uf };
    }

    const steps = [];
    const hops = pathToRoot(next, a).length - 1;

    steps.push(frame(next, { current: a, path: [a], message: `Find the root of ${labelOf(a)}` }));

    const root = findWithSteps(next, a, steps);
    const after = pathToRoot(next, a).length - 1;

    steps.push(
      frame(next, {
        root,
        current: a,
        resultBadge: `ROOT: ${labelOf(root)}`,
        message:
          hops === after
            ? `${labelOf(a)} is in ${labelOf(root)}'s set — the path was already as short as it gets`
            : `${labelOf(a)} is in ${labelOf(root)}'s set — the walk took ${hops} hop${hops === 1 ? "" : "s"}, and the next one will take ${after}`,
      })
    );

    return { steps, finalUf: next };
  },
};
