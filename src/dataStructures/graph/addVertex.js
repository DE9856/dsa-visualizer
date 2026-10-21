import { cloneGraph, nextVertexId, nextVertexLabel } from "./helpers";

export const addVertex = {
  key: "addVertex",
  label: "Add Vertex",
  group: "build",
  fields: ["vertexLabel"],
  desc: "Inserts a new, unconnected vertex into the graph. An adjacency list appends an empty list for it; an adjacency matrix grows by one row and one column.",
  time: "O(1) list \u00b7 O(V\u00b2) matrix resize",
  space: "O(1) list \u00b7 O(V) matrix",
  run(graph, { vertexLabel }) {
    const g = cloneGraph(graph);
    const label = (vertexLabel || "").trim() || nextVertexLabel(g.nodes);

    if (g.nodes.some((n) => n.label === label)) {
      return {
        steps: [{ ...g, notFound: true, message: `Vertex "${label}" already exists` }],
        finalGraph: graph,
      };
    }

    const newNode = { id: nextVertexId(), label };
    const withNode = { nodes: [...g.nodes, newNode], edges: g.edges };
    const steps = [
      { ...withNode, pending: newNode.id, message: `Creating vertex ${label}` },
      { ...withNode, active: [newNode.id], message: `Vertex ${label} added` },
    ];
    return { steps, finalGraph: withNode };
  },
};
