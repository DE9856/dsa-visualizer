import { nextId } from "../linkedList/nodeId";
import { formatTerm, formatPolynomial } from "./helpers";

export const multiplyPolynomials = {
  key: "multiplyPoly",
  label: "Multiply Polynomials",
  group: "combine",
  fields: ["secondList"],
  desc: "Multiplies every term of A by every term of B (coefficients multiply, exponents add), accumulating the results into a running total for each exponent as it goes.",
  time: "O(n * m)",
  space: "O(n + m)",
  run(list, { secondList = [] }) {
    const a = list.map((n) => ({ coeff: n.coeff, exp: n.exp }));
    const b = secondList.map((t) => ({ coeff: t.coeff, exp: t.exp }));
    const steps = [];

    if (a.length === 0 || b.length === 0) {
      steps.push({ nodes: [], message: "One of the polynomials is empty — product is 0" });
      return { steps, finalList: [] };
    }

    const idForExp = new Map();
    const getId = (exp) => {
      if (!idForExp.has(exp)) idForExp.set(exp, nextId());
      return idForExp.get(exp);
    };

    const accum = new Map(); // exp -> coeff
    const snapshot = () =>
      [...accum.entries()]
        .filter(([, coeff]) => coeff !== 0)
        .sort((x, y) => y[0] - x[0])
        .map(([exp, coeff]) => ({ id: getId(exp), coeff, exp, value: formatTerm(coeff, exp) }));

    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const prodCoeff = a[i].coeff * b[j].coeff;
        const prodExp = a[i].exp + b[j].exp;
        accum.set(prodExp, (accum.get(prodExp) || 0) + prodCoeff);

        steps.push({
          nodes: snapshot(),
          active: accum.get(prodExp) !== 0 ? [getId(prodExp)] : [],
          message: `${formatTerm(a[i].coeff, a[i].exp)} × ${formatTerm(b[j].coeff, b[j].exp)} = ${formatTerm(
            prodCoeff,
            prodExp
          )} — added into the x^${prodExp} term`,
        });
      }
    }

    const finalNodes = snapshot();
    const finalTerms = [...accum.entries()].filter(([, c]) => c !== 0).map(([exp, coeff]) => ({ coeff, exp }));
    steps.push({
      nodes: finalNodes,
      headId: finalNodes[0]?.id ?? null,
      message: "Multiplication complete",
      resultBadge: `Product = ${formatPolynomial(finalTerms)}`,
    });

    return { steps, finalList: finalNodes };
  },
};
