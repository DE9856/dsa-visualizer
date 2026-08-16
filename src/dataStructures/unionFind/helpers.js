/**
 * Union-Find (disjoint set union). Two arrays and nothing else:
 *
 *   parent[i] — the element above i, or i itself if i is a root
 *   size[i]   — how many elements are in i's tree (only meaningful at a root)
 *
 * A "set" is a tree, and two elements are in the same set exactly when they
 * walk up to the same root. Both optimizations that make this fast are about
 * keeping those trees short: union by size never puts a larger tree under a
 * smaller one, and path compression re-points everything it walks past
 * straight at the root, so the walk pays for itself.
 */

export const MAX_ELEMENTS = 12;
const LABELS = "ABCDEFGHIJKL";

export const labelOf = (i) => LABELS[i] ?? `#${i}`;

export function emptyUnionFind(n) {
  const count = Math.min(Math.max(n, 1), MAX_ELEMENTS);
  return {
    n: count,
    parent: Array.from({ length: count }, (_, i) => i),
    size: Array.from({ length: count }, () => 1),
  };
}

export const cloneUnionFind = (uf) => ({ n: uf.n, parent: [...uf.parent], size: [...uf.size] });

/** A step frame: the whole forest, plus what this step is highlighting. */
export const frame = (uf, extra) => ({ n: uf.n, parent: [...uf.parent], size: [...uf.size], ...extra });

export const isRoot = (uf, i) => uf.parent[i] === i;

/** The chain from i up to its root, i first. No compression, no frames. */
export function pathToRoot(uf, i) {
  const path = [i];
  let x = i;
  // n hops is more than any valid forest needs; the bound stops a malformed
  // parent array (from a hand-edited link) from spinning forever.
  for (let guard = 0; guard <= uf.n && !isRoot(uf, x); guard++) {
    x = uf.parent[x];
    path.push(x);
  }
  return path;
}

export const rootOf = (uf, i) => pathToRoot(uf, i).at(-1);

/** Children of each element, ascending — the forest the canvas draws. */
export function childrenOf(uf) {
  const kids = Array.from({ length: uf.n }, () => []);
  for (let i = 0; i < uf.n; i++) {
    if (!isRoot(uf, i)) kids[uf.parent[i]].push(i);
  }
  return kids;
}

export const rootsOf = (uf) => Array.from({ length: uf.n }, (_, i) => i).filter((i) => isRoot(uf, i));

/** Each set as { root, members }, in root order. */
export function componentsOf(uf) {
  const groups = new Map();
  for (let i = 0; i < uf.n; i++) {
    const root = rootOf(uf, i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }
  return [...groups.entries()]
    .map(([root, members]) => ({ root, members }))
    .sort((a, b) => a.root - b.root);
}

/** Recomputes every root's size from the parent array. */
export function recomputeSizes(uf) {
  const size = Array.from({ length: uf.n }, () => 1);
  for (const { root, members } of componentsOf(uf)) size[root] = members.length;
  return { ...uf, size };
}

// ---------------------------------------------------------------------
// the two operations, with frames
// ---------------------------------------------------------------------

/**
 * Walks from `i` to its root, then compresses the path — every element the
 * walk touched is re-pointed straight at the root, so the next find on any of
 * them is a single hop. Mutates `uf` and pushes a frame per hop and per
 * re-point. Returns the root.
 */
export function findWithSteps(uf, i, steps, base = {}) {
  const path = pathToRoot(uf, i);
  const root = path.at(-1);

  for (let step = 0; step < path.length; step++) {
    const node = path[step];
    if (node === root) break;
    steps.push(
      frame(uf, {
        ...base,
        current: node,
        path: path.slice(0, step + 1),
        message: `parent[${labelOf(node)}] = ${labelOf(uf.parent[node])} — not a root, so hop up`,
      })
    );
  }

  steps.push(
    frame(uf, {
      ...base,
      current: root,
      root,
      path,
      message:
        path.length === 1
          ? `${labelOf(root)} is its own parent — it is already a root`
          : `${labelOf(root)} is its own parent — that is the root of ${labelOf(i)}'s set, ${path.length - 1} hop${path.length === 2 ? "" : "s"} up`,
    })
  );

  // Everything except the root and the element directly below it gains from
  // being re-pointed; re-pointing all of them keeps the rule simple.
  const toCompress = path.slice(0, -1).filter((node) => uf.parent[node] !== root);

  for (const node of toCompress) {
    uf.parent[node] = root;
    steps.push(
      frame(uf, {
        ...base,
        current: node,
        root,
        path,
        compressed: [node],
        message: `Path compression: point ${labelOf(node)} straight at ${labelOf(root)} — the walk already knows the answer, so record it`,
      })
    );
  }

  return root;
}

/** Links two roots, smaller tree under larger. Returns the surviving root. */
export function linkRoots(uf, ra, rb) {
  const [big, small] = uf.size[ra] >= uf.size[rb] ? [ra, rb] : [rb, ra];
  uf.parent[small] = big;
  uf.size[big] += uf.size[small];
  return big;
}

// ---------------------------------------------------------------------
// the silent API — used by Kruskal's MST
// ---------------------------------------------------------------------

/**
 * The same structure keyed by arbitrary ids rather than array indices, with no
 * frames. Kruskal's uses this for its cycle check; the visualizer above is the
 * same algorithm with the steps written down.
 */
export function makeUnionFind(ids) {
  const parent = Object.fromEntries(ids.map((id) => [id, id]));
  const size = Object.fromEntries(ids.map((id) => [id, 1]));

  const find = (x) => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) {
      const next = parent[x];
      parent[x] = root;
      x = next;
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
    return true;
  };

  const connected = (a, b) => find(a) === find(b);

  return { find, union, connected };
}

// ---------------------------------------------------------------------
// building
// ---------------------------------------------------------------------

/** Applies union pairs silently — used by shuffles and shared links. */
export function buildUnionFind(n, pairs = []) {
  const uf = emptyUnionFind(n);
  for (const [a, b] of pairs) {
    if (a < 0 || b < 0 || a >= uf.n || b >= uf.n) continue;
    const ra = rootOf(uf, a);
    const rb = rootOf(uf, b);
    if (ra !== rb) linkRoots(uf, ra, rb);
  }
  return uf;
}

export function randomUnionFind() {
  const n = 8 + Math.floor(Math.random() * 3);
  const pairs = [];
  const unions = 3 + Math.floor(Math.random() * 3);
  for (let k = 0; k < unions; k++) {
    pairs.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
  }
  return buildUnionFind(n, pairs);
}

/**
 * Rebuilds from a parent array, e.g. from a shared link. Anything that isn't a
 * valid forest — an out-of-range parent, or a cycle — falls back to singletons.
 */
export function fromParentArray(parent) {
  const n = Math.min(parent.length, MAX_ELEMENTS);
  if (n === 0) return emptyUnionFind(1);

  const clipped = parent.slice(0, n);
  if (clipped.some((p) => !Number.isInteger(p) || p < 0 || p >= n)) return emptyUnionFind(n);

  const candidate = { n, parent: clipped, size: Array.from({ length: n }, () => 1) };
  for (let i = 0; i < n; i++) {
    // pathToRoot stops after n hops; if it did not land on a root, i is in a
    // cycle and the array is not a forest.
    const end = pathToRoot(candidate, i).at(-1);
    if (!isRoot(candidate, end)) return emptyUnionFind(n);
  }

  return recomputeSizes(candidate);
}

/** Parses the element-count box. */
export function parseElementCount(input, fallback = 8) {
  const n = parseInt(String(input).trim(), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, 2), MAX_ELEMENTS);
}

/** Parses an element name ("A", "b", "3") into an index, or -1. */
export function parseElement(input, n) {
  const text = String(input).trim().toUpperCase();
  if (!text) return -1;
  const byLabel = LABELS.indexOf(text);
  if (byLabel >= 0 && byLabel < n) return byLabel;
  const byNumber = parseInt(text, 10);
  if (!Number.isNaN(byNumber) && byNumber >= 0 && byNumber < n) return byNumber;
  return -1;
}
