/**
 * Backtracking — four problems that are all the same loop.
 *
 * Choose a value for the next slot, check whether it can possibly work, and if
 * it can, recurse; if the recursion fails, take the value back out and try the
 * next one. What separates the four is only what a "slot" is and how much the
 * check can rule out in advance:
 *
 *   permutations   no check at all — every branch is legal, so the tree is the
 *                  whole answer and nothing is ever pruned. This is the
 *                  baseline the other three are measured against.
 *   n-queens       a square is rejected if any placed queen attacks it
 *   sudoku         a digit is rejected if its row, column or box already has it
 *   subset sum     a branch is rejected when the running total has overshot,
 *                  or when everything left could not reach the target
 *
 * The search tree is the artifact worth watching, so it is recorded the way
 * the divide-and-conquer sorts record theirs: ONE shared `calls` array that
 * every frame points at, never a copy per frame. `RecursionPanel` slices that
 * array by `callCount`, which works because a merge-sort call never changes
 * after it is created. A backtracking node does change — it starts as
 * "exploring" and later becomes a dead end or a solution — so instead of
 * mutating a status that earlier frames would then show too early, a node
 * records *when* it changed:
 *
 *   { id, parent, depth, label, openedAt, closedAt, result }
 *
 * `openedAt` and `closedAt` are frame ordinals. A panel drawing frame `seq`
 * shows a node if `openedAt <= seq`, and shows it closed only if
 * `closedAt !== null && closedAt <= seq`. Mutation stays safe because it is
 * only ever read as a comparison against the frame doing the reading.
 */

// ---------------------------------------------------------------------
// limits
// ---------------------------------------------------------------------

export const QUEENS_MIN = 4;
export const QUEENS_MAX = 8;
export const MAX_SUBSET = 10;
export const MAX_PERM = 6;

/**
 * The search stops here. Backtracking is exponential and a bad setup finds out
 * the hard way: every solution to 7-queens is 3,585 nodes, 8-queens is 15,721,
 * and the newspaper sudoku at the top of the Wikipedia article takes this
 * solver 37,653. The budget is set just above 7-queens — the largest search
 * that is still worth stepping through — and everything past it stops and says
 * so, which is both honest and the exponential curve made concrete.
 */
export const MAX_NODES = 4000;

// ---------------------------------------------------------------------
// the recorder
// ---------------------------------------------------------------------

/**
 * Collects the frames and the search tree together.
 *
 * `open` records entering a branch, `close` records how it ended, and `emit`
 * writes a frame. Every frame carries the live call's id and the shared tree,
 * so the panel can draw the stack without the algorithm having to describe it.
 */
export function makeRecorder() {
  const calls = [];
  const steps = [];
  const stats = { nodes: 0, backtracks: 0, pruned: 0, solutions: 0 };
  let seq = 0;

  const open = (parent, depth, label) => {
    const id = calls.length;
    calls.push({ id, parent, depth, label, openedAt: seq, closedAt: null, result: null });
    stats.nodes += 1;
    return id;
  };

  /** `result` is "solution", "dead" or "pruned" — what the branch turned out to be. */
  const close = (id, result) => {
    if (id === null || id === undefined) return;
    calls[id].closedAt = seq;
    calls[id].result = result;
    if (result === "pruned") stats.pruned += 1;
    if (result === "dead") stats.backtracks += 1;
  };

  const emit = (fields) => {
    steps.push({
      calls,
      callCount: calls.length,
      seq,
      depth: 0,
      callId: null,
      aux: null,
      line: null,
      phase: "search",
      message: "",
      ...fields,
      // Copied, because these are the numbers a frame is claiming at the
      // moment it was taken.
      stats: { ...stats },
    });
    seq += 1;
  };

  return {
    calls,
    steps,
    stats,
    open,
    close,
    emit,
    exhausted: () => stats.nodes >= MAX_NODES,
  };
}

// ---------------------------------------------------------------------
// boards
// ---------------------------------------------------------------------

/**
 * Every problem draws one grid, so a row of numbers is a grid one row tall and
 * the canvas needs no second layout. `values` and `tones` are flat arrays of
 * primitives rather than per-cell objects: a sudoku frame copies 81 numbers
 * and 81 short strings, and there can be a couple of thousand frames.
 *
 * `blocks` draws the heavier 3×3 rules on a sudoku. `labels` is an optional
 * second line per cell — the index under a subset-sum number, the position
 * under a permutation slot.
 */
export function board({ rows, cols, values, tones, labels = null, blocks = 0 }) {
  return { rows, cols, values, tones, labels, blocks };
}

/** A flat array of `n` copies of `value` — the starting point for every tone array. */
export const filled = (n, value) => new Array(n).fill(value);

// ---------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------

export function parseNumbers(text, limit) {
  return String(text || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n))
    .slice(0, limit);
}

export function parseBounded(text, min, max, fallback) {
  const n = parseInt(String(text || "").trim(), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** "first" finds one answer and stops; "all" enumerates the whole tree. */
export const MODES = [
  { key: "first", label: "FIRST", desc: "Stop at the first solution — the shortest path to seeing how backtracking works." },
  { key: "all", label: "ALL", desc: "Explore the whole tree and count every solution. Slower, and the tree is the point." },
];

export const isAll = (mode) => mode === "all";
