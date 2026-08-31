/**
 * The frame shape `GridCanvas` draws: a set of rows sharing one set of
 * columns, plus the pointers walking along them.
 *
 *   {
 *     width      columns in the grid — the longest row decides it
 *     rows       [{ label, offset, cells: [{ text, tone, sub }] }]
 *     pointers   [{ label, at, tone }] — drawn above the grid
 *     aux        { label, items } — chips for whatever is not a column
 *     message, line, phase, resultBadge
 *   }
 *
 * `offset` is what makes alignment visible: a row that starts part-way along
 * is physically indented to the column it belongs at, so a pattern sliding
 * forward, or an activity that begins at time 5, is a row in the right place
 * rather than a number you have to read.
 *
 * These builders live apart from any one family because two of them use this
 * grid for entirely different pictures — the string algorithms align
 * characters, the greedy and number-theory ones lay out a timeline, a sieve
 * and a table of Euclidean steps.
 */

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
