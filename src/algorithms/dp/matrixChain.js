import { MAX_MATRICES, VOID, cell, emptyTable, head, parseNumbers, randomInts, snap } from "./helpers";

const PSEUDOCODE = [
  "for i = 1..n:  m[i][i] = 0        (one matrix, nothing to multiply)",
  "for len = 2..n:",
  "    for i = 1..n-len+1:  j = i+len-1",
  "        m[i][j] = ∞",
  "        for k = i..j-1:",
  "            cost = m[i][k] + m[k+1][j] + d[i-1]·d[k]·d[j]",
  "            if cost < m[i][j]:  m[i][j] = cost;  s[i][j] = k",
  "backtrack through s[][] to bracket the product",
];

const LINE = { base: 0, len: 1, cell: 2, split: 5, better: 6, backtrack: 7 };

export const matrixChain = {
  key: "matrixchain",
  label: "Matrix Chain Order",
  short: "MATRIX CHAIN",
  group: "sequences",
  fields: ["dims"],
  defaults: { dims: "30, 35, 15, 5, 10, 20" },
  desc: "Matrix multiplication is associative but not equally cheap: (AB)C and A(BC) give the same product for wildly different amounts of arithmetic. Given a chain of matrices by their dimensions, this finds the bracketing that costs the fewest scalar multiplications. m[i][j] is the cheapest way to multiply the run from matrix i to matrix j, and every cell tries every place the run could be split in two — the two halves are already solved, and joining them costs one flat multiplication of the three dimensions at the edges. Only the top-right cell is the answer, and the table is triangular because a run never goes backwards.",
  time: "O(n³)",
  space: "O(n²)",
  pseudocode: PSEUDOCODE,

  random: () => ({ dims: randomInts(5 + Math.floor(Math.random() * 2), 5, 40).join(", ") }),

  parse(raw) {
    const dims = parseNumbers(raw.dims, MAX_MATRICES + 1).filter((d) => d > 0);
    if (dims.length < 3) return { error: "Give at least three dimensions — that is two matrices." };
    return { dims };
  },

  run({ dims }) {
    const n = dims.length - 1;
    const label = (i) => `A${i}`;
    const ctx = {
      rows: Array.from({ length: n }, (_, i) => head(label(i + 1), `${dims[i]}×${dims[i + 1]}`)),
      cols: Array.from({ length: n }, (_, i) => head(label(i + 1))),
      rowAxis: "FROM MATRIX i",
      colAxis: "TO MATRIX j",
      table: emptyTable(n, n),
    };
    const steps = [];
    const split = Array.from({ length: n }, () => new Array(n).fill(-1));

    // A run from i to j only exists for j >= i, so the lower triangle is not
    // "not filled yet" — it is not part of the table, and has to look
    // different or half the picture reads as unfinished work.
    for (let r = 0; r < n; r++) for (let c = 0; c < r; c++) ctx.table[r][c] = VOID();

    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.len,
        message: `${n} matrices: ${Array.from({ length: n }, (_, i) => `${label(i + 1)} ${dims[i]}×${dims[i + 1]}`).join(
          ", "
        )}. m[i][j] is the cheapest way to multiply the run from i to j.`,
      })
    );

    for (let i = 0; i < n; i++) ctx.table[i][i] = cell(0);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.base,
        deps: Array.from({ length: n }, (_, i) => ({ r: i, c: i, kind: "read" })),
        message: "The diagonal is free — a run of one matrix has nothing to multiply. Everything else is built outward from it.",
      })
    );

    for (let len = 2; len <= n; len++) {
      for (let i = 0; i + len - 1 < n; i++) {
        const j = i + len - 1;
        let best = Infinity;
        let bestK = -1;

        for (let k = i; k < j; k++) {
          const cost =
            ctx.table[i][k].value + ctx.table[k + 1][j].value + dims[i] * dims[k + 1] * dims[j + 1];
          const better = cost < best;
          if (better) {
            best = cost;
            bestK = k;
          }
          // Written provisionally on every split, so the cell visibly settles
          // rather than appearing finished from a blank.
          ctx.table[i][j] = cell(best, `k=${bestK + 1}`);

          steps.push(
            snap(ctx, {
              cur: { r: i, c: j },
              deps: [
                { r: i, c: k, kind: better ? "chosen" : "read" },
                { r: k + 1, c: j, kind: better ? "chosen" : "read" },
              ],
              line: better ? LINE.better : LINE.split,
              message: `${label(i + 1)}..${label(j + 1)} split after ${label(k + 1)}: ${
                ctx.table[i][k].value
              } + ${ctx.table[k + 1][j].value} + ${dims[i]}·${dims[k + 1]}·${dims[j + 1]} = ${cost}. ${
                better ? `Best so far.` : `Worse than ${best} — keep the earlier split.`
              }`,
            })
          );
        }

        // Only worth restating when there was a choice to make.
        if (j - i > 1) {
          steps.push(
            snap(ctx, {
              cur: { r: i, c: j },
              line: LINE.cell,
              message: `${label(i + 1)}..${label(j + 1)} costs ${best} at best, splitting after ${label(
                bestK + 1
              )} — that split is all this cell remembers about how`,
            })
          );
        }
        split[i][j] = bestK;
      }
    }

    const total = ctx.table[0][n - 1].value;
    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: 0, c: n - 1 },
        line: LINE.backtrack,
        message: `m[1][${n}] = ${total} scalar multiplications — the top-right cell, the only one that answers the original question`,
      })
    );

    // ---- backtracking: the split table is a binary tree, walked in pre-order ----
    const path = [];
    const order = [];

    const bracket = (i, j) => {
      if (i === j) return label(i + 1);
      const k = split[i][j];
      return `(${bracket(i, k)}${bracket(k + 1, j)})`;
    };

    const walk = (i, j) => {
      if (i === j) return;
      const k = split[i][j];
      path.push({ r: i, c: j });
      order.push({ text: `${label(i + 1)}..${label(j + 1)} @ ${label(k + 1)}`, tone: "take" });
      steps.push(
        snap(ctx, {
          phase: "backtrack",
          cur: { r: i, c: j },
          deps: [
            { r: i, c: k, kind: "chosen" },
            { r: k + 1, c: j, kind: "chosen" },
          ],
          path: [...path],
          line: LINE.backtrack,
          aux: { label: "SPLITS", items: [...order] },
          message: `${label(i + 1)}..${label(j + 1)} splits after ${label(k + 1)} → ${bracket(i, k)} × ${bracket(
            k + 1,
            j
          )}`,
        })
      );
      walk(i, k);
      walk(k + 1, j);
    };

    walk(0, n - 1);

    const naive = naiveCost(dims);
    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: { label: "SPLITS", items: [...order] },
        resultBadge: `${bracket(0, n - 1)} — ${total.toLocaleString()} MULTIPLICATIONS`,
        message: `Bracketed left to right instead, ${naive.toLocaleString()} multiplications — ${(
          naive / Math.max(1, total)
        ).toFixed(
          1
        )}× more for exactly the same product. The bracketing changes nothing about the answer and everything about the work.`,
      })
    );

    return { steps };
  },
};

/** Cost of the obvious bracketing, ((AB)C)D — the thing the table beats. */
function naiveCost(dims) {
  let total = 0;
  for (let i = 1; i + 1 < dims.length; i++) total += dims[0] * dims[i] * dims[i + 1];
  return total;
}
