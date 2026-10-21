import { useCallback, useState } from "react";
import { KIND_MAP, SELECTION_OP_MAP } from "../dataStructures/selectionTree";
import {
  DEFAULT_RUNS,
  formatRuns,
  parseRuns,
  randomRuns,
  stateFrom,
  toFrame,
} from "../dataStructures/selectionTree/helpers";

import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { kind: "winner", k: 2, tree: [], runs: [], output: [], compare: [], path: [], message: "" };

/**
 * The selection tree view's state: the runs, the tree over them, and which of
 * the two kinds it is.
 *
 * The runs *drain* as the merge proceeds, so the structure genuinely changes
 * — unlike the other comparison views here, this one is consumed by being
 * watched. Which is why the typed runs travel in the snapshot: undo has to
 * put back both the tree and the text that produced the original runs, or
 * APPLY would reload something different from what an undo just restored.
 *
 * `init` is the setup decoded from a shared link ({ runs, kind }).
 */
export function useSelectionTree(init) {
  const initialKind = init?.kind === "loser" ? "loser" : "winner";
  const initialRuns = init?.runs || parseRuns(DEFAULT_RUNS);

  const [kind, setKindState] = useState(initialKind);
  const [runsInput, setRunsInput] = useState(() =>
    (initialRuns || parseRuns(DEFAULT_RUNS)).map((run) => run.join(", ")).join("\n")
  );

  const { view, value: state, apply, load } = useStructureRun({
    initial: () => stateFrom(initialRuns || parseRuns(DEFAULT_RUNS), initialKind),
    toFrame: (next, message) => toFrame(next, message),
    emptyStep: EMPTY_STEP,
    readyMessage: "Ready — the tournament is already played",
    snapshot: () => ({ kind, runsInput }),
    restore: (doc) => {
      setKindState(doc.kind);
      setRunsInput(doc.runsInput);
    },
  });

  const [operation, setOperation] = useState("build");

  const opMeta = SELECTION_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalTree } = opMeta.run(state, {});
    apply(newSteps, finalTree);
  }, [state, opMeta, apply]);

  const applyRuns = useCallback(() => {
    const parsed = parseRuns(runsInput);
    if (!parsed) return;
    load(stateFrom(parsed, kind), `${parsed.length} runs loaded, tournament played`);
  }, [runsInput, kind, load]);

  /**
   * Switching kind replays the same tournament and stores the other half of
   * each match. The runs are reset to what the box holds rather than kept
   * mid-drain: half a merge under one kind is not a state the other kind
   * would ever have been in, and pretending otherwise would make the two
   * columns of comparisons meaningless.
   */
  const setKind = useCallback(
    (next) => {
      const parsed = parseRuns(runsInput) || parseRuns(DEFAULT_RUNS);
      setKindState(next);
      // `load` records first, and the snapshot above still reads the previous
      // kind, so undo lands on the kind this switch left.
      load(
        stateFrom(parsed, next),
        `The same tournament, with each node keeping ${KIND_MAP[next].stores} — and the runs back at the start`
      );
    },
    [runsInput, load]
  );

  const shuffle = useCallback(() => {
    const runs = randomRuns();
    const next = stateFrom(runs, kind);
    setRunsInput(formatRuns(next));
    load(next, "New random runs");
  }, [kind, load]);

  return {
    ...view,
    state,
    kind,
    setKind,
    operation,
    setOperation,
    opMeta,
    runsInput,
    setRunsInput,
    applyRuns,
    shuffle,
    runOperation,
  };
}
