import { cloneGraph } from "./helpers";

export const removeVertex = {
  key: "removeVertex",
  label: "Remove Vertex",
  group: "build",
  fields: ["vertex"],
  desc: "Deletes a vertex and every edge incident to it. An adjacency list splices out the vertex's own list and scrubs references to it from every other list; an adjacency matrix removes the corresponding row and column.",
  time: "O(V + E)",
  space: "O(1)",
  run(graph, { vertex }) {
    const g = cloneGraph(graph);
    const target = g.nodes.find((n) => n.id === vertex);
    if (!target) {
      return { steps: [{ ...g, notFound: true, message: "Pick a vertex to remove" }], finalGraph: graph };
    }

    const incident = g.edges.filter((e) => e.from === target.id || e.to === target.id).map((e) => e.id);
    const step1 = {
      ...g,
      removing: target.id,
      activeEdges: incident,
      message: `Removing vertex ${target.label} and its ${incident.length} incident edge(s)`,
    };

    const remainingEdges = g.edges.filter((e) => e.from !== target.id && e.to !== target.id);
    const remainingNodes = g.nodes.filter((n) => n.id !== target.id);
    const final = { nodes: remainingNodes, edges: remainingEdges };
    const step2 = { ...final, message: `Vertex ${target.label} removed` };

    return { steps: [step1, step2], finalGraph: final };
  },
};
