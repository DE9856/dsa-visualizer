import { adjacencyOf, cloneGraph, labelMap } from "./helpers";

export const bridges = {
  key: "bridges",
  label: "Bridges & Articulation Points",
  group: "connectivity",
  fields: [],
  desc: "A bridge is an edge whose removal disconnects the graph; an articulation point is a vertex whose removal does. Both are the single points of failure in a network, and one depth-first search finds all of them. Give each vertex a discovery time and a low-link — the earliest discovery time reachable from its subtree using tree edges and at most one back edge — and the answers fall out of comparing the two. If a child's low-link is strictly greater than this vertex's discovery time, nothing beneath that child can get back here except through the edge you just came down, so that edge is a bridge. If it is merely greater than or equal, the subtree cannot get past *this vertex*, which makes the vertex itself an articulation point. Defined on undirected graphs.",
  time: "O(V + E)",
  space: "O(V)",
  run(graph) {
    const g = cloneGraph(graph);
    const label = labelMap(g);
    const steps = [];

    if (!g.nodes.length) {
      return { steps: [{ ...g, notFound: true, message: "Add vertices first" }], finalGraph: graph };
    }

    // Always undirected: "removing this disconnects the graph" is a question
    // about connectivity, not about which way the arrows point.
    const adj = adjacencyOf(g, false);
    const disc = {};
    const low = {};
    const foundBridges = [];
    const articulation = new Set();
    let counter = 0;

    const labels = () => {
      const out = {};
      g.nodes.forEach((n) => {
        out[n.id] = disc[n.id] === undefined ? "" : `${disc[n.id]}/${low[n.id]}`;
      });
      return out;
    };
    const seen = () => Object.keys(disc);

    steps.push({
      ...g,
      distances: labels(),
      message: `Each vertex gets discovery/low-link. A child that cannot reach back past its parent marks a bridge; one that cannot reach past the parent itself marks an articulation point.`,
    });

    const visit = (u, parentEdge) => {
      disc[u] = low[u] = counter++;
      let children = 0;

      steps.push({
        ...g,
        distances: labels(),
        visited: seen(),
        current: u,
        treeEdges: foundBridges,
        active: [...articulation],
        message: `Discover ${label[u]} at ${disc[u]}.`,
      });

      for (const { to, edge } of adj.get(u) || []) {
        if (edge === parentEdge) continue; // don't walk straight back up the edge we came down
        if (disc[to] === undefined) {
          children += 1;
          visit(to, edge);
          low[u] = Math.min(low[u], low[to]);

          if (low[to] > disc[u]) {
            foundBridges.push(edge.id);
            steps.push({
              ...g,
              distances: labels(),
              visited: seen(),
              current: u,
              active: [u, to],
              activeEdges: [edge.id],
              treeEdges: foundBridges,
              message: `low(${label[to]}) = ${low[to]} is greater than disc(${label[u]}) = ${
                disc[u]
              } — nothing under ${label[to]} has any way back except this edge. ${label[u]}–${
                label[to]
              } is a bridge.`,
            });
          } else {
            steps.push({
              ...g,
              distances: labels(),
              visited: seen(),
              current: u,
              active: [to],
              activeEdges: [edge.id],
              treeEdges: foundBridges,
              message: `low(${label[to]}) = ${low[to]} reaches back to ${disc[u]} or earlier, so there is another way round — ${label[u]}–${label[to]} is not a bridge.`,
            });
          }

          // The root is special: it is a cut vertex only if the search had to
          // start over from it more than once, which means its children were
          // not connected to each other except through it.
          const isRoot = !parentEdge;
          if (!isRoot && low[to] >= disc[u] && !articulation.has(u)) {
            articulation.add(u);
            steps.push({
              ...g,
              distances: labels(),
              visited: seen(),
              current: u,
              active: [...articulation],
              treeEdges: foundBridges,
              message: `low(${label[to]}) = ${low[to]} is not less than disc(${label[u]}) = ${
                disc[u]
              } — ${label[to]}'s subtree cannot get past ${label[u]} at all. Remove ${label[u]} and it falls off: an articulation point.`,
            });
          }
          if (isRoot && children === 2 && !articulation.has(u)) {
            articulation.add(u);
            steps.push({
              ...g,
              distances: labels(),
              visited: seen(),
              current: u,
              active: [...articulation],
              treeEdges: foundBridges,
              message: `${label[u]} is the root of this search and has a second independent child — the only route between them runs through it, so it is an articulation point too.`,
            });
          }
        } else {
          const before = low[u];
          low[u] = Math.min(low[u], disc[to]);
          if (low[u] !== before) {
            steps.push({
              ...g,
              distances: labels(),
              visited: seen(),
              current: u,
              active: [to],
              activeEdges: [edge.id],
              treeEdges: foundBridges,
              message: `${label[u]}–${label[to]} is a back edge to something discovered at ${disc[to]}, so ${label[u]}'s low-link drops to ${low[u]} — there is a way round.`,
            });
          }
        }
      }
    };

    g.nodes.forEach((n) => {
      if (disc[n.id] === undefined) visit(n.id, null);
    });

    const bridgeCount = foundBridges.length;
    const cutCount = articulation.size;
    steps.push({
      ...g,
      distances: labels(),
      visited: seen(),
      treeEdges: foundBridges,
      active: [...articulation],
      resultBadge: `${bridgeCount} BRIDGE${bridgeCount === 1 ? "" : "S"} · ${cutCount} ARTICULATION POINT${
        cutCount === 1 ? "" : "S"
      }`,
      message:
        bridgeCount || cutCount
          ? `${bridgeCount} bridge${bridgeCount === 1 ? "" : "s"} and ${cutCount} articulation point${
              cutCount === 1 ? "" : "s"
            }. Every one of them is a single point of failure: cut it and the graph falls into pieces.`
          : `No bridges and no articulation points — every vertex and edge has a way round it, so this graph survives any single removal.`,
    });

    return { steps, finalGraph: g };
  },
};
