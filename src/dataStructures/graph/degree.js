import { cloneGraph } from "./helpers";

export const degree = {
  key: "degree",
  label: "Degree",
  group: "query",
  fields: ["vertex"],
  desc: "Counts how many edges touch a vertex. For a directed graph this reports in-degree (incoming) and out-degree (outgoing) separately; for an undirected graph it reports one overall degree.",
  time: "O(E) list \u00b7 O(V) matrix row/column scan",
  space: "O(1)",
  run(graph, { vertex, directed }) {
    const g = cloneGraph(graph);
    const v = g.nodes.find((n) => n.id === vertex);
    if (!v) {
      return { steps: [{ ...g, notFound: true, message: "Pick a vertex" }], finalGraph: graph };
    }

    const touching = g.edges.filter((e) => e.from === v.id || e.to === v.id).map((e) => e.id);
    let resultBadge;
    if (directed) {
      const outDeg = g.edges.filter((e) => e.from === v.id).length;
      const inDeg = g.edges.filter((e) => e.to === v.id).length;
      resultBadge = `IN-DEGREE ${inDeg} \u00b7 OUT-DEGREE ${outDeg}`;
    } else {
      resultBadge = `DEGREE ${touching.length}`;
    }

    const steps = [
      { ...g, active: [v.id], activeEdges: touching, resultBadge, message: `Counting edges incident to ${v.label}` },
    ];
    return { steps, finalGraph: graph };
  },
};
