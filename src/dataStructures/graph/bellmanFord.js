import { cloneGraph, labelMap } from "./helpers";

export const bellmanFord = {
  key: "bellmanFord",
  label: "Bellman-Ford",
  group: "shortestPath",
  fields: ["vertex"],
  desc: "Shortest paths from one source, and unlike Dijkstra it copes with negative edge weights. The idea is brute force made careful: relax every edge in the graph, V−1 times over. After the first pass every shortest path of one edge is correct, after the second every path of two edges, and since no shortest path can use more than V−1 edges, V−1 passes settle all of them. That also gives it something Dijkstra cannot do — run the relaxation one more time, and any distance that still improves proves a negative cycle, because a path that keeps getting cheaper the more edges you add has no shortest form at all.",
  time: "O(V·E)",
  space: "O(V)",
  run(graph, { vertex, directed }) {
    const g = cloneGraph(graph);
    const label = labelMap(g);
    const start = g.nodes.find((n) => n.id === vertex);
    if (!start) {
      return {
        steps: [{ ...g, notFound: true, message: "Pick a source vertex for Bellman-Ford" }],
        finalGraph: graph,
      };
    }

    const steps = [];
    const dist = {};
    const parent = {};
    g.nodes.forEach((n) => (dist[n.id] = n.id === start.id ? 0 : Infinity));

    // An undirected edge relaxes both ways; a directed one only follows its
    // arrow. (With a negative weight an undirected edge is a negative cycle all
    // by itself — you can walk back and forth along it forever — which the
    // final check will report rather than hide.)
    const arcs = [];
    g.edges.forEach((e) => {
      arcs.push({ from: e.from, to: e.to, edge: e });
      if (!directed && e.from !== e.to) arcs.push({ from: e.to, to: e.from, edge: e });
    });

    const treeEdges = () => Object.values(parent).map((e) => e.id);

    steps.push({
      ...g,
      distances: { ...dist },
      current: start.id,
      message: `Start at ${start.label}, everything else at ∞. Every edge gets relaxed ${
        g.nodes.length - 1
      } times over — that is V−1, the most edges any shortest path can have.`,
    });

    let changedAtAll = false;
    for (let round = 1; round < g.nodes.length; round++) {
      let changedThisRound = false;

      for (const arc of arcs) {
        if (dist[arc.from] === Infinity) continue;
        const via = dist[arc.from] + arc.edge.weight;
        if (via < dist[arc.to]) {
          const was = dist[arc.to];
          dist[arc.to] = via;
          parent[arc.to] = arc.edge;
          changedThisRound = true;
          changedAtAll = true;
          steps.push({
            ...g,
            distances: { ...dist },
            active: [arc.from, arc.to],
            activeEdges: [arc.edge.id],
            treeEdges: treeEdges(),
            message: `Pass ${round}: ${label[arc.from]}→${label[arc.to]} gives ${dist[arc.from]} + ${
              arc.edge.weight
            } = ${via}, better than ${was === Infinity ? "∞" : was}. Relax it.`,
          });
        }
      }

      // Nothing moved, so nothing can move again — the remaining passes would
      // all be identical, and stopping early is the standard optimisation.
      if (!changedThisRound) {
        steps.push({
          ...g,
          distances: { ...dist },
          treeEdges: treeEdges(),
          message: `Pass ${round} changed nothing, so no later pass can either — the distances have settled with ${
            g.nodes.length - 1 - round
          } pass${g.nodes.length - 1 - round === 1 ? "" : "es"} to spare.`,
        });
        break;
      }
    }

    // One pass past the guarantee. Anything that still improves is on, or
    // reachable from, a cycle whose total weight is negative.
    let negativeEdge = null;
    for (const arc of arcs) {
      if (dist[arc.from] === Infinity) continue;
      if (dist[arc.from] + arc.edge.weight < dist[arc.to]) {
        negativeEdge = arc;
        break;
      }
    }

    if (negativeEdge) {
      steps.push({
        ...g,
        distances: { ...dist },
        active: [negativeEdge.from, negativeEdge.to],
        activeEdges: [negativeEdge.edge.id],
        notFound: true,
        resultBadge: "NEGATIVE CYCLE — NO SHORTEST PATH EXISTS",
        message: `After V−1 passes ${label[negativeEdge.from]}→${
          label[negativeEdge.to]
        } still improves. That is impossible unless going round a cycle makes the total smaller — so there is no shortest path, only ever-cheaper ones.`,
      });
      return { steps, finalGraph: g };
    }

    const reached = g.nodes.filter((n) => dist[n.id] !== Infinity).length;
    steps.push({
      ...g,
      distances: { ...dist },
      visited: g.nodes.filter((n) => dist[n.id] !== Infinity).map((n) => n.id),
      treeEdges: treeEdges(),
      resultBadge:
        reached === g.nodes.length
          ? `ALL ${reached} REACHED — NO NEGATIVE CYCLE`
          : `${reached}/${g.nodes.length} REACHED — NO NEGATIVE CYCLE`,
      message: changedAtAll
        ? `Done. The extra pass changed nothing, which is the proof there is no negative cycle. Dijkstra would have been faster here — O((V+E) log V) against O(V·E) — but it cannot run at all once an edge is negative.`
        : `Nothing to relax: ${start.label} reaches nothing, or every edge was already tight.`,
    });

    return { steps, finalGraph: g };
  },
};
