import { useState, useEffect, useCallback } from "react";
import { HASH_OP_MAP, STRATEGY_MAP } from "../dataStructures/hashTable";
import {
  buildTableFromKeys,
  INITIAL_CAPACITY,
  parseKeyList,
  randomTable,
  tableKeys,
} from "../dataStructures/hashTable/helpers";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { buckets: [], capacity: 0, message: "" };

/** `init` is the setup decoded from a shared link ({ values, strategy, capacity }). */
export function useHashTable(init) {
  const initialStrategy = init?.strategy ?? "chaining";
  const [strategy, setStrategyState] = useState(initialStrategy);
  const [table, setTable] = useState(() =>
    init?.values
      ? buildTableFromKeys(init.values, initialStrategy, init.capacity ?? INITIAL_CAPACITY)
      : randomTable(initialStrategy)
  );

  const [operation, setOperation] = useState("insert");
  const [keyInput, setKeyInput] = useState("42");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = HASH_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ ...table, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const parsed = parseInt(keyInput, 10);
    const { steps: newSteps, finalTable } = opMeta.run(table, { key: Number.isNaN(parsed) ? 0 : parsed });
    setSteps(newSteps);
    setStepIdx(0);
    setTable(finalTable);
    setPlaying(newSteps.length > 1);
  }, [table, opMeta, keyInput]);

  const applyCustomTable = useCallback(() => {
    const parsed = parseKeyList(customInput);
    if (parsed.length === 0) return;
    const next = buildTableFromKeys(parsed, strategy);
    setTable(next);
    setSteps([{ ...next, message: "Custom keys loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, strategy]);

  const shuffle = useCallback(() => {
    const next = randomTable(strategy);
    setTable(next);
    setSteps([{ ...next, message: "New random keys" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [strategy]);

  // Switching strategy replays the same keys into a fresh table rather than
  // starting over — the whole point is watching where those keys land when
  // only the collision rule changes.
  const setStrategy = useCallback(
    (next) => {
      setStrategyState(next);
      const rebuilt = buildTableFromKeys(tableKeys(table), next);
      setTable(rebuilt);
      setSteps([{ ...rebuilt, message: `Same keys, resolved by ${STRATEGY_MAP[next].label.toLowerCase()}` }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [table]
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    table,
    strategy,
    setStrategy,
    operation,
    setOperation,
    opMeta,
    keyInput,
    setKeyInput,
    customInput,
    setCustomInput,
    applyCustomTable,
    shuffle,
    steps,
    step,
    runOperation,
  };
}
