/**
 * Greedy algorithms and number theory — five algorithms that each get the
 * right answer by refusing to look at most of the problem.
 *
 *   activity selection    sort by finish time, then take anything that starts
 *                         after the last one ended. The exchange argument is
 *                         what makes it optimal, not the sorting
 *   fractional knapsack   sort by value per unit weight and pour. Optimal only
 *                         because items divide — the 0/1 version does not, and
 *                         needs the dynamic programming view instead
 *   sieve                 cross off multiples of each prime, starting at its
 *                         square, because everything below it is already gone
 *   fast exponentiation   square the base, halve the exponent: log n
 *                         multiplications instead of n
 *   Euclid                gcd(a, b) = gcd(b, a mod b), because a common divisor
 *                         of a and b divides their remainder too
 *
 * The first two are greedy in the technical sense — a locally best choice that
 * is provably globally optimal — and the last three are the arithmetic that
 * shows up underneath everything else. They share a view because they share a
 * picture: a small grid of aligned rows, drawn by `GridCanvas`. See
 * `../gridFrame.js` for the frame shape.
 */

export {
  cell,
  charRow,
  numberRow,
  indexRow,
  pointer,
  snap,
} from "../gridFrame.js";

// ---------------------------------------------------------------------
// limits
// ---------------------------------------------------------------------

// One frame per decision, and every limit here is about how much fits on a
// row of the grid rather than about what the algorithm could handle.
export const MAX_ACTIVITIES = 12;
export const MAX_TIME = 24;
export const MAX_ITEMS = 10;
export const MAX_SIEVE = 120;
export const SIEVE_COLUMNS = 10;
export const MAX_BASE = 999;
export const MAX_EXPONENT = 64;
export const MAX_GCD = 100000;
// Without a modulus the powers explode; this is the widest value that still
// reads as a number in a grid cell rather than a smear of digits.
export const MAX_PLAIN_DIGITS = 15;

// ---------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------

/** A single non-negative integer, or null if the text is not one. */
export function parseInteger(raw) {
  const text = String(raw ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const value = parseInt(text, 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * A list of `a/b` or `a-b` pairs — "60/10, 100/20" or "1-4, 3-5". Both
 * separators are accepted because one reads as a ratio and the other as a
 * span, and which one you reach for depends on the algorithm.
 */
export function parsePairs(raw, limit) {
  const text = String(raw ?? "").trim();
  if (!text) return { error: "Enter at least one pair." };
  const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > limit) return { error: `At most ${limit} entries.` };

  const pairs = [];
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*[-/:]\s*(\d+)$/);
    if (!match) return { error: `"${part}" is not a pair — write it as a/b or a-b.` };
    pairs.push([parseInt(match[1], 10), parseInt(match[2], 10)]);
  }
  return { pairs };
}

// ---------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------

/**
 * Column width for a frame whose cells hold numbers rather than single
 * characters. The grid's default column suits one character, so anything
 * wider has to say so or it spills over its neighbour.
 */
export const widthFor = (longest) => Math.max(26, Math.min(140, longest * 9 + 12));

// ---------------------------------------------------------------------
// aux chips
// ---------------------------------------------------------------------

export const chip = (text, tone = "plain") => ({ text: String(text), tone });

export const auxOf = (label, items) => ({ label, items });

// ---------------------------------------------------------------------
// random inputs
// ---------------------------------------------------------------------

const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

/**
 * Activities that actually overlap. A random set of spans where nothing
 * conflicts makes the greedy choice look trivial, because it is — the
 * interesting picture is the one where taking a long activity early would
 * have cost you two short ones.
 */
export function randomActivities(count = 8) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const start = randInt(0, MAX_TIME - 4);
    const end = Math.min(MAX_TIME, start + randInt(2, 7));
    list.push([start, end]);
  }
  return list.map(([s, e]) => `${s}-${e}`).join(", ");
}

/**
 * Items whose ratios are not in the same order as their values, so sorting by
 * value alone gets it wrong and the ratio has something to prove.
 */
export function randomItems(count = 5) {
  const list = [];
  for (let i = 0; i < count; i++) list.push([randInt(10, 120), randInt(5, 40)]);
  return list.map(([v, w]) => `${v}/${w}`).join(", ");
}
