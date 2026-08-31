import { adjacencyOf, cloneGraph, labelMap } from "./helpers";

export const tarjanScc = {
  key: "tarjan",
  label: "Tarjan's SCC",
  group: "connectivity",
  fields: [],
  desc: "A strongly connected component is a set of vertices where every one can reach every other, following the arrows. Tarjan finds all of them in a single depth-first search. Each vertex gets a discovery number when it is first seen, and a 'low-link' — the smallest discovery number reachable from its subtree, including by one back edge. A vertex whose low-link never drops below its own discovery number is the root of a component: nothing beneath it found a way back past it. The vertices of that component are exactly the ones sitting above it on a stack of things not yet assigned, which is what makes one pass enough. Only defined on a directed graph — undirected, every connected piece is trivially strongly connected.",
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
    const disc = {};
    const low = {};
    const onStack = new Set();
    const stack = [];
    const component = {};
    let counter = 0;
    let componentCount = 0;

    /** disc/low above each vertex — the two numbers the whole algorithm turns on. */
    const labels = () => {
      const out = {};
      g.nodes.forEach((n) => {
        if (component[n.id] !== undefined) out[n.id] = `C${component[n.id]}`;
        else if (disc[n.id] !== undefined) out[n.id] = `${disc[n.id]}/${low[n.id]}`;
        else out[n.id] = "";
      });
      return out;
    };

    const assigned = () => Object.keys(component);

    steps.push({
      ...g,
      distances: labels(),
      message: directed
        ? "Each vertex will be labelled discovery/low-link. A vertex whose low-link stays equal to its own discovery number is the root of a component."
        : "This graph is undirected, so every connected piece is strongly connected by definition — the search below just finds those pieces.",
    });

    const visit = (u) => {
      disc[u] = low[u] = counter++;
      stack.push(u);
      onStack.add(u);

      steps.push({
        ...g,
        distances: labels(),
        visited: assigned(),
        current: u,
        active: [...onStack],
        message: `Discover ${label[u]} at time ${disc[u]}. Its low-link starts as its own discovery number and can only fall.`,
      });

      for (const { to, edge } of adj.get(u) || []) {
        if (disc[to] === undefined) {
          visit(to);
          const before = low[u];
          low[u] = Math.min(low[u], low[to]);
          steps.push({
            ...g,
            distances: labels(),
            visited: assigned(),
            current: u,
            active: [to],
            activeEdges: [edge.id],
            message:
              low[u] < before
                ? `Back from ${label[to]}: its subtree reaches as far back as ${low[to]}, so ${label[u]}'s low-link drops to ${low[u]}. Something below found a way around ${label[u]}.`
                : `Back from ${label[to]}: nothing in its subtree reaches past ${label[u]}, so the low-link stays at ${low[u]}.`,
          });
        } else if (onStack.has(to)) {
          const before = low[u];
          low[u] = Math.min(low[u], disc[to]);
          steps.push({
            ...g,
            distances: labels(),
            visited: assigned(),
            current: u,
            active: [to],
            activeEdges: [edge.id],
            message: `${label[u]}→${label[to]} is a back edge to something still on the stack (discovered at ${disc[to]}), so ${label[u]}'s low-link ${
              low[u] < before ? `drops to ${low[u]}` : `stays at ${low[u]}`
            }. Only vertices still on the stack count — one already assigned is in a component we have finished with.`,
          });
        }
      }

      if (low[u] === disc[u]) {
        const members = [];
        let popped;
        do {
          popped = stack.pop();
          onStack.delete(popped);
          component[popped] = componentCount;
          members.push(popped);
        } while (popped !== u);
        componentCount += 1;

        steps.push({
          ...g,
          distances: labels(),
          visited: assigned(),
          active: members,
          message: `${label[u]}'s low-link never dropped below its discovery number ${disc[u]} — nothing beneath it escaped past it, so it is the root of a component: {${members
            .map((id) => label[id])
            .join(", ")}}. Pop them off the stack and assign them.`,
        });
      }
    };

    g.nodes.forEach((n) => {
      if (disc[n.id] === undefined) visit(n.id);
    });

    steps.push({
      ...g,
      distances: labels(),
      visited: assigned(),
      resultBadge: `${componentCount} STRONGLY CONNECTED COMPONENT${componentCount === 1 ? "" : "S"}`,
      message: `${componentCount} component${componentCount === 1 ? "" : "s"}, from one depth-first pass — Kosaraju's finds the same answer with two passes and a reversed graph, which is easier to explain and twice the work.`,
    });

    return { steps, finalGraph: g };
  },
};
