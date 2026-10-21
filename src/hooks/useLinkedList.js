import { useState, useEffect, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { LL_OP_MAP } from "../dataStructures/linkedList";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

function randomList(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

/** `init` is the setup decoded from a shared link ({ values, listType }). */
export function useLinkedList(init) {
  const [list, setList] = useState(() =>
    init?.values ? init.values.map((value) => ({ id: nextId(), value })) : randomList(5)
  );
  const [listType, setListType] = useState(init?.listType ?? "singly"); // singly | doubly | circular
  const [operation, setOperation] = useState("insertHead");
  const [valueInput, setValueInput] = useState("42");
  const [positionInput, setPositionInput] = useState("0");
  const [secondListInput, setSecondListInput] = useState("2, 4, 6");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP, nodes: [] }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = LL_OP_MAP[operation];

  const history = useHistory(
    () => ({ list, listType }),
    (doc, message) => {
      setList(doc.list);
      setListType(doc.listType);
      setSteps([{ nodes: doc.list, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ nodes: list, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const params = {
      value: parseInt(valueInput, 10) || 0,
      position: parseInt(positionInput, 10) || 0,
      secondList: parseValueList(secondListInput),
      listType,
    };
    const { steps: newSteps, finalList } = opMeta.run(list, params);
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setList(finalList);
    setPlaying(newSteps.length > 1);
  }, [list, opMeta, valueInput, positionInput, secondListInput, listType, history]);

  const applyCustomList = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    history.record();
    setList(parsed);
    setSteps([{ nodes: parsed, message: "Custom list loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, history]);

  const shuffle = useCallback(() => {
    const next = randomList(5 + Math.floor(Math.random() * 3));
    history.record();
    setList(next);
    setSteps([{ nodes: next, message: "New random list" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [history]);

  const changeListType = useCallback((next) => {
    history.record();
    setListType(next);
    // Re-anchor the current list as a fresh "Ready" step so the canvas
    // immediately re-renders with the new pointer style (singly/doubly/circular).
    setSteps((prev) => {
      const currentNodes = prev[Math.min(stepIdx, prev.length - 1)]?.nodes ?? list;
      return [{ nodes: currentNodes, message: `Switched to ${next} linked list` }];
    });
    setStepIdx(0);
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, stepIdx, history]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    list,
    listType,
    setListType: changeListType,
    operation,
    setOperation,
    opMeta,
    valueInput,
    setValueInput,
    positionInput,
    setPositionInput,
    secondListInput,
    setSecondListInput,
    customInput,
    setCustomInput,
    applyCustomList,
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