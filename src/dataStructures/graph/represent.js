import { makeRng } from "../../utils/rng";

/**
 * What the two representations of a graph actually cost.
 *
 * The panel above the canvas draws the adjacency list and the adjacency matrix
 * as two ways of looking at one graph, which is true and hides the trade-off:
 * they are not interchangeable, they are opposite bets. The matrix answers
 * "is there an edge u→v?" in one read and pays V² slots for the privilege,
 * most of them zeros. The list stores only the arcs that exist and pays for
 * that with a walk down u's neighbours every time you ask.
 *
 * Nothing here is asserted from a complexity table: both structures are built,
 * their slots counted, and the lookups run against them.
 *
 *   matrix   cells[i][j]      V × V numbers, zero where there is no edge
 *   list     lists[i] = [j…]  V heads, one entry per stored arc
 *
 * An undirected edge is two arcs in the list — u's row names v and v's names
 * u — and two cells in the matrix. That symmetry is the reason an undirected
 * matrix is usually described as wasting half of itself.
 */

export const REPRESENTATIONS = [
  {
    key: "matrix",
    label: "Adjacency Matrix",
    short: "MATRIX",
    color: "var(--blue)",
    claim: "V² memory · 1 read per query · O(V) per neighbour list",
  },
  {
    key: "list",
    label: "Adjacency List",
    short: "LIST",
    color: "var(--primary)",
    claim: "V + 2E memory · O(deg u) per query and per list",
  },
];

export const REPR_MAP = Object.fromEntries(REPRESENTATIONS.map((r) => [r.key, r]));

export const COST_MEASURES = [
  {
    key: "memory",
    label: "MEMORY",
    title: "Slots stored — V² cells against V heads plus one entry per stored arc",
  },
  {
    key: "query",
    label: "EDGE QUERY",
    title: "Slots examined answering “is there an edge u→v?”, averaged over random vertex pairs",
  },
  {
    key: "scan",
    label: "TRAVERSE",
    title: "Slots examined visiting every vertex's neighbours once — what BFS and DFS pay to walk the whole graph",
  },
];

export const MEASURE_MAP = Object.fromEntries(COST_MEASURES.map((m) => [m.key, m]));

/**
 * How many edges a graph of V vertices gets. Density is the whole argument:
 * the matrix costs V² whatever you do, so the only question is whether the
 * graph has enough edges to earn it.
 */
export const DENSITIES = [
  {
    key: "tree",
    label: "Tree (E = V−1)",
    desc: "The sparsest connected graph there is. The matrix is essentially all zeros.",
    edgesFor: (v) => Math.max(0, v - 1),
  },
  {
    key: "sparse",
    label: "Sparse (avg degree 4)",
    desc: "E = 2V — a road network, a social graph, most graphs anyone actually stores.",
    edgesFor: (v) => 2 * v,
  },
  {
    key: "logv",
    label: "E = V log₂ V",
    desc: "The threshold where a graph stops being sparse but is still nowhere near full.",
    edgesFor: (v) => Math.round(v * Math.log2(Math.max(2, v))),
  },
  {
    key: "complete",
    label: "Complete",
    desc: "Every pair joined. The one case where the list stores more than the matrix.",
    edgesFor: (v) => (v * (v - 1)) / 2,
  },
];

export const DENSITY_MAP = Object.fromEntries(DENSITIES.map((d) => [d.key, d]));

// Geometric, so the log axis is evenly sampled and V² is a straight line.
const ALL_SIZES = [8, 16, 32, 64, 128, 256];

export const SWEEP_SIZES = ALL_SIZES;

export const MAX_V_CHOICES = [
  { key: 64, label: "64", desc: "Instant." },
  { key: 128, label: "128", desc: "A moment." },
  { key: 256, label: "256", desc: "A second or two — a complete graph at this size is 65,536 cells." },
];

export const sizesUpTo = (maxV) => {
  const sizes = ALL_SIZES.filter((v) => v <= maxV);
  return sizes.length ? sizes : [ALL_SIZES[0]];
};

/** Random ordered pairs tried per point, when the graph is too big to ask about every pair. */
const QUERY_SAMPLES = 4000;

// ---------------------------------------------------------------------
// building both representations
// ---------------------------------------------------------------------

/**
 * Builds the matrix and the list from the same arc list, so neither can be
 * measured against a graph the other doesn't have. `arcs` is already directed:
 * an undirected edge arrives as both of its directions.
 */
export function buildBoth(v, arcs) {
  const matrix = Array.from({ length: v }, () => new Array(v).fill(0));
  const lists = Array.from({ length: v }, () => []);
  arcs.forEach(([from, to]) => {
    if (from < 0 || to < 0 || from >= v || to >= v) return;
    // A duplicate arc would be one list entry too many and no extra cell, so
    // the two would stop describing the same graph.
    if (matrix[from][to]) return;
    matrix[from][to] = 1;
    lists[from].push(to);
  });
  return { matrix, lists };
}

/**
 * Slots the list examines answering "is there an arc from → to?" — it walks
 * the row until it finds the target or runs out.
 *
 * An empty row still costs one: the head has to be read to discover there is
 * nothing there, and counting it as free is what would make an empty graph
 * look infinitely cheap to query.
 */
function listQueryCost(lists, from, to) {
  const row = lists[from];
  for (let i = 0; i < row.length; i++) {
    if (row[i] === to) return i + 1;
  }
  return Math.max(1, row.length);
}

/**
 * Measures one graph, both ways.
 *
 * Memory and traversal are counted off the structures themselves — the matrix
 * has exactly V² cells and a full scan reads every one, the list has V heads
 * and one entry per arc and a scan reads every one — so there is nothing to
 * estimate. The edge query is run: `queries` random pairs, or every ordered
 * pair when the graph is small enough for that to be quick, which is what the
 * graph on screen gets.
 */
export function measureBoth(v, arcs, { queries = QUERY_SAMPLES, seed = 1 } = {}) {
  const { matrix, lists } = buildBoth(v, arcs);
  const storedArcs = lists.reduce((total, row) => total + row.length, 0);

  let listQueryTotal = 0;
  let asked = 0;
  let worstQuery = 0;

  const ask = (from, to) => {
    const cost = listQueryCost(lists, from, to);
    listQueryTotal += cost;
    if (cost > worstQuery) worstQuery = cost;
    asked += 1;
  };

  if (v > 0 && v * v <= queries) {
    for (let from = 0; from < v; from++) {
      for (let to = 0; to < v; to++) ask(from, to);
    }
  } else if (v > 0) {
    const rand = makeRng(seed);
    for (let i = 0; i < queries; i++) {
      ask(Math.floor(rand() * v), Math.floor(rand() * v));
    }
  }

  const degrees = lists.map((row) => row.length);

  return {
    v,
    arcs: storedArcs,
    memory: { matrix: v * v, list: v + storedArcs },
    // A cell read is a cell read, whatever the graph looks like. That is the
    // matrix's entire pitch.
    query: { matrix: 1, list: asked ? listQueryTotal / asked : 0 },
    scan: { matrix: v * v, list: v + storedArcs },
    worstQuery: { matrix: 1, list: Math.max(1, ...degrees, 1) },
    maxDegree: degrees.length ? Math.max(...degrees) : 0,
  };
}

// ---------------------------------------------------------------------
// the graph on screen
// ---------------------------------------------------------------------

/**
 * The same measurement, for the graph the canvas is drawing. Every ordered
 * pair is asked about rather than sampled — a couple of dozen vertices is 676
 * questions, which is free, and an exact number is worth more than an estimate
 * on a graph you can count by eye.
 */
export function representationCost(graph, directed) {
  const index = new Map(graph.nodes.map((node, i) => [node.id, i]));
  const v = graph.nodes.length;
  const arcs = [];
  graph.edges.forEach((edge) => {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) return;
    arcs.push([from, to]);
    // A self-loop is one cell and one list entry either way — mirroring it
    // would count the same arc twice.
    if (!directed && from !== to) arcs.push([to, from]);
  });

  const measured = measureBoth(v, arcs, { queries: Infinity });
  const pairs = directed ? v * (v - 1) : (v * (v - 1)) / 2;
  return {
    ...measured,
    e: graph.edges.length,
    directed,
    density: pairs > 0 ? graph.edges.length / pairs : 0,
  };
}

// ---------------------------------------------------------------------
// the sweep
// ---------------------------------------------------------------------

/**
 * A random undirected graph with `edges` edges, as an arc list.
 *
 * A spanning tree first, then extra edges on top, so even the sparsest setting
 * is a connected graph rather than a scattering of isolated vertices — the
 * costs are the same either way, but a disconnected "tree" would be a lie in
 * the label. Near-complete graphs are dealt from the full pair list instead,
 * because rejection sampling for the last few pairs of a complete graph takes
 * arbitrarily long.
 */
function randomArcs(v, edges, rand) {
  const maxPairs = (v * (v - 1)) / 2;
  const target = Math.max(0, Math.min(edges, maxPairs));
  const pairs = [];

  if (target >= maxPairs * 0.6) {
    for (let i = 0; i < v; i++) {
      for (let j = i + 1; j < v; j++) pairs.push([i, j]);
    }
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    pairs.length = target;
  } else {
    const seen = new Set();
    const add = (a, b) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (a === b || seen.has(key)) return false;
      seen.add(key);
      pairs.push([a, b]);
      return true;
    };
    for (let i = 1; i < v && pairs.length < target; i++) add(Math.floor(rand() * i), i);
    let guard = 0;
    while (pairs.length < target && guard < target * 40) {
      add(Math.floor(rand() * v), Math.floor(rand() * v));
      guard += 1;
    }
  }

  const arcs = [];
  pairs.forEach(([a, b]) => {
    arcs.push([a, b]);
    arcs.push([b, a]);
  });
  return arcs;
}

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Both representations of the same graph at growing V, at one density.
 *
 * Density is held fixed and V varies, because that is the axis on which the
 * two diverge: at a fixed average degree the list grows with V and the matrix
 * with V², so the gap is not a constant factor, it is a different curve.
 */
export async function runRepresentationSweep({
  density = "sparse",
  maxV = 128,
  seed = 1,
  onProgress,
  token = {},
}) {
  const sizes = sizesUpTo(maxV);
  const spec = DENSITY_MAP[density] || DENSITIES[0];
  const series = { matrix: [], list: [] };
  let done = 0;

  for (const v of sizes) {
    if (token.cancelled) return null;
    const rand = makeRng((seed >>> 0) + v * 7919);
    const edges = Math.round(spec.edgesFor(v));
    const measured = measureBoth(v, randomArcs(v, edges, rand), { seed: (seed >>> 0) + v });

    REPRESENTATIONS.forEach((repr) => {
      series[repr.key].push({
        v,
        edges: measured.arcs / 2,
        memory: measured.memory[repr.key],
        query: measured.query[repr.key],
        scan: measured.scan[repr.key],
        worstQuery: measured.worstQuery[repr.key],
      });
    });

    done += 1;
    onProgress?.(done / sizes.length, v);
    await yieldToUi();
  }

  return { sizes, series, density, seed };
}

/** The two shapes every measure here lands on: V² and V + 2E. */
export const COST_MODELS = [
  { key: "v2", label: "V²", color: "var(--blue)", f: (v) => v * v },
  { key: "v", label: "V", color: "var(--primary)", f: (v) => v },
];
