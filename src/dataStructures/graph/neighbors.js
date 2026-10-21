import { cloneGraph, neighborsOf } from "./helpers";

export const neighbors = {
  key: "neighbors",
  label: "Get Neighbors",
  group: "query",
  fields: ["vertex"],
  desc: "Lists every vertex directly reachable from a given vertex in one hop \u2014 exactly the row you'd read off an adjacency list, or the non-zero cells in that vertex's row of the adjacency matrix.",
  time: "O(degree) list \u00b7 O(V) matrix row scan",
  space: "O(degree)",
  run(graph, { vertex, directed }) {
    const g = cloneGraph(graph);
    const v = g.nodes.find((n) => n.id === vertex);
    if (!v) {
      return { steps: [{ ...g, notFound: true, message: "Pick a vertex" }], finalGraph: graph };
    }

    const nbIds = neighborsOf(g.nodes, g.edges, v.id, directed);
    const nbLabels = nbIds.map((id) => g.nodes.find((n) => n.id === id)?.label).filter(Boolean);
    const touchingEdges = g.edges
      .filter((e) => (e.from === v.id && nbIds.includes(e.to)) || (!directed && e.to === v.id && nbIds.includes(e.from)))
      .map((e) => e.id);

    const steps = [
      {
        ...g,
        active: [v.id, ...nbIds],
        activeEdges: touchingEdges,
        resultBadge: nbLabels.length ? `NEIGHBORS OF ${v.label}: ${nbLabels.join(", ")}` : `${v.label} HAS NO NEIGHBORS`,
        message: `Reading ${v.label}'s adjacency row`,
      },
    ];
    return { steps, finalGraph: graph };
  },
};
