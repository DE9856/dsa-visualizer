import { adjacencyOf, cloneGraph, labelMap } from "./helpers";

export const cycleDetect = {
  key: "cycle",
  label: "Cycle Detection",
  group: "connectivity",
  fields: [],
  desc: "Does the graph contain a cycle? The answer depends on whether the arrows matter, and so does the algorithm. On a directed graph, depth-first search marks each vertex grey while it is on the current recursion stack and black once finished; an edge into a grey vertex is a back edge, and a back edge is a cycle — exactly the condition topological sorting fails on. An edge into a black vertex is not: that subtree is already finished and cannot lead back here. On an undirected graph any edge to an already-visited vertex closes a cycle, except the one you arrived on, which has to be excluded or every single edge would look like a two-step loop. Switch the DIRECTED toggle and this runs the other version.",
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
    // undefined = white (unseen), 1 = grey (on the current path), 2 = black (finished)
    const state = {};
    const labels = () => {
      const out = {};
      g.nodes.forEach((n) => (out[n.id] = state[n.id] === 1 ? "•" : state[n.id] === 2 ? "✓" : ""));
      return out;
    };
    const grey = () => g.nodes.filter((n) => state[n.id] === 1).map((n) => n.id);
    const black = () => g.nodes.filter((n) => state[n.id] === 2).map((n) => n.id);

    steps.push({
      ...g,
      distances: labels(),
      message: directed
        ? "Directed: a vertex is grey (•) while it is on the current path and black (✓) once finished. An edge into a grey vertex is a back edge — a cycle."
        : "Undirected: any edge to an already-visited vertex closes a cycle, except the one edge we arrived on.",
    });

    let found = null;

    const visit = (u, parentEdge) => {
      if (found) return;
      state[u] = 1;
      steps.push({
        ...g,
        distances: labels(),
        visited: black(),
        active: grey(),
        current: u,
        message: `Enter ${label[u]} — it is now on the current path.`,
      });

      for (const { to, edge } of adj.get(u) || []) {
        if (found) return;

        if (to === u) {
          found = { edge, a: u, b: u, why: `${label[u]} has a self-loop, which is a cycle all on its own.` };
          return;
        }
        // The edge we came down is not a cycle back to our parent.
        if (!directed && edge === parentEdge) continue;

        if (state[to] === undefined) {
          steps.push({
            ...g,
            distances: labels(),
            visited: black(),
            active: grey(),
            current: u,
            activeEdges: [edge.id],
            message: `Follow ${label[u]}${directed ? "→" : "–"}${label[to]}.`,
          });
          visit(to, edge);
        } else if (!directed || state[to] === 1) {
          found = {
            edge,
            a: u,
            b: to,
            why: directed
              ? `${label[to]} is grey — still on the path we are standing on — so ${label[u]}→${label[to]} closes a loop back into it.`
              : `${label[to]} has already been visited and this is not the edge we arrived on, so ${label[u]}–${label[to]} closes a cycle.`,
          };
          return;
        } else {
          steps.push({
            ...g,
            distances: labels(),
            visited: black(),
            active: grey(),
            current: u,
            activeEdges: [edge.id],
            message: `${label[u]}→${label[to]} points at a black vertex — already finished, so it cannot lead back here. A cross edge, not a cycle.`,
          });
        }
      }

      state[u] = 2;
      steps.push({
        ...g,
        distances: labels(),
        visited: black(),
        active: grey(),
        current: u,
        message: `${label[u]} is finished — every edge out of it has been followed, and none led back onto the path.`,
      });
    };

    for (const n of g.nodes) {
      if (found) break;
      if (state[n.id] === undefined) visit(n.id, null);
    }

    if (found) {
      steps.push({
        ...g,
        distances: labels(),
        visited: black(),
        active: [found.a, found.b],
        activeEdges: [found.edge.id],
        notFound: true,
        resultBadge: directed ? "CYCLE FOUND — NOT A DAG" : "CYCLE FOUND",
        message: `${found.why}${
          directed
            ? " A directed graph with a back edge is not acyclic, so it has no topological order."
            : " An undirected graph with a cycle is not a forest."
        }`,
      });
      return { steps, finalGraph: g };
    }

    steps.push({
      ...g,
      distances: labels(),
      visited: black(),
      resultBadge: directed ? "NO CYCLE — THIS IS A DAG" : "NO CYCLE — THIS IS A FOREST",
      message: directed
        ? `No back edge anywhere, so the graph is acyclic — a DAG, and topological sort will succeed on it.`
        : `No cycle, so every connected piece is a tree and the whole graph is a forest: ${g.edges.length} edges across ${g.nodes.length} vertices, and a forest can never have more than ${g.nodes.length - 1}.`,
    });

    return { steps, finalGraph: g };
  },
};
