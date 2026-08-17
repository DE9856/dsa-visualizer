import { useState, useEffect, useCallback } from "react";
import { UF_OP_MAP } from "../dataStructures/unionFind";
import {
  emptyUnionFind,
  fromParentArray,
  parseElement,
  parseElementCount,
  randomUnionFind,
} from "../dataStructures/unionFind/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

const EMPTY_STEP = { n: 0, parent: [], size: [], message: "" };

/** `init` is the setup decoded from a shared link ({ parent }). */
export function useUnionFind(init) {
  const [uf, setUf] = useState(() => (init?.parent ? fromParentArray(init.parent) : randomUnionFind()));

  const [operation, setOperation] = useState("union");
  const [elementA, setElementA] = useState("A");
  const [elementB, setElementB] = useState("B");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = UF_OP_MAP[operation];

  const history = useHistory(
    () => ({ uf }),
    (doc, message) => {
      setUf(doc.uf);
      setSteps([{ ...doc.uf, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ ...uf, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const params = { a: parseElement(elementA, uf.n), b: parseElement(elementB, uf.n) };
    const { steps: newSteps, finalUf } = opMeta.run(uf, params);
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setUf(finalUf);
    setPlaying(newSteps.length > 1);
  }, [uf, opMeta, elementA, elementB, setStepIdx, setPlaying, history]);

  const load = useCallback(
    (next, message) => {
      history.record();
      setUf(next);
      setSteps([{ ...next, message }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [setStepIdx, setPlaying, history]
  );

  const applyCustomUnionFind = useCallback(() => {
    const n = parseElementCount(customInput, uf.n);
    load(emptyUnionFind(n), `${n} singleton sets — union some of them to begin`);
    setCustomInput("");
  }, [customInput, uf.n, load]);

  const shuffle = useCallback(() => load(randomUnionFind(), "New random sets"), [load]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    steps,
    step,
    runOperation,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
