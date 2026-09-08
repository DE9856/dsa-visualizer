import { useState, useCallback } from "react";
import { DYNAMIC_OP_MAP, KIND_MAP } from "../dataStructures/dynamicHash";
import {
  buildTableFromKeys,
  emptyTable,
  parseKeyList,
  randomTable,
} from "../dataStructures/dynamicHash/helpers";
import { useStructureRun } from "./useStructureRun.js";

// Shaped like a real (empty) table so the canvas can read depths and counts
// off it during the one render before the mount effect seeds the steps.
const EMPTY_STEP = { ...emptyTable("extendible"), message: "" };

/** `init` is the setup decoded from a shared link ({ values, kind }). */
export function useDynamicHash(init) {
  const initialKind = init?.kind ?? "extendible";
  const [kind, setKindState] = useState(initialKind);

  const { view, value: table, apply, load } = useStructureRun({
    initial: () => (init?.values ? buildTableFromKeys(init.values, initialKind) : randomTable(initialKind)),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
    // Which scheme grew the table is part of what the table *is*, so undo
    // brings the scheme back along with the keys.
    snapshot: () => ({ kind }),
    restore: (doc) => setKindState(doc.kind),
  });

  const [operation, setOperation] = useState("insert");
  const [keyInput, setKeyInput] = useState("12");
  const [customInput, setCustomInput] = useState("");

  const opMeta = DYNAMIC_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const parsed = parseInt(keyInput, 10);
    const { steps: newSteps, finalTable } = opMeta.run(table, { key: Number.isNaN(parsed) ? 0 : parsed });
    apply(newSteps, finalTable);
  }, [table, opMeta, keyInput, apply]);

  const applyCustomTable = useCallback(() => {
    const parsed = parseKeyList(customInput);
    if (parsed.length === 0) return;
    load(buildTableFromKeys(parsed, kind), "Custom keys loaded");
    setCustomInput("");
  }, [customInput, kind, load]);

  const shuffle = useCallback(() => load(randomTable(kind), "New random keys"), [kind, load]);

  // Switching scheme replays the same keys from empty, because where a key
  // lands depends on how many splits had happened when it arrived — the two
  // schemes deal the same arrival order into different shapes.
  const setKind = useCallback(
    (next) => {
      setKindState(next);
      load(
        buildTableFromKeys([...table.order], next),
        `Same keys, inserted in the same order, grown by ${KIND_MAP[next].label.toLowerCase()}`
      );
    },
    [table, load]
  );

  const reset = useCallback(() => load(emptyTable(kind), "Empty table"), [kind, load]);

  return {
    ...view,
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
    runOperation,
  };
}
