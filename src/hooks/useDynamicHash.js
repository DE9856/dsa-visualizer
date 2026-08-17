import { useState, useEffect, useCallback } from "react";
import { DYNAMIC_OP_MAP, KIND_MAP } from "../dataStructures/dynamicHash";
import {
  buildTableFromKeys,
  emptyTable,
  parseKeyList,
  randomTable,
} from "../dataStructures/dynamicHash/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

// Shaped like a real (empty) table so the canvas can read depths and counts
// off it during the one render before the mount effect seeds the steps.
const EMPTY_STEP = { ...emptyTable("extendible"), message: "" };

/** `init` is the setup decoded from a shared link ({ values, kind }). */
export function useDynamicHash(init) {
  const initialKind = init?.kind ?? "extendible";
  const [kind, setKindState] = useState(initialKind);
  const [table, setTable] = useState(() =>
    init?.values ? buildTableFromKeys(init.values, initialKind) : randomTable(initialKind)
  );

  const [operation, setOperation] = useState("insert");
  const [keyInput, setKeyInput] = useState("12");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = DYNAMIC_OP_MAP[operation];

  const history = useHistory(
    () => ({ table, kind }),
    (doc, message) => {
      setTable(doc.table);
      setKindState(doc.kind);
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
    const next = buildTableFromKeys(parsed, kind);
    history.record();
    setTable(next);
    setSteps([{ ...next, message: "Custom keys loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, kind, history]);

  const shuffle = useCallback(() => {
    const next = randomTable(kind);
    history.record();
    setTable(next);
    setSteps([{ ...next, message: "New random keys" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [kind, history]);

  // Switching scheme replays the same keys from empty, because where a key
  // lands depends on how many splits had happened when it arrived — the two
  // schemes deal the same arrival order into different shapes.
  const setKind = useCallback(
    (next) => {
      history.record();
      setKindState(next);
      const rebuilt = buildTableFromKeys([...table.order], next);
      setTable(rebuilt);
      setSteps([{ ...rebuilt, message: `Same keys, inserted in the same order, grown by ${KIND_MAP[next].label.toLowerCase()}` }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [table, history]
  );

  const reset = useCallback(() => {
    const fresh = emptyTable(kind);
    history.record();
    setTable(fresh);
    setSteps([{ ...fresh, message: "Empty table" }]);
    setStepIdx(0);
    setPlaying(false);
  }, [kind, history]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    table,
    kind,
    setKind,
    operation,
    setOperation,
    opMeta,
    keyInput,
    setKeyInput,
    customInput,
    setCustomInput,
    applyCustomTable,
    shuffle,
    resetTable: reset,
    steps,
    step,
    runOperation,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
