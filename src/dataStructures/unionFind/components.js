import { cloneUnionFind, componentsOf, frame, labelOf } from "./helpers";

export const components = {
  key: "components",
  label: "Components",
  group: "query",
  fields: [],
  desc: "Groups every element by the root it walks up to. This is the read-out Kruskal's algorithm cares about: while more than one component remains, the spanning tree is not finished, and an edge inside a component is an edge that would close a cycle. Note that the structure never stores these groups — they are recovered by walking every element up to its root.",
  time: "O(n · α(n))",
  space: "O(n)",
  run(uf) {
    const next = cloneUnionFind(uf);
    const groups = componentsOf(next);
    const steps = [];

    groups.forEach((group, index) => {
      steps.push(
        frame(next, {
          root: group.root,
          active: group.members,
          message: `Set ${index + 1} of ${groups.length}: rooted at ${labelOf(group.root)} — {${group.members.map(labelOf).join(", ")}}`,
        })
      );
    });

    steps.push(
      frame(next, {
        roots: groups.map((g) => g.root),
        resultBadge: `${groups.length} SET${groups.length === 1 ? "" : "S"}`,
        message:
          groups.length === 1
            ? `All ${next.n} elements are in one set — a graph in this state is fully connected`
            : `${next.n} elements in ${groups.length} disjoint sets: ${groups.map((g) => `{${g.members.map(labelOf).join(",")}}`).join(" ")}`,
      })
    );

    return { steps, finalUf: uf };
  },
};
