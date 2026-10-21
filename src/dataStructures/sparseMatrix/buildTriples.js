import { auxOf, frame, storageOf, term } from "./helpers";

export const buildTriples = {
  key: "build",
  label: "Build the Triplet List",
  group: "represent",
  fields: [],
  desc: "The conversion itself, one cell at a time: scan the dense grid in row-major order and write down a (row, column, value) triple for every cell that is not zero. Everything else is thrown away and reconstructed from the shape. Two things fall out of scanning in this order and are relied on everywhere afterwards — the list comes out sorted by (row, column), and it comes out in one pass. Watch the storage figures at the end: three numbers per term plus a three-number header, against one per cell, so the triplet form wins below about a third density and loses above it.",
  time: "O(rows · cols)",
  space: "O(t)",

  run(matrix) {
    const built = { rows: matrix.rows, cols: matrix.cols, triples: [] };
    const steps = [];

    steps.push(
      frame(matrix, {
        aux: auxOf(built, "TRIPLET LIST"),
        message: `A ${matrix.rows}×${matrix.cols} grid, ${matrix.rows * matrix.cols} cells. Scan it row by row and keep only what is not zero.`,
      })
    );

    for (let r = 0; r < matrix.rows; r++) {
      for (let c = 0; c < matrix.cols; c++) {
        const value = matrix.triples.find((t) => t.r === r && t.c === c)?.value ?? 0;
        if (value === 0) {
          steps.push(
            frame(matrix, {
              cell: { r, c },
              aux: auxOf(built, "TRIPLET LIST"),
              message: `(${r}, ${c}) is zero — nothing is recorded. A zero costs the sparse form nothing at all, which is the entire idea.`,
            })
          );
          continue;
        }
        const entry = term(r, c, value);
        built.triples.push(entry);
        steps.push(
          frame(matrix, {
            cell: { r, c },
            active: [entry.id],
            aux: auxOf(built, "TRIPLET LIST", { active: [entry.id] }),
            message: `(${r}, ${c}) holds ${value} — record the triple (${r}, ${c}, ${value}). It goes on the end, and because the scan is row-major the list stays sorted without ever being sorted.`,
          })
        );
      }
    }

    const { dense, sparse, wins } = storageOf(built);
    steps.push(
      frame(matrix, {
        aux: auxOf(built, "TRIPLET LIST"),
        resultBadge: `${built.triples.length} TERMS · ${sparse} NUMBERS vs ${dense}`,
        message: `${built.triples.length} non-zero terms out of ${dense} cells — ${((built.triples.length / dense) * 100).toFixed(
          0
        )}% dense. The triplet list costs 3 × ${built.triples.length} + 3 = ${sparse} numbers against the grid's ${dense}, so ${
          wins ? "it wins here" : "the dense grid is actually the cheaper one at this density"
        }.`,
      })
    );

    return { steps, finalMatrix: built };
  },
};
