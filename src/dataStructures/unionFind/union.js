import { cloneUnionFind, findWithSteps, frame, labelOf, linkRoots } from "./helpers";

export const union = {
  key: "union",
  label: "Union",
  group: "core",
  fields: ["a", "b"],
  desc: "Merges two sets by finding both roots and pointing one at the other. Which one moves is not arbitrary: union by size always hangs the smaller tree under the larger, because the elements that gain depth are the ones in the tree that moved, and there are fewer of those. Hanging a big tree under a small one would deepen everything. Together with path compression this keeps every tree nearly flat no matter what order the unions arrive in.",
  time: "O(α(n)) amortized",
  space: "O(1)",
  run(uf, { a, b }) {
    const next = cloneUnionFind(uf);

    if (a < 0 || b < 0) {
      return { steps: [frame(next, { message: "Pick two elements to union" })], finalUf: uf };
    }
    if (a === b) {
      return {
        steps: [frame(next, { current: a, message: `${labelOf(a)} and ${labelOf(b)} are the same element` })],
        finalUf: uf,
      };
    }

    const steps = [];

    steps.push(frame(next, { path: [a, b], message: `Union ${labelOf(a)} and ${labelOf(b)} — find both roots first` }));

    const ra = findWithSteps(next, a, steps, { pair: [a, b] });
    const rb = findWithSteps(next, b, steps, { pair: [a, b], otherRoot: ra });

    if (ra === rb) {
      steps.push(
        frame(next, {
          root: ra,
          pair: [a, b],
          resultBadge: "ALREADY CONNECTED",
          message: `Both walk up to ${labelOf(ra)} — they are already in the same set, so there is nothing to merge. This is exactly the cycle check Kruskal's algorithm runs on every edge.`,
        })
      );
      return { steps, finalUf: next };
    }

    const sizeA = next.size[ra];
    const sizeB = next.size[rb];

    steps.push(
      frame(next, {
        pair: [a, b],
        roots: [ra, rb],
        message: `Two different roots: ${labelOf(ra)} holds ${sizeA} element${sizeA === 1 ? "" : "s"}, ${labelOf(rb)} holds ${sizeB}`,
      })
    );

    const winner = linkRoots(next, ra, rb);
    const loser = winner === ra ? rb : ra;

    steps.push(
      frame(next, {
        root: winner,
        linked: loser,
        pair: [a, b],
        message: `Point ${labelOf(loser)} at ${labelOf(winner)} — the smaller tree moves, so only ${Math.min(sizeA, sizeB)} element${Math.min(sizeA, sizeB) === 1 ? "" : "s"} get${Math.min(sizeA, sizeB) === 1 ? "s" : ""} deeper`,
      })
    );

    steps.push(
      frame(next, {
        root: winner,
        resultBadge: `MERGED — SET OF ${next.size[winner]}`,
        message: `${labelOf(a)} and ${labelOf(b)} are now in the same set, rooted at ${labelOf(winner)} with ${next.size[winner]} elements`,
      })
    );

    return { steps, finalUf: next };
  },
};
