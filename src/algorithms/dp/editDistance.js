import { MAX_STRING, cell, emptyTable, parseWord, prefixHeads, randomWord, snap } from "./helpers";

const PSEUDOCODE = [
  "for i = 0..n:  D[i][0] = i        (delete i characters)",
  "for j = 0..m:  D[0][j] = j        (insert j characters)",
  "for i = 1..n, for j = 1..m:",
  "    if A[i] == B[j]:",
  "        D[i][j] = D[i-1][j-1]     (free)",
  "    else:",
  "        D[i][j] = 1 + min(D[i-1][j-1],  substitute",
  "                          D[i-1][j],    delete",
  "                          D[i][j-1])    insert",
  "backtrack from D[n][m] to read the edit script off",
];

const LINE = {
  baseRow: 0,
  baseCol: 1,
  loop: 2,
  match: 4,
  edit: 6,
  backtrack: 9,
};

// The three ways to spend an edit, and the direction each one steps.
const SUB = "↖";
const DEL = "↑";
const INS = "←";

export const editDistance = {
  key: "edit",
  label: "Edit Distance",
  short: "EDIT DIST",
  group: "strings",
  fields: ["stringA", "stringB"],
  defaults: { stringA: "KITTEN", stringB: "SITTING" },
  desc: "The fewest single-character edits — insert, delete, substitute — that turn A into B. This is the Levenshtein distance, and it is the same table as the longest common subsequence with the arithmetic turned upside down: instead of counting what the two strings share, it counts what they don't. D[i][j] is the distance between the first i characters of A and the first j of B. A matching pair costs nothing and copies the diagonal straight through; a mismatch costs one edit on top of the cheapest of three neighbours, and which neighbour won is which edit you made. The backtrack turns the number into an actual script of edits.",
  time: "O(n·m)",
  space: "O(n·m)",
  pseudocode: PSEUDOCODE,

  random: () => ({ stringA: randomWord(4, 7), stringB: randomWord(4, 7) }),

  parse(raw) {
    const a = parseWord(raw.stringA, MAX_STRING);
    const b = parseWord(raw.stringB, MAX_STRING);
    if (!a || !b) return { error: "Both strings need at least one character." };
    return { a, b };
  },

  run({ a, b }) {
    const n = a.length;
    const m = b.length;
    const ctx = {
      rows: prefixHeads(a),
      cols: prefixHeads(b),
      rowAxis: `A = ${a}`,
      colAxis: `B = ${b}`,
      table: emptyTable(n + 1, m + 1),
    };
    const steps = [];

    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.loop,
        message: `D[i][j] is the cheapest way to turn the first i characters of A into the first j of B`,
      })
    );

    // Unlike LCS the edges are not all zero, and the reason is worth its own
    // frame: turning a prefix into nothing is exactly one delete per
    // character, and the other edge is the same argument with inserts.
    for (let j = 0; j <= m; j++) ctx.table[0][j] = cell(j, j ? INS : undefined);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.baseRow,
        deps: Array.from({ length: m + 1 }, (_, j) => ({ r: 0, c: j, kind: "read" })),
        message: `Row 0: turning "" into the first j characters of B costs j inserts`,
      })
    );

    for (let i = 0; i <= n; i++) ctx.table[i][0] = cell(i, i ? DEL : undefined);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.baseCol,
        deps: Array.from({ length: n + 1 }, (_, i) => ({ r: i, c: 0, kind: "read" })),
        message: `Column 0: turning the first i characters of A into "" costs i deletes`,
      })
    );

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const chA = a[i - 1];
        const chB = b[j - 1];
        const diag = ctx.table[i - 1][j - 1].value;
        const up = ctx.table[i - 1][j].value;
        const left = ctx.table[i][j - 1].value;

        if (chA === chB) {
          ctx.table[i][j] = cell(diag, SUB);
          steps.push(
            snap(ctx, {
              cur: { r: i, c: j },
              deps: [{ r: i - 1, c: j - 1, kind: "chosen" }],
              line: LINE.match,
              message: `A[${i}] = B[${j}] = ${chA} — nothing to fix, so this costs whatever the shorter pair cost: ${diag}`,
            })
          );
          continue;
        }

        // Substitution first on a tie, then delete, then insert. The order is
        // arbitrary but it has to be *fixed*, because the backtrack reads the
        // mark rather than recomputing the minimum — otherwise the script it
        // recovers could disagree with the number the fill wrote.
        const best = Math.min(diag, up, left);
        const mark = best === diag ? SUB : best === up ? DEL : INS;
        ctx.table[i][j] = cell(best + 1, mark);

        const nameFor = { [SUB]: "substitute", [DEL]: "delete", [INS]: "insert" };
        steps.push(
          snap(ctx, {
            cur: { r: i, c: j },
            deps: [
              { r: i - 1, c: j - 1, kind: mark === SUB ? "chosen" : "read" },
              { r: i - 1, c: j, kind: mark === DEL ? "chosen" : "read" },
              { r: i, c: j - 1, kind: mark === INS ? "chosen" : "read" },
            ],
            line: LINE.edit,
            message: `A[${i}] = ${chA} but B[${j}] = ${chB} — one edit on top of the cheapest neighbour: min(${diag} sub, ${up} del, ${left} ins) + 1 = ${
              best + 1
            }, so ${nameFor[mark]}`,
          })
        );
      }
    }

    const distance = ctx.table[n][m].value;
    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: n, c: m },
        line: LINE.backtrack,
        message: `D[${n}][${m}] = ${distance}. That is how many edits — the table still hasn't said which ones.`,
      })
    );

    // ---- backtracking: every step back is one edit, or one free match ----
    const path = [];
    const script = [];
    let i = n;
    let j = m;

    const auxOf = () => ({ label: "EDIT SCRIPT", items: [...script] });

    while (i > 0 || j > 0) {
      path.push({ r: i, c: j });
      const mark = ctx.table[i][j].mark;
      const chA = a[i - 1];
      const chB = b[j - 1];
      let text;
      let tone;
      let next;

      if (mark === SUB && chA === chB) {
        text = `keep ${chA}`;
        tone = "plain";
        next = { r: i - 1, c: j - 1 };
      } else if (mark === SUB) {
        text = `${chA}→${chB}`;
        tone = "take";
        next = { r: i - 1, c: j - 1 };
      } else if (mark === DEL) {
        text = `del ${chA}`;
        tone = "skip";
        next = { r: i - 1, c: j };
      } else {
        text = `ins ${chB}`;
        tone = "take";
        next = { r: i, c: j - 1 };
      }

      script.unshift({ text, tone });
      steps.push(
        snap(ctx, {
          phase: "backtrack",
          cur: { r: i, c: j },
          deps: [{ ...next, kind: "chosen" }],
          path: [...path],
          line: LINE.backtrack,
          aux: auxOf(),
          message: `${mark} — ${
            tone === "plain" ? `the characters matched, so this step is free (${text})` : `this cell paid for one edit: ${text}`
          }`,
        })
      );

      i = next.r;
      j = next.c;
    }

    const edits = script.filter((s) => s.tone !== "plain").length;
    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: auxOf(),
        resultBadge: `DISTANCE ${distance} — ${edits} EDIT${edits === 1 ? "" : "S"}`,
        message: `Read the script left to right and it turns ${a} into ${b}. ${
          script.length - edits
        } of the ${script.length} steps were free matches; the ${edits} that weren't are the distance.`,
      })
    );

    return { steps };
  },
};
