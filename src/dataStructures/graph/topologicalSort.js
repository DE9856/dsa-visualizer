import { cloneGraph } from "./helpers";

export const topologicalSort = {
  key: "topoSort",
  label: "Topological Sort",
  group: "traverse",
  fields: [],
  desc: "Orders the vertices of a directed acyclic graph so that every edge points from an earlier vertex to a later one. Uses Kahn's algorithm: repeatedly remove a vertex with in-degree 0 (no remaining prerequisites), add it to the order, and reduce the in-degree of its neighbors \u2014 if the graph has a cycle, some vertices never reach in-degree 0 and get left out.",
  time: "O(V + E)",
  space: "O(V)",
  run(graph, { directed }) {
    const g = cloneGraph(graph);
    if (!directed) {
      return {
        steps: [{ ...g, notFound: true, message: "Topological sort needs a directed graph \u2014 switch to DIRECTED first" }],
        finalGraph: graph,
      };
    }
    if (g.nodes.length === 0) {
      return { steps: [{ ...g, notFound: true, message: "Add vertices before running Topological Sort" }], finalGraph: graph };
    }

    const steps = [];
    const inDegree = {};
    g.nodes.forEach((n) => (inDegree[n.id] = 0));
    g.edges.forEach((e) => {
      inDegree[e.to] = (inDegree[e.to] || 0) + 1;
    });

    const queue = g.nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    const order = [];
    const visited = new Set();

    steps.push({
      ...g,
      message: `In-degrees: ${g.nodes.map((n) => `${n.label}=${inDegree[n.id]}`).join(", ")}`,
    });

    while (queue.length) {
      const u = queue.shift();
      const uNode = g.nodes.find((n) => n.id === u);
      order.push(u);
      visited.add(u);

      steps.push({
        ...g,
        visited: [...visited],
        current: u,
        resultBadge: `ORDER SO FAR: ${order.map((id) => g.nodes.find((n) => n.id === id).label).join(" \u2192 ")}`,
        message: `${uNode.label} has in-degree 0 \u2014 place it next in the order`,
      });

      g.edges
        .filter((e) => e.from === u)
        .forEach((e) => {
          inDegree[e.to] -= 1;
          const toNode = g.nodes.find((n) => n.id === e.to);
          steps.push({
            ...g,
            visited: [...visited],
            current: u,
            active: [u, e.to],
            activeEdges: [e.id],
            message: `Remove ${uNode.label}\u2192${toNode.label}: ${toNode.label}'s in-degree drops to ${inDegree[e.to]}`,
          });
          if (inDegree[e.to] === 0) queue.push(e.to);
        });
    }

    const orderLabels = order.map((id) => g.nodes.find((n) => n.id === id).label).join(" \u2192 ");
    if (order.length < g.nodes.length) {
      const stuck = g.nodes.filter((n) => !visited.has(n.id)).map((n) => n.label);
      steps.push({
        ...g,
        visited: [...visited],
        notFound: true,
        resultBadge: `CYCLE DETECTED \u2014 STUCK VERTICES: ${stuck.join(", ")}`,
        message: "Graph has a cycle, so a full topological order doesn't exist",
      });
    } else {
      steps.push({
        ...g,
        visited: [...visited],
        resultBadge: `TOPOLOGICAL ORDER: ${orderLabels}`,
        message: "Topological sort complete",
      });
    }

    return { steps, finalGraph: g };
  },
};
