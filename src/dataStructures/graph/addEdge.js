import { cloneGraph, edgeExists, nextEdgeId } from "./helpers";

export const addEdge = {
  key: "addEdge",
  label: "Add Edge",
  group: "build",
  fields: ["fromVertex", "toVertex", "weight"],
  desc: "Connects two vertices with an edge. An adjacency list appends each endpoint to the other's list (only one direction if the graph is directed); an adjacency matrix sets matrix[from][to] (and matrix[to][from] if undirected) to the edge weight.",
  time: "O(1)",
  space: "O(1)",
  run(graph, { fromVertex, toVertex, weight, directed }) {
    const g = cloneGraph(graph);
    const from = g.nodes.find((n) => n.id === fromVertex);
    const to = g.nodes.find((n) => n.id === toVertex);

    if (!from || !to) {
      return { steps: [{ ...g, notFound: true, message: "Choose both endpoints for the new edge" }], finalGraph: graph };
    }
    if (from.id === to.id) {
      return {
        steps: [{ ...g, active: [from.id], notFound: true, message: "Self-loops aren't supported \u2014 pick two different vertices" }],
        finalGraph: graph,
      };
    }
    if (edgeExists(g.edges, from.id, to.id, directed)) {
      return {
        steps: [{ ...g, active: [from.id, to.id], notFound: true, message: `Edge ${from.label}\u2013${to.label} already exists` }],
        finalGraph: graph,
      };
    }

    const w = Number.isFinite(weight) ? weight : 1;
    const newEdge = { id: nextEdgeId(), from: from.id, to: to.id, weight: w };
    const withEdge = { nodes: g.nodes, edges: [...g.edges, newEdge] };

    const steps = [
      { ...g, active: [from.id, to.id], message: `Connecting ${from.label} \u2192 ${to.label}` },
      {
        ...withEdge,
        active: [from.id, to.id],
        activeEdges: [newEdge.id],
        message: `Edge ${from.label}\u2013${to.label} added${directed ? "" : " (both directions)"}`,
      },
    ];
    return { steps, finalGraph: withEdge };
  },
};
