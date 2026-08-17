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
  desc: "Sets matrix[from][to] — adding, reweighting or removing the edge to match. A diagonal cell works the same way, and gives that vertex a self-loop.",
  time: "O(E)",
  space: "O(1)",
  run(graph, { fromVertex, toVertex, weight, directed }) {
    const g = cloneGraph(graph);
    const from = g.nodes.find((n) => n.id === fromVertex);
    const to = g.nodes.find((n) => n.id === toVertex);

    if (!from || !to) {
      return { steps: [{ ...g, notFound: true, message: "That cell isn't an edge" }], finalGraph: graph };
    }

    // An undirected edge occupies both cells, so either one finds it.
    const existing = g.edges.find(
      (e) =>
        (e.from === from.id && e.to === to.id) || (!directed && e.from === to.id && e.to === from.id)
    );
    // A diagonal cell is one cell — a self-loop has no mirrored half to move
    // with it, whichever way round the graph is, and it names one vertex
    // rather than a pair.
    const selfLoop = from.id === to.id;
    const both = directed || selfLoop ? "" : " (both directions)";
    const ends = selfLoop ? [from.id] : [from.id, to.id];
    const what = selfLoop ? `${from.label}'s self-loop` : `edge ${from.label}–${to.label}`;
    const whatCap = what.charAt(0).toUpperCase() + what.slice(1);

    // 0 is the matrix's way of saying "not connected".
    if (weight === 0) {
      if (!existing) {
        return {
          steps: [
            {
              ...g,
              active: ends,
              message: selfLoop
                ? `${from.label} had no self-loop to clear`
                : `${from.label} and ${to.label} were already unconnected`,
            },
          ],
          finalGraph: graph,
        };
      }
      const final = { nodes: g.nodes, edges: g.edges.filter((e) => e.id !== existing.id) };
      const steps = [
        { ...g, active: ends, activeEdges: [existing.id], message: `Clearing ${what}` },
        { ...final, active: ends, message: `${whatCap} removed${both}` },
      ];
      return { steps, finalGraph: final };
    }

    if (existing) {
      if (existing.weight === weight) {
        return {
          steps: [{ ...g, active: ends, activeEdges: [existing.id], message: `${whatCap} is already ${weight}` }],
          finalGraph: graph,
        };
      }
      const final = {
        nodes: g.nodes,
        edges: g.edges.map((e) => (e.id === existing.id ? { ...e, weight } : e)),
      };
      const steps = [
        { ...g, active: ends, activeEdges: [existing.id], message: `${whatCap} was ${existing.weight}` },
        { ...final, active: ends, activeEdges: [existing.id], message: `${whatCap} is now ${weight}` },
      ];
      return { steps, finalGraph: final };
    }

    const created = { id: nextEdgeId(), from: from.id, to: to.id, weight };
    const final = { nodes: g.nodes, edges: [...g.edges, created] };
    const steps = [
      {
        ...g,
        active: ends,
        message: selfLoop ? `Looping ${from.label} back to itself` : `Connecting ${from.label} → ${to.label}`,
      },
      {
        ...final,
        active: ends,
        activeEdges: [created.id],
        message: `${whatCap} added with weight ${weight}${both}`,
      },
    ];
    return { steps, finalGraph: final };
  },
};
