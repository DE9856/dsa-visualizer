import {
  MODES,
  QUEENS_MAX,
  QUEENS_MIN,
  board,
  filled,
  isAll,
  makeRecorder,
  parseBounded,
} from "./helpers";

const PSEUDOCODE = [
  "place(row):",
  "    if row == n:  record a solution;  return",
  "    for col = 0..n-1:",
  "        if attacked(row, col):  skip this column",
  "        put a queen on (row, col)",
  "        place(row + 1)",
  "        take the queen back off      ← the backtrack",
];

const LINE = { enter: 0, solution: 1, loop: 2, attack: 3, place: 4, recurse: 5, undo: 6 };

export const nQueens = {
  key: "queens",
  label: "N-Queens",
  short: "N-QUEENS",
  group: "grids",
  fields: ["n", "mode"],
  defaults: { n: 6, mode: "first" },
  desc: "Place n queens on an n×n board so that no two attack each other — no shared row, column or diagonal. One queen per row is forced, so the only real question is which column each row gets, and that turns the problem into a tree: row 0 has n choices, each of which leaves row 1 with fewer, and so on. What makes it tractable is that a bad choice is provably bad immediately — a square attacked by a queen already placed can be rejected without ever looking at the rows below it. Every column the search skips is an entire subtree it never has to build.",
  time: "O(n!) worst case — far less in practice, because pruning cuts whole subtrees",
  space: "O(n) for the board plus the recursion stack",
  pseudocode: PSEUDOCODE,

  random: () => ({ n: String(QUEENS_MIN + Math.floor(Math.random() * 3)), mode: "first" }),

  parse(raw) {
    const n = parseBounded(raw.n, QUEENS_MIN, QUEENS_MAX, 6);
    const mode = MODES.some((m) => m.key === raw.mode) ? raw.mode : "first";
    return { n, mode };
  },

  run({ n, mode }) {
    const rec = makeRecorder();
    // queens[r] is the column of the queen in row r, or -1 for an empty row.
    const queens = filled(n, -1);
    const solutions = [];
    const findAll = isAll(mode);

    const attacks = (row, col) => {
      for (let r = 0; r < row; r++) {
        const c = queens[r];
        if (c === col || Math.abs(c - col) === row - r) return r;
      }
      return -1;
    };

    /**
     * The board as the canvas draws it. Squares a placed queen attacks are
     * shaded, which is the whole reason the search can prune: the shading is
     * the set of choices that no longer exist.
     */
    const boardNow = (cur, tone) => {
      const values = filled(n * n, "");
      const tones = filled(n * n, null);

      for (let r = 0; r < n; r++) {
        if (queens[r] < 0) continue;
        const c = queens[r];
        values[r * n + c] = "♛";
        tones[r * n + c] = "placed";
        // Everything this queen rules out, marked only on the rows still to
        // be filled — the rows above are settled and shading them says nothing.
        for (let rr = r + 1; rr < n; rr++) {
          const d = rr - r;
          [c, c - d, c + d].forEach((cc) => {
            if (cc < 0 || cc >= n) return;
            const i = rr * n + cc;
            if (!tones[i]) tones[i] = "attacked";
          });
        }
      }

      if (cur) {
        const i = cur.row * n + cur.col;
        values[i] = "♛";
        tones[i] = tone;
      }
      return board({ rows: n, cols: n, values, tones });
    };

    const auxNow = () => ({
      label: "COLUMN PER ROW",
      items: queens.map((c, r) => ({
        text: c < 0 ? `r${r}: —` : `r${r}: c${c}`,
        tone: c < 0 ? "plain" : "take",
      })),
    });

    rec.emit({
      board: boardNow(null),
      line: LINE.enter,
      aux: auxNow(),
      message: `${n} queens on an ${n}×${n} board. One queen per row is forced, so the search is over which column each row gets.`,
    });

    const root = rec.open(null, 0, "start");

    /** Returns true when the caller should stop — a solution in "first" mode, or the node cap. */
    function place(row, parent) {
      if (row === n) {
        solutions.push([...queens]);
        rec.stats.solutions += 1;
        rec.emit({
          board: boardNow(null),
          callId: parent,
          depth: row,
          line: LINE.solution,
          phase: "solution",
          aux: auxNow(),
          message: `All ${n} rows filled and no queen attacks another — solution ${solutions.length}.`,
        });
        return !findAll;
      }

      for (let col = 0; col < n; col++) {
        if (rec.exhausted()) return true;

        const id = rec.open(parent, row + 1, `c${col}`);
        const attacker = attacks(row, col);

        if (attacker >= 0) {
          rec.close(id, "pruned");
          rec.emit({
            board: boardNow({ row, col }, "conflict"),
            callId: id,
            depth: row + 1,
            line: LINE.attack,
            // Carried on every frame, including this one: a read-out that
            // appears and disappears between steps makes the message under it
            // jump, which reads as the layout being broken.
            aux: auxNow(),
            message: `Row ${row}, column ${col} is attacked by the queen in row ${attacker} — skip it, and every arrangement underneath it with it.`,
          });
          continue;
        }

        queens[row] = col;
        rec.emit({
          board: boardNow(null),
          callId: id,
          depth: row + 1,
          line: LINE.place,
          aux: auxNow(),
          message: `Row ${row} takes column ${col}. ${
            row + 1 === n ? "That is the last row." : `Now find a square for row ${row + 1}.`
          }`,
        });

        const stop = place(row + 1, id);
        if (stop) {
          // A solution below leaves this branch open on screen: it is part of
          // the answer, not a branch that failed.
          rec.close(id, solutions.length ? "solution" : "dead");
          return true;
        }

        queens[row] = -1;
        rec.close(id, "dead");
        rec.emit({
          board: boardNow({ row, col }, "undo"),
          callId: id,
          depth: row + 1,
          line: LINE.undo,
          phase: "backtrack",
          aux: auxNow(),
          message: `Nothing below row ${row} works with a queen on column ${col} — take it back off and try the next column. That is the backtrack.`,
        });
      }

      return false;
    }

    place(0, root);
    rec.close(root, solutions.length ? "solution" : "dead");

    const { nodes, pruned, backtracks } = rec.stats;
    const capped = rec.exhausted();

    rec.emit({
      board: solutions.length ? boardSolution(n, solutions[solutions.length - 1]) : boardNow(null),
      line: null,
      phase: "done",
      aux: solutions.length
        ? {
            label: "SOLUTION",
            items: solutions[solutions.length - 1].map((c, r) => ({ text: `r${r}: c${c}`, tone: "take" })),
          }
        : null,
      resultBadge: capped
        ? `STOPPED AT ${nodes} NODES`
        : solutions.length
          ? findAll
            ? `${solutions.length} SOLUTION${solutions.length === 1 ? "" : "S"} — ${nodes} NODES`
            : `SOLVED IN ${nodes} NODES`
          : `NO SOLUTION — ${nodes} NODES`,
      message: capped
        ? `The search hit its ${nodes}-node budget before finishing. Every solution to 7-queens is 3,585 nodes and 8-queens is 15,721 — the tree roughly quadruples with each extra queen, which is the exponential curve as something you ran into rather than read about.`
        : solutions.length
          ? `${nodes} nodes explored, ${pruned} of them rejected on sight and ${backtracks} abandoned after looking below. A brute force over all ${n}^${n} = ${(
              n ** n
            ).toLocaleString()} column assignments would have looked at every one.`
          : `No arrangement exists for n = ${n}. ${nodes} nodes were enough to prove it — the pruning is what makes that cheap.`,
    });

    return { steps: rec.steps };
  },
};

/** The finished board, with every queen marked as part of the answer. */
function boardSolution(n, cols) {
  const values = filled(n * n, "");
  const tones = filled(n * n, null);
  cols.forEach((c, r) => {
    values[r * n + c] = "♛";
    tones[r * n + c] = "solution";
  });
  return board({ rows: n, cols: n, values, tones });
}
