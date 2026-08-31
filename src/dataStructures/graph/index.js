import { addVertex } from "./addVertex";
import { removeVertex } from "./removeVertex";
import { addEdge } from "./addEdge";
import { removeEdge } from "./removeEdge";
import { hasEdge } from "./hasEdge";
import { degree } from "./degree";
import { neighbors } from "./neighbors";
import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { topologicalSort } from "./topologicalSort";
import { kruskalMST } from "./kruskalMST";
import { primMST } from "./primMST";
import { dijkstra } from "./dijkstra";
import { bellmanFord } from "./bellmanFord";
import { floydWarshall } from "./floydWarshall";
import { aStar } from "./aStar";
import { tarjanScc } from "./tarjanScc";
import { kosarajuScc } from "./kosarajuScc";
import { bridges } from "./bridges";
import { bipartite } from "./bipartite";
import { cycleDetect } from "./cycleDetect";
import { maxFlow } from "./maxFlow";
import { clearGraph } from "./clear";

// The full Graph ADT: build, query, traverse, connectivity (components,
// cut points, colourability), MST, shortest paths and flow.
export const GRAPH_OPERATIONS = [
  addVertex,
  removeVertex,
  addEdge,
  removeEdge,
  hasEdge,
  degree,
  neighbors,
  bfs,
  dfs,
  topologicalSort,
  cycleDetect,
  bipartite,
  bridges,
  tarjanScc,
  kosarajuScc,
  kruskalMST,
  primMST,
  dijkstra,
  bellmanFord,
  floydWarshall,
  aStar,
  maxFlow,
  clearGraph,
];

export const GRAPH_OP_MAP = Object.fromEntries(GRAPH_OPERATIONS.map((op) => [op.key, op]));

/**
 * Shortest paths are split by what the search is allowed to know.
 *
 * Dijkstra and Bellman-Ford are *uninformed*: they know the edges and nothing
 * else, so they expand outwards in every direction and their guarantees hold on
 * any graph you hand them. A* is *informed* — it is given an estimate of how far
 * each vertex still is from the target and leans towards it, which is why it
 * usually expands a fraction as many vertices, and why it comes with a
 * condition attached: the estimate must never overshoot, or the answer it
 * finds need not be the shortest one. Same problem, same output, and a
 * completely different set of assumptions, which is worth a heading of its own
 * rather than one long list.
 */
export const GRAPH_GROUPS = [
  { key: "build", label: "Build" },
  { key: "query", label: "Query" },
  { key: "traverse", label: "Traversal" },
  { key: "connectivity", label: "Connectivity & Structure" },
  { key: "mst", label: "Minimum Spanning Tree" },
  { key: "shortestPath", label: "Shortest Path — Uninformed" },
  { key: "heuristic", label: "Shortest Path — Heuristic" },
  { key: "flow", label: "Network Flow" },
  { key: "utility", label: "Utility" },
];

// Two ways to *view* the same underlying graph, not two different data
// structures \u2014 mirrors how LL_TYPES swaps rendering for the linked list.
export const GRAPH_REPRESENTATIONS = [
  { key: "list", label: "Adjacency List" },
  { key: "matrix", label: "Adjacency Matrix" },
];
