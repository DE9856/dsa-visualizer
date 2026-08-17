import { isLeaf } from "../dataStructures/twoThreeTree/helpers";
import { INITIAL_CAPACITY as HASH_INITIAL_CAPACITY } from "../dataStructures/hashTable/helpers";
import { parseWordList } from "../dataStructures/trie/helpers";

/**
 * URL state — the current topic and its data round-trip through the location
 * hash, so a link is enough to hand someone the exact setup on your screen.
 *
 * The hash carries the same text the sidebar's custom-data boxes accept, so a
 * shared link stays readable and hand-editable:
 *
 *   #v=sorting&algo=quick&a=5,3,8,1
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
 *
 * The hash is written with replaceState, so it tracks the current data without
 * filling up browser history. It is read once, on load — editing the hash by
 * hand afterwards needs a reload to take effect.
 */

const VIEWS = [
  "sorting",
  "searching",
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
];

const LIST_TYPES = ["singly", "doubly", "circular"];
const TREE_TYPES = ["binary", "bst", "avl", "threaded"];
const THREAD_MODES = ["double", "single"];
const HASH_STRATEGIES = ["chaining", "linear", "quadratic", "double", "robinhood", "cuckoo"];
const HASH_FUNCTIONS = ["division", "multiplication", "midsquare", "folding"];
const DYNAMIC_KINDS = ["extendible", "linear"];
const HEAP_KINDS = ["max", "min"];

// Values are capped to the same limits the sidebar parsers use, so a
// hand-edited link can't build something the app wouldn't let you type.
const MAX_VALUES = 40;
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

// 2-3 tree nodes hold one or two keys; taking them level by level puts the
// upper nodes in first, which rebuilds the same shape.
function serializeTwoThree(root) {
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

/** The hash fields describing what the given view currently holds. */
function fieldsFor(view, s) {
  switch (view) {
    case "sorting":
      return { v: view, algo: s.v.algo, a: s.v.array.join(",") };
    case "searching":
      return { v: view, algo: s.v.algo, a: s.v.array.join(","), t: s.v.target ?? undefined };
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
      return { v: view, a: serializeTwoThree(s.tt.tree.root) };
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
