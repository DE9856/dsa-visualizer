import { nextId } from "../linkedList/nodeId";
import { formatTerm, formatPolynomial } from "./helpers";

export const addPolynomials = {
  key: "addPoly",
  label: "Add Polynomials",
  group: "combine",
  fields: ["secondList"],
  desc: "Walks both term lists at once (both sorted by descending exponent). Matching exponents are summed into one term; unmatched exponents are copied straight across. Terms that cancel out to zero are dropped.",
  time: "O(n + m)",
  space: "O(n + m)",
  run(list, { secondList = [] }) {
    const a = list.map((n) => ({ id: n.id, coeff: n.coeff, exp: n.exp }));
    const b = secondList.map((t) => ({ id: nextId(), coeff: t.coeff, exp: t.exp }));
    const steps = [];

    const toNode = (t) => ({ id: t.id, coeff: t.coeff, exp: t.exp, value: formatTerm(t.coeff, t.exp) });

    if (a.length === 0 && b.length === 0) {
      steps.push({ nodes: [], message: "Both polynomials are empty — sum is 0" });
      return { steps, finalList: [] };
    }

    let i = 0;
    let j = 0;
    const merged = [];

    const renderRow = () => [...merged, ...a.slice(i), ...b.slice(j)].map(toNode);

    while (i < a.length && j < b.length) {
      steps.push({
        nodes: renderRow(),
        active: [a[i].id, b[j].id],
        headId: merged[0]?.id ?? a[i].id,
        message: `Comparing ${formatTerm(a[i].coeff, a[i].exp)} (A) and ${formatTerm(b[j].coeff, b[j].exp)} (B)`,
      });

      if (a[i].exp === b[j].exp) {
        const sum = a[i].coeff + b[j].coeff;
        const msgTerms = `${formatTerm(a[i].coeff, a[i].exp)} + ${formatTerm(b[j].coeff, b[j].exp)}`;
        if (sum !== 0) {
          const combined = { id: a[i].id, coeff: sum, exp: a[i].exp };
          merged.push(combined);
          steps.push({
            nodes: [...merged, ...a.slice(i + 1), ...b.slice(j + 1)].map(toNode),
            mergedIds: merged.map((n) => n.id),
            pending: combined.id,
            headId: merged[0]?.id ?? null,
            message: `${msgTerms} = ${formatTerm(sum, a[i].exp)} — same exponent, terms combined`,
          });
        } else {
          steps.push({
            nodes: [...merged, ...a.slice(i + 1), ...b.slice(j + 1)].map(toNode),
            mergedIds: merged.map((n) => n.id),
            headId: merged[0]?.id ?? null,
            message: `${msgTerms} = 0 — same exponent, terms cancel out`,
          });
        }
        i += 1;
        j += 1;
      } else if (a[i].exp > b[j].exp) {
        merged.push(a[i]);
        steps.push({
          nodes: [...merged, ...a.slice(i + 1), ...b.slice(j)].map(toNode),
          mergedIds: merged.map((n) => n.id),
          pending: a[i].id,
          headId: merged[0]?.id ?? null,
          message: `${formatTerm(a[i].coeff, a[i].exp)} has no match in B — copied across as-is`,
        });
        i += 1;
      } else {
        merged.push(b[j]);
        steps.push({
          nodes: [...merged, ...a.slice(i), ...b.slice(j + 1)].map(toNode),
          mergedIds: merged.map((n) => n.id),
          pending: b[j].id,
          headId: merged[0]?.id ?? null,
          message: `${formatTerm(b[j].coeff, b[j].exp)} has no match in A — copied across as-is`,
        });
        j += 1;
      }
    }

    while (i < a.length) {
      merged.push(a[i]);
      i += 1;
    }
    while (j < b.length) {
      merged.push(b[j]);
      j += 1;
    }

    const finalNodes = merged.map(toNode);
    steps.push({
      nodes: finalNodes,
      mergedIds: finalNodes.map((n) => n.id),
      headId: finalNodes[0]?.id ?? null,
      message: "Addition complete",
      resultBadge: `Sum = ${formatPolynomial(merged)}`,
    });

    return { steps, finalList: finalNodes };
  },
};
