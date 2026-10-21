import { adjacencyOf, cloneGraph, labelMap } from "./helpers";

export const kosarajuScc = {
  key: "kosaraju",
  label: "Kosaraju's SCC",
  group: "connectivity",
  fields: [],
  desc: "The same strongly connected components as Tarjan's, found a completely different way: two depth-first passes with the graph reversed in between. The first pass records the order vertices *finish* in. Reverse every edge, then run depth-first search again taking vertices in reverse finishing order — and each tree you get is exactly one component. The reason it works is worth the second pass: reversing the edges leaves the components unchanged (if u reaches v and v reaches u, that is still true with every arrow flipped) but reverses the direction between them, so starting from the last vertex to finish traps the search inside a single component instead of letting it run on into the next one.",
  time: "O(V + E)",
  space: "O(V)",
  run(graph, { directed }) {
    const g = cloneGraph(graph);
    const label = labelMap(g);
    const steps = [];

    if (!g.nodes.length) {
      return { steps: [{ ...g, notFound: true, message: "Add vertices first" }], finalGraph: graph };
    }

    const adj = adjacencyOf(g, directed);
    // The transpose: every arc turned around. On an undirected graph this is
    // the same graph, which is why every connected piece comes back as one
    // component there.
    const rev = new Map(g.nodes.map((n) => [n.id, []]));
    g.edges.forEach((edge) => {
      rev.get(edge.to)?.push({ to: edge.from, edge });
      if (!directed && edge.from !== edge.to) rev.get(edge.from)?.push({ to: edge.to, edge });
    });

    const order = [];
    const seen = new Set();
    const component = {};
    let componentCount = 0;

    const labels = () => {
      const out = {};
      g.nodes.forEach((n) => {
        out[n.id] = component[n.id] !== undefined ? `C${component[n.id]}` : "";
      });
      return out;
    };

    steps.push({
      ...g,
      message: `Pass 1: an ordinary depth-first search, recording the order vertices finish in. Nothing is decided yet — this pass only produces an ordering.`,
    });

    const first = (u) => {
      seen.add(u);
      steps.push({
        ...g,
        visited: [...seen],
        current: u,
        message: `Pass 1: enter ${label[u]}.`,
      });
      for (const { to, edge } of adj.get(u) || []) {
        if (!seen.has(to)) {
          steps.push({
            ...g,
            visited: [...seen],
            current: u,
            active: [to],
            activeEdges: [edge.id],
            message: `Pass 1: follow ${label[u]}→${label[to]}.`,
          });
          first(to);
        }
      }
      order.push(u);
      steps.push({
        ...g,
        visited: [...seen],
        current: u,
        message: `Pass 1: ${label[u]} finishes — every arrow out of it has been followed. It goes on the order stack at position ${order.length}.`,
      });
    };

    g.nodes.forEach((n) => {
      if (!seen.has(n.id)) first(n.id);
    });

    steps.push({
      ...g,
      visited: [...seen],
      message: `Finishing order: ${order.map((id) => label[id]).join(", ")}. Now reverse every edge and go again, taking vertices from the end of that list — the last to finish is first to start.`,
    });

    const assigned = new Set();
    const second = (u, members) => {
      assigned.add(u);
      component[u] = componentCount;
      members.push(u);
      steps.push({
        ...g,
        distances: labels(),
        visited: [...assigned],
        current: u,
        active: members,
        message: `Pass 2 (edges reversed): ${label[u]} joins component ${componentCount}.`,
      });
      for (const { to } of rev.get(u) || []) {
        if (!assigned.has(to)) second(to, members);
      }
    };

    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      if (assigned.has(id)) continue;
      const members = [];
      second(id, members);
      steps.push({
        ...g,
        distances: labels(),
        visited: [...assigned],
        active: members,
        message: `Component ${componentCount} is closed: {${members
          .map((x) => label[x])
          .join(", ")}}. On the reversed graph the search could not get out of it — which is exactly what makes it a component and not merely a reachable set.`,
      });
      componentCount += 1;
    }

    steps.push({
      ...g,
      distances: labels(),
      visited: [...assigned],
      resultBadge: `${componentCount} STRONGLY CONNECTED COMPONENT${componentCount === 1 ? "" : "S"}`,
      message: `${componentCount} component${
        componentCount === 1 ? "" : "s"
      } — the same answer Tarjan's gives, for two passes instead of one. The trade is clarity for work: this one is much easier to convince yourself of.`,
    });

    return { steps, finalGraph: g };
  },
};
