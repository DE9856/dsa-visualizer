import { cloneUnionFind, findWithSteps, frame, labelOf } from "./helpers";

export const connected = {
  key: "connected",
  label: "Connected?",
  group: "query",
  fields: ["a", "b"],
  desc: "Two elements are in the same set exactly when they walk up to the same root — so the query is two finds and one comparison. Note what this cannot do: union-find answers 'are these connected?' but never 'how are they connected'. It keeps no edges and no paths, only the root each element ultimately points at, which is why it costs almost nothing to maintain.",
  time: "O(α(n)) amortized",
  space: "O(1)",
  run(uf, { a, b }) {
    const next = cloneUnionFind(uf);

    if (a < 0 || b < 0) {
      return { steps: [frame(next, { message: "Pick two elements to compare" })], finalUf: uf };
    }

    const steps = [];
    steps.push(frame(next, { path: [a, b], message: `Are ${labelOf(a)} and ${labelOf(b)} in the same set?` }));

    const ra = findWithSteps(next, a, steps, { pair: [a, b] });
    const rb = findWithSteps(next, b, steps, { pair: [a, b], otherRoot: ra });

    const same = ra === rb;
    steps.push(
      frame(next, {
        pair: [a, b],
        roots: same ? [ra] : [ra, rb],
        root: same ? ra : undefined,
        notFound: !same,
        resultBadge: same ? "CONNECTED" : "NOT CONNECTED",
        message: same
          ? `Both roots are ${labelOf(ra)} — same set`
          : `${labelOf(a)} roots at ${labelOf(ra)}, ${labelOf(b)} at ${labelOf(rb)} — different sets`,
      })
    );

    return { steps, finalUf: next };
  },
};
