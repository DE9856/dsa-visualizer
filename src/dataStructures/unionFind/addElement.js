import { cloneUnionFind, frame, labelOf, MAX_ELEMENTS } from "./helpers";

export const addElement = {
  key: "add",
  label: "Add Element",
  group: "utility",
  fields: [],
  desc: "Adds a new element as a set of one — parent pointing at itself, size 1. This is the make-set operation, and it is the cheapest thing the structure does: no rebalancing, no rehashing, just one more slot in each array.",
  time: "O(1)",
  space: "O(1)",
  run(uf) {
    const next = cloneUnionFind(uf);

    if (next.n >= MAX_ELEMENTS) {
      return {
        steps: [
          frame(next, {
            notFound: true,
            overflow: true,
            message: `This visualizer stops at ${MAX_ELEMENTS} elements so the forest stays readable`,
          }),
        ],
        finalUf: uf,
      };
    }

    const index = next.n;
    next.n += 1;
    next.parent.push(index);
    next.size.push(1);

    return {
      steps: [
        frame(next, {
          current: index,
          root: index,
          resultBadge: `ADDED ${labelOf(index)}`,
          message: `${labelOf(index)} starts as a set of one, its own parent`,
        }),
      ],
      finalUf: next,
    };
  },
};
