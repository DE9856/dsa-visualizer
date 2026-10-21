import { adjacencyOf, cloneGraph, labelMap } from "./helpers";

export const bipartite = {
  key: "bipartite",
  label: "Bipartite Check",
  group: "connectivity",
  fields: [],
  desc: "Can the vertices be split into two groups so that every edge crosses between them? That is the same as asking whether the graph is 2-colourable, and a breadth-first sweep answers it: colour the start vertex, colour everything adjacent to it the opposite, and carry on. The moment an edge joins two vertices that already share a colour, the answer is no — and that edge closes an odd-length cycle, which is the real characterisation. A graph is bipartite exactly when it contains no odd cycle. Every tree is bipartite; every triangle is not.",
  time: "O(V + E)",
  space: "O(V)",
  run(graph, { directed }) {
    const g = cloneGraph(graph);
    const label = labelMap(g);
    const steps = [];

    if (!g.nodes.length) {
      return { steps: [{ ...g, notFound: true, message: "Add vertices first" }], finalGraph: graph };
    }

    // Two-colourability is a question about connections, not directions.
    const adj = adjacencyOf(g, false);
    const color = {};
    const labels = () => {
      const out = {};
      g.nodes.forEach((n) => (out[n.id] = color[n.id] === undefined ? "" : color[n.id] ? "B" : "A"));
      return out;
    };
    const sideA = () => g.nodes.filter((n) => color[n.id] === 0).map((n) => n.id);
    const sideB = () => g.nodes.filter((n) => color[n.id] === 1).map((n) => n.id);

    steps.push({
      ...g,
      distances: labels(),
      message: directed
        ? "Direction is ignored — two-colourability is about which vertices are joined, not which way."
        : "Colour every vertex A or B so that no edge joins two of the same. If that is impossible, the graph has an odd cycle.",
    });

    for (const root of g.nodes) {
      if (color[root.id] !== undefined) continue;
      color[root.id] = 0;
      const queue = [root.id];

      steps.push({
        ...g,
        distances: labels(),
        visited: sideA(),
        active: sideB(),
        current: root.id,
        message: `Start a new piece at ${root.label} and colour it A.`,
      });

      while (queue.length) {
        const u = queue.shift();
        for (const { to, edge } of adj.get(u) || []) {
          if (to === u) {
            steps.push({
              ...g,
              distances: labels(),
              visited: sideA(),
              active: [u],
              activeEdges: [edge.id],
              notFound: true,
              resultBadge: "NOT BIPARTITE — SELF-LOOP",
              message: `${label[u]} has a self-loop, which is a cycle of length one. An odd cycle, so no 2-colouring exists.`,
            });
            return { steps, finalGraph: g };
          }

          if (color[to] === undefined) {
            color[to] = 1 - color[u];
            queue.push(to);
            steps.push({
              ...g,
              distances: labels(),
              visited: sideA(),
              active: sideB(),
              current: u,
              activeEdges: [edge.id],
              message: `${label[u]} is ${color[u] ? "B" : "A"}, so ${label[to]} across this edge must be ${
                color[to] ? "B" : "A"
              }.`,
            });
          } else if (color[to] === color[u]) {
            steps.push({
              ...g,
              distances: labels(),
              visited: sideA(),
              active: [u, to],
              activeEdges: [edge.id],
              notFound: true,
              resultBadge: "NOT BIPARTITE — ODD CYCLE",
              message: `${label[u]} and ${label[to]} are both ${
                color[u] ? "B" : "A"
              } and there is an edge between them. Tracing the colours back from each to where they met walks a cycle of odd length — and no odd cycle can ever be 2-coloured.`,
            });
            return { steps, finalGraph: g };
          }
        }
      }
    }

    const a = sideA().length;
    const b = sideB().length;
    steps.push({
      ...g,
      distances: labels(),
      visited: sideA(),
      active: sideB(),
      resultBadge: `BIPARTITE — ${a} + ${b}`,
      message: `Bipartite: ${a} vertices on side A, ${b} on side B, and every edge crosses between them. Equivalently, this graph has no cycle of odd length.`,
    });

    return { steps, finalGraph: g };
  },
};
