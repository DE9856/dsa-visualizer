import { cloneGraph, neighborsOf } from "./helpers";

export const dfs = {
  key: "dfs",
  label: "DFS",
  group: "traverse",
  fields: ["vertex"],
  desc: "Depth-First Search dives as deep as possible along one branch, using a stack (or recursion) to remember where to backtrack to, before exploring the next unvisited branch. It's the natural fit for cycle detection and topological ordering.",
  time: "O(V + E)",
  space: "O(V)",
  run(graph, { vertex, directed }) {
    const g = cloneGraph(graph);
    const start = g.nodes.find((n) => n.id === vertex);
    if (!start) {
      return { steps: [{ ...g, notFound: true, message: "Pick a start vertex for DFS" }], finalGraph: graph };
    }

    const steps = [];
    const visited = new Set();
    const order = [];

    const visit = (nodeId, fromId) => {
      visited.add(nodeId);
      order.push(nodeId);
      const node = g.nodes.find((n) => n.id === nodeId);
      const linkEdge = fromId
        ? g.edges.find((e) => (e.from === fromId && e.to === nodeId) || (!directed && e.from === nodeId && e.to === fromId))
        : null;

      steps.push({
        ...g,
        visited: [...visited],
        current: nodeId,
        active: fromId ? [fromId, nodeId] : [nodeId],
        activeEdges: linkEdge ? [linkEdge.id] : [],
        message: fromId ? `Descend into ${node.label}` : `Start DFS at ${node.label}`,
      });

      const nbIds = neighborsOf(g.nodes, g.edges, nodeId, directed);
      for (const nb of nbIds) {
        if (!visited.has(nb)) visit(nb, nodeId);
      }
    };

    visit(start.id, null);

    const orderLabels = order.map((id) => g.nodes.find((n) => n.id === id).label).join(" \u2192 ");
    steps.push({ ...g, visited: [...visited], resultBadge: `DFS ORDER: ${orderLabels}`, message: "DFS traversal complete" });
    return { steps, finalGraph: g };
  },
};
