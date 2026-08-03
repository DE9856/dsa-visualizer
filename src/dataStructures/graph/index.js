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
import { clearGraph } from "./clear";

// The full Graph ADT: build (vertices/edges), query (adjacency/degree),
// traverse (BFS/DFS/topological sort), MST (Kruskal/Prim), shortest path
// (Dijkstra), and a bulk reset.
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
  kruskalMST,
  primMST,
  dijkstra,
  clearGraph,
];

export const GRAPH_OP_MAP = Object.fromEntries(GRAPH_OPERATIONS.map((op) => [op.key, op]));

export const GRAPH_GROUPS = [
  { key: "build", label: "Build" },
  { key: "query", label: "Query" },
  { key: "traverse", label: "Traversal" },
  { key: "mst", label: "Minimum Spanning Tree" },
  { key: "shortestPath", label: "Shortest Path" },
  { key: "utility", label: "Utility" },
];

// Two ways to *view* the same underlying graph, not two different data
// structures \u2014 mirrors how LL_TYPES swaps rendering for the linked list.
export const GRAPH_REPRESENTATIONS = [
  { key: "list", label: "Adjacency List" },
  { key: "matrix", label: "Adjacency Matrix" },
];
