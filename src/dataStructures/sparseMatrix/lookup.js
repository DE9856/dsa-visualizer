import { density, frame, storageOf } from "./helpers";

export const lookup = {
  key: "lookup",
  label: "Read A[i][j]",
  group: "status",
  fields: ["row", "col"],
  desc: "The operation the representation gives up. A dense matrix reads a cell with one multiply and one add — the address *is* the answer, and it costs the same whatever is in it. A triplet list has to look, and because the list is sorted by (row, column) the look can at least be a binary search rather than a scan, which is what this does. Every zero cell is the worst case: it is found by not being there. That is the trade in a sentence — random access, in exchange for not storing the zeros.",
  time: "O(log t)",
  space: "O(1)",

  run(matrix, { row = 0, col = 0 }) {
    const steps = [];

    if (row < 0 || row >= matrix.rows || col < 0 || col >= matrix.cols) {
      return {
        steps: [
          frame(matrix, {
            notFound: true,
            message: `(${row}, ${col}) is outside a ${matrix.rows}×${matrix.cols} matrix.`,
          }),
        ],
        finalMatrix: matrix,
      };
    }

    steps.push(
      frame(matrix, {
        cell: { r: row, c: col },
        message: `Looking for (${row}, ${col}). In a dense array this would be one address calculation; here it is a search over ${matrix.triples.length} terms.`,
      })
    );

    let lo = 0;
    let hi = matrix.triples.length - 1;
    let found = null;
    let probes = 0;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const t = matrix.triples[mid];
      probes++;
      const cmp = t.r - row || t.c - col;
      steps.push(
        frame(matrix, {
          cell: { r: row, c: col },
          active: [t.id],
          range: [lo, hi],
          probe: mid,
          message: `Probe ${probes}: term ${mid} is (${t.r}, ${t.c}) — ${
            cmp === 0 ? "that is it" : cmp < 0 ? `earlier than (${row}, ${col}), so look to the right half` : `later than (${row}, ${col}), so look to the left half`
          }.`,
        })
      );
      if (cmp === 0) {
        found = t;
        break;
      }
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
    }

    const { dense, sparse } = storageOf(matrix);
    steps.push(
      frame(matrix, {
        cell: { r: row, c: col },
        active: found ? [found.id] : [],
        found: Boolean(found),
        notFound: !found,
        resultBadge: `A[${row}][${col}] = ${found ? found.value : 0}`,
        message: found
          ? `A[${row}][${col}] = ${found.value}, in ${probes} probe${probes === 1 ? "" : "s"}.`
          : `No term for (${row}, ${col}) after ${probes} probe${
              probes === 1 ? "" : "s"
            }, so the cell is zero. A zero costs nothing to store and the most to read — ${probes} probes to learn there is nothing there. ${matrix.triples.length} terms, ${(
              density(matrix) * 100
            ).toFixed(0)}% dense, ${sparse} numbers against a dense ${dense}.`,
      })
    );

    return { steps, finalMatrix: matrix };
  },
};
