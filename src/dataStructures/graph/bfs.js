import { cloneGraph, neighborsOf } from "./helpers";

export const bfs = {
  key: "bfs",
  label: "BFS",
  group: "traverse",
  fields: ["vertex"],
  desc: "Breadth-First Search explores the graph one layer at a time using a queue: visit the start vertex, then every unvisited neighbor, then their unvisited neighbors, and so on \u2014 guaranteeing the shortest path (by edge count) from the start to every reachable vertex.",
  time: "O(V + E)",
  space: "O(V)",
  run(graph, { vertex, directed }) {
    const g = cloneGraph(graph);
    const start = g.nodes.find((n) => n.id === vertex);
    if (!start) {
      return { steps: [{ ...g, notFound: true, message: "Pick a start vertex for BFS" }], finalGraph: graph };
    }

    const steps = [];
    const visited = new Set([start.id]);
    const order = [start.id];
    const queue = [start.id];

    steps.push({ ...g, visited: [...visited], current: start.id, message: `Enqueue start vertex ${start.label}` });

    while (queue.length) {
      const currentId = queue.shift();
      const currentNode = g.nodes.find((n) => n.id === currentId);
      steps.push({ ...g, visited: [...visited], current: currentId, message: `Dequeue and visit ${currentNode.label}` });

      const nbIds = neighborsOf(g.nodes, g.edges, currentId, directed);
      nbIds.forEach((nb) => {
        if (!visited.has(nb)) {
          visited.add(nb);
          order.push(nb);
          queue.push(nb);
          const nbNode = g.nodes.find((n) => n.id === nb);
          const linkEdge = g.edges.find(
            (e) => (e.from === currentId && e.to === nb) || (!directed && e.from === nb && e.to === currentId)
          );
          steps.push({
            ...g,
            visited: [...visited],
            current: currentId,
            active: [currentId, nb],
            activeEdges: linkEdge ? [linkEdge.id] : [],
            message: `Discover ${nbNode.label} from ${currentNode.label} \u2014 enqueue it`,
          });
        }
      });
    }

    const orderLabels = order.map((id) => g.nodes.find((n) => n.id === id).label).join(" \u2192 ");
    steps.push({ ...g, visited: [...visited], resultBadge: `BFS ORDER: ${orderLabels}`, message: "BFS traversal complete" });
    return { steps, finalGraph: g };
  },
};
