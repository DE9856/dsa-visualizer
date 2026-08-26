import { MAX_SEQUENCE, cell, emptyTable, head, parseNumbers, randomInts, snap } from "./helpers";

const PSEUDOCODE = [
  "for i = 0..n-1:  L[i] = 1        (the element alone)",
  "for i = 1..n-1:",
  "    for j = 0..i-1:",
  "        if seq[j] < seq[i] and L[j] + 1 > L[i]:",
  "            L[i] = L[j] + 1;  prev[i] = j",
  "answer = max(L);  follow prev back from its index",
];

const LINE = { base: 0, outer: 1, inner: 2, test: 3, extend: 4, backtrack: 5 };

export const lis = {
  key: "lis",
  label: "Longest Increasing Subsequence",
  short: "LIS",
  group: "sequences",
  fields: ["sequence"],
  defaults: { sequence: "3, 10, 2, 1, 20, 4, 6" },
  desc: "The longest run of strictly increasing values you can pick out of a sequence without reordering it. The table here is one row rather than two dimensions, and the trick is what a cell means: L[i] is the length of the best increasing subsequence *ending exactly at* i — not the best in the whole prefix. That restriction is what makes the recurrence work, because any subsequence ending at i has to arrive from some earlier j with a smaller value, and the best one is the best of those plus one. The consequence is that the answer is not the last cell but the largest cell anywhere in the row, which is unusual enough to be worth seeing.",
  time: "O(n²)",
  space: "O(n)",
  pseudocode: PSEUDOCODE,

  random: () => ({ sequence: randomInts(6 + Math.floor(Math.random() * 3), 1, 25).join(", ") }),

  parse(raw) {
    const sequence = parseNumbers(raw.sequence, MAX_SEQUENCE);
    if (sequence.length < 2) return { error: "Give at least two numbers." };
    return { sequence };
  },

  run({ sequence }) {
    const n = sequence.length;
    const ctx = {
      rows: [head("L[i]")],
      cols: sequence.map((value, i) => head(String(value), String(i))),
      rowAxis: "BEST ENDING HERE",
      colAxis: "SEQUENCE",
      table: emptyTable(1, n),
    };
    const steps = [];
    const prev = new Array(n).fill(-1);

    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.outer,
        message: `L[i] is the longest increasing subsequence that ends at position i — one cell per element, not a grid`,
      })
    );

    for (let i = 0; i < n; i++) ctx.table[0][i] = cell(1);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.base,
        deps: Array.from({ length: n }, (_, i) => ({ r: 0, c: i, kind: "read" })),
        message: "Every element is an increasing subsequence of length 1 on its own — that is the floor for every cell",
      })
    );

    for (let i = 1; i < n; i++) {
      for (let j = 0; j < i; j++) {
        const smaller = sequence[j] < sequence[i];
        const candidate = ctx.table[0][j].value + 1;
        const better = smaller && candidate > ctx.table[0][i].value;

        if (better) {
          ctx.table[0][i] = cell(candidate, `←${j}`);
          prev[i] = j;
        }

        steps.push(
          snap(ctx, {
            cur: { r: 0, c: i },
            deps: [{ r: 0, c: j, kind: better ? "chosen" : "read" }],
            line: better ? LINE.extend : LINE.test,
            message: !smaller
              ? `seq[${j}] = ${sequence[j]} is not smaller than seq[${i}] = ${sequence[i]} — nothing ending at ${j} can be extended by it`
              : better
                ? `seq[${j}] = ${sequence[j]} < ${sequence[i]}, and L[${j}] + 1 = ${candidate} beats the ${
                    candidate - 1
                  } already here — extend it`
                : `seq[${j}] = ${sequence[j]} < ${sequence[i]}, but L[${j}] + 1 = ${candidate} is no better than the ${
                    ctx.table[0][i].value
                  } already here`,
          })
        );
      }
    }

    // The answer is the largest cell, wherever it is. Ties go to the earliest,
    // and the backtrack starts from the same index, so the length and the
    // subsequence always describe each other.
    let bestIdx = 0;
    for (let i = 1; i < n; i++) if (ctx.table[0][i].value > ctx.table[0][bestIdx].value) bestIdx = i;
    const length = ctx.table[0][bestIdx].value;

    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: 0, c: bestIdx },
        line: LINE.backtrack,
        deps: Array.from({ length: n }, (_, i) => ({ r: 0, c: i, kind: "read" })),
        message: `The answer is the largest cell in the row, not the last one — L[${bestIdx}] = ${length}, ending at ${sequence[bestIdx]}`,
      })
    );

    // ---- backtracking: prev[] is a chain of indices, walked in reverse ----
    const path = [];
    const values = [];
    let at = bestIdx;

    const auxOf = () => ({
      label: "SUBSEQUENCE",
      items: values.map((v) => ({ text: String(v), tone: "take" })),
    });

    while (at !== -1) {
      path.push({ r: 0, c: at });
      values.unshift(sequence[at]);
      const from = prev[at];
      steps.push(
        snap(ctx, {
          phase: "backtrack",
          cur: { r: 0, c: at },
          deps: from === -1 ? [] : [{ r: 0, c: from, kind: "chosen" }],
          path: [...path],
          line: LINE.backtrack,
          aux: auxOf(),
          message:
            from === -1
              ? `L[${at}] = 1 — ${sequence[at]} started the chain. That is the whole subsequence.`
              : `${sequence[at]} was reached from position ${from} (${sequence[from]}) — step back to it`,
        })
      );
      at = from;
    }

    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: auxOf(),
        resultBadge: `LENGTH ${length} — ${values.join(" < ")}`,
        message: `${values.join(", ")} is increasing and ${length} long. Note where it ended: cell ${bestIdx} of ${
          n - 1
        }${bestIdx === n - 1 ? ", which is the last one here only by luck" : ", not the last cell — the row's maximum is the answer"}.`,
      })
    );

    return { steps };
  },
};
