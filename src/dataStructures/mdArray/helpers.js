/**
 * Multidimensional arrays, and the arithmetic that makes them a fiction.
 *
 * Memory is one-dimensional. Every rectangular array, every cube, every
 * triangular matrix stored without its zeros, is a *mapping* from a tuple of
 * indices onto a single offset — and the whole subject is those mappings:
 * which one a language picked, what it costs when you traverse against the
 * grain, and how far the same trick goes when the matrix has a shape worth
 * exploiting.
 *
 *   layout      how a tuple of indices becomes one offset
 *   dims        the logical shape, e.g. [3, 4, 2] or [n, n]
 *
 * There is no structure here in the usual sense: nothing is stored and
 * nothing is mutated. What a frame carries is an *address calculation* and
 * the strip of memory it lands in, which is the only thing there is to see.
 */

// Every cell of the logical array gets a slot on screen and a frame in a
// layout walk, so the caps are where both stay readable.
export const MAX_RANK = 3;
export const MAX_DIM = 6;
export const MAX_CELLS = 48;
export const MAX_N = 7;

const tri = (k) => (k * (k + 1)) / 2;

/**
 * A layout: how it maps indices to offsets, how many slots it needs, and the
 * arithmetic spelled out so a step can show its own working.
 *
 * `slot(dims, index)` returns
 *
 *   { slot, stored, redirect }
 *
 * where `stored: false` means the cell is not in memory at all (a structural
 * zero), and `redirect` is the index actually read instead — the whole trick
 * of a symmetric matrix.
 */
export const LAYOUTS = [
  {
    key: "rowmajor",
    label: "Row-major",
    short: "ROW-MAJOR",
    kind: "dense",
    formula: "((i₀·d₁ + i₁)·d₂ + i₂)",
    hint: "the last index moves fastest — C, C++, Python/NumPy, Java, Rust",
    slots: (dims) => dims.reduce((a, b) => a * b, 1),
    slot: (dims, index) => ({ slot: index.reduce((acc, i, k) => acc * dims[k] + i, 0), stored: true }),
    // Horner's rule, which is what the formula is: multiply by the next
    // dimension, add the next index. Written out, it is also the loop a
    // compiler emits.
    steps(dims, index) {
      const lines = [];
      let acc = 0;
      lines.push({ text: `offset = 0` });
      for (let k = 0; k < index.length; k++) {
        const before = acc;
        acc = acc * dims[k] + index[k];
        lines.push({
          text:
            k === 0
              ? `offset = i₀ = ${index[0]}`
              : `offset = offset · d${SUB[k]} + i${SUB[k]} = ${before} · ${dims[k]} + ${index[k]} = ${acc}`,
        });
      }
      return lines;
    },
    /** Indices in the order memory holds them: the last index varies fastest. */
    order(dims) {
      const out = [];
      const walk = (prefix) => {
        if (prefix.length === dims.length) return out.push([...prefix]);
        for (let i = 0; i < dims[prefix.length]; i++) walk([...prefix, i]);
      };
      walk([]);
      return out;
    },
  },
  {
    key: "colmajor",
    label: "Column-major",
    short: "COLUMN-MAJOR",
    kind: "dense",
    formula: "i₀ + d₀·(i₁ + d₁·i₂)",
    hint: "the first index moves fastest — Fortran, MATLAB, R, Julia, BLAS",
    slots: (dims) => dims.reduce((a, b) => a * b, 1),
    slot: (dims, index) => ({
      slot: index.reduceRight((acc, i, k) => acc * dims[k] + i, 0),
      stored: true,
    }),
    steps(dims, index) {
      const lines = [{ text: `offset = 0` }];
      let acc = 0;
      for (let k = index.length - 1; k >= 0; k--) {
        const before = acc;
        acc = acc * dims[k] + index[k];
        lines.push({
          text:
            k === index.length - 1
              ? `offset = i${SUB[k]} = ${index[k]}`
              : `offset = offset · d${SUB[k]} + i${SUB[k]} = ${before} · ${dims[k]} + ${index[k]} = ${acc}`,
        });
      }
      return lines;
    },
    /** The first index varies fastest — the mirror image of row-major. */
    order(dims) {
      const out = [];
      const walk = (suffix) => {
        if (suffix.length === dims.length) return out.push([...suffix].reverse());
        for (let i = 0; i < dims[dims.length - 1 - suffix.length]; i++) walk([...suffix, i]);
      };
      walk([]);
      return out;
    },
  },
  {
    key: "lower",
    label: "Lower triangular",
    short: "LOWER △",
    kind: "special",
    formula: "i(i+1)/2 + j",
    hint: "every cell above the diagonal is zero by definition, so none of them is stored",
    slots: ([n]) => tri(n),
    slot: (dims, [i, j]) => (j > i ? { slot: null, stored: false } : { slot: tri(i) + j, stored: true }),
    steps(dims, [i, j]) {
      if (j > i) {
        return [
          { text: `j = ${j} > i = ${i}` },
          { text: `above the diagonal — structurally zero, nothing stored`, tone: "zero" },
        ];
      }
      return [
        { text: `rows 0..${i - 1} hold ${tri(i)} elements between them` },
        { text: `offset = i(i+1)/2 + j = ${i}·${i + 1}/2 + ${j} = ${tri(i)} + ${j} = ${tri(i) + j}` },
      ];
    },
    order: ([n]) => rowsOf(n, (i) => range(0, i)),
  },
  {
    key: "upper",
    label: "Upper triangular",
    short: "UPPER △",
    kind: "special",
    formula: "i·n − i(i−1)/2 + (j − i)",
    hint: "the mirror of the lower triangle — the rows get shorter instead of longer",
    slots: ([n]) => tri(n),
    slot: (dims, [i, j]) => {
      const n = dims[0];
      if (j < i) return { slot: null, stored: false };
      return { slot: i * n - tri(i - 1) + (j - i), stored: true };
    },
    steps(dims, [i, j]) {
      const n = dims[0];
      if (j < i) {
        return [
          { text: `j = ${j} < i = ${i}` },
          { text: `below the diagonal — structurally zero, nothing stored`, tone: "zero" },
        ];
      }
      const base = i * n - tri(i - 1);
      return [
        { text: `row ${i} starts at i·n − i(i−1)/2 = ${i}·${n} − ${tri(i - 1)} = ${base}` },
        { text: `offset = ${base} + (j − i) = ${base} + ${j - i} = ${base + (j - i)}` },
      ];
    },
    order: ([n]) => rowsOf(n, (i) => range(i, n - 1)),
  },
  {
    key: "symmetric",
    label: "Symmetric",
    short: "SYMMETRIC",
    kind: "special",
    formula: "i ≥ j ? i(i+1)/2 + j : j(j+1)/2 + i",
    hint: "A[i][j] = A[j][i], so half of it is stored and the other half is a redirection",
    slots: ([n]) => tri(n),
    slot: (dims, [i, j]) =>
      j > i
        ? { slot: tri(j) + i, stored: true, redirect: [j, i] }
        : { slot: tri(i) + j, stored: true },
    steps(dims, [i, j]) {
      if (j > i) {
        return [
          { text: `j = ${j} > i = ${i}, so (${i}, ${j}) is not the copy that is stored` },
          { text: `A[${i}][${j}] = A[${j}][${i}] — swap the indices`, tone: "redirect" },
          { text: `offset = j(j+1)/2 + i = ${tri(j)} + ${i} = ${tri(j) + i}` },
        ];
      }
      return [
        { text: `j = ${j} ≤ i = ${i} — this is the stored half` },
        { text: `offset = i(i+1)/2 + j = ${tri(i)} + ${j} = ${tri(i) + j}` },
      ];
    },
    order: ([n]) => rowsOf(n, (i) => range(0, i)),
  },
  {
    key: "tridiagonal",
    label: "Tridiagonal",
    short: "TRIDIAGONAL",
    kind: "special",
    formula: "2i + j",
    hint: "only the diagonal and its two neighbours — 3n−2 elements out of n²",
    slots: ([n]) => 3 * n - 2,
    slot: (dims, [i, j]) => (Math.abs(i - j) > 1 ? { slot: null, stored: false } : { slot: 2 * i + j, stored: true }),
    steps(dims, [i, j]) {
      if (Math.abs(i - j) > 1) {
        return [
          { text: `|i − j| = ${Math.abs(i - j)} > 1` },
          { text: `off the band — structurally zero, nothing stored`, tone: "zero" },
        ];
      }
      return [
        { text: `|i − j| = ${Math.abs(i - j)} ≤ 1, so this cell is on the band` },
        { text: `offset = 2i + j = 2·${i} + ${j} = ${2 * i + j}` },
      ];
    },
    order: ([n]) => rowsOf(n, (i) => range(Math.max(0, i - 1), Math.min(n - 1, i + 1))),
  },
  {
    key: "diagonal",
    label: "Diagonal",
    short: "DIAGONAL",
    kind: "special",
    formula: "i",
    hint: "n elements out of n² — the mapping collapses to the index itself",
    slots: ([n]) => n,
    slot: (dims, [i, j]) => (i === j ? { slot: i, stored: true } : { slot: null, stored: false }),
    steps(dims, [i, j]) {
      if (i !== j) {
        return [
          { text: `i = ${i} ≠ j = ${j}` },
          { text: `off the diagonal — structurally zero, nothing stored`, tone: "zero" },
        ];
      }
      return [{ text: `on the diagonal` }, { text: `offset = i = ${i}` }];
    },
    order: ([n]) => rowsOf(n, (i) => [i]),
  },
];

export const LAYOUT_MAP = Object.fromEntries(LAYOUTS.map((l) => [l.key, l]));

export const LAYOUT_GROUPS = [
  { key: "dense", label: "Dense (every cell stored)" },
  { key: "special", label: "Special (shape exploited)" },
];

export const SUB = ["₀", "₁", "₂", "₃"];

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, k) => from + k);

/** Row-major over whichever columns each row actually stores. */
function rowsOf(n, colsOf) {
  const out = [];
  for (let i = 0; i < n; i++) for (const j of colsOf(i)) out.push([i, j]);
  return out;
}

// ---------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------

export const isSquare = (layout) => LAYOUT_MAP[layout].kind === "special";

export const logicalCount = (dims) => dims.reduce((a, b) => a * b, 1);

export const slotCount = (layout, dims) => LAYOUT_MAP[layout].slots(dims);

export const slotOf = (layout, dims, index) => LAYOUT_MAP[layout].slot(dims, index);

export const storageOrder = (layout, dims) => LAYOUT_MAP[layout].order(dims);

export const addressSteps = (layout, dims, index) => LAYOUT_MAP[layout].steps(dims, index);

/** Every index of the logical array, in row-major reading order. */
export function everyIndex(dims) {
  const out = [];
  const walk = (prefix) => {
    if (prefix.length === dims.length) return out.push([...prefix]);
    for (let i = 0; i < dims[prefix.length]; i++) walk([...prefix, i]);
  };
  walk([]);
  return out;
}

export const showIndex = (index) => `[${index.join("][")}]`;

/**
 * The shape a layout can actually describe. Special layouts are square by
 * definition, so switching to one collapses whatever shape was on screen to
 * an n×n of the same order rather than refusing.
 */
export function shapeFor(layout, dims) {
  if (!isSquare(layout)) {
    const kept = dims.slice(0, MAX_RANK).map((d) => Math.min(MAX_DIM, Math.max(1, d)));
    return capCells(kept.length ? kept : [4, 4]);
  }
  const n = Math.min(MAX_N, Math.max(2, dims[0] || 5));
  return [n, n];
}

/** Trims trailing dimensions until the array fits on screen. */
function capCells(dims) {
  const out = [...dims];
  while (out.length > 1 && logicalCount(out) > MAX_CELLS) out.pop();
  while (logicalCount(out) > MAX_CELLS) out[out.length - 1]--;
  return out;
}

// ---------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------

export function parseDims(text) {
  const dims = String(text || "")
    .split(/[,\s×x*]+/)
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, MAX_RANK)
    .map((n) => Math.min(MAX_DIM, n));
  return dims.length ? capCells(dims) : null;
}

export function parseIndex(text, dims) {
  const raw = String(text || "")
    .split(/[,\s[\]]+/)
    .filter(Boolean)
    .map((s) => parseInt(s, 10));
  // Missing indices default to 0 and out-of-range ones are clamped, so a
  // half-typed tuple still names a cell rather than nothing.
  return dims.map((d, k) => Math.min(d - 1, Math.max(0, Number.isInteger(raw[k]) ? raw[k] : 0)));
}

export const formatDims = (dims) => dims.join(", ");

/**
 * The shape as the sidebar box holds it. A packed layout is square, so its
 * box asks for one number rather than a shape that could disagree with
 * itself — "5, 4" is not a triangular matrix.
 */
export const inputFor = (layout, dims) => (isSquare(layout) ? String(dims[0]) : formatDims(dims));

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

/**
 * One frame.
 *
 *   memory     the linear strip: slot -> the index tuple stored there, or null
 *   cursor     the logical index being addressed
 *   redirect   the index actually read instead (symmetric matrices)
 *   slot       where it landed, or null for a structural zero
 *   formula    the arithmetic, spelled out line by line
 *   visited    logical indices already placed, as "i,j" keys
 *   jump       the address distance from the previous step — the locality walk
 */
export function frame(ctx, extra = {}) {
  return {
    layout: ctx.layout,
    dims: ctx.dims,
    slots: ctx.slots,
    memory: [...ctx.memory],
    cursor: null,
    redirect: null,
    slot: null,
    formula: [],
    visited: new Set(ctx.visited),
    jump: null,
    message: "",
    ...extra,
  };
}

/** The still frame a freshly chosen shape or layout gets. */
export function toFrame(dims, layout, message) {
  const slots = slotCount(layout, dims);
  return frame({ layout, dims, slots, memory: new Array(slots).fill(null), visited: new Set() }, { message });
}
