import { auxOf, frame, term } from "./helpers";

export const transposeFast = {
  key: "transposeFast",
  label: "Fast Transpose",
  group: "transform",
  fields: [],
  desc: "The same result in one pass, by working out where every term is going *before* moving any of them. Count how many terms sit in each column of A — that count is the length of the corresponding row of Aᵀ. Turn those counts into starting positions with a running sum, and now each term's destination index is known outright: read the list once, and drop each term straight into its slot. It is a counting sort on the column index, and it costs O(cols + t) instead of O(cols · t). The price is one array of length cols, which is exactly the trade a counting sort always makes: memory for the pass you no longer have to repeat.",
  time: "O(cols + t)",
  space: "O(cols + t)",

  run(matrix) {
    const steps = [];
    const n = matrix.triples.length;
    const result = { rows: matrix.cols, cols: matrix.rows, triples: [] };

    steps.push(
      frame(matrix, {
        aux: auxOf(result, "Aᵀ"),
        message: `${n} terms to move. Instead of hunting for them column by column, work out where each one lands first.`,
      })
    );

    // ---- pass one: how many terms in each column ----
    const count = new Array(matrix.cols).fill(0);
    steps.push(
      frame(matrix, {
        counts: { label: "TERMS PER COLUMN", values: [...count] },
        aux: auxOf(result, "Aᵀ"),
        message: "One counter per column of A. Column j's count is how long row j of Aᵀ will be.",
      })
    );

    for (const t of matrix.triples) {
      count[t.c]++;
      steps.push(
        frame(matrix, {
          active: [t.id],
          cell: { r: t.r, c: t.c },
          counts: { label: "TERMS PER COLUMN", values: [...count], at: t.c },
          aux: auxOf(result, "Aᵀ"),
          message: `(${t.r}, ${t.c}, ${t.value}) is in column ${t.c} — count[${t.c}] is now ${count[t.c]}.`,
        })
      );
    }

    // ---- pass two: counts into starting positions ----
    const start = new Array(matrix.cols).fill(0);
    steps.push(
      frame(matrix, {
        counts: { label: "TERMS PER COLUMN", values: [...count] },
        aux: auxOf(result, "Aᵀ"),
        message: `Counts done: [${count.join(", ")}]. A running sum turns them into the index each row of Aᵀ starts at.`,
      })
    );

    for (let c = 1; c < matrix.cols; c++) {
      start[c] = start[c - 1] + count[c - 1];
      steps.push(
        frame(matrix, {
          counts: { label: "STARTING POSITION", values: [...start], at: c, secondary: { label: "COUNT", values: [...count] } },
          aux: auxOf(result, "Aᵀ"),
          message: `start[${c}] = start[${c - 1}] + count[${c - 1}] = ${start[c - 1]} + ${count[c - 1]} = ${start[c]} — row ${c} of Aᵀ begins there, because everything before it is already accounted for.`,
        })
      );
    }

    // ---- pass three: one read, each term straight to its slot ----
    const slots = new Array(n).fill(null);
    const cursor = [...start];
    steps.push(
      frame(matrix, {
        counts: { label: "STARTING POSITION", values: [...cursor] },
        aux: auxOf(result, "Aᵀ"),
        message: `Every destination is known. Read A's terms once, in order, and place each one — no searching, no sorting.`,
      })
    );

    for (const t of matrix.triples) {
      const at = cursor[t.c]++;
      const entry = term(t.c, t.r, t.value);
      slots[at] = entry;
      result.triples = slots.filter(Boolean);
      steps.push(
        frame(matrix, {
          active: [t.id],
          cell: { r: t.r, c: t.c },
          counts: { label: "NEXT FREE SLOT", values: [...cursor], at: t.c },
          aux: auxOf(result, "Aᵀ", { active: [entry.id] }),
          message: `(${t.r}, ${t.c}, ${t.value}) belongs at index ${at} of Aᵀ — the next free slot in row ${t.c}. Place it, and bump the cursor to ${cursor[t.c]}.`,
        })
      );
    }

    result.triples = slots.filter(Boolean);
    const simple = matrix.cols * n;
    steps.push(
      frame(matrix, {
        aux: auxOf(result, "Aᵀ"),
        resultBadge: `${matrix.cols} + ${n} = ${matrix.cols + n} STEPS vs ${simple}`,
        message: `Same Aᵀ, in row-major order, from ${matrix.cols} + ${n} = ${
          matrix.cols + n
        } units of work rather than ${matrix.cols} × ${n} = ${simple}. Nothing was ever examined and rejected: the counting pass bought the right to place every term exactly once.`,
      })
    );

    return { steps, finalMatrix: result };
  },
};
