import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ALGO_MAP, SORT_KEYS, SEARCH_KEYS, getSteps } from "../algorithms";
import { randomArray } from "../utils/randomArray";

export function useVisualizer() {
  const [category, setCategoryState] = useState("sorting");
  const [algo, setAlgo] = useState("bubble");
  const [size, setSize] = useState(18);
  const [array, setArray] = useState(() => randomArray(18));
  const [target, setTarget] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60); // 1-100, higher = faster
  const intervalRef = useRef(null);

  const meta = ALGO_MAP[algo];

  const steps = useMemo(() => {
    setPlaying(false);
    if (meta.category === "searching") {
      const t = target === null ? array[Math.floor(Math.random() * array.length)] : target;
      return getSteps(algo, array, t);
    }
    return getSteps(algo, array);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, array, target]);

  useEffect(() => {
    setStepIdx(0);
  }, [steps]);

  useEffect(() => {
    if (playing) {
      const delay = 620 - speed * 5.5;
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(30, delay));
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps]);

  const switchCategory = useCallback(
    (cat) => {
      setCategoryState(cat);
      setPlaying(false);
      const first = cat === "sorting" ? SORT_KEYS[0] : SEARCH_KEYS[0];
      setAlgo(first);
      if (cat === "searching") setTarget(array[Math.floor(Math.random() * array.length)]);
    },
    [array]
  );

  const switchAlgo = useCallback(
    (key) => {
      setPlaying(false);
      setAlgo(key);
      if (ALGO_MAP[key].category === "searching") {
        setTarget(array[Math.floor(Math.random() * array.length)]);
      }
    },
    [array]
  );

  const handleShuffle = useCallback(() => {
    const next = randomArray(size);
    setArray(next);
    if (meta.category === "searching") setTarget(next[Math.floor(Math.random() * next.length)]);
  }, [size, meta.category]);

  const handleSizeChange = useCallback(
    (n) => {
      setSize(n);
      const next = randomArray(n);
      setArray(next);
      if (meta.category === "searching") setTarget(next[Math.floor(Math.random() * next.length)]);
    },
    [meta.category]
  );

  const applyCustomArray = useCallback(() => {
    const parsed = customInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n))
      .slice(0, 40);
    if (parsed.length >= 2) {
      setArray(parsed);
      setSize(parsed.length);
      if (meta.category === "searching") setTarget(parsed[Math.floor(Math.random() * parsed.length)]);
    }
    setCustomInput("");
  }, [customInput, meta.category]);

  const setRandomTarget = useCallback(
    (inArray) => {
      const arr = steps[Math.min(stepIdx, steps.length - 1)]?.array || array;
      if (inArray) setTarget(arr[Math.floor(Math.random() * arr.length)]);
      else setTarget(Math.max(...arr) + Math.floor(Math.random() * 20) + 1);
    },
    [array, steps, stepIdx]
  );

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

  const step = steps[Math.min(stepIdx, steps.length - 1)] || {};
  const displayArr = step.array || array;
  const maxVal = Math.max(...displayArr, 1);
  const atEnd = stepIdx >= steps.length - 1;

  return {
    category,
    algo,
    meta,
    size,
    array,
    target,
    customInput,
    setCustomInput,
    stepIdx,
    setStepIdx,
    playing,
    speed,
    setSpeed,
    steps,
    step,
    displayArr,
    maxVal,
    atEnd,
    switchCategory,
    switchAlgo,
    handleShuffle,
    handleSizeChange,
    applyCustomArray,
    setRandomTarget,
    togglePlay,
  };
}
