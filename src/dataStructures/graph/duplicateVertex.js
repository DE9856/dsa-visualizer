import { cloneGraph, nextEdgeId, nextVertexId, nextVertexLabel } from "./helpers";

/**
 * Copies one vertex, keeping the edges that ran through it.
 *
 * Deliberately not in GRAPH_OPERATIONS: duplicating is a canvas editing
 * affordance reached by copy/paste, not an operation of the graph ADT, and it
 * would only clutter the sidebar's operation list. Exported the same way
 * unionFind's makeUnionFind() is — used by name, not through the registry.
 *
 * The copy keeps its original's neighbours because a bare copy would be
 * nothing but a new vertex, which double-clicking the canvas already gives
 * you. Replicating a vertex *and its position in the graph* is the part that
 * would otherwise be a dozen clicks.
 */
export const duplicateVertex = {
  key: "duplicateVertex",
  label: "Duplicate Vertex",
  desc: "Adds a copy of a vertex, wired to the same neighbours as the original.",
  time: "O(E)",
  space: "O(E)",
  run(graph, { vertexId, directed }) {
    const g = cloneGraph(graph);
    const source = g.nodes.find((n) => n.id === vertexId);
    if (!source) {
      return { steps: [{ ...g, notFound: true, message: "That vertex is no longer in the graph" }], finalGraph: graph };
    }

    const label = nextVertexLabel(g.nodes);
    const copy = { id: nextVertexId(), label };
    const nodes = [...g.nodes, copy];

    // One new edge per edge touching the original, pointing the same way round
    // so a directed graph's in- and out-edges don't get swapped.
    const copied = [];
    g.edges.forEach((e) => {
      if (e.from === source.id) copied.push({ id: nextEdgeId(), from: copy.id, to: e.to, weight: e.weight });
      else if (e.to === source.id) copied.push({ id: nextEdgeId(), from: e.from, to: copy.id, weight: e.weight });
    });
    // A self-loop on the original would have matched both arms above; keep the
    // single copy of it rather than the pair.
    const deduped = copied.filter((e, i) => copied.findIndex((o) => o.from === e.from && o.to === e.to) === i);

    const withCopy = { nodes, edges: [...g.edges, ...deduped] };
    const edgeWord = deduped.length === 1 ? "edge" : "edges";
    const steps = [
      { ...g, active: [source.id], message: `Copying vertex ${source.label}` },
      { ...withCopy, pending: copy.id, message: `Vertex ${label} created` },
      {
        ...withCopy,
        active: [copy.id],
        activeEdges: deduped.map((e) => e.id),
        message: deduped.length
          ? `${label} copied from ${source.label} with ${deduped.length} ${edgeWord}`
          : `${label} copied from ${source.label} — ${source.label} had no edges`,
      },
    ];
    return { steps, finalGraph: withCopy };
  },
};
