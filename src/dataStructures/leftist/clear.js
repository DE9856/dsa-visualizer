import { frame } from "./helpers";

export const clearTree = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Drops the root, and with it the whole tree. Nothing is walked and nothing is freed one node at a time — there is exactly one reference into the structure, which is as true of a leftist tree as of any other linked structure.",
  time: "O(1)",
  space: "O(1)",

  run(tree) {
    if (!tree.root) {
      return { steps: [frame(tree, { message: "Already empty." })], finalTree: tree };
    }
    const next = { ...tree, root: null };
    return {
      steps: [frame(next, { message: "Cleared — one pointer set to null.", resultBadge: "EMPTY" })],
      finalTree: next,
    };
  },
};
