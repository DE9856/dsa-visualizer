import { makeRng } from "../../utils/rng";

/**
 * Prim against Kruskal, on one graph, counted.
 *
 * The two are the standard example of different algorithms with the same
 * answer, and the interesting part is *how* the answer is the same. They
 * disagree about everything on the way: Prim always holds one connected tree
 * and grows it outward, Kruskal holds a forest of fragments that only becomes
 * a tree with the last edge it adds. Yet the total weight is identical, and
 * when no two edges share a weight so is the edge set — the cut property makes
 * every safe edge safe for both of them.
 *
 * Where they genuinely differ is cost, and the axis is density. Array-based
 * Prim pays V² picking minimum keys whether the graph has V edges or V²;
 * Kruskal pays E log E sorting, which is nothing on a sparse graph and the
 * dominant term on a dense one. The sweep at the bottom of this file is that
 * crossover, measured.
 *
 * Both counts here are elementary array operations of the algorithm's own
 * inner loop, so they are comparable in shape. They are not wall-clock time
 * and the constant factors are not equal — a sort comparison and a union-find
 * parent read do not cost the same thing.
 */

export const MST_ALGOS = [
  {
    key: "prim",
    label: "Prim",
    short: "PRIM",
    color: "var(--primary)",
    claim: "O(V²) with an array, O(E log V) with a heap",
    costs: "min-key scans + one pass per neighbour list",
  },
  {
    key: "kruskal",
    label: "Kruskal",
    short: "KRUSKAL",
    color: "var(--green)",
    claim: "O(E log E)",
    costs: "sort comparisons + union-find reads and writes",
  },
];

export const MST_ALGO_MAP = Object.fromEntries(MST_ALGOS.map((a) => [a.key, a]));

// ---------------------------------------------------------------------
// the two algorithms, without frames
// ---------------------------------------------------------------------

/**
 * Merge sort with every comparison counted. A real sort rather than
 * `Array.prototype.sort`, because the number of comparisons Kruskal spends is
 * half of what is being measured and the engine's sort will not report it.
 */
function sortByWeight(edges, counters) {
  if (edges.length < 2) return edges;
  const mid = Math.floor(edges.length / 2);
  const left = sortByWeight(edges.slice(0, mid), counters);
  const right = sortByWeight(edges.slice(mid), counters);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    counters.comparisons += 1;
    if (left[i].weight <= right[j].weight) out.push(left[i++]);
    else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}

/**
 * The union-find Kruskal runs on, with every parent read and write counted.
 * Same rules as `unionFind/helpers.js` — union by size, path compression —
 * with a meter on it.
 */
function countingUnionFind(n, counters) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);

  const find = (x) => {
    let root = x;
    // Every hop up is a parent read, and so is the one that discovers a root.
    while (parent[root] !== root) {
      counters.ufReads += 1;
      root = parent[root];
    }
    counters.ufReads += 1;
    let walk = x;
    while (parent[walk] !== root) {
      const next = parent[walk];
      parent[walk] = root;
      counters.ufWrites += 1;
      walk = next;
    }
    return root;
  };

  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    const [big, small] = size[ra] >= size[rb] ? [ra, rb] : [rb, ra];
    parent[small] = big;
    size[big] += size[small];
    counters.ufWrites += 2;
    return true;
  };

  return { find, union, connected: (a, b) => find(a) === find(b) };
}

/**
 * Kruskal over an indexed edge list. `edges` is `{ from, to, weight, id }`
 * with vertex indices; the returned tree edges are the same objects, in the
 * order the algorithm accepted them.
 */
export function runKruskal(v, edges) {
  const counters = { comparisons: 0, ufReads: 0, ufWrites: 0, finds: 0, unions: 0, skipped: 0 };
  const sorted = sortByWeight([...edges], counters);
  const uf = countingUnionFind(v, counters);
  const tree = [];
  let total = 0;

  sorted.forEach((edge) => {
    counters.finds += 2;
    if (uf.union(edge.from, edge.to)) {
      counters.unions += 1;
      tree.push(edge);
      total += edge.weight;
    } else {
      counters.skipped += 1;
    }
  });

  return {
    key: "kruskal",
    tree,
    total,
    counters,
    steps: counters.comparisons + counters.ufReads + counters.ufWrites,
    components: v - tree.length,
  };
}

/**
 * Array-based Prim, the version the view animates: no heap, so each round
 * scans every vertex for the smallest key.
 *
 * Run as a forest — when the graph is disconnected it restarts at the next
 * unreached vertex rather than stopping — so that its total can be compared
 * with Kruskal's, which has always produced a spanning forest. The animated
 * operation stops after the start vertex's component instead, and says so.
 */
export function runPrim(v, edges, start = 0) {
  const counters = { minScans: 0, edgeScans: 0, updates: 0, restarts: 0 };
  const adjacency = Array.from({ length: v }, () => []);
  edges.forEach((edge) => {
    adjacency[edge.from].push(edge);
    if (edge.from !== edge.to) adjacency[edge.to].push(edge);
  });

  const key = new Array(v).fill(Infinity);
  const edgeTo = new Array(v).fill(null);
  const inTree = new Array(v).fill(false);
  key[Math.min(start, Math.max(0, v - 1))] = 0;

  const tree = [];
  let total = 0;

  for (let round = 0; round < v; round++) {
    let best = -1;
    for (let i = 0; i < v; i++) {
      counters.minScans += 1;
      if (!inTree[i] && key[i] < (best === -1 ? Infinity : key[best])) best = i;
    }

    if (best === -1) {
      // Everything reachable is in the tree and vertices remain: start a new
      // fragment, which is exactly what Kruskal has been doing all along.
      const next = inTree.indexOf(false);
      if (next === -1) break;
      key[next] = 0;
      counters.restarts += 1;
      best = next;
    }

    inTree[best] = true;
    if (edgeTo[best]) {
      tree.push(edgeTo[best]);
      total += edgeTo[best].weight;
    }

    adjacency[best].forEach((edge) => {
      counters.edgeScans += 1;
      const other = edge.from === best ? edge.to : edge.from;
      if (inTree[other]) return;
      if (edge.weight < key[other]) {
        key[other] = edge.weight;
        edgeTo[other] = edge;
        counters.updates += 1;
      }
    });
  }

  return {
    key: "prim",
    tree,
    total,
    counters,
    steps: counters.minScans + counters.edgeScans,
    components: v === 0 ? 0 : counters.restarts + 1,
  };
}

// ---------------------------------------------------------------------
// the graph on screen
// ---------------------------------------------------------------------

/**
 * Runs both on the graph the canvas is drawing.
 *
 * Direction is ignored, as both algorithms and the view's own operations do —
 * a minimum spanning tree is only defined for an undirected graph, and the
 * panel says so rather than quietly refusing.
 */
export function compareOnGraph(graph, startId) {
  const index = new Map(graph.nodes.map((node, i) => [node.id, i]));
  const labels = graph.nodes.map((node) => node.label);
  const v = graph.nodes.length;

  const edges = [];
  graph.edges.forEach((edge) => {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    // A self-loop can never join two fragments, so neither algorithm would
    // ever take one; dropping it here keeps the edge counts honest.
    if (from === undefined || to === undefined || from === to) return;
    edges.push({ id: edge.id, from, to, weight: edge.weight });
  });

  const start = startId !== undefined && index.has(startId) ? index.get(startId) : 0;
  const prim = runPrim(v, edges, start);
  const kruskal = runKruskal(v, edges);

  const nameOf = (edge) => `${labels[edge.from]}–${labels[edge.to]}`;
  const setOf = (result) => new Set(result.tree.map((edge) => edge.id));
  const primSet = setOf(prim);
  const kruskalSet = setOf(kruskal);

  return {
    v,
    e: edges.length,
    startLabel: labels[start],
    prim: { ...prim, edges: prim.tree.map((edge) => ({ ...edge, name: nameOf(edge) })) },
    kruskal: { ...kruskal, edges: kruskal.tree.map((edge) => ({ ...edge, name: nameOf(edge) })) },
    sameTotal: prim.total === kruskal.total,
    sameEdges:
      primSet.size === kruskalSet.size && [...primSet].every((id) => kruskalSet.has(id)),
    // Ties are the only reason two correct MSTs can differ, so it is worth
    // saying whether this graph has any.
    hasTies: new Set(edges.map((edge) => edge.weight)).size < edges.length,
    components: kruskal.components,
  };
}

// ---------------------------------------------------------------------
// the density sweep
// ---------------------------------------------------------------------

export const V_CHOICES = [
  { key: 64, label: "64", desc: "Instant. The crossover is already visible." },
  { key: 128, label: "128", desc: "A moment." },
  { key: 256, label: "256", desc: "A second or two — a complete graph here is 32,640 edges to sort." },
];

/** Eight densities from a spanning tree up to complete, spread geometrically. */
export function edgeCountsFor(v) {
  const min = Math.max(1, v - 1);
  const max = (v * (v - 1)) / 2;
  const counts = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    counts.push(Math.round(Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)))));
  }
  return [...new Set(counts)];
}

/**
 * A connected weighted graph with `edgeCount` edges. The spanning tree comes
 * first so every point on the sweep is one connected graph — a disconnected
 * one would make Prim restart, which is a different algorithm's cost.
 */
function randomWeightedGraph(v, edgeCount, rand) {
  const maxPairs = (v * (v - 1)) / 2;
  const target = Math.max(v - 1, Math.min(edgeCount, maxPairs));
  const seen = new Set();
  const edges = [];
  const keyOf = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const add = (a, b) => {
    if (a === b || seen.has(keyOf(a, b))) return false;
    seen.add(keyOf(a, b));
    edges.push({ id: edges.length, from: a, to: b, weight: 1 + Math.floor(rand() * 999) });
    return true;
  };

  for (let i = 1; i < v; i++) add(Math.floor(rand() * i), i);

  if (target >= maxPairs * 0.6) {
    // Dealing from the full pair list, because rejection sampling the last few
    // pairs of a near-complete graph takes arbitrarily long.
    const pairs = [];
    for (let i = 0; i < v; i++) {
      for (let j = i + 1; j < v; j++) if (!seen.has(keyOf(i, j))) pairs.push([i, j]);
    }
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    pairs.slice(0, target - edges.length).forEach(([a, b]) => add(a, b));
  } else {
    let guard = 0;
    while (edges.length < target && guard < target * 40) {
      add(Math.floor(rand() * v), Math.floor(rand() * v));
      guard += 1;
    }
  }

  return edges;
}

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Both algorithms on the same graphs, at one vertex count and growing density.
 *
 * V is held fixed and E varies because that is the axis the two disagree on:
 * Prim's V² is a flat line here and Kruskal's E log E is not, so where they
 * cross is a real, findable number rather than a rule of thumb about "sparse"
 * and "dense".
 *
 * Every point also checks that the two returned the same total weight. That is
 * not decoration — it is the one assertion this whole comparison rests on, and
 * it is cheap to verify at every size.
 */
export async function runMstSweep({ v = 128, seed = 1, onProgress, token = {} }) {
  const counts = edgeCountsFor(v);
  const series = { prim: [], kruskal: [] };
  let disagreements = 0;
  let done = 0;

  for (const edgeCount of counts) {
    if (token.cancelled) return null;
    const rand = makeRng((seed >>> 0) + edgeCount * 7919 + v);
    const edges = randomWeightedGraph(v, edgeCount, rand);

    const prim = runPrim(v, edges, 0);
    const kruskal = runKruskal(v, edges);
    if (prim.total !== kruskal.total) disagreements += 1;

    series.prim.push({ e: edges.length, steps: prim.steps, total: prim.total, counters: prim.counters });
    series.kruskal.push({
      e: edges.length,
      steps: kruskal.steps,
      total: kruskal.total,
      counters: kruskal.counters,
    });

    done += 1;
    onProgress?.(done / counts.length, edges.length);
    await yieldToUi();
  }

  // Where Kruskal's curve crosses Prim's — the whole point of the plot. The
  // two measured points that bracket it rather than an interpolated number:
  // the crossing was not measured, only the fact that it happened in between.
  let crossover = null;
  for (let i = 1; i < series.prim.length; i++) {
    const wasCheaper = series.kruskal[i - 1].steps < series.prim[i - 1].steps;
    const isCheaper = series.kruskal[i].steps < series.prim[i].steps;
    if (wasCheaper && !isCheaper) crossover = { from: series.kruskal[i - 1].e, to: series.kruskal[i].e };
  }

  return { v, seed, counts, series, disagreements, crossover };
}

/** The two shapes the plot is checking the measurements against. */
export const MST_MODELS = [
  { key: "v2", label: "V²", color: "var(--primary)", f: (e, v) => v * v },
  { key: "elge", label: "E log₂ E", color: "var(--green)", f: (e) => e * Math.log2(Math.max(2, e)) },
];
