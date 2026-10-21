import { MAX_TERMS, auxOf, frame, inOrder, term } from "./helpers";

export const multiplyMatrices = {
  key: "multiply",
  label: "Multiply by B",
  group: "combine",
  fields: ["secondMatrix"],
  desc: "The dense algorithm does rows × columns × depth multiplications and most of them are by zero. The sparse one never touches a zero at all: a term of A at (i, k) can only ever meet a term of B at (k, j) — the k has to match, or there is nothing to multiply — so the work is exactly the number of such matching pairs. That is why sparse multiply is the operation where the representation pays off most and also where it is least predictable: two matrices with the same number of terms can differ by orders of magnitude in how many pairs line up. Products land in an accumulator, because several pairs can contribute to the same cell of the result, and only non-zero sums become terms.",
  time: "O(pairs)",
  space: "O(t)",

  run(matrix, { secondMatrix }) {
    const b = secondMatrix;
    if (!b || matrix.cols !== b.rows) {
      return {
        steps: [
          frame(matrix, {
            notFound: true,
            aux: b ? auxOf(b, "B") : null,
            message: b
              ? `A is ${matrix.rows}×${matrix.cols} and B is ${b.rows}×${b.cols} — A's columns must match B's rows.`
              : "Type a second matrix to multiply by.",
          }),
        ],
        finalMatrix: matrix,
      };
    }

    const result = { rows: matrix.rows, cols: b.cols, triples: [] };
    const acc = new Map();
    const steps = [];
    let pairs = 0;

    // The result is rebuilt from the accumulator on every frame, in row-major
    // order, so the list on screen is always a valid sparse matrix rather than
    // an accumulator drawn as one.
    const commit = () => {
      result.triples = [...acc.entries()]
        .map(([key, value]) => {
          const [r, c] = key.split(":").map(Number);
          return { r, c, value };
        })
        .filter((t) => t.value !== 0)
        .sort(inOrder)
        .slice(0, MAX_TERMS)
        .map((t) => term(t.r, t.c, t.value));
    };

    const shot = (extra = {}) => {
      commit();
      return frame(matrix, { aux: auxOf(result, "A × B"), second: auxOf(b, "B"), ...extra });
    };

    steps.push(
      shot({
        message: `A is ${matrix.rows}×${matrix.cols}, B is ${b.rows}×${b.cols}, so A × B is ${result.rows}×${result.cols}. Dense would be ${
          matrix.rows * b.cols * matrix.cols
        } multiplications; only the pairs that share an index are real.`,
      })
    );

    for (const ta of matrix.triples) {
      const partners = b.triples.filter((tb) => tb.r === ta.c);

      if (partners.length === 0) {
        steps.push(
          shot({
            active: [ta.id],
            cell: { r: ta.r, c: ta.c },
            message: `A(${ta.r}, ${ta.c}) = ${ta.value}, so it needs row ${ta.c} of B — and row ${ta.c} of B is empty. This term contributes nothing to the product at all.`,
          })
        );
        continue;
      }

      for (const tb of partners) {
        pairs++;
        const key = `${ta.r}:${tb.c}`;
        const before = acc.get(key) || 0;
        const product = ta.value * tb.value;
        acc.set(key, before + product);
        steps.push(
          shot({
            active: [ta.id],
            cell: { r: ta.r, c: ta.c },
            second: auxOf(b, "B", { active: [tb.id], cell: { r: tb.r, c: tb.c } }),
            message: `A(${ta.r}, ${ta.c}) = ${ta.value} meets B(${tb.r}, ${tb.c}) = ${tb.value} — the ${ta.c} matches, so they multiply. ${
              before === 0
                ? `Result(${ta.r}, ${tb.c}) starts at ${product}.`
                : `Result(${ta.r}, ${tb.c}) was ${before}, now ${before} + ${product} = ${before + product}.`
            }`,
          })
        );
      }
    }

    const zeroed = [...acc.values()].filter((v) => v === 0).length;
    steps.push(
      shot({
        resultBadge: `${pairs} MULTIPLICATIONS · ${result.triples.length} TERMS`,
        message: `${pairs} multiplications instead of ${
          matrix.rows * b.cols * matrix.cols
        }, and ${result.triples.length} terms in the answer${
          zeroed ? `. ${zeroed} accumulated cell${zeroed > 1 ? "s" : ""} cancelled to zero and ${zeroed > 1 ? "are" : "is"} not stored` : ""
        }. A product of two sparse matrices need not be sparse — that is worth checking before relying on it.`,
      })
    );

    return { steps, finalMatrix: result };
  },
};
