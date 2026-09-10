import { nextId } from "../linkedList/nodeId";

/**
 * A sparse matrix, stored the way sparse matrices are actually stored: a list
 * of the non-zero entries, in row-major order, and nothing at all for the
 * zeros.
 *
 *   matrix = { rows, cols, triples: [{ id, r, c, value }, ...] }
 *
 * The whole subject is the trade this makes. A dense 6×6 of which four cells
 * are non-zero costs 36 slots either way you count it — but the triplet form
 * costs 3 numbers per term plus a 3-number header, so it wins the moment the
 * density drops below about a third, and loses badly above it. Everything a
 * dense matrix gets for free (read A[i][j] in one step) becomes a search, and
 * everything that was a nested loop becomes a merge.
 *
 * `triples` is kept sorted by (r, c) at all times, because every operation
 * here relies on it: addition is a two-list merge, and transpose is
 * interesting precisely *because* the naive way of restoring that order is
 * quadratic and there is a linear way.
 *
 * Entries keep a stable `id` so the canvas can follow a term from one list to
 * another rather than redrawing.
 */

// A dense grid drawn beside its own triplet list is the whole point of the
// view, so the cap is where the two still fit on screen together.
export const MAX_DIM = 8;

// One frame per multiplied pair means the term count is the length of the
// animation.
export const MAX_TERMS = 24;

export const emptyMatrix = (rows = 4, cols = 4) => ({ rows, cols, triples: [] });

export const termCount = (matrix) => matrix.triples.length;

export const density = (matrix) =>
  matrix.rows * matrix.cols === 0 ? 0 : matrix.triples.length / (matrix.rows * matrix.cols);

/** Row-major order: down the rows, and left to right within each. */
export const inOrder = (a, b) => a.r - b.r || a.c - b.c;

/** The dense grid a triplet list stands for — what the canvas draws. */
export function toDense({ rows, cols, triples }) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (const t of triples) if (t.r < rows && t.c < cols) grid[t.r][t.c] = t.value;
  return grid;
}

/** The triplet list a dense grid reduces to, in row-major order. */
export function toTriples(grid) {
  const triples = [];
  grid.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value !== 0) triples.push({ id: nextId(), r, c, value });
    })
  );
  return triples.slice(0, MAX_TERMS);
}

export function matrixFromDense(grid) {
  return { rows: grid.length, cols: grid[0]?.length ?? 0, triples: toTriples(grid) };
}

export const term = (r, c, value) => ({ id: nextId(), r, c, value });

/**
 * How many numbers each representation costs.
 *
 * The triplet count is 3 per term plus a 3-number header (rows, cols, terms),
 * which is the figure the textbooks compare — and the reason the crossover is
 * at a third rather than at a half.
 */
export function storageOf(matrix) {
  const dense = matrix.rows * matrix.cols;
  const sparse = 3 * matrix.triples.length + 3;
  return { dense, sparse, wins: sparse < dense };
}

// ---------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------

/**
 * The custom-matrix box: one row per line (or per `;`), values separated by
 * commas or spaces. Short rows are padded with zeros rather than rejected —
 * trailing zeros are exactly what nobody wants to type in a sparse matrix.
 */
export function parseMatrix(input) {
  const lines = String(input || "")
    .split(/[;\n]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_DIM);

  if (lines.length === 0) return null;

  const grid = lines.map((line) =>
    line
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((s) => {
        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
      })
      .slice(0, MAX_DIM)
  );

  const cols = Math.max(...grid.map((row) => row.length));
  if (cols === 0) return null;
  return matrixFromDense(grid.map((row) => [...row, ...new Array(cols - row.length).fill(0)]));
}

export function formatMatrix(matrix) {
  return toDense(matrix)
    .map((row) => row.join(", "))
    .join("\n");
}

/** A matrix of the given shape with roughly `fill` of its cells non-zero. */
export function randomMatrix(rows = 5, cols = 5, fill = 0.2) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < fill ? Math.floor(Math.random() * 18) - 6 || 4 : 0))
  );
  // A sparse matrix with nothing in it teaches nothing, so one term is forced.
  if (grid.every((row) => row.every((v) => v === 0))) {
    grid[Math.floor(rows / 2)][Math.floor(cols / 2)] = 5;
  }
  return matrixFromDense(grid);
}

export const DEFAULT_MATRIX = "0, 0, 3, 0, 0\n5, 0, 0, 0, 9\n0, 0, 0, 0, 0\n0, 7, 0, 0, 0\n2, 0, 0, 4, 0";
export const DEFAULT_SECOND = "0, 1, 0, 0, 0\n0, 0, 0, 6, 0\n3, 0, 0, 0, 0\n0, 0, 0, 0, 0\n0, 0, 8, 0, 0";

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

/**
 * One frame. The triplet list and the dense grid are both included, and both
 * are copies — a frame owns its own picture, which is what makes stepping
 * backwards free.
 *
 *   cell      { r, c } in the dense grid this step is looking at
 *   active    ids of triples this step is touching
 *   scanCol   the column the naive transpose is currently hunting for
 *   aux       a second matrix — the operand, or the result being built
 *   counts    the count / starting-position arrays of the fast transpose
 */
export function frame(matrix, extra = {}) {
  return {
    rows: matrix.rows,
    cols: matrix.cols,
    triples: matrix.triples.map((t) => ({ ...t })),
    dense: toDense(matrix),
    label: "A",
    cell: null,
    active: [],
    scanCol: null,
    aux: null,
    // The right-hand operand of an add or a multiply. Only those two have
    // one, so it is absent rather than empty everywhere else.
    second: null,
    counts: null,
    range: null,
    probe: null,
    message: "",
    ...extra,
  };
}

/** A second matrix drawn beside the first — an operand, or a result. */
export function auxOf(matrix, label, extra = {}) {
  return {
    label,
    rows: matrix.rows,
    cols: matrix.cols,
    triples: matrix.triples.map((t) => ({ ...t })),
    dense: toDense(matrix),
    active: [],
    cell: null,
    ...extra,
  };
}

/** The still frame a freshly loaded matrix gets. */
export function toFrame(matrix, message) {
  return frame(matrix, { message });
}
