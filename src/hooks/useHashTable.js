import { useState, useEffect, useCallback } from "react";
import { HASH_OP_MAP, HASH_FN_MAP, STRATEGY_MAP } from "../dataStructures/hashTable";
import {
  buildTableFromKeys,
  DEFAULT_HASH_FN,
  INITIAL_CAPACITY,
  parseKeyList,
  randomTable,
  tableKeys,
} from "../dataStructures/hashTable/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

const EMPTY_STEP = { buckets: [], capacity: 0, message: "" };

/** `init` is the setup decoded from a shared link ({ values, strategy, capacity, hashFn }). */
export function useHashTable(init) {
  const initialStrategy = init?.strategy ?? "chaining";
  const initialHashFn = init?.hashFn ?? DEFAULT_HASH_FN;
  const [strategy, setStrategyState] = useState(initialStrategy);
  const [hashFn, setHashFnState] = useState(initialHashFn);
  const [table, setTable] = useState(() =>
    init?.values
      ? buildTableFromKeys(init.values, initialStrategy, init.capacity ?? INITIAL_CAPACITY, initialHashFn)
      : randomTable(initialStrategy, initialHashFn)
  );

  const [operation, setOperation] = useState("insert");
  const [keyInput, setKeyInput] = useState("42");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = HASH_OP_MAP[operation];

  const history = useHistory(
    () => ({ table, strategy, hashFn }),
    (doc, message) => {
      setTable(doc.table);
      setStrategyState(doc.strategy);
      setHashFnState(doc.hashFn);
      setSteps([{ ...doc.table, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ ...table, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const parsed = parseInt(keyInput, 10);
    const { steps: newSteps, finalTable } = opMeta.run(table, { key: Number.isNaN(parsed) ? 0 : parsed });
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setTable(finalTable);
    setPlaying(newSteps.length > 1);
  }, [table, opMeta, keyInput, history]);

  const applyCustomTable = useCallback(() => {
    const parsed = parseKeyList(customInput);
    if (parsed.length === 0) return;
    const next = buildTableFromKeys(parsed, strategy, INITIAL_CAPACITY, hashFn);
    history.record();
    setTable(next);
    setSteps([{ ...next, message: "Custom keys loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, strategy, hashFn, history]);

  const shuffle = useCallback(() => {
    const next = randomTable(strategy, hashFn);
    history.record();
    setTable(next);
    setSteps([{ ...next, message: "New random keys" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [strategy, hashFn, history]);

  // Switching strategy replays the same keys into a fresh table rather than
  // starting over — the whole point is watching where those keys land when
  // only the collision rule changes.
  const setStrategy = useCallback(
    (next) => {
      history.record();
      setStrategyState(next);
      const rebuilt = buildTableFromKeys(tableKeys(table), next, INITIAL_CAPACITY, hashFn);
      setTable(rebuilt);
      setSteps([{ ...rebuilt, message: `Same keys, resolved by ${STRATEGY_MAP[next].label.toLowerCase()}` }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [table, hashFn, history]
  );

  // Same idea one level down: the hash function decides where keys land before
  // any collision rule gets a say, so changing it redeals the same keys.
  const setHashFn = useCallback(
    (next) => {
      history.record();
      setHashFnState(next);
      const rebuilt = buildTableFromKeys(tableKeys(table), strategy, INITIAL_CAPACITY, next);
      setTable(rebuilt);
      setSteps([{ ...rebuilt, message: `Same keys, hashed by ${HASH_FN_MAP[next].formula}` }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [table, strategy, history]
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    table,
    strategy,
    setStrategy,
    hashFn,
    setHashFn,
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
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
