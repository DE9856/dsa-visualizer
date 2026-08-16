import { cloneUnionFind, emptyUnionFind, frame, rootsOf } from "./helpers";

export const reset = {
  key: "reset",
  label: "Reset",
  group: "utility",
  fields: [],
  desc: "Breaks every set apart, leaving each element as its own singleton — the state a union-find starts in, before any unions.",
  time: "O(n)",
  space: "O(1)",
  run(uf) {
    const next = cloneUnionFind(uf);
    const fresh = emptyUnionFind(next.n);

    if (rootsOf(next).length === next.n) {
      return { steps: [frame(next, { message: "Every element is already its own set" })], finalUf: uf };
    }

    return {
      steps: [
        frame(next, { active: Array.from({ length: next.n }, (_, i) => i), message: "Breaking every set apart" }),
        frame(fresh, { message: `Reset — ${fresh.n} singleton sets` }),
      ],
      finalUf: fresh,
    };
  },
};
