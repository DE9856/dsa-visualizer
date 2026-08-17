import { cloneGraph } from "./helpers";

export const hasEdge = {
  key: "hasEdge",
  label: "Is Adjacent",
  group: "query",
  fields: ["fromVertex", "toVertex"],
  desc: "Checks whether an edge directly connects two vertices \u2014 a single cell lookup in an adjacency matrix (O(1)), or a scan of that vertex's list in an adjacency list (O(degree)).",
  time: "O(1) matrix \u00b7 O(V) list",
  space: "O(1)",
  run(graph, { fromVertex, toVertex, directed }) {
    const g = cloneGraph(graph);
    const from = g.nodes.find((n) => n.id === fromVertex);
    const to = g.nodes.find((n) => n.id === toVertex);

    if (!from || !to) {
      return { steps: [{ ...g, notFound: true, message: "Choose both vertices to check" }], finalGraph: graph };
    }

    const found = g.edges.find(
      (e) => (e.from === from.id && e.to === to.id) || (!directed && e.from === to.id && e.to === from.id)
    );

    // A vertex asked about itself is asking whether it has a self-loop, which
    // is the one case where "adjacent" is about one vertex rather than a pair.
    const selfLoop = from.id === to.id;
    const steps = [
      {
        ...g,
        active: selfLoop ? [from.id] : [from.id, to.id],
        activeEdges: found ? [found.id] : [],
        notFound: !found,
        resultBadge: selfLoop
          ? found
            ? `TRUE \u2014 ${from.label} HAS A SELF-LOOP`
            : `FALSE \u2014 ${from.label} HAS NO SELF-LOOP`
          : found
            ? `TRUE \u2014 ${from.label} \u2192 ${to.label} EXISTS`
            : "FALSE \u2014 NOT ADJACENT",
        message: selfLoop
          ? found
            ? `${from.label} is adjacent to itself`
            : `${from.label} is not connected to itself`
          : found
            ? `${from.label} and ${to.label} are adjacent`
            : `${from.label} and ${to.label} are not directly connected`,
      },
    ];
    return { steps, finalGraph: graph };
  },
};
