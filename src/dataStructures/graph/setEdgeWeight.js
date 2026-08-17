import { cloneGraph, nextEdgeId } from "./helpers";

/**
 * Writes one cell of the adjacency matrix back into the graph.
 *
 * The matrix is the graph, so editing a cell has to be able to do all three
 * things a cell can express: 0 means no edge, a number where there was a 0
 * means a new one, and a different number on an existing edge means a new
 * weight. Splitting those across addEdge/removeEdge at the call site would
 * leave the caller deciding which operation a typed number amounts to, which
 * is exactly the thing the matrix already answers.
 *
 * Not in GRAPH_OPERATIONS: this is the canvas/matrix editing path, not an
 * entry the sidebar's operation list needs — the same reasoning as
 * duplicateVertex.
 */
export const setEdgeWeight = {
  key: "setEdgeWeight",
  label: "Set Edge Weight",
  desc: "Sets matrix[from][to] — adding, reweighting or removing the edge to match.",
  time: "O(E)",
  space: "O(1)",
  run(graph, { fromVertex, toVertex, weight, directed }) {
    const g = cloneGraph(graph);
    const from = g.nodes.find((n) => n.id === fromVertex);
    const to = g.nodes.find((n) => n.id === toVertex);

    if (!from || !to || from.id === to.id) {
      return { steps: [{ ...g, notFound: true, message: "That cell isn't an edge" }], finalGraph: graph };
    }

    // An undirected edge occupies both cells, so either one finds it.
    const existing = g.edges.find(
      (e) =>
        (e.from === from.id && e.to === to.id) || (!directed && e.from === to.id && e.to === from.id)
    );
    const both = directed ? "" : " (both directions)";

    // 0 is the matrix's way of saying "not connected".
    if (weight === 0) {
      if (!existing) {
        return {
          steps: [{ ...g, active: [from.id, to.id], message: `${from.label} and ${to.label} were already unconnected` }],
          finalGraph: graph,
        };
      }
      const final = { nodes: g.nodes, edges: g.edges.filter((e) => e.id !== existing.id) };
      const steps = [
        { ...g, active: [from.id, to.id], activeEdges: [existing.id], message: `Clearing ${from.label}–${to.label}` },
        { ...final, active: [from.id, to.id], message: `Edge ${from.label}–${to.label} removed${both}` },
      ];
      return { steps, finalGraph: final };
    }

    if (existing) {
      if (existing.weight === weight) {
        return {
          steps: [{ ...g, active: [from.id, to.id], activeEdges: [existing.id], message: `${from.label}–${to.label} is already ${weight}` }],
          finalGraph: graph,
        };
      }
      const final = {
        nodes: g.nodes,
        edges: g.edges.map((e) => (e.id === existing.id ? { ...e, weight } : e)),
      };
      const steps = [
        { ...g, active: [from.id, to.id], activeEdges: [existing.id], message: `${from.label}–${to.label} was ${existing.weight}` },
        { ...final, active: [from.id, to.id], activeEdges: [existing.id], message: `${from.label}–${to.label} is now ${weight}` },
      ];
      return { steps, finalGraph: final };
    }

    const created = { id: nextEdgeId(), from: from.id, to: to.id, weight };
    const final = { nodes: g.nodes, edges: [...g.edges, created] };
    const steps = [
      { ...g, active: [from.id, to.id], message: `Connecting ${from.label} → ${to.label}` },
      {
        ...final,
        active: [from.id, to.id],
        activeEdges: [created.id],
        message: `Edge ${from.label}–${to.label} added with weight ${weight}${both}`,
      },
    ];
    return { steps, finalGraph: final };
  },
};
