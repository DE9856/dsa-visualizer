import { cloneGraph } from "./helpers";

function outgoingEdges(edges, vertexId) {
  const result = [];
  edges.forEach((e) => {
    if (e.from === vertexId) result.push({ neighbor: e.to, edge: e });
    if (e.to === vertexId) result.push({ neighbor: e.from, edge: e });
  });
  return result;
}

export const primMST = {
  key: "prim",
  label: "Prim's MST",
  group: "mst",
  fields: ["vertex"],
  desc: "Grows a Minimum Spanning Tree one vertex at a time. Starting from a chosen vertex, it always adds the cheapest edge that connects a vertex already in the tree to one that isn't \u2014 like a tree reaching outward and always taking the shortest available step. Only defined for undirected graphs.",
  time: "O(V\u00b2) (array-based); O(E log V) with a heap",
  space: "O(V)",
  run(graph, { vertex }) {
    const g = cloneGraph(graph);
    const start = g.nodes.find((n) => n.id === vertex);
    if (!start) {
      return { steps: [{ ...g, notFound: true, message: "Pick a start vertex for Prim's MST" }], finalGraph: graph };
    }

    const steps = [];
    const key = {};
    const edgeTo = {};
    const inTree = new Set();
    g.nodes.forEach((n) => (key[n.id] = n.id === start.id ? 0 : Infinity));

    let totalWeight = 0;

    steps.push({
      ...g,
      distances: { ...key },
      current: start.id,
      message: `Start the tree at ${start.label}`,
    });

    while (inTree.size < g.nodes.length) {
      let u = null;
      let best = Infinity;
      g.nodes.forEach((n) => {
        if (!inTree.has(n.id) && key[n.id] < best) {
          best = key[n.id];
          u = n.id;
        }
      });
      if (u === null) break; // remaining vertices are unreachable \u2014 graph is disconnected

      inTree.add(u);
      if (edgeTo[u]) totalWeight += edgeTo[u].weight;
      const uNode = g.nodes.find((n) => n.id === u);
      steps.push({
        ...g,
        distances: { ...key },
        visited: [...inTree],
        current: u,
        treeEdges: Object.values(edgeTo).map((e) => e.id),
        message: edgeTo[u]
          ? `Add ${uNode.label} to the tree via its cheapest connecting edge (weight ${edgeTo[u].weight})`
          : `Add ${uNode.label} to the tree (start vertex)`,
      });

      const edges = outgoingEdges(g.edges, u);
      edges.forEach(({ neighbor, edge }) => {
        if (inTree.has(neighbor)) return;
        const nNode = g.nodes.find((n) => n.id === neighbor);
        if (edge.weight < key[neighbor]) {
          key[neighbor] = edge.weight;
          edgeTo[neighbor] = edge;
          steps.push({
            ...g,
            distances: { ...key },
            visited: [...inTree],
            current: u,
            active: [u, neighbor],
            activeEdges: [edge.id],
            treeEdges: Object.values(edgeTo).map((e) => e.id),
            message: `${uNode.label}\u2013${nNode.label} (weight ${edge.weight}) is now the cheapest way to reach ${nNode.label}`,
          });
        } else {
          steps.push({
            ...g,
            distances: { ...key },
            visited: [...inTree],
            current: u,
            active: [u, neighbor],
            activeEdges: [edge.id],
            treeEdges: Object.values(edgeTo).map((e) => e.id),
            message: `${uNode.label}\u2013${nNode.label} (weight ${edge.weight}) is not cheaper than the current best (${key[neighbor]}) for ${nNode.label}`,
          });
        }
      });
    }

    const reached = inTree.size;
    const finalTreeEdges = Object.values(edgeTo).map((e) => e.id);
    steps.push({
      ...g,
      visited: [...inTree],
      treeEdges: finalTreeEdges,
      resultBadge:
        reached === g.nodes.length
          ? `MST COMPLETE \u2014 TOTAL WEIGHT ${totalWeight}`
          : `GRAPH DISCONNECTED \u2014 SPANNING FOREST WEIGHT ${totalWeight} (${reached}/${g.nodes.length} VERTICES REACHED)`,
      message: "Prim's algorithm complete",
    });

    return { steps, finalGraph: g };
  },
};
