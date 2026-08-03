import { cloneGraph } from "./helpers";

// Builds the initial n x n distance matrix from the graph's current edges.
function initMatrix(nodes, edges, directed) {
  const n = nodes.length;
  const idx = Object.fromEntries(nodes.map((node, i) => [node.id, i]));
  const dist = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  edges.forEach((e) => {
    const i = idx[e.from];
    const j = idx[e.to];
    if (i === undefined || j === undefined) return;
    dist[i][j] = Math.min(dist[i][j], e.weight);
    if (!directed) dist[j][i] = Math.min(dist[j][i], e.weight);
  });
  return dist;
}

function snapshotMatrix(dist, labels) {
  return { labels: [...labels], matrix: dist.map((row) => [...row]) };
}

export const floydWarshall = {
  key: "floydWarshall",
  label: "Floyd-Warshall",
  group: "shortestPath",
  fields: [],
  desc: "Computes shortest paths between every pair of vertices at once. For each intermediate vertex k, it checks every pair (i, j) and asks: is the path i \u2192 k \u2192 j shorter than what we currently know for i \u2192 j? If so, it updates the distance. After trying every vertex as an intermediate stop, the matrix holds the true shortest distance between all pairs.",
  time: "O(V\u00b3)",
  space: "O(V\u00b2)",
  run(graph, { directed }) {
    const g = cloneGraph(graph);
    const n = g.nodes.length;
    if (n === 0) {
      return { steps: [{ ...g, notFound: true, message: "Add vertices before running Floyd-Warshall" }], finalGraph: graph };
    }

    const labels = g.nodes.map((node) => node.label);
    const dist = initMatrix(g.nodes, g.edges, directed);
    const steps = [];

    steps.push({
      ...g,
      distanceMatrix: snapshotMatrix(dist, labels),
      message: "Initialize distances directly from the edges (\u221e where no edge exists)",
    });

    for (let k = 0; k < n; k++) {
      const kNode = g.nodes[k];
      steps.push({
        ...g,
        current: kNode.id,
        distanceMatrix: snapshotMatrix(dist, labels),
        message: `Consider ${kNode.label} as the intermediate vertex`,
      });

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j || i === k || j === k) continue;
          const through = dist[i][k] + dist[k][j];
          const iNode = g.nodes[i];
          const jNode = g.nodes[j];
          if (through < dist[i][j]) {
            dist[i][j] = through;
            steps.push({
              ...g,
              current: kNode.id,
              active: [iNode.id, jNode.id],
              distanceMatrix: { ...snapshotMatrix(dist, labels), highlight: [i, j] },
              message: `${iNode.label}\u2192${jNode.label} improves via ${kNode.label}: now ${through}`,
            });
          } else {
            steps.push({
              ...g,
              current: kNode.id,
              active: [iNode.id, jNode.id],
              distanceMatrix: { ...snapshotMatrix(dist, labels), highlight: [i, j] },
              message: `${iNode.label}\u2192${jNode.label} via ${kNode.label} is not shorter (${
                through === Infinity ? "\u221e" : through
              } \u2265 ${dist[i][j] === Infinity ? "\u221e" : dist[i][j]})`,
            });
          }
        }
      }
    }

    const hasNegative = dist.some((row, i) => row[i] < 0);
    steps.push({
      ...g,
      distanceMatrix: snapshotMatrix(dist, labels),
      resultBadge: hasNegative ? "NEGATIVE CYCLE DETECTED" : "ALL-PAIRS SHORTEST PATHS COMPLETE",
      message: "Floyd-Warshall complete \u2014 the matrix holds every pair's shortest distance",
    });

    return { steps, finalGraph: g };
  },
};
