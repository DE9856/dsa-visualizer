import { auxOf, frame, term } from "./helpers";

export const addMatrices = {
  key: "add",
  label: "Add B",
  group: "combine",
  fields: ["secondMatrix"],
  desc: "Both lists are sorted by (row, column), so adding them is a merge — the same two-pointer walk that adds two polynomials, with a pair of indices instead of one exponent. Compare the positions the two heads sit at: whichever comes first in row-major order is copied out on its own, and when both point at the same cell the values are added. That last case is the one worth watching, because a sum can be zero — and a zero has no business in a sparse list, so the term is dropped rather than stored. The cost is O(t₁ + t₂): each term is looked at once, and never re-read.",
  time: "O(t₁ + t₂)",
  space: "O(t₁ + t₂)",

  run(matrix, { secondMatrix }) {
    const b = secondMatrix;
    if (!b || b.rows !== matrix.rows || b.cols !== matrix.cols) {
      return {
        steps: [
          frame(matrix, {
            notFound: true,
            aux: b ? auxOf(b, "B") : null,
            message: b
              ? `A is ${matrix.rows}×${matrix.cols} and B is ${b.rows}×${b.cols} — addition needs the same shape.`
              : "Type a second matrix to add.",
          }),
        ],
        finalMatrix: matrix,
      };
    }

    const result = { rows: matrix.rows, cols: matrix.cols, triples: [] };
    const steps = [];
    let i = 0;
    let j = 0;

    // `bActive` and `resultActive` name terms in the two *other* lists, so
    // they are turned into those lists' own highlights rather than left on
    // the frame, where they would mean nothing.
    const shot = ({ bActive, resultActive, ...extra }) =>
      frame(matrix, {
        aux: auxOf(result, "A + B", resultActive ? { active: resultActive } : {}),
        second: auxOf(b, "B", bActive ? { active: bActive } : {}),
        ...extra,
      });

    steps.push(
      shot({
        message: `${matrix.triples.length} terms in A, ${b.triples.length} in B, both sorted by (row, column). Walk them together.`,
      })
    );

    while (i < matrix.triples.length && j < b.triples.length) {
      const ta = matrix.triples[i];
      const tb = b.triples[j];
      const cmp = ta.r - tb.r || ta.c - tb.c;

      if (cmp === 0) {
        const sum = ta.value + tb.value;
        if (sum === 0) {
          steps.push(
            shot({
              active: [ta.id],
              bActive: [tb.id],
              cell: { r: ta.r, c: ta.c },
              message: `Both lists hold (${ta.r}, ${ta.c}): ${ta.value} + ${tb.value} = 0. The cell is zero now, so nothing is stored — a sparse list that recorded zeros would stop being sparse.`,
            })
          );
        } else {
          const entry = term(ta.r, ta.c, sum);
          result.triples.push(entry);
          steps.push(
            shot({
              active: [ta.id],
              bActive: [tb.id],
              cell: { r: ta.r, c: ta.c },
              resultActive: [entry.id],
              message: `Both lists hold (${ta.r}, ${ta.c}): ${ta.value} + ${tb.value} = ${sum}. One term out, two consumed.`,
            })
          );
        }
        i++;
        j++;
        continue;
      }

      if (cmp < 0) {
        const entry = term(ta.r, ta.c, ta.value);
        result.triples.push(entry);
        steps.push(
          shot({
            active: [ta.id],
            cell: { r: ta.r, c: ta.c },
            resultActive: [entry.id],
            message: `(${ta.r}, ${ta.c}) comes before (${tb.r}, ${tb.c}) in row-major order, so B has nothing there — copy A's ${ta.value} straight out.`,
          })
        );
        i++;
        continue;
      }

      const entry = term(tb.r, tb.c, tb.value);
      result.triples.push(entry);
      steps.push(
        shot({
          bActive: [tb.id],
          resultActive: [entry.id],
          message: `(${tb.r}, ${tb.c}) comes first, so A has nothing there — copy B's ${tb.value} out.`,
        })
      );
      j++;
    }

    while (i < matrix.triples.length) {
      const ta = matrix.triples[i++];
      const entry = term(ta.r, ta.c, ta.value);
      result.triples.push(entry);
      steps.push(
        shot({
          active: [ta.id],
          cell: { r: ta.r, c: ta.c },
          resultActive: [entry.id],
          message: `B is exhausted — the rest of A copies over unchanged. (${ta.r}, ${ta.c}, ${ta.value}).`,
        })
      );
    }

    while (j < b.triples.length) {
      const tb = b.triples[j++];
      const entry = term(tb.r, tb.c, tb.value);
      result.triples.push(entry);
      steps.push(
        shot({
          bActive: [tb.id],
          resultActive: [entry.id],
          message: `A is exhausted — the rest of B copies over. (${tb.r}, ${tb.c}, ${tb.value}).`,
        })
      );
    }

    steps.push(
      shot({
        resultBadge: `${result.triples.length} TERMS FROM ${matrix.triples.length} + ${b.triples.length}`,
        message: `A + B has ${result.triples.length} terms, from ${
          matrix.triples.length + b.triples.length
        } inputs — one pass over each list, nothing sorted afterwards, because a merge of two ordered lists is ordered.`,
      })
    );

    return { steps, finalMatrix: result };
  },
};
