import { nextId } from "../dataStructures/linkedList/nodeId";
import { parsePolynomial, formatTerm } from "../dataStructures/polynomial/helpers";
import { POLY_OP_MAP } from "../dataStructures/polynomial";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useStepPlayer } from "./useStepPlayer.js";

function toNodes(terms) {
  return terms.map((t) => ({ id: nextId(), coeff: t.coeff, exp: t.exp, value: formatTerm(t.coeff, t.exp) }));
}

const DEFAULT_POLY = "4x^3 + 3x^2 - 5x + 7";
const DEFAULT_SECOND_POLY = "2x + 1";

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ poly }). */
export function usePolynomial(init) {
  const initialPoly = init?.poly || DEFAULT_POLY;
  const [list, setList] = useState(() => toNodes(parsePolynomial(initialPoly)));
  const [operation, setOperation] = useState("addPoly");
  const [polyInput, setPolyInput] = useState(initialPoly);
  const [secondPolyInput, setSecondPolyInput] = useState(DEFAULT_SECOND_POLY);
  const [xValueInput, setXValueInput] = useState("2");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP, nodes: [] }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = POLY_OP_MAP[operation];
  const secondPreviewNodes = useMemo(() => toNodes(parsePolynomial(secondPolyInput)), [secondPolyInput]);
  const isIdle = stepIdx >= steps.length - 1 && steps.length <= 1;
  const showSecondPreview = isIdle && opMeta.fields.includes("secondList");

  useEffect(() => {
    setSteps([{ nodes: list, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const params = {
      secondList: parsePolynomial(secondPolyInput),
      xValue: parseFloat(xValueInput) || 0,
    };
    const { steps: newSteps, finalList } = opMeta.run(list, params);
    setSteps(newSteps);
    setStepIdx(0);
    setList(finalList);
    setPlaying(newSteps.length > 1);
  }, [list, opMeta, secondPolyInput, xValueInput]);

  const applyPolynomial = useCallback(() => {
    const parsed = toNodes(parsePolynomial(polyInput));
    setList(parsed);
    setSteps([{ nodes: parsed, message: "Polynomial loaded" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [polyInput]);

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
    const nodes = toNodes(terms);
    setList(nodes);
    setSteps([{ nodes, message: "New random polynomial" }]);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    steps,
    step,
    runOperation,
    secondPreviewNodes,
    showSecondPreview,
  };
}
