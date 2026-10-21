import { adjacencyOf, cloneGraph, distanceBetween, labelMap, vertexPoints } from "./helpers";

export const aStar = {
  key: "astar",
  label: "A* Search",
  group: "heuristic",
  fields: ["fromVertex", "toVertex"],
  desc: "Dijkstra with a hint. Dijkstra always expands the unvisited vertex with the smallest distance-so-far, which means it spreads outwards in every direction equally — including directly away from where you are going. A* expands the smallest g + h instead, where g is the distance so far and h is an estimate of what is left, so the search leans towards the target. The estimate here is the straight-line distance on the canvas, scaled so it can never overshoot: that property, admissibility, is exactly what guarantees A* still finds the true shortest path rather than merely a quick one. Drag the vertices around and the heuristic changes with them — the answer will not, but the number of vertices expanded to find it will.",
  time: "O(E log V) with a binary heap, like Dijkstra — but it usually expands far fewer vertices",
  space: "O(V)",
  run(graph, { fromVertex, toVertex, directed, positions }) {
    const g = cloneGraph(graph);
    const label = labelMap(g);
    const start = g.nodes.find((n) => n.id === fromVertex);
    const goal = g.nodes.find((n) => n.id === toVertex);

    if (!start || !goal) {
      return {
        steps: [{ ...g, notFound: true, message: "Pick a start and a target vertex for A*" }],
        finalGraph: graph,
      };
    }

    const steps = [];
    const points = vertexPoints(g.nodes, positions);
    const adj = adjacencyOf(g, directed);

    /**
     * The heuristic has to be *admissible* — never more than the real remaining
     * cost — or A* can return a path that is merely good. Straight-line
     * distance on the canvas is not admissible on its own, because edge weights
     * have nothing to do with how far apart the vertices were drawn. Scaling by
     * (cheapest edge ÷ longest edge on screen) fixes that: a route covering
     * geometric distance D needs at least D / longestEdge hops, each costing at
     * least cheapestEdge, so the scaled straight line can never overshoot.
     */
    const weights = g.edges.map((e) => e.weight);
    const cheapest = weights.length ? Math.min(...weights) : 1;
    const longestOnScreen = g.edges.reduce(
      (m, e) => Math.max(m, distanceBetween(points[e.from], points[e.to])),
      0.0001
    );
    const scale = cheapest / longestOnScreen;
    const h = (id) => distanceBetween(points[id], points[goal.id]) * scale;
    const show = (v) => (v === Infinity ? "∞" : Math.round(v * 10) / 10);

    const gScore = {};
    const parent = {};
    const open = new Set([start.id]);
    const closed = new Set();
    g.nodes.forEach((n) => (gScore[n.id] = n.id === start.id ? 0 : Infinity));

    // f is what the canvas shows above each vertex — the number A* actually
    // sorts on, rather than the g Dijkstra would show.
    const fLabels = () => {
      const out = {};
      g.nodes.forEach((n) => {
        out[n.id] = gScore[n.id] === Infinity ? Infinity : show(gScore[n.id] + h(n.id));
      });
      return out;
    };

    const treeEdges = () => Object.values(parent).map((e) => e.id);

    steps.push({
      ...g,
      distances: fLabels(),
      current: start.id,
      active: [goal.id],
      message: `From ${start.label} to ${goal.label}. Each vertex is labelled f = g + h — the distance so far plus the straight-line estimate of what is left, scaled by ${
        Math.round(scale * 100) / 100
      } so it can never overshoot the real cost.`,
    });

    let expanded = 0;

    while (open.size) {
      let best = null;
      let bestF = Infinity;
      for (const id of open) {
        const f = gScore[id] + h(id);
        if (f < bestF) {
          bestF = f;
          best = id;
        }
      }

      if (best === goal.id) {
        const path = [];
        let at = goal.id;
        while (parent[at]) {
          const edge = parent[at];
          path.push(edge.id);
          at = edge.from === at ? edge.to : edge.from;
        }
        steps.push({
          ...g,
          distances: fLabels(),
          visited: [...closed],
          current: goal.id,
          treeEdges: path,
          resultBadge: `SHORTEST PATH ${gScore[goal.id]} — ${expanded} VERTICES EXPANDED`,
          message: `${goal.label} came off the open set, and because h never overshoots, the first time that happens its distance is already final. Cost ${
            gScore[goal.id]
          }, after expanding ${expanded} of ${g.nodes.length} vertices — Dijkstra would have kept going until it had settled everything closer than the target.`,
        });
        return { steps, finalGraph: g };
      }

      open.delete(best);
      closed.add(best);
      expanded += 1;

      steps.push({
        ...g,
        distances: fLabels(),
        visited: [...closed],
        current: best,
        active: [goal.id],
        treeEdges: treeEdges(),
        message: `Expand ${label[best]} — the smallest f in the open set at ${show(bestF)} (g = ${show(
          gScore[best]
        )}, h = ${show(h(best))}). Its distance is settled.`,
      });

      for (const { to, edge } of adj.get(best) || []) {
        if (closed.has(to)) continue;
        const tentative = gScore[best] + edge.weight;
        if (tentative < gScore[to]) {
          const was = gScore[to];
          gScore[to] = tentative;
          parent[to] = edge;
          open.add(to);
          steps.push({
            ...g,
            distances: fLabels(),
            visited: [...closed],
            current: best,
            active: [to],
            activeEdges: [edge.id],
            treeEdges: treeEdges(),
            message: `${label[best]}→${label[to]} costs ${edge.weight}, so g(${label[to]}) = ${tentative}${
              was === Infinity ? "" : ` (was ${was})`
            }. With h = ${show(h(to))} that puts it in the open set at f = ${show(tentative + h(to))}.`,
          });
        }
      }
    }

    steps.push({
      ...g,
      distances: fLabels(),
      visited: [...closed],
      notFound: true,
      resultBadge: `${goal.label} IS UNREACHABLE`,
      message: `The open set emptied without reaching ${goal.label}: every vertex reachable from ${start.label} has been expanded — ${expanded} of them — and none of them leads there.`,
    });

    return { steps, finalGraph: g };
  },
};
