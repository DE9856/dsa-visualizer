/**
 * String algorithms — four ways of not re-reading what you have already read.
 *
 * The naive search re-compares from scratch after every mismatch, which is
 * O(n·m) and throws away everything the failed attempt just proved. Each
 * algorithm here keeps a different piece of that knowledge:
 *
 *   KMP         a failure function over the pattern: the longest proper
 *               prefix that is also a suffix, so a mismatch slides the pattern
 *               forward by exactly the amount the match already earned
 *   Z           for every position, how far it agrees with the prefix, reusing
 *               a previously computed window instead of recomparing inside it
 *   Rabin-Karp  a rolling hash, so a whole window is compared in O(1) and only
 *               a hash collision costs a real character comparison
 *   Manacher    palindrome radii, using the mirror image inside the current
 *               palindrome as a lower bound instead of expanding from scratch
 *
 * All four are the same picture: characters in a row, sometimes a second row
 * aligned under it at an offset, and an array of numbers underneath that. So
 * a frame is a small grid of aligned rows plus the pointers walking along it,
 * and one canvas draws every one of them.
 *
 *   {
 *     width      columns in the grid — the longest row decides it
 *     rows       [{ label, offset, cells: [{ text, tone, sub }] }]
 *     pointers   [{ label, at, tone }] — i, j, l, r, C, drawn above the grid
 *     aux        { label, items } — matches found, hashes, the answer so far
 *     message, line, phase, resultBadge
 *   }
 *
 * `offset` is what makes alignment visible: KMP's search draws the pattern as
 * a second row starting at the column it is currently aligned with, so a shift
 * is the row physically moving right.
 */

// ---------------------------------------------------------------------
// limits
// ---------------------------------------------------------------------

// One frame per comparison, so the text length is roughly the length of the
// animation. Thirty characters is a couple of hundred frames.
export const MAX_TEXT = 30;
export const MAX_PATTERN = 12;

/** Z's pattern-matching trick needs a character that cannot occur in either string. */
export const SEPARATOR = "$";

// ---------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------

/**
 * A string input. Spaces are dropped rather than kept: they are invisible in a
 * grid of character cells, and a pattern that silently contains one is a
 * confusing way to find out.
 */
export function parseText(text, limit = MAX_TEXT) {
  return String(text || "")
    .replace(/\s+/g, "")
    .slice(0, limit);
}

// ---------------------------------------------------------------------
// rows and cells
// ---------------------------------------------------------------------

export const cell = (text, tone, sub) => {
  const c = { text: String(text) };
  if (tone) c.tone = tone;
  if (sub !== undefined) c.sub = String(sub);
  return c;
};

/** A row of characters, optionally starting part-way along the grid. */
export const charRow = (label, str, tones = {}, offset = 0) => ({
  label,
  offset,
  cells: [...str].map((ch, i) => cell(ch, tones[i], undefined)),
});

/** A row of numbers under the characters — a failure function, Z, or radii. */
export const numberRow = (label, values, tones = {}, offset = 0) => ({
  label,
  offset,
  cells: values.map((v, i) => cell(v === null || v === undefined ? "" : v, tones[i])),
});

/** The 0,1,2… ruler. Alignment is the whole point, so the columns are numbered. */
export const indexRow = (n) => ({
  label: "",
  offset: 0,
  index: true,
  cells: Array.from({ length: n }, (_, i) => cell(i)),
});

export const pointer = (label, at, tone) => ({ label, at, tone });

/**
 * One frame. Rows are rebuilt from scratch each time rather than mutated, so a
 * frame owns its own picture and stepping backwards costs nothing.
 */
export function snap(extra = {}) {
  return {
    width: 0,
    rows: [],
    pointers: [],
    aux: null,
    line: null,
    phase: "run",
    message: "",
    ...extra,
  };
}

// ---------------------------------------------------------------------
// random inputs
// ---------------------------------------------------------------------

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function randomString(min, max, alphabet = "ABAB CAB".replace(/\s/g, "")) {
  const length = min + Math.floor(Math.random() * (max - min + 1));
  return Array.from({ length }, () => pick([...alphabet])).join("");
}

/**
 * A text with the pattern planted in it somewhere, so a random example
 * actually finds something. A search that never matches is a fine thing to
 * look at deliberately and a poor thing to land on by accident.
 */
export function randomTextWith(pattern, length, alphabet = "ABC") {
  const filler = (n) => Array.from({ length: n }, () => pick([...alphabet])).join("");
  const room = Math.max(0, length - pattern.length);
  const at = Math.floor(Math.random() * (room + 1));
  return filler(at) + pattern + filler(room - at);
}
