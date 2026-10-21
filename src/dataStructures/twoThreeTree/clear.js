export const clearTree = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Removes every node, resetting the tree back to empty.",
  time: "O(1)",
  space: "O(1)",
  run() {
    const empty = { root: null };
    return { steps: [{ root: null, message: "Tree cleared" }], finalTree: empty };
  },
};
