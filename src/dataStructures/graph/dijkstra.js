import { cloneGraph } from "./helpers";

// Edges leaving `vertexId` (both directions counted for undirected graphs),
// each paired with the neighbor id and the edge used to reach it.
function outgoingEdges(edges, vertexId, directed) {
  const result = [];
  edges.forEach((e) => {
    if (e.from === vertexId) result.push({ neighbor: e.to, edge: e });
    if (!directed && e.to === vertexId) result.push({ neighbor: e.from, edge: e });
  });
  return result;
}

export const dijkstra = {
  key: "dijkstra",
  label: "Dijkstra",
  group: "shortestPath",
  fields: ["vertex"],
  desc: "Finds the shortest distance from a start vertex to every other vertex when edge weights are non-negative. It repeatedly picks the unvisited vertex with the smallest known distance, locks it in, then relaxes its edges \u2014 updating a neighbor's distance whenever going through the current vertex is cheaper than what's currently recorded.",
  time: "O(V\u00b2) (array-based); O((V+E) log V) with a heap",
  space: "O(V)",
  run(graph, { vertex, directed }) {
    const g = cloneGraph(graph);
    const start = g.nodes.find((n) => n.id === vertex);
    if (!start) {
      return { steps: [{ ...g, notFound: true, message: "Pick a start vertex for Dijkstra" }], finalGraph: graph };
    }

    const steps = [];
    const dist = {};
    const prevEdge = {};
    const visited = new Set();
    g.nodes.forEach((n) => (dist[n.id] = n.id === start.id ? 0 : Infinity));

    steps.push({
      ...g,
      distances: { ...dist },
      current: start.id,
      message: `Start at ${start.label} with distance 0, every other vertex begins at \u221e`,
    });

    while (visited.size < g.nodes.length) {
      let u = null;
      let best = Infinity;
      g.nodes.forEach((n) => {
        if (!visited.has(n.id) && dist[n.id] < best) {
          best = dist[n.id];
          u = n.id;
        }
      });
      if (u === null) break; // remaining vertices are unreachable

      visited.add(u);
      const uNode = g.nodes.find((n) => n.id === u);
      steps.push({
        ...g,
        distances: { ...dist },
        visited: [...visited],
        current: u,
        treeEdges: Object.values(prevEdge).map((e) => e.id),
        message: `Lock in ${uNode.label} \u2014 its shortest distance (${dist[u]}) is final`,
      });

      const edges = outgoingEdges(g.edges, u, directed);
      edges.forEach(({ neighbor, edge }) => {
        if (visited.has(neighbor)) return;
        const nNode = g.nodes.find((n) => n.id === neighbor);
        const through = dist[u] + edge.weight;
        if (through < dist[neighbor]) {
          dist[neighbor] = through;
          prevEdge[neighbor] = edge;
          steps.push({
            ...g,
            distances: { ...dist },
            visited: [...visited],
            current: u,
            active: [u, neighbor],
            activeEdges: [edge.id],
            treeEdges: Object.values(prevEdge).map((e) => e.id),
            message: `Relax ${uNode.label}\u2192${nNode.label}: ${dist[u]} + ${edge.weight} = ${through}, better than before`,
          });
        } else {
          steps.push({
            ...g,
            distances: { ...dist },
            visited: [...visited],
            current: u,
            active: [u, neighbor],
            activeEdges: [edge.id],
            treeEdges: Object.values(prevEdge).map((e) => e.id),
            message: `${uNode.label}\u2192${nNode.label}: ${dist[u]} + ${edge.weight} = ${through}, no improvement over ${dist[neighbor]}`,
          });
        }
      });
    }

    const summary = g.nodes
      .map((n) => `${n.label}:${dist[n.id] === Infinity ? "\u221e" : dist[n.id]}`)
      .join("  ");
    steps.push({
      ...g,
      distances: { ...dist },
      visited: [...visited],
      treeEdges: Object.values(prevEdge).map((e) => e.id),
      resultBadge: `SHORTEST DISTANCES FROM ${start.label}: ${summary}`,
      message: "Dijkstra complete",
    });

    return { steps, finalGraph: g };
  },
};
