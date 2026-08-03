import { useState, useEffect, useRef, useCallback } from "react";
import { nextId } from "../dataStructures/linkedList/nodeId";
import { parseValueList } from "../dataStructures/linkedList/helpers";
import { LL_OP_MAP } from "../dataStructures/linkedList";

function randomList(size) {
  return Array.from({ length: size }, () => ({ id: nextId(), value: Math.floor(Math.random() * 90) + 10 }));
}

const EMPTY_STEP = { nodes: [], message: "" };

export function useLinkedList() {
  const [list, setList] = useState(() => randomList(5));
  const [listType, setListType] = useState("singly"); // singly | doubly | circular
  const [operation, setOperation] = useState("insertHead");
  const [valueInput, setValueInput] = useState("42");
  const [positionInput, setPositionInput] = useState("0");
  const [secondListInput, setSecondListInput] = useState("2, 4, 6");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP, nodes: [] }]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const intervalRef = useRef(null);

  const opMeta = LL_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ nodes: list, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playing) {
      const delay = 720 - speed * 6;
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(40, delay));
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps]);

  const runOperation = useCallback(() => {
    const params = {
      value: parseInt(valueInput, 10) || 0,
      position: parseInt(positionInput, 10) || 0,
      secondList: parseValueList(secondListInput),
      listType,
    };
    const { steps: newSteps, finalList } = opMeta.run(list, params);
    setSteps(newSteps);
    setStepIdx(0);
    setList(finalList);
    setPlaying(newSteps.length > 1);
  }, [list, opMeta, valueInput, positionInput, secondListInput, listType]);

  const applyCustomList = useCallback(() => {
    const parsed = parseValueList(customInput).map((value) => ({ id: nextId(), value }));
    setList(parsed);
    setSteps([{ nodes: parsed, message: "Custom list loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput]);

  const shuffle = useCallback(() => {
    const next = randomList(5 + Math.floor(Math.random() * 3));
    setList(next);
    setSteps([{ nodes: next, message: "New random list" }]);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const changeListType = useCallback((next) => {
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
  }, [list, stepIdx]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const atEnd = stepIdx >= steps.length - 1;
      if (atEnd) {
        setStepIdx(0);
        return true;
      }
      return !p;
    });
  }, [stepIdx, steps.length]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;
  const atEnd = stepIdx >= steps.length - 1;

  return {
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
    stepIdx,
    setStepIdx,
    playing,
    speed,
    setSpeed,
    atEnd,
    runOperation,
    togglePlay,
  };
}