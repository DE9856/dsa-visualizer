import { board, filled, makeRecorder } from "./helpers";

const PSEUDOCODE = [
  "solve():",
  "    find the first empty cell, row-major",
  "    if there is none:  solved",
  "    for d = 1..9:",
  "        if d already appears in the row, column or box:  skip",
  "        write d into the cell",
  "        if solve():  return true",
  "        rub d back out               ← the backtrack",
  "    return false     (no digit works here — the mistake is further up)",
];

const LINE = { enter: 0, find: 1, solved: 2, loop: 3, conflict: 4, write: 5, recurse: 6, undo: 7, fail: 8 };

/**
 * Puzzles chosen for how they *search*, not for how hard a person finds them.
 * The two are barely related: the famous newspaper puzzle that opens the
 * Wikipedia article takes this solver 37,653 nodes and 4,157 backtracks,
 * because row-major order makes it guess in exactly the places a person never
 * would. These three were picked by running the solver over candidates and
 * keeping ones that finish in a couple of hundred nodes, spanning none, a few,
 * and a lot of backtracking — a puzzle the solver never has to undo teaches
 * nothing here, and one that undoes 4,000 times cannot be watched.
 */
export const PUZZLES = [
  {
    key: "deduced",
    label: "No guessing needed",
    blurb: "The row/column/box rule alone fills every blank — 46 nodes, not one backtrack.",
    grid:
      "534678912" +
      "672195348" +
      "198342567" +
      "859761423" +
      "426853791" +
      "713924856" +
      "961537284" +
      "........." +
      "345286179",
  },
  {
    key: "guesses",
    label: "A few guesses",
    blurb: "Twenty blanks, three of which the solver gets wrong before getting right.",
    grid:
      "53467..12" +
      "6.2195.48" +
      "198.42567" +
      "8.97.1.23" +
      ".2685379." +
      "7.39...56" +
      ".61537284" +
      "28.41963." +
      "3..28617.",
  },
  {
    key: "backtracks",
    label: "Real backtracking",
    blurb: "Twenty-eight blanks and eight wrong turns — the tree is worth watching on this one.",
    grid:
      "53467..12" +
      "6.21.5..8" +
      "..8.42567" +
      "8.97...23" +
      ".26853.9." +
      "7.39...56" +
      ".61537284" +
      "28.41963." +
      "...286.7.",
  },
];

export const PUZZLE_MAP = Object.fromEntries(PUZZLES.map((p) => [p.key, p]));

/** Any of 0, ., - or a space means "blank"; everything else must be 1–9. */
export function parseGrid(text) {
  const chars = String(text || "").replace(/[^0-9.\-\s]/g, "");
  const cells = [];
  for (const ch of chars) {
    if (/\s/.test(ch)) continue;
    cells.push(ch === "0" || ch === "." || ch === "-" ? 0 : Number(ch));
    if (cells.length === 81) break;
  }
  return cells.length === 81 ? cells : null;
}

export const sudoku = {
  key: "sudoku",
  label: "Sudoku",
  short: "SUDOKU",
  group: "grids",
  fields: ["puzzle"],
  defaults: { puzzle: PUZZLES[0].grid },
  desc: "Fill the grid so every row, column and 3×3 box holds each digit once. The solver here is the plainest one there is: walk the blanks in row-major order, try 1 through 9 in each, and recurse. A digit that already appears in the cell's row, column or box is rejected without recursing — that is the whole constraint, and it does nearly all the work. When no digit fits a cell, the mistake is not in that cell but in one filled earlier, which is exactly what the backtrack goes back to fix. Note what this solver does *not* do: it never picks the most constrained cell first, so it guesses in places a person never would.",
  time: "exponential in the worst case; a well-formed puzzle is far less",
  space: "O(1) beyond the grid, plus the recursion stack",
  pseudocode: PSEUDOCODE,

  random: () => ({ puzzle: PUZZLES[Math.floor(Math.random() * PUZZLES.length)].grid }),

  parse(raw) {
    const cells = parseGrid(raw.puzzle);
    if (!cells) return { error: "A puzzle is 81 digits, using 0 or . for a blank." };
    if (!isConsistent(cells)) return { error: "That grid already breaks a row, column or box rule." };
    return { cells };
  },

  run({ cells }) {
    const rec = makeRecorder();
    const grid = [...cells];
    const given = cells.map((v) => v !== 0);
    let solved = false;

    const rowOf = (i) => Math.floor(i / 9);
    const colOf = (i) => i % 9;
    const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

    /** Where `d` already sits in this cell's row, column or box — or -1. */
    const clash = (index, d) => {
      for (let j = 0; j < 81; j++) {
        if (j === index || grid[j] !== d) continue;
        if (rowOf(j) === rowOf(index) || colOf(j) === colOf(index) || boxOf(j) === boxOf(index)) return j;
      }
      return -1;
    };

    const boardNow = (cur, tone, conflictAt) => {
      const values = grid.map((v) => (v === 0 ? "" : String(v)));
      const tones = grid.map((v, i) => (given[i] ? "given" : v === 0 ? null : "placed"));
      if (conflictAt !== undefined && conflictAt >= 0) tones[conflictAt] = "conflict";
      if (cur !== undefined && cur >= 0) tones[cur] = tone;
      return board({ rows: 9, cols: 9, values, tones, blocks: 3 });
    };

    const blanks = grid.filter((v) => v === 0).length;

    rec.emit({
      board: boardNow(),
      line: LINE.enter,
      message: `${blanks} blank${blanks === 1 ? "" : "s"} to fill. The solver takes them in reading order and tries 1 to 9 in each.`,
    });

    const root = rec.open(null, 0, "start");

    function solve(parent, depth) {
      const index = grid.indexOf(0);
      if (index === -1) {
        solved = true;
        rec.stats.solutions += 1;
        rec.emit({
          board: boardNow(),
          callId: parent,
          depth,
          line: LINE.solved,
          phase: "solution",
          message: "No blanks left — every row, column and box holds 1 to 9 exactly once.",
        });
        return true;
      }

      const r = rowOf(index);
      const c = colOf(index);

      for (let d = 1; d <= 9; d++) {
        if (rec.exhausted()) return true;

        const id = rec.open(parent, depth + 1, String(d));
        const conflictAt = clash(index, d);

        if (conflictAt >= 0) {
          rec.close(id, "pruned");
          rec.emit({
            board: boardNow(index, "conflict", conflictAt),
            callId: id,
            depth: depth + 1,
            line: LINE.conflict,
            message: `${d} is already in ${
              rowOf(conflictAt) === r ? `row ${r}` : colOf(conflictAt) === c ? `column ${c}` : `this box`
            } — r${r}c${c} cannot take it.`,
          });
          continue;
        }

        grid[index] = d;
        rec.emit({
          board: boardNow(index, "current"),
          callId: id,
          depth: depth + 1,
          line: LINE.write,
          message: `r${r}c${c} = ${d}. Nothing rules it out yet, so move to the next blank and find out.`,
        });

        if (solve(id, depth + 1)) {
          rec.close(id, "solution");
          return true;
        }

        grid[index] = 0;
        rec.close(id, "dead");
        rec.emit({
          board: boardNow(index, "undo"),
          callId: id,
          depth: depth + 1,
          line: LINE.undo,
          phase: "backtrack",
          message: `Every digit downstream failed with ${d} here — rub it out and try ${
            d === 9 ? "nothing: this cell is out of digits" : `${d + 1}`
          }.`,
        });
      }

      rec.emit({
        board: boardNow(index, "conflict"),
        callId: parent,
        depth,
        line: LINE.fail,
        phase: "backtrack",
        message: `No digit at all fits r${r}c${c}. The wrong guess is above this cell, not in it — return and let the caller undo it.`,
      });
      return false;
    }

    solve(root, 0);
    rec.close(root, solved ? "solution" : "dead");

    const { nodes, pruned, backtracks } = rec.stats;
    const capped = rec.exhausted();

    rec.emit({
      board: boardNow(),
      line: null,
      phase: "done",
      resultBadge: capped
        ? `STOPPED AT ${nodes} NODES`
        : solved
          ? `SOLVED — ${nodes} NODES, ${backtracks} BACKTRACKS`
          : `UNSOLVABLE — ${nodes} NODES`,
      message: capped
        ? `The search hit its ${nodes}-node budget. This puzzle needs more guessing than the view is willing to animate; try one of the presets.`
        : solved
          ? `${blanks} blanks filled from ${nodes} nodes: ${pruned} digits rejected on sight by the row/column/box rule, and ${backtracks} written down and later rubbed out. Without the rule, 9^${blanks} grids would have to be checked.`
          : `This puzzle has no solution — every branch of the tree ends in a cell with no legal digit.`,
    });

    return { steps: rec.steps };
  },
};

/** True if the givens don't already break a rule — a bad grid is a bad input, not a bug. */
function isConsistent(cells) {
  for (let i = 0; i < 81; i++) {
    const v = cells[i];
    if (!v) continue;
    for (let j = i + 1; j < 81; j++) {
      if (cells[j] !== v) continue;
      const sameRow = Math.floor(i / 9) === Math.floor(j / 9);
      const sameCol = i % 9 === j % 9;
      const sameBox =
        Math.floor(Math.floor(i / 9) / 3) === Math.floor(Math.floor(j / 9) / 3) &&
        Math.floor((i % 9) / 3) === Math.floor((j % 9) / 3);
      if (sameRow || sameCol || sameBox) return false;
    }
  }
  return true;
}
