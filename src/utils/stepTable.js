/**
 * Turns a run's step frames into rows for the printable table.
 *
 * The frames are the same precomputed objects the canvas draws, so this is a
 * read of what the algorithm already recorded rather than a second
 * description of it that could drift. What differs per view is only the shape
 * of the frame, and the extractors below cover the four shapes the app
 * actually builds — an array, a list of nodes, a grid of rows, a DP table —
 * falling back to the frame's own message for anything else. A view whose
 * state cannot be put in a table cell still gets a usable table: the step
 * number, the line of code executing and what happened are always there.
 */

const EM_DASH = "—";

function cellText(cell) {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object") {
    if (cell.void) return "";
    return String(cell.text ?? cell.value ?? "");
  }
  return String(cell);
}

/** The data the frame is showing, as one line of text. */
function stateOf(step) {
  if (Array.isArray(step.array)) return step.array.join("  ");

  if (Array.isArray(step.nodes) && step.nodes.length && step.nodes[0] && "value" in step.nodes[0]) {
    return step.nodes.map((node) => node.value).join("  ");
  }

  // The grid views (string matching, greedy, number theory) already lay their
  // state out as labelled rows, which is exactly a table cell's worth.
  if (Array.isArray(step.rows) && step.rows.length) {
    return step.rows
      .map((row) => {
        const text = row.cells.map((c) => cellText(c)).join(" ").trim();
        return row.label ? `${row.label}: ${text}` : text;
      })
      .join("   |   ");
  }

  // A DP table is far too wide to print whole on every row, and it barely
  // changes between steps anyway — the cell the step just decided is the
  // interesting part, so that is what the column carries.
  if (Array.isArray(step.table) && step.cur) {
    const { r, c } = step.cur;
    const value = cellText(step.table[r]?.[c]);
    return `[${r}][${c}] = ${value === "" ? EM_DASH : value}`;
  }

  return "";
}

/** What the frame is doing, for views that don't write their own message. */
function describe(step) {
  if (step.message) return step.message;

  const pair = (a, b) => `a[${a}] and a[${b}]`;

  if (step.swap?.length === 2) return `Swap ${pair(step.swap[0], step.swap[1])}`;
  if (step.swap?.length === 1) return `Write a[${step.swap[0]}]`;
  if (step.compare?.length === 2) return `Compare ${pair(step.compare[0], step.compare[1])}`;
  if (step.compare?.length === 1) return `Read a[${step.compare[0]}]`;
  if (step.found >= 0) return `Found at index ${step.found}`;
  if (step.found === -2) return "Target not found";
  if (step.mid >= 0) return `Probe a[${step.mid}]`;
  if (step.checking >= 0) return `Check a[${step.checking}]`;
  if (step.line === null || step.line === undefined) return "Done";
  return "";
}

const hasStats = (steps) => steps.some((s) => s.stats);

/**
 * The whole table: a header describing the run, and one row per frame.
 *
 * `pseudocode` is the algorithm's own array, so the LINE column prints the
 * line the frame was executing rather than a number that means nothing on
 * paper.
 */
export function buildStepTable({ steps, pseudocode = [], title, subtitle, complexity }) {
  const counters = hasStats(steps);

  const columns = ["#", "LINE", "WHAT HAPPENED", "STATE"];
  if (counters) columns.push("CMP", "RD", "WR");

  const rows = steps.map((step, i) => {
    const line = step.line === null || step.line === undefined ? "" : (pseudocode[step.line] ?? "").trim();
    const row = [String(i + 1), line || EM_DASH, describe(step) || EM_DASH, stateOf(step) || EM_DASH];
    if (counters) {
      const stats = step.stats ?? {};
      row.push(
        String(stats.comparisons ?? step.cCount ?? 0),
        String(stats.reads ?? EM_DASH),
        String(stats.writes ?? step.sCount ?? 0)
      );
    }
    return row;
  });

  return { title, subtitle, complexity, columns, rows, pseudocode };
}
