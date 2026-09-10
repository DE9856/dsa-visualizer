import { nextId } from "../linkedList/nodeId";

/**
 * Selection trees — the tournament that makes a k-way merge cheap.
 *
 * Merging two sorted runs is one comparison per element. Merging k of them
 * the obvious way is k−1 comparisons per element, because every output scans
 * every run's head again — and it re-derives, every single time, a fact that
 * has barely changed: only one run moved. A selection tree remembers the
 * tournament instead. Each leaf is a run, each internal node records the
 * result of a match between its two subtrees, and after an element is output
 * only the matches on one root-to-leaf path can have changed. So the next
 * winner costs ⌈log₂ k⌉ comparisons rather than k−1.
 *
 * There are two ways to record it, and they come out of the same pass:
 *
 *   winner tree   each internal node stores the *winner* beneath it, so the
 *                 root is the overall winner. Replaying a path needs both
 *                 children of each node — one comparison, two node reads.
 *
 *   loser tree    each internal node stores the *loser* of the match played
 *                 there, and the overall winner is kept above the root. Now
 *                 replaying is a plain walk upward: at each node, compare the
 *                 value being carried up against the loser sitting there, and
 *                 the winner of *that* carries on. One comparison, one node
 *                 read, and no sibling indexing at all.
 *
 * Both are stored in one array over a complete binary tree with k leaves, k
 * rounded up to a power of two:
 *
 *   positions 1 .. k-1     internal nodes
 *   position  k + i        the leaf for run i
 *   position  0            unused in a winner tree; the champion in a loser tree
 *
 * The array holds *run indices*, never values — a run's current head can
 * change, and re-storing it everywhere it appears would be the bookkeeping
 * the tree exists to avoid.
 */

export const SELECTION_KINDS = [
  {
    key: "winner",
    label: "Winner Tree",
    short: "WINNER",
    stores: "the winner of each match",
    top: "the root holds the overall winner",
  },
  {
    key: "loser",
    label: "Loser Tree",
    short: "LOSER",
    stores: "the loser of each match",
    top: "the champion is kept above the root, at position 0",
  },
];

export const KIND_MAP = Object.fromEntries(SELECTION_KINDS.map((k) => [k.key, k]));

// Eight runs is four levels of tree drawn with a run under every leaf, which
// is where it stops fitting. The per-run length cap keeps a full merge to a
// sane number of frames.
export const MAX_RUNS = 8;
export const MIN_RUNS = 2;
export const MAX_RUN_LENGTH = 6;

/** A run that has nothing left compares as +∞ and so can never win again. */
export const EXHAUSTED = Infinity;

/** k, rounded up to a power of two — a complete tree needs a full bottom row. */
export function paddedK(count) {
  let k = 1;
  while (k < Math.max(MIN_RUNS, count)) k *= 2;
  return k;
}

export const leafOf = (k, run) => k + run;

/** The run index a tree position stands for: a leaf is its own run. */
export const runAtLeaf = (k, pos) => pos - k;

export const isLeafPos = (k, pos) => pos >= k;

export const headOf = (runs, i) => (runs[i] && runs[i].head < runs[i].values.length ? runs[i].values[runs[i].head] : EXHAUSTED);

export const isSpent = (runs, i) => headOf(runs, i) === EXHAUSTED;

export const showKey = (value) => (value === EXHAUSTED ? "∞" : String(value));

export const showHead = (runs, i) => showKey(headOf(runs, i));

/** Remaining values in run i, head first. */
export const remainingOf = (runs, i) => (runs[i] ? runs[i].values.slice(runs[i].head) : []);

export const totalRemaining = (runs) => runs.reduce((sum, run) => sum + (run.values.length - run.head), 0);

export const emptyTree = (kind) => ({ kind, k: MIN_RUNS, runs: [], tree: [], champion: null, output: [] });

export function cloneState(state) {
  return {
    ...state,
    runs: state.runs.map((run) => ({ ...run, values: [...run.values] })),
    tree: [...state.tree],
    output: [...state.output],
  };
}

// ---------------------------------------------------------------------
// building
// ---------------------------------------------------------------------

/**
 * Does run i beat run j?
 *
 * Ties go to the lower-numbered run, which is what makes the merge stable —
 * and it matters for exhausted runs too, since every one of those offers ∞
 * and they would otherwise tie with each other arbitrarily.
 */
export function beats(runs, i, j) {
  const a = headOf(runs, i);
  const b = headOf(runs, j);
  return a < b || (a === b && i < j);
}

/**
 * One bottom-up pass plays every match and learns both facts at each node —
 * who won and who lost. Which of the two gets *stored* is the only difference
 * between the two kinds of tree, and `plays` reports both so the operations
 * can show that.
 */
export function playMatches(state) {
  const { k, runs } = state;
  const winner = new Array(k).fill(-1);
  const loser = new Array(k).fill(-1);
  const plays = [];

  const winnerBelow = (pos) => (isLeafPos(k, pos) ? runAtLeaf(k, pos) : winner[pos]);

  for (let pos = k - 1; pos >= 1; pos--) {
    const a = winnerBelow(2 * pos);
    const b = winnerBelow(2 * pos + 1);
    const aWins = beats(runs, a, b);
    winner[pos] = aWins ? a : b;
    loser[pos] = aWins ? b : a;
    plays.push({ pos, a, b, winner: winner[pos], loser: loser[pos] });
  }

  return { winner, loser, plays: plays.reverse(), champion: winner[1] };
}

/** The array a kind actually stores, from one pass of matches. */
export function treeFor(state) {
  const { winner, loser, champion } = playMatches(state);
  if (state.kind === "winner") return { tree: winner, champion: winner[1] };
  const tree = [...loser];
  tree[0] = champion;
  return { tree, champion };
}

/** Whichever run a position names, for either kind. */
export const namedAt = (state, pos) => (isLeafPos(state.k, pos) ? runAtLeaf(state.k, pos) : state.tree[pos]);

/** The run currently winning overall. */
export const championOf = (state) => (state.kind === "winner" ? state.tree[1] : state.tree[0]);

// ---------------------------------------------------------------------
// parsing and building state
// ---------------------------------------------------------------------

/**
 * The runs box: one sorted run per line. Each line is sorted on the way in
 * rather than rejected — a selection tree merges *sorted* runs, and a run
 * that is not sorted is a typo, not an interesting case.
 */
export function parseRuns(input) {
  const lines = String(input || "")
    .split(/[;\n]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_RUNS);

  const runs = lines
    .map((line) =>
      line
        .split(/[,\s]+/)
        .filter(Boolean)
        .map((s) => parseInt(s, 10))
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b)
        .slice(0, MAX_RUN_LENGTH)
    )
    .filter((values) => values.length > 0);

  return runs.length >= MIN_RUNS ? runs : null;
}

export function formatRuns(state) {
  return state.runs
    .filter((run) => !run.padded)
    .map((run) => run.values.join(", "))
    .join("\n");
}

/**
 * A fresh state from a list of runs. The tree needs a full bottom row, so any
 * padding leaves get an empty run — permanently ∞, so they lose every match
 * they play and never affect the answer.
 */
export function stateFrom(lists, kind) {
  const k = paddedK(lists.length);
  const runs = Array.from({ length: k }, (_, i) => ({
    id: nextId(),
    values: lists[i] ? [...lists[i]] : [],
    head: 0,
    padded: !lists[i],
  }));
  const base = { kind, k, runs, tree: new Array(k).fill(-1), champion: null, output: [], live: lists.length };
  const { tree, champion } = treeFor(base);
  return { ...base, tree, champion };
}

export const DEFAULT_RUNS = "10, 15, 16\n9, 20, 38\n20, 30, 40\n6, 15, 17";

export function randomRuns() {
  const count = 3 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, () => {
    const length = 3 + Math.floor(Math.random() * 2);
    return Array.from({ length }, () => Math.floor(Math.random() * 90) + 10).sort((a, b) => a - b);
  });
}

/** ⌈log₂ k⌉ — the depth of the tree, and the comparisons one output costs. */
export const levelsOf = (k) => Math.log2(k);

// ---------------------------------------------------------------------
// replaying one path
// ---------------------------------------------------------------------

/**
 * Advances the winning run and repairs the tree, reporting each step so an
 * operation can either animate it or ignore it.
 *
 * Both kinds walk the same path — leaf to root — and both spend one
 * comparison per level. What differs is what a level needs to *read*. A
 * winner tree has to look at both children of every node on the path, because
 * a node holds a winner and the winner of the sibling subtree is the opponent.
 * A loser tree already has the opponent sitting at the node, so it reads one
 * value per level and carries the current champion up in a variable.
 *
 * Returns the events, so the caller decides how much of it to show.
 */
export function replay(state, push = () => {}) {
  const { k, runs, kind } = state;
  const c = state.champion;
  const key = headOf(runs, c);

  runs[c].head++;
  state.output.push(key);
  push({ kind: "output", run: c, value: key });

  if (kind === "winner") {
    const winnerBelow = (pos) => (isLeafPos(k, pos) ? runAtLeaf(k, pos) : state.tree[pos]);
    for (let pos = leafOf(k, c) >> 1; pos >= 1; pos >>= 1) {
      const a = winnerBelow(2 * pos);
      const b = winnerBelow(2 * pos + 1);
      const won = beats(runs, a, b) ? a : b;
      const before = state.tree[pos];
      state.tree[pos] = won;
      push({ kind: "match", pos, a, b, won, changed: before !== won });
    }
    state.champion = state.tree[1];
    return state;
  }

  let carry = c;
  for (let pos = leafOf(k, c) >> 1; pos >= 1; pos >>= 1) {
    const sitting = state.tree[pos];
    const swapped = beats(runs, sitting, carry);
    if (swapped) {
      state.tree[pos] = carry;
      carry = sitting;
    }
    push({ kind: "match", pos, a: carry, b: state.tree[pos], won: carry, changed: swapped, loserTree: true });
  }
  state.tree[0] = carry;
  state.champion = carry;
  return state;
}

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

/**
 * One frame.
 *
 *   compare   tree positions being played against each other
 *   path      the root-to-leaf path being replayed
 *   leafHot   run indices being highlighted under the leaves
 */
export function frame(state, extra = {}) {
  return {
    kind: state.kind,
    k: state.k,
    live: state.live,
    tree: [...state.tree],
    champion: state.champion,
    runs: state.runs.map((run) => ({ ...run, values: [...run.values] })),
    output: [...state.output],
    compare: [],
    active: [],
    path: [],
    leafHot: [],
    winners: [],
    message: "",
    ...extra,
  };
}

export const toFrame = (state, message) => frame(state, { message });
