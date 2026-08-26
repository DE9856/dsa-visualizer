/**
 * Dynamic programming — six problems that are all the same picture.
 *
 * A table is filled cell by cell, where every cell is the answer to a smaller
 * version of the question and is computed from cells already filled in. Then
 * the fill is walked *backwards* to recover which choices produced the answer,
 * because the table on its own only ever says how good the answer is, never
 * what it was. "Length 4" is not a subsequence; "23" is not a set of items.
 * The backtrack is the half that most explanations skip and the half that
 * makes the table mean something.
 *
 * Both halves are frames like everything else in this app: `run(params)`
 * returns an array of them and nothing animates itself, so stepping backwards
 * through a fill is free and scrubbing to the middle of a backtrack shows
 * exactly the state that step had.
 *
 * A frame:
 *
 *   {
 *     rows, cols        header descriptors, { label, sub } each
 *     rowAxis, colAxis  what the two axes are, e.g. "PREFIX OF A" / "AMOUNT"
 *     table             rows × cols of null | { value, mark } | { void: true }
 *     cur               { r, c } being written, or null
 *     deps              [{ r, c, kind }] cells being read — "chosen" won
 *     path              [{ r, c }] cells on the recovered solution
 *     phase             "base" | "fill" | "backtrack" | "done"
 *     aux               { label, items: [{ text, tone }] } — the answer being built
 *     message, line, resultBadge
 *   }
 *
 * `null` is a cell that has not been filled yet; `{ void: true }` is a cell
 * that never will be, which is the whole lower triangle in matrix chain
 * multiplication and needs to look different from "not yet".
 */

// ---------------------------------------------------------------------
// input limits
// ---------------------------------------------------------------------

// Every cap here exists for the same reason: one frame per cell means the
// table's area is the length of the animation, and an 8×20 table is already
// 160 steps. These are the sizes where you can still see the whole table and
// step through the whole fill.
export const MAX_STRING = 12;
export const MAX_ITEMS = 8;
export const MAX_CAPACITY = 20;
export const MAX_COINS = 6;
export const MAX_AMOUNT = 24;
export const MAX_SEQUENCE = 14;
export const MAX_MATRICES = 7;

/** Displayed in place of a number too large to be a real answer. */
export const INF = "∞";

export const EMPTY = "∅";

// ---------------------------------------------------------------------
// parsing the sidebar's boxes
// ---------------------------------------------------------------------

/** A string input: whitespace dropped, capped, so "A G C A T" is fine to type. */
export function parseWord(text, limit = MAX_STRING) {
  return String(text || "")
    .replace(/\s+/g, "")
    .slice(0, limit);
}

/** A comma or space separated integer list. */
export function parseNumbers(text, limit) {
  return String(text || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n))
    .slice(0, limit);
}

/** The items box: "5:10, 4:40" -> [{ weight: 5, value: 10 }, ...]. */
export function parseItems(text, limit = MAX_ITEMS) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((token) => {
      const [w, v] = token.split(/[:/]/).map((part) => parseInt(part.trim(), 10));
      if (Number.isNaN(w) || Number.isNaN(v)) return null;
      return { weight: Math.max(0, w), value: Math.max(0, v) };
    })
    .filter(Boolean)
    .slice(0, limit);
}

/** A bounded integer from a text box, for the capacity and amount fields. */
export function parseBounded(text, min, max, fallback) {
  const n = parseInt(String(text || "").trim(), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------
// tables and frames
// ---------------------------------------------------------------------

export const cell = (value, mark) => (mark ? { value, mark } : { value });

export const VOID = () => ({ void: true });

/** An unfilled table of the right shape. */
export function emptyTable(rows, cols) {
  return Array.from({ length: rows }, () => new Array(cols).fill(null));
}

const copyTable = (table) => table.map((row) => row.map((c) => (c ? { ...c } : null)));

/**
 * One frame. The table is copied every time, which is what makes stepping
 * backwards free — a frame owns its own picture and nothing has to be undone
 * to show it again.
 */
export function snap(ctx, extra = {}) {
  return {
    rows: ctx.rows,
    cols: ctx.cols,
    rowAxis: ctx.rowAxis,
    colAxis: ctx.colAxis,
    table: copyTable(ctx.table),
    cur: null,
    deps: [],
    path: [],
    phase: "fill",
    aux: null,
    line: null,
    message: "",
    ...extra,
  };
}

/** A header cell: the label the axis shows, with an optional index under it. */
export const head = (label, sub) => (sub === undefined ? { label } : { label, sub });

/** Row/column headers for a table indexed by prefixes of `word`, 0..n. */
export function prefixHeads(word) {
  return [head(EMPTY, "0"), ...[...word].map((ch, i) => head(ch, String(i + 1)))];
}

/** Row/column headers for a table indexed by a count, 0..n. */
export function countHeads(n, format = String) {
  return Array.from({ length: n + 1 }, (_, i) => head(format(i)));
}

// ---------------------------------------------------------------------
// shared random inputs
// ---------------------------------------------------------------------

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function randomWord(min, max, alphabet = "ABCD") {
  const length = min + Math.floor(Math.random() * (max - min + 1));
  return Array.from({ length }, () => pick([...alphabet])).join("");
}

export function randomInts(count, min, max) {
  return Array.from({ length: count }, () => min + Math.floor(Math.random() * (max - min + 1)));
}
