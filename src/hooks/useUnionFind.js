import { useState, useCallback } from "react";
import { UF_OP_MAP } from "../dataStructures/unionFind";
import {
  emptyUnionFind,
  fromParentArray,
  parseElement,
  parseElementCount,
  randomUnionFind,
} from "../dataStructures/unionFind/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { n: 0, parent: [], size: [], message: "" };

/** `init` is the setup decoded from a shared link ({ parent }). */
export function useUnionFind(init) {
  const { view, value: uf, apply, load } = useStructureRun({
    initial: () => (init?.parent ? fromParentArray(init.parent) : randomUnionFind()),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
  });

  const [operation, setOperation] = useState("union");
  const [elementA, setElementA] = useState("A");
  const [elementB, setElementB] = useState("B");
  const [customInput, setCustomInput] = useState("");

  const opMeta = UF_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const params = { a: parseElement(elementA, uf.n), b: parseElement(elementB, uf.n) };
    const { steps: newSteps, finalUf } = opMeta.run(uf, params);
    apply(newSteps, finalUf);
  }, [uf, opMeta, elementA, elementB, apply]);

  const applyCustomUnionFind = useCallback(() => {
    const n = parseElementCount(customInput, uf.n);
    load(emptyUnionFind(n), `${n} singleton sets — union some of them to begin`);
    setCustomInput("");
  }, [customInput, uf.n, load]);

  const shuffle = useCallback(() => load(randomUnionFind(), "New random sets"), [load]);

  return {
    ...view,
    uf,
    operation,
    setOperation,
    opMeta,
    elementA,
    setElementA,
    elementB,
    setElementB,
    customInput,
    setCustomInput,
    applyCustomUnionFind,
    shuffle,
    runOperation,
  };
}
