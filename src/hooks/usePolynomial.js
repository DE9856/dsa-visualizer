import { nextId } from "../dataStructures/linkedList/nodeId";
import { parsePolynomial, formatTerm } from "../dataStructures/polynomial/helpers";
import { POLY_OP_MAP } from "../dataStructures/polynomial";
import { useState, useCallback, useMemo } from "react";
import { useStructureRun } from "./useStructureRun.js";

function toNodes(terms) {
  return terms.map((t) => ({ id: nextId(), coeff: t.coeff, exp: t.exp, value: formatTerm(t.coeff, t.exp) }));
}

const DEFAULT_POLY = "4x^3 + 3x^2 - 5x + 7";
const DEFAULT_SECOND_POLY = "2x + 1";

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ poly }). */
export function usePolynomial(init) {
  const initialPoly = init?.poly || DEFAULT_POLY;
  const [polyInput, setPolyInput] = useState(initialPoly);

  const { view, value: list, apply, load } = useStructureRun({
    initial: () => toNodes(parsePolynomial(initialPoly)),
    toFrame: (nodes, message) => ({ nodes, message }),
    emptyStep: EMPTY_STEP,
    // The typed polynomial is part of the document, not just a field: undoing
    // back to an earlier list should put the text that produced it back too.
    snapshot: () => ({ polyInput }),
    restore: (doc) => setPolyInput(doc.polyInput),
  });

  const [operation, setOperation] = useState("addPoly");
  const [secondPolyInput, setSecondPolyInput] = useState(DEFAULT_SECOND_POLY);
  const [xValueInput, setXValueInput] = useState("2");

  const opMeta = POLY_OP_MAP[operation];

  const secondPreviewNodes = useMemo(() => toNodes(parsePolynomial(secondPolyInput)), [secondPolyInput]);
  // The second polynomial is previewed only while nothing is being played, so
  // it never sits alongside a run it is not part of.
  const isIdle = view.stepIdx >= view.steps.length - 1 && view.steps.length <= 1;
  const showSecondPreview = isIdle && opMeta.fields.includes("secondList");

  const runOperation = useCallback(() => {
    const params = {
      secondList: parsePolynomial(secondPolyInput),
      xValue: parseFloat(xValueInput) || 0,
    };
    const { steps: newSteps, finalList } = opMeta.run(list, params);
    apply(newSteps, finalList);
  }, [list, opMeta, secondPolyInput, xValueInput, apply]);

  const applyPolynomial = useCallback(
    () => load(toNodes(parsePolynomial(polyInput)), "Polynomial loaded"),
    [polyInput, load]
  );

  const randomPolynomial = useCallback(() => {
    const termCount = 2 + Math.floor(Math.random() * 3);
    const usedExp = new Set();
    const terms = [];
    while (terms.length < termCount) {
      const exp = Math.floor(Math.random() * 5);
      if (usedExp.has(exp)) continue;
      usedExp.add(exp);
      const coeff = Math.floor(Math.random() * 17) - 8;
      if (coeff === 0) continue;
      terms.push({ coeff, exp });
    }
    load(toNodes(terms), "New random polynomial");
  }, [load]);

  return {
    ...view,
    list,
    operation,
    setOperation,
    opMeta,
    polyInput,
    setPolyInput,
    secondPolyInput,
    setSecondPolyInput,
    xValueInput,
    setXValueInput,
    applyPolynomial,
    randomPolynomial,
    runOperation,
    secondPreviewNodes,
    showSecondPreview,
  };
}
