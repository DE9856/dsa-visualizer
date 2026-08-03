import { cloneGraph } from "./helpers";

export const removeEdge = {
  key: "removeEdge",
  label: "Remove Edge",
  group: "build",
  fields: ["fromVertex", "toVertex"],
  desc: "Disconnects two vertices. An adjacency list removes each endpoint from the other's list; an adjacency matrix resets matrix[from][to] (and matrix[to][from] if undirected) back to 0.",
  time: "O(E) list \u00b7 O(1) matrix",
  space: "O(1)",
  run(graph, { fromVertex, toVertex, directed }) {
    const g = cloneGraph(graph);
    const from = g.nodes.find((n) => n.id === fromVertex);
    const to = g.nodes.find((n) => n.id === toVertex);

    if (!from || !to) {
      return { steps: [{ ...g, notFound: true, message: "Choose both endpoints of the edge to remove" }], finalGraph: graph };
    }

    const match = g.edges.find(
      (e) => (e.from === from.id && e.to === to.id) || (!directed && e.from === to.id && e.to === from.id)
    );

    if (!match) {
      return {
        steps: [{ ...g, active: [from.id, to.id], notFound: true, message: `No edge exists between ${from.label} and ${to.label}` }],
        finalGraph: graph,
      };
    }

    const step1 = { ...g, active: [from.id, to.id], activeEdges: [match.id], message: `Removing edge ${from.label}\u2013${to.label}` };
    const final = { nodes: g.nodes, edges: g.edges.filter((e) => e.id !== match.id) };
    const step2 = { ...final, active: [from.id, to.id], message: `Edge ${from.label}\u2013${to.label} removed` };

    return { steps: [step1, step2], finalGraph: final };
  },
};
