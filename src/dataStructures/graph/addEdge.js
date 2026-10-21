import { cloneGraph, edgeExists, nextEdgeId } from "./helpers";

export const addEdge = {
  key: "addEdge",
  label: "Add Edge",
  group: "build",
  fields: ["fromVertex", "toVertex", "weight"],
  desc: "Connects two vertices with an edge. An adjacency list appends each endpoint to the other's list (only one direction if the graph is directed); an adjacency matrix sets matrix[from][to] (and matrix[to][from] if undirected) to the edge weight. Both endpoints may be the same vertex \u2014 that's a self-loop, which occupies the single diagonal cell matrix[v][v] and makes the vertex its own neighbour.",
  time: "O(1)",
  space: "O(1)",
  run(graph, { fromVertex, toVertex, weight, directed }) {
    const g = cloneGraph(graph);
    const from = g.nodes.find((n) => n.id === fromVertex);
    const to = g.nodes.find((n) => n.id === toVertex);

    if (!from || !to) {
      return { steps: [{ ...g, notFound: true, message: "Choose both endpoints for the new edge" }], finalGraph: graph };
    }

    // A self-loop's two endpoints are one vertex, so highlighting it twice
    // would be the same vertex named twice over.
    const selfLoop = from.id === to.id;
    const ends = selfLoop ? [from.id] : [from.id, to.id];

    if (edgeExists(g.edges, from.id, to.id, directed)) {
      return {
        steps: [
          {
            ...g,
            active: ends,
            notFound: true,
            message: selfLoop
              ? `${from.label} already has a self-loop`
              : `Edge ${from.label}\u2013${to.label} already exists`,
          },
        ],
        finalGraph: graph,
      };
    }

    const w = Number.isFinite(weight) ? weight : 1;
    const newEdge = { id: nextEdgeId(), from: from.id, to: to.id, weight: w };
    const withEdge = { nodes: g.nodes, edges: [...g.edges, newEdge] };

    // A self-loop has nothing to mirror \u2014 it is one cell of the matrix and one
    // entry of one list whether the graph is directed or not.
    const steps = [
      {
        ...g,
        active: ends,
        message: selfLoop ? `Looping ${from.label} back to itself` : `Connecting ${from.label} \u2192 ${to.label}`,
      },
      {
        ...withEdge,
        active: ends,
        activeEdges: [newEdge.id],
        message: selfLoop
          ? `Self-loop on ${from.label} added`
          : `Edge ${from.label}\u2013${to.label} added${directed ? "" : " (both directions)"}`,
      },
    ];
    return { steps, finalGraph: withEdge };
  },
};
