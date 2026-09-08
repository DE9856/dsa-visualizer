import { useState, useCallback } from "react";
import { HASH_OP_MAP, HASH_FN_MAP, STRATEGY_MAP } from "../dataStructures/hashTable";
import {
  buildTableFromKeys,
  DEFAULT_HASH_FN,
  INITIAL_CAPACITY,
  parseKeyList,
  randomTable,
  tableKeys,
} from "../dataStructures/hashTable/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { buckets: [], capacity: 0, message: "" };

/** `init` is the setup decoded from a shared link ({ values, strategy, capacity, hashFn }). */
export function useHashTable(init) {
  const initialStrategy = init?.strategy ?? "chaining";
  const initialHashFn = init?.hashFn ?? DEFAULT_HASH_FN;
  const [strategy, setStrategyState] = useState(initialStrategy);
  const [hashFn, setHashFnState] = useState(initialHashFn);

  const { view, value: table, apply, load } = useStructureRun({
    initial: () =>
      init?.values
        ? buildTableFromKeys(init.values, initialStrategy, init.capacity ?? INITIAL_CAPACITY, initialHashFn)
        : randomTable(initialStrategy, initialHashFn),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
    // Both settings are part of the document: a table is only meaningful
    // alongside the rules that placed its keys, so an undo has to bring them
    // back together.
    snapshot: () => ({ strategy, hashFn }),
    restore: (doc) => {
      setStrategyState(doc.strategy);
      setHashFnState(doc.hashFn);
    },
  });

  const [operation, setOperation] = useState("insert");
  const [keyInput, setKeyInput] = useState("42");
  const [customInput, setCustomInput] = useState("");

  const opMeta = HASH_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const parsed = parseInt(keyInput, 10);
    const { steps: newSteps, finalTable } = opMeta.run(table, { key: Number.isNaN(parsed) ? 0 : parsed });
    apply(newSteps, finalTable);
  }, [table, opMeta, keyInput, apply]);

  const applyCustomTable = useCallback(() => {
    const parsed = parseKeyList(customInput);
    if (parsed.length === 0) return;
    load(buildTableFromKeys(parsed, strategy, INITIAL_CAPACITY, hashFn), "Custom keys loaded");
    setCustomInput("");
  }, [customInput, strategy, hashFn, load]);

  const shuffle = useCallback(
    () => load(randomTable(strategy, hashFn), "New random keys"),
    [strategy, hashFn, load]
  );

  // Switching strategy replays the same keys into a fresh table rather than
  // starting over — the whole point is watching where those keys land when
  // only the collision rule changes.
  //
  // The setting is changed before `load` records, which is deliberate and
  // matches what these did by hand: the snapshot closure still sees the old
  // value this render, so undo returns to the rule that was replaced.
  const setStrategy = useCallback(
    (next) => {
      setStrategyState(next);
      const rebuilt = buildTableFromKeys(tableKeys(table), next, INITIAL_CAPACITY, hashFn);
      load(rebuilt, `Same keys, resolved by ${STRATEGY_MAP[next].label.toLowerCase()}`);
    },
    [table, hashFn, load]
  );

  // Same idea one level down: the hash function decides where keys land before
  // any collision rule gets a say, so changing it redeals the same keys.
  const setHashFn = useCallback(
    (next) => {
      setHashFnState(next);
      const rebuilt = buildTableFromKeys(tableKeys(table), strategy, INITIAL_CAPACITY, next);
      load(rebuilt, `Same keys, hashed by ${HASH_FN_MAP[next].formula}`);
    },
    [table, strategy, load]
  );

  return {
    ...view,
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
    runOperation,
  };
}
