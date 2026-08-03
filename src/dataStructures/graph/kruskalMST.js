import { cloneGraph } from "./helpers";

function makeUnionFind(ids) {
  const parent = Object.fromEntries(ids.map((id) => [id, id]));
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
    return true;
  };
  return { find, union };
}

export const kruskalMST = {
  key: "kruskal",
  label: "Kruskal's MST",
  group: "mst",
  fields: [],
  desc: "Builds a Minimum Spanning Tree by sorting every edge by weight and greedily adding the cheapest one, as long as it doesn't close a cycle. A union-find (disjoint set) structure tracks which vertices are already connected so cycle-forming edges can be skipped in O(\u03b1(V)) time. Only defined for undirected graphs.",
  time: "O(E log E)",
  space: "O(V)",
  run(graph) {
    const g = cloneGraph(graph);
    if (g.nodes.length === 0) {
      return { steps: [{ ...g, notFound: true, message: "Add vertices before running Kruskal's MST" }], finalGraph: graph };
    }

    const steps = [];
    const sortedEdges = [...g.edges].sort((a, b) => a.weight - b.weight);
    const uf = makeUnionFind(g.nodes.map((n) => n.id));
    const treeEdges = [];
    let totalWeight = 0;

    steps.push({
      ...g,
      message: `Sort all ${sortedEdges.length} edges by weight: ${sortedEdges.map((e) => e.weight).join(", ")}`,
    });

    sortedEdges.forEach((edge) => {
      const fromNode = g.nodes.find((n) => n.id === edge.from);
      const toNode = g.nodes.find((n) => n.id === edge.to);
      const wouldCycle = uf.find(edge.from) === uf.find(edge.to);

      if (wouldCycle) {
        steps.push({
          ...g,
          active: [edge.from, edge.to],
          activeEdges: [edge.id],
          treeEdges: [...treeEdges],
          message: `${fromNode.label}\u2013${toNode.label} (weight ${edge.weight}) would form a cycle \u2014 skip it`,
        });
      } else {
        uf.union(edge.from, edge.to);
        treeEdges.push(edge.id);
        totalWeight += edge.weight;
        steps.push({
          ...g,
          active: [edge.from, edge.to],
          activeEdges: [edge.id],
          treeEdges: [...treeEdges],
          message: `${fromNode.label}\u2013${toNode.label} (weight ${edge.weight}) connects two separate trees \u2014 add it`,
        });
      }
    });

    const roots = new Set(g.nodes.map((n) => uf.find(n.id)));
    const connected = roots.size === 1;
    steps.push({
      ...g,
      treeEdges: [...treeEdges],
      resultBadge: connected
        ? `MST COMPLETE \u2014 TOTAL WEIGHT ${totalWeight}`
        : `GRAPH DISCONNECTED \u2014 SPANNING FOREST WEIGHT ${totalWeight} (${roots.size} COMPONENTS)`,
      message: "Kruskal's algorithm complete",
    });

    return { steps, finalGraph: g };
  },
};
