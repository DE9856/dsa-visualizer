import { formatTerm } from "./helpers";

export const evaluatePolynomial = {
  key: "evaluatePoly",
  label: "Evaluate P(x)",
  group: "query",
  fields: ["xValue"],
  desc: "Walks the term list from head to tail, computing coeff * x^exp for each term and keeping a running total as it goes.",
  time: "O(n)",
  space: "O(1)",
  run(list, { xValue = 0 }) {
    const steps = [];

    if (list.length === 0) {
      steps.push({ nodes: [], message: "Polynomial is empty — P(x) = 0", resultBadge: `P(${xValue}) = 0` });
      return { steps, finalList: list };
    }

    const headId = list[0]?.id ?? null;
    let total = 0;

    for (let i = 0; i < list.length; i++) {
      const term = list[i];
      const termValue = term.coeff * Math.pow(xValue, term.exp);
      total += termValue;
      steps.push({
        nodes: list,
        active: [term.id],
        headId,
        message: `${formatTerm(term.coeff, term.exp)} at x = ${xValue} → ${termValue}. Running total: ${total}`,
      });
    }

    steps.push({
      nodes: list,
      headId,
      message: "Evaluation complete",
      resultBadge: `P(${xValue}) = ${total}`,
    });

    return { steps, finalList: list };
  },
};
