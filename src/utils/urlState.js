import { isLeaf } from "../dataStructures/twoThreeTree/helpers";
import { INITIAL_CAPACITY as HASH_INITIAL_CAPACITY } from "../dataStructures/hashTable/helpers";
import { parseWordList } from "../dataStructures/trie/helpers";
import { ALGO_MAP, SORT_KEYS } from "../algorithms";
import { DISTRIBUTION_KEYS } from "./distributions";
import { ORDER_KEYS } from "../dataStructures/tree/compare";
import { DP_KEYS, DP_PROBLEM_MAP } from "../algorithms/dp";
import { BT_KEYS, BT_PROBLEM_MAP } from "../algorithms/backtracking";
import { STRING_ALGO_MAP, STRING_KEYS } from "../algorithms/strings";
import { GREEDY_ALGO_MAP, GREEDY_KEYS } from "../algorithms/greedy";

/**
 * URL state — the current topic and its data round-trip through the location
 * hash, so a link is enough to hand someone the exact setup on your screen.
 *
 * The hash carries the same text the sidebar's custom-data boxes accept, so a
 * shared link stays readable and hand-editable:
 *
 *   #v=sorting&algo=quick&a=5,3,8,1
 *   #v=sorting&algo=quick&sh=sorted&n=18&sd=7&q=quick.pivot:median3
 *   #v=race&algos=insertion,merge,quick&sh=nearly&n=24&sd=7&sy=op
 *   #v=treecompare&ord=sorted&n=15&sd=7&st=1
 *   #v=searching&algo=binary&a=5,3,8,1&t=8
 *   #v=linkedlist&type=doubly&a=5,12,3
 *   #v=tree&type=avl&a=50,30,70
 *   #v=tree&type=threaded&tm=single&a=50,30,70
 *   #v=hashtable&type=linear&a=42,13,7
 *   #v=hashtable&type=cuckoo&hf=midsquare&a=42,13,7
 *   #v=dynamichash&type=extendible&a=12,5,30,3
 *   #v=heap&type=min&a=4,10,3,5,1
 *   #v=trie&a=car,card,care,cat
 *   #v=unionfind&p=0,0,2,0,4,4
 *   #v=graph&d=1&w=1&g=A: B(5), C; B: C; D:
 *   #v=graph&g=A,B,C&e=A-B,B-C&xy=A:0.2:0.15,C:0.75:0.8
 *   #v=dp&type=lcs&a=AGCAT&b=GAC
 *   #v=dp&type=knapsack&it=2:3, 3:4, 4:5&cap=8
 *   #v=bt&type=queens&n=6&md=first
 *   #v=bt&type=subset&nums=3, 34, 4, 12&tg=9&md=all
 *   #v=str&type=kmp&t=ABABDABACDABABCABAB&p=ABABCABAB
 *   #v=rangequery&type=segment&cb=min&a=5,2,9,1,7,3,8,4
 *   #v=huffman&t=ABRACADABRA
 *   #v=btree&type=bplus&ord=4&a=10,20,5,6,12
 *
 * The hash is written with replaceState, so it tracks the current data without
 * filling up browser history. It is read once, on load — editing the hash by
 * hand afterwards needs a reload to take effect.
 */

const VIEWS = [
  "sorting",
  "searching",
  "race",
  "treecompare",
  "linkedlist",
  "polynomial",
  "stack",
  "queue",
  "graph",
  "tree",
  "twothree",
  "hashtable",
  "dynamichash",
  "heap",
  "trie",
  "unionfind",
  "dp",
  "bt",
  "str",
  "rangequery",
  "huffman",
  "btree",
  "greedy",
];

// The activity list is the longest greedy field; this is comfortably above it.
const MAX_GREEDY_INPUT = 120;

const LIST_TYPES = ["singly", "doubly", "circular"];
const TREE_TYPES = ["binary", "bst", "avl", "threaded", "redblack", "splay", "treap"];
const THREAD_MODES = ["double", "single"];
const BTREE_ORDERS = [3, 4, 5];
const HASH_STRATEGIES = ["chaining", "linear", "quadratic", "double", "robinhood", "cuckoo"];
const HASH_FUNCTIONS = ["division", "multiplication", "midsquare", "folding"];
const DYNAMIC_KINDS = ["extendible", "linear"];
const HEAP_KINDS = ["max", "min"];

// A DP problem's inputs are the raw text its sidebar boxes hold, so they can
// travel as themselves. One short hash key per field, and only the fields the
// named problem actually declares are read or written — a link to LCS has no
// business naming a bag capacity.
const STRING_FIELD_KEYS = { text: "t", pattern: "p" };

// Short keys keep the hash readable. `b` is taken by the gcd pair, so the
// knapsack's capacity is `cap` rather than the obvious `c`.
const GREEDY_FIELD_KEYS = {
  activities: "act",
  items: "it",
  capacity: "cap",
  limit: "lim",
  base: "base",
  exponent: "exp",
  modulus: "mod",
  a: "a1",
  b: "b1",
};

const BT_FIELD_KEYS = {
  n: "n",
  mode: "md",
  puzzle: "gr",
  numbers: "nums",
  target: "tg",
  values: "vals",
};

const DP_FIELD_KEYS = {
  stringA: "a",
  stringB: "b",
  items: "it",
  capacity: "cap",
  coins: "co",
  amount: "amt",
  sequence: "sq",
  dims: "dm",
};

// Values are capped to the same limits the sidebar parsers use, so a
// hand-edited link can't build something the app wouldn't let you type.
const MAX_VALUES = 40;
const MAX_LANES = 4;
const MAX_TEXT = 600;

// encodeURIComponent escapes plenty that is perfectly legal in a fragment.
// Putting commas, colons, semicolons and spaces back makes shared links
// readable; & and = stay escaped because they separate our own fields.
function enc(value) {
  return encodeURIComponent(String(value))
    .replace(/%2C/g, ",")
    .replace(/%3A/g, ":")
    .replace(/%3B/g, ";")
    .replace(/%20/g, " ");
}

function dec(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    // A truncated or mangled escape shouldn't take the whole link down.
    return value;
  }
}

function parseHash(hash) {
  const raw = hash.replace(/^#/, "");
  if (!raw) return null;
  const fields = {};
  for (const part of raw.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    fields[dec(part.slice(0, eq))] = dec(part.slice(eq + 1));
  }
  return fields;
}

function buildHash(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${enc(value)}`)
    .join("&");
}

function parseValues(text) {
  if (typeof text !== "string") return [];
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .slice(0, MAX_VALUES);
}

// ---------------------------------------------------------------------
// serializing what's on screen
// ---------------------------------------------------------------------

const nodeValues = (nodes) => (nodes || []).map((n) => n.value).join(",");

// Any ordered tree (BST, AVL, threaded) rebuilds exactly from its preorder,
// since inserting a parent before its children reproduces the same shape —
// and a threaded tree's threads follow from that shape.
function preorderValues(node, out = []) {
  if (!node) return out;
  out.push(node.value);
  preorderValues(node.left, out);
  preorderValues(node.right, out);
  return out;
}

// A plain binary tree is filled level by level, so level order is what
// rebuilds it.
function levelOrderValues(root) {
  const out = [];
  const queue = root ? [root] : [];
  while (queue.length) {
    const node = queue.shift();
    out.push(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return out;
}

function serializeTree(root, treeType) {
  const values = treeType === "binary" ? levelOrderValues(root) : preorderValues(root);
  return values.join(",");
}

// A 2-3 or B-tree node holds several keys; taking them level by level puts the
// upper nodes in first, which rebuilds the same shape. (A B+ tree repeats its
// separators in the leaves, and parseValueList drops the repeats.)
function serializeMultiway(root) {
  const out = [];
  const queue = root ? [root] : [];
  while (queue.length) {
    const node = queue.shift();
    out.push(...node.keys);
    if (!isLeaf(node)) queue.push(...node.children);
  }
  return out.join(",");
}

// Vertices and edges are listed separately, each in its own order: vertices so
// isolated ones survive and the ring layout comes back the same, edges so the
// adjacency panel lists them the way it did before.
const serializeVertices = (graph) => (graph?.nodes || []).map((n) => n.label).join(",");

function serializeEdges(graph) {
  if (!graph) return "";
  const labelById = Object.fromEntries(graph.nodes.map((n) => [n.id, n.label]));
  return graph.edges
    .map((e) => {
      const from = labelById[e.from];
      const to = labelById[e.to];
      if (!from || !to) return null;
      return e.weight && e.weight !== 1 ? `${from}-${to}(${e.weight})` : `${from}-${to}`;
    })
    .filter(Boolean)
    .join(",");
}

/** Parses the edge field: "A-B(5),B-C" -> [{ from, to, weight }]. */
export function parseSharedEdges(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => {
      const match = token.match(/^(.+?)-(.+?)(?:\((-?\d+(?:\.\d+)?)\))?$/);
      if (!match) return null;
      return { from: match[1].trim(), to: match[2].trim(), weight: match[3] ? Number(match[3]) : 1 };
    })
    .filter(Boolean)
    .slice(0, MAX_VALUES);
}

// Only the vertices the user actually dragged are listed, so a graph left on
// the default ring adds nothing to the link at all. Three decimals puts the
// rounding error under a pixel on either canvas, and Number() drops the
// trailing zeros that toFixed leaves behind.
const roundPos = (n) => String(Number(n.toFixed(3)));

function serializePositions(graph, positions) {
  if (!graph || !positions) return "";
  return graph.nodes
    .filter((n) => positions[n.id])
    .map((n) => `${n.label}:${roundPos(positions[n.id].nx)}:${roundPos(positions[n.id].ny)}`)
    .join(",");
}

/**
 * Parses the layout field: "A:0.12:0.34,C:0.8:0.2" -> { A: { nx, ny }, ... }.
 * Keyed by label, like the vertex and edge fields — vertex ids are per-session
 * counters and would mean nothing in someone else's tab.
 */
export function parseSharedPositions(text) {
  const out = {};
  String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_VALUES)
    .forEach((token) => {
      const [label, xPart, yPart, ...rest] = token.split(":");
      if (!label || rest.length) return;
      const nx = Number(xPart);
      const ny = Number(yPart);
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;
      // A fraction of the canvas, so anything outside 0..1 is off-screen.
      out[label.trim()] = { nx: Math.min(1, Math.max(0, nx)), ny: Math.min(1, Math.max(0, ny)) };
    });
  return out;
}

/** Parses the vertex field: "A,B,C" -> ["A", "B", "C"]. */
export function parseSharedVertices(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_VALUES);
}

/**
 * Variant choices, qualified by algorithm so one field covers both the single
 * view (one algorithm) and the race (up to four): "quick.pivot:median3".
 */
function serializeVariants(variants) {
  return Object.entries(variants || {})
    .flatMap(([algoKey, chosen]) =>
      Object.entries(chosen || {}).map(([variantKey, value]) => `${algoKey}.${variantKey}:${value}`)
    )
    .join(",");
}

/**
 * Parses the variant field. Only choices the registry actually declares
 * survive, so a hand-edited link can't name a pivot rule quick sort doesn't
 * have — it just falls back to the default.
 */
export function parseSharedVariants(text) {
  const out = {};
  String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_VALUES)
    .forEach((token) => {
      const match = token.match(/^([A-Za-z]+)\.([A-Za-z]+):([A-Za-z0-9]+)$/);
      if (!match) return;
      const [, algoKey, variantKey, value] = match;
      const variant = ALGO_MAP[algoKey]?.variants?.find((v) => v.key === variantKey);
      if (!variant || !variant.options.some((o) => o.key === value)) return;
      out[algoKey] = { ...(out[algoKey] || {}), [variantKey]: value };
    });
  return out;
}

/** The hash fields describing what the given view currently holds. */
function fieldsFor(view, s) {
  switch (view) {
    // The array travels literally, since that is the exact data someone meant
    // to share. The shape and seed ride along anyway so the sidebar comes back
    // saying what the array *is*, and so NEW ARRAY re-rolls the same shape.
    case "sorting":
      return {
        v: view,
        algo: s.v.algo,
        a: s.v.array.join(","),
        sh: s.v.distribution === "custom" ? undefined : s.v.distribution,
        sd: s.v.distribution === "custom" ? undefined : s.v.seed,
        q: serializeVariants(s.v.variants),
        st: s.v.showTags ? "1" : undefined,
      };
    case "searching":
      return {
        v: view,
        algo: s.v.algo,
        a: s.v.array.join(","),
        t: s.v.target ?? undefined,
        sh: s.v.distribution === "custom" ? undefined : s.v.distribution,
        sd: s.v.distribution === "custom" ? undefined : s.v.seed,
      };
    // The keys are a permutation of 1..n decided by the order and (for the
    // random one) the seed, so naming those three rebuilds them exactly.
    case "treecompare":
      return { v: view, ord: s.tcmp.order, n: s.tcmp.size, sd: s.tcmp.seed };
    // A race carries no array: the shape and the seed rebuild it exactly, and
    // listing 40 values would drown out the part that matters (which sorts).
    case "race":
      return {
        v: view,
        algos: s.race.algos.join(","),
        sh: s.race.distribution,
        n: s.race.size,
        sd: s.race.seed,
        sy: s.race.syncMode,
        st: s.race.showTags ? "1" : undefined,
        q: serializeVariants(s.race.variants),
      };
    case "linkedlist":
      return { v: view, type: s.ll.listType, a: nodeValues(s.ll.list) };
    case "polynomial":
      return { v: view, p: s.poly.polyInput };
    case "stack":
      return { v: view, a: nodeValues(s.st.stack) };
    case "queue":
      return { v: view, a: nodeValues(s.q.queue) };
    // `tm` only means anything to a threaded tree, so it travels with one.
    case "tree":
      return {
        v: view,
        type: s.tr.treeType,
        a: serializeTree(s.tr.tree.root, s.tr.treeType),
        tm: s.tr.treeType === "threaded" ? s.tr.threadMode : undefined,
      };
    case "twothree":
      return { v: view, a: serializeMultiway(s.tt.tree.root) };
    // Insertion order, not bucket order: with probing, the order keys arrive
    // in is what decides where the collisions land. Capacity travels too — a
    // table that grew and then had keys deleted is bigger than its key count
    // alone would rebuild.
    case "hashtable":
      return {
        v: view,
        type: s.ht.strategy,
        // The hash function is the other half of where a key lands, so it
        // travels too — but only when it isn't the default.
        hf: s.ht.hashFn === "division" ? undefined : s.ht.hashFn,
        a: s.ht.table.order.join(","),
        m: s.ht.table.capacity === HASH_INITIAL_CAPACITY ? undefined : s.ht.table.capacity,
      };
    // Both dynamic schemes grow one split at a time, so the arrival order is
    // the whole shape — no capacity to carry alongside it.
    case "dynamichash":
      return { v: view, type: s.dh.kind, a: s.dh.table.order.join(",") };
    // Array order is the heap itself, so re-heapifying it on load is a no-op
    // and the shape comes back exactly.
    case "heap":
      return { v: view, type: s.hp.kind, a: s.hp.values.join(",") };
    // A trie's shape depends only on which words it holds, not the order they
    // arrived in, so the alphabetical list rebuilds it exactly.
    case "trie":
      return { v: view, a: s.tri.words.join(",") };
    // The parent array is the structure — sizes are recomputed from it, and
    // compression state is part of what makes a given forest interesting.
    case "unionfind":
      return { v: view, p: s.uf.uf.parent.join(",") };
    // `xy` carries only the vertices dragged off the ring, so it is absent
    // from the link of a graph nobody has rearranged.
    case "graph":
      return {
        v: view,
        d: s.gr.directed ? "1" : undefined,
        w: s.gr.weighted ? "1" : undefined,
        g: serializeVertices(s.gr.graph),
        e: serializeEdges(s.gr.graph),
        xy: serializePositions(s.gr.graph, s.gr.positions),
      };
    // Only the active problem's own fields, as the text the sidebar holds.
    // Every one of them is re-parsed on the way back in by the same parser the
    // sidebar uses, which is what caps a hand-edited link to a table the app
    // would have drawn anyway.
    case "dp":
      return {
        v: view,
        type: s.dp.problem,
        ...Object.fromEntries(
          s.dp.meta.fields.map((field) => [DP_FIELD_KEYS[field], s.dp.activeInputs[field]])
        ),
      };
    // Same as the DP view: the problem, then only the fields it declares, as
    // the text its own boxes hold.
    case "bt":
      return {
        v: view,
        type: s.bt.problem,
        ...Object.fromEntries(
          s.bt.meta.fields.map((field) => [BT_FIELD_KEYS[field], s.bt.activeInputs[field]])
        ),
      };
    // The array is the structure; the kind and combine are how it is read.
    case "huffman":
      return { v: view, t: s.hf.text };
    // Order and variant decide the shape, so both travel with the keys.
    case "btree":
      return { v: view, type: s.btr.variant, ord: String(s.btr.order), a: serializeMultiway(s.btr.root) };
    case "rangequery":
      return { v: view, type: s.rq.kind, cb: s.rq.combine === "sum" ? undefined : s.rq.combine, a: s.rq.values.join(",") };
    case "str":
      return {
        v: view,
        type: s.str.algo,
        ...Object.fromEntries(
          s.str.meta.fields.map((field) => [STRING_FIELD_KEYS[field], s.str.activeInputs[field]])
        ),
      };
    case "greedy":
      return {
        v: view,
        type: s.grd.algo,
        ...Object.fromEntries(
          s.grd.meta.fields.map((field) => [GREEDY_FIELD_KEYS[field], s.grd.activeInputs[field]])
        ),
      };
    default:
      return { v: view };
  }
}

// ---------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------

/**
 * The shared setup in the current URL, or null for a normal visit. Everything
 * is validated here — a hand-edited link can only ever produce a setup the app
 * could have made itself.
 */
export function readSharedState() {
  if (typeof window === "undefined") return null;
  const fields = parseHash(window.location.hash);
  if (!fields || !VIEWS.includes(fields.v)) return null;

  const view = fields.v;
  const state = { view };
  const values = parseValues(fields.a);

  if (view === "sorting" || view === "searching") {
    if (fields.algo) state.algo = fields.algo; // checked against the registry in useVisualizer
    if (values.length >= 2) state.values = values;
    const target = Number(fields.t);
    if (fields.t !== undefined && !Number.isNaN(target)) state.target = target;
    if (DISTRIBUTION_KEYS.includes(fields.sh)) state.distribution = fields.sh;
    const seed = Number(fields.sd);
    if (Number.isInteger(seed) && seed >= 0) state.seed = seed;
    if (fields.q) state.variants = parseSharedVariants(fields.q);
    state.showTags = fields.st === "1";
  } else if (view === "race") {
    // Lanes must be sorting algorithms that can actually race; useRace tops
    // the list back up if a link names too few.
    const algos = parseSharedVertices(fields.algos || "")
      .filter((key) => SORT_KEYS.includes(key))
      .slice(0, MAX_LANES);
    if (algos.length) state.algos = algos;
    if (DISTRIBUTION_KEYS.includes(fields.sh)) state.distribution = fields.sh;
    const size = Number(fields.n);
    if (Number.isInteger(size) && size >= 2 && size <= MAX_VALUES) state.size = size;
    const seed = Number(fields.sd);
    if (Number.isInteger(seed) && seed >= 0) state.seed = seed;
    if (fields.sy === "op" || fields.sy === "frame") state.syncMode = fields.sy;
    if (fields.q) state.variants = parseSharedVariants(fields.q);
    state.showTags = fields.st === "1";
  } else if (view === "treecompare") {
    if (ORDER_KEYS.includes(fields.ord)) state.order = fields.ord;
    const size = Number(fields.n);
    if (Number.isInteger(size) && size >= 2 && size <= MAX_VALUES) state.size = size;
    const seed = Number(fields.sd);
    if (Number.isInteger(seed) && seed >= 0) state.seed = seed;
  } else if (view === "polynomial") {
    if (fields.p) state.poly = fields.p.slice(0, MAX_TEXT);
  } else if (view === "unionfind") {
    // Every entry must be a whole number: dropping a malformed one would shift
    // every element after it onto the wrong parent. fromParentArray() then
    // checks the result really is a forest.
    if (fields.p) {
      const parent = fields.p.split(",").map((part) => Number(part.trim()));
      if (parent.every((value) => Number.isInteger(value))) state.parent = parent.slice(0, MAX_VALUES);
    }
  } else if (view === "trie") {
    // Words, not numbers — validated by the same parser the sidebar uses.
    const words = parseWordList((fields.a || "").slice(0, MAX_TEXT));
    if (words.length) state.words = words;
  } else if (view === "dp") {
    if (DP_KEYS.includes(fields.type)) state.problem = fields.type;
    const problem = DP_PROBLEM_MAP[state.problem || DP_KEYS[0]];
    const inputs = {};
    problem.fields.forEach((field) => {
      const raw = fields[DP_FIELD_KEYS[field]];
      if (typeof raw === "string") inputs[field] = raw.slice(0, MAX_TEXT);
    });
    if (Object.keys(inputs).length) state.inputs = inputs;
  } else if (view === "bt") {
    if (BT_KEYS.includes(fields.type)) state.problem = fields.type;
    const problem = BT_PROBLEM_MAP[state.problem || BT_KEYS[0]];
    const inputs = {};
    problem.fields.forEach((field) => {
      const raw = fields[BT_FIELD_KEYS[field]];
      if (typeof raw === "string") inputs[field] = raw.slice(0, MAX_TEXT);
    });
    if (Object.keys(inputs).length) state.inputs = inputs;
  } else if (view === "str") {
    if (STRING_KEYS.includes(fields.type)) state.algo = fields.type;
    const algo = STRING_ALGO_MAP[state.algo || STRING_KEYS[0]];
    const inputs = {};
    algo.fields.forEach((field) => {
      const raw = fields[STRING_FIELD_KEYS[field]];
      if (typeof raw === "string") inputs[field] = raw.slice(0, MAX_TEXT);
    });
    if (Object.keys(inputs).length) state.inputs = inputs;
  } else if (view === "greedy") {
    if (GREEDY_KEYS.includes(fields.type)) state.algo = fields.type;
    const algo = GREEDY_ALGO_MAP[state.algo || GREEDY_KEYS[0]];
    const inputs = {};
    algo.fields.forEach((field) => {
      const raw = fields[GREEDY_FIELD_KEYS[field]];
      // Length is capped here and the value is validated by the algorithm's own
      // `parse` before it runs, so a hand-edited link can only ever produce a
      // setup the app could have built itself.
      if (typeof raw === "string") inputs[field] = raw.slice(0, MAX_GREEDY_INPUT);
    });
    if (Object.keys(inputs).length) state.inputs = inputs;
  } else if (view === "btree") {
    if (values.length) state.values = values;
    if (fields.type === "btree" || fields.type === "bplus") state.variant = fields.type;
    const order = parseInt(fields.ord, 10);
    if (BTREE_ORDERS.includes(order)) state.order = order;
  } else if (view === "huffman") {
    if (typeof fields.t === "string" && fields.t.trim()) state.text = fields.t.slice(0, MAX_TEXT);
  } else if (view === "rangequery") {
    if (values.length) state.values = values;
    if (fields.type === "segment" || fields.type === "fenwick") state.kind = fields.type;
    if (["sum", "min", "max"].includes(fields.cb)) state.combine = fields.cb;
  } else if (view === "graph") {
    if (fields.g !== undefined) {
      state.vertices = parseSharedVertices(fields.g.slice(0, MAX_TEXT));
      state.edges = parseSharedEdges((fields.e || "").slice(0, MAX_TEXT));
      // Labels naming a vertex the link doesn't declare are simply never
      // matched up, so they fall back to the ring like any other.
      state.positions = parseSharedPositions((fields.xy || "").slice(0, MAX_TEXT));
    }
    state.directed = fields.d === "1";
    state.weighted = fields.w === "1";
  } else {
    if (values.length) state.values = values;
    if (view === "linkedlist" && LIST_TYPES.includes(fields.type)) state.listType = fields.type;
    if (view === "tree") {
      if (TREE_TYPES.includes(fields.type)) state.treeType = fields.type;
      if (THREAD_MODES.includes(fields.tm)) state.threadMode = fields.tm;
    }
    if (view === "heap" && HEAP_KINDS.includes(fields.type)) state.kind = fields.type;
    if (view === "dynamichash" && DYNAMIC_KINDS.includes(fields.type)) state.kind = fields.type;
    if (view === "hashtable") {
      if (HASH_STRATEGIES.includes(fields.type)) state.strategy = fields.type;
      if (HASH_FUNCTIONS.includes(fields.hf)) state.hashFn = fields.hf;
      // Only a capacity the table could have grown into is accepted; anything
      // else falls back to the default and grows from there.
      const capacity = Number(fields.m);
      if (Number.isInteger(capacity) && capacity > 0) state.capacity = capacity;
    }
  }

  return state;
}

/**
 * The hash describing what's on screen. A plain string, so it doubles as the
 * change-detection key for the effect that writes it.
 */
export function shareHashFor(view, sources) {
  return buildHash(fieldsFor(view, sources));
}

/**
 * Points the address bar at the current data without touching history, so the
 * link is always there to copy and the back button still leaves the app.
 */
/**
 * The hash this visit arrived with, if it was meant to open something and
 * can't — otherwise null.
 *
 * A visit with no hash at all is an ordinary one and belongs on the landing
 * page. A hash that names a view this build has never heard of is a link that
 * has gone wrong somewhere: truncated in a chat window, hand-edited, or made
 * by a version of the app that had a view this one doesn't. Those two used to
 * be indistinguishable — both quietly showed the home page — and the second
 * deserves to be told what happened rather than left to wonder what it
 * clicked. Returned as the raw text so the screen can show it back.
 */
export function unopenableHash() {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  return readSharedState() === null ? raw : null;
}

/**
 * Drops the hash, without a history entry. Leaving a dead link in the address
 * bar would put the reader back on the not-found screen the moment they
 * reloaded or came back to the tab.
 */
export function clearHash() {
  if (typeof window === "undefined" || !window.location.hash) return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

export function replaceHash(hash) {
  const next = `#${hash}`;
  if (next === window.location.hash) return;
  window.history.replaceState(null, "", next);
}

/** The absolute link for a given hash. */
export function buildShareUrl(hash) {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${hash}`;
}
