import { auxOf, frame, term } from "./helpers";

export const transposeSimple = {
  key: "transposeSimple",
  label: "Transpose (simple)",
  group: "transform",
  fields: [],
  desc: "Transposing a triplet list is not the trivial job it looks like. Swapping r and c in every term takes one pass — but it destroys the row-major order the list has to be in, and sorting it back costs O(t log t). So the naive fix keeps the order by *building* the result in order: pick column 0, walk the whole list looking for terms in it, then column 1, and so on. Correct, in place of the sort, and quadratic — it re-reads all t terms once per column, so it costs O(cols · t). Watch how many terms it looks at and rejects; that waste is what the fast transpose removes.",
  time: "O(cols · t)",
  space: "O(t)",

  run(matrix) {
    const result = { rows: matrix.cols, cols: matrix.rows, triples: [] };
    const steps = [];
    let looks = 0;

    steps.push(
      frame(matrix, {
        aux: auxOf(result, "Aᵀ"),
        message: `Aᵀ is ${result.rows}×${result.cols}. Take the columns of A one at a time — that is the order the transpose's rows need to come out in.`,
      })
    );

    for (let c = 0; c < matrix.cols; c++) {
      steps.push(
        frame(matrix, {
          scanCol: c,
          aux: auxOf(result, "Aᵀ"),
          message: `Column ${c} of A becomes row ${c} of Aᵀ. Scan every one of the ${matrix.triples.length} terms looking for it.`,
        })
      );

      for (const t of matrix.triples) {
        looks++;
        if (t.c !== c) {
          steps.push(
            frame(matrix, {
              scanCol: c,
              active: [t.id],
              cell: { r: t.r, c: t.c },
              aux: auxOf(result, "Aᵀ"),
              message: `(${t.r}, ${t.c}, ${t.value}) is in column ${t.c}, not ${c} — skip it. This is the ${looks}th term examined, and it did no work.`,
            })
          );
          continue;
        }
        const entry = term(t.c, t.r, t.value);
        result.triples.push(entry);
        steps.push(
          frame(matrix, {
            scanCol: c,
            active: [t.id],
            cell: { r: t.r, c: t.c },
            aux: auxOf(result, "Aᵀ", { active: [entry.id] }),
            message: `(${t.r}, ${t.c}, ${t.value}) is in column ${c} — append (${t.c}, ${t.r}, ${t.value}). The row index is now ${c}, so the result is still in row-major order.`,
          })
        );
      }
    }

    const wasted = looks - matrix.triples.length;
    steps.push(
      frame(matrix, {
        aux: auxOf(result, "Aᵀ"),
        resultBadge: `${looks} TERMS EXAMINED FOR ${matrix.triples.length} PLACED`,
        message: `Done, and in order — but ${looks} term inspections to place ${matrix.triples.length} terms: ${wasted} of them found nothing. Every term is re-read once per column, which is the O(cols · t) in the heading. The fast transpose does it in one pass.`,
      })
    );

    return { steps, finalMatrix: result };
  },
};
