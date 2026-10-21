export const clearGraph = {
  key: "clear",
  label: "Clear Graph",
  group: "utility",
  fields: [],
  desc: "Removes every vertex and edge, resetting the graph to empty.",
  time: "O(1)",
  space: "O(1)",
  run() {
    const empty = { nodes: [], edges: [] };
    return { steps: [{ ...empty, message: "Graph cleared" }], finalGraph: empty };
  },
};
