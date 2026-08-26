import {
  MAX_STRING,
  cell,
  emptyTable,
  parseWord,
  prefixHeads,
  randomWord,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "for i = 0..n:  L[i][0] = 0",
  "for j = 0..m:  L[0][j] = 0",
  "for i = 1..n, for j = 1..m:",
  "    if A[i] == B[j]:",
  "        L[i][j] = L[i-1][j-1] + 1",
  "    else:",
  "        L[i][j] = max(L[i-1][j], L[i][j-1])",
  "backtrack from L[n][m] to read the subsequence off",
];

const LINE = {
  baseRow: 0,
  baseCol: 1,
  loop: 2,
  match: 4,
  skip: 6,
  backtrack: 7,
};

export const lcs = {
  key: "lcs",
  label: "Longest Common Subsequence",
  short: "LCS",
  group: "strings",
  fields: ["stringA", "stringB"],
  defaults: { stringA: "AGCAT", stringB: "GAC" },
  desc: "The longest sequence of characters that appears in both strings in the same order, though not necessarily next to each other. L[i][j] is the answer for the first i characters of A against the first j of B, so each cell asks one question: do these two characters match? If they do, this pair extends the best answer for the two shorter prefixes and the cell is that diagonal neighbour plus one. If they don't, at least one of the two characters cannot be used, so the answer is whichever of dropping A's or dropping B's does better. The table's last cell is the length; the subsequence itself only comes back by walking the choices backwards.",
  time: "O(n·m)",
  space: "O(n·m)",
  pseudocode: PSEUDOCODE,

  random: () => ({ stringA: randomWord(4, 7), stringB: randomWord(3, 6) }),

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
        message: `L[i][j] is the LCS of the first i characters of A and the first j of B — ${n + 1} × ${
          m + 1
        } cells, and the answer is the last one`,
      })
    );

    // The two zero edges are one frame each rather than one per cell: they are
    // the same fact stated n times, and the fact — an empty prefix shares
    // nothing with anything — is worth a sentence, not thirty steps.
    for (let j = 0; j <= m; j++) ctx.table[0][j] = cell(0);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.baseRow,
        deps: Array.from({ length: m + 1 }, (_, j) => ({ r: 0, c: j, kind: "read" })),
        message: "Row 0: an empty prefix of A has nothing in common with any prefix of B — all zeros",
      })
    );

    for (let i = 0; i <= n; i++) ctx.table[i][0] = cell(0);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.baseCol,
        deps: Array.from({ length: n + 1 }, (_, i) => ({ r: i, c: 0, kind: "read" })),
        message: "Column 0: the same the other way round — zeros, and every other cell is built from these",
      })
    );

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const chA = a[i - 1];
        const chB = b[j - 1];

        if (chA === chB) {
          const diagonal = ctx.table[i - 1][j - 1].value;
          ctx.table[i][j] = cell(diagonal + 1, "↖");
          steps.push(
            snap(ctx, {
              cur: { r: i, c: j },
              deps: [{ r: i - 1, c: j - 1, kind: "chosen" }],
              line: LINE.match,
              message: `A[${i}] = B[${j}] = ${chA} — this pair extends the best answer for the two shorter prefixes: ${diagonal} + 1 = ${
                diagonal + 1
              }`,
            })
          );
        } else {
          const up = ctx.table[i - 1][j].value;
          const left = ctx.table[i][j - 1].value;
          // Ties go up, and the backtrack follows the same rule, so the two
          // halves can never disagree about which path the table describes.
          const takeUp = up >= left;
          ctx.table[i][j] = cell(Math.max(up, left), takeUp ? "↑" : "←");
          steps.push(
            snap(ctx, {
              cur: { r: i, c: j },
              deps: [
                { r: i - 1, c: j, kind: takeUp ? "chosen" : "read" },
                { r: i, c: j - 1, kind: takeUp ? "read" : "chosen" },
              ],
              line: LINE.skip,
              message: `A[${i}] = ${chA} but B[${j}] = ${chB} — one of them is unusable, so take the better of dropping A's (${up}) or dropping B's (${left}) = ${Math.max(
                up,
                left
              )}`,
            })
          );
        }
      }
    }

    const length = ctx.table[n][m].value;
    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: n, c: m },
        line: LINE.backtrack,
        message: `The table is full. L[${n}][${m}] = ${length} — that is the length, and the table does not say which characters they were`,
      })
    );

    // ---- backtracking: the same three cases, read in reverse ----
    const path = [];
    const chars = [];
    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
      path.push({ r: i, c: j });
      const mark = ctx.table[i][j].mark;
      if (mark === "↖") {
        chars.unshift(a[i - 1]);
        steps.push(
          snap(ctx, {
            phase: "backtrack",
            cur: { r: i, c: j },
            deps: [{ r: i - 1, c: j - 1, kind: "chosen" }],
            path: [...path],
            line: LINE.backtrack,
            aux: { label: "SUBSEQUENCE", items: chars.map((ch) => ({ text: ch, tone: "take" })) },
            message: `↖ — this cell was built from a match, so ${a[i - 1]} is in the subsequence. Step diagonally.`,
          })
        );
        i -= 1;
        j -= 1;
      } else {
        const next = mark === "↑" ? { r: i - 1, c: j } : { r: i, c: j - 1 };
        steps.push(
          snap(ctx, {
            phase: "backtrack",
            cur: { r: i, c: j },
            deps: [{ ...next, kind: "chosen" }],
            path: [...path],
            line: LINE.backtrack,
            aux: { label: "SUBSEQUENCE", items: chars.map((ch) => ({ text: ch, tone: "take" })) },
            message: `${mark} — this cell copied its neighbour rather than matching, so ${
              mark === "↑" ? `A[${i}] = ${a[i - 1]}` : `B[${j}] = ${b[j - 1]}`
            } contributes nothing here`,
          })
        );
        if (mark === "↑") i -= 1;
        else j -= 1;
      }
    }

    const result = chars.join("");
    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: { label: "SUBSEQUENCE", items: chars.map((ch) => ({ text: ch, tone: "take" })) },
        resultBadge: length ? `LCS = "${result}" — LENGTH ${length}` : "NO COMMON SUBSEQUENCE",
        message: length
          ? `"${result}" appears in both strings in this order. The walk touched ${path.length} cells out of ${
              (n + 1) * (m + 1)
            } — the table had to be filled, but the answer is one path through it.`
          : "The two strings share no characters at all",
      })
    );

    return { steps };
  },
};
