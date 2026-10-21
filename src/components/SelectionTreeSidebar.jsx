import { Shuffle } from "lucide-react";
import { KIND_MAP, MAX_RUNS, MAX_RUN_LENGTH, SELECTION_GROUPS, SELECTION_KINDS, SELECTION_OPERATIONS } from "../dataStructures/selectionTree";
import { levelsOf, totalRemaining } from "../dataStructures/selectionTree/helpers";

export default function SelectionTreeSidebar({
  state,
  kind,
  onKindChange,
  operation,
  onOperationChange,
  opMeta,
  runsInput,
  setRunsInput,
  onApplyRuns,
  onShuffle,
  onRun,
}) {
  const levels = levelsOf(state.k);
  const flat = Math.max(1, state.live - 1);
  const left = totalRemaining(state.runs);

  return (
    <div className="panel sidebar">
      <div className="label">TREE</div>
      <div className="type-toggle">
        {SELECTION_KINDS.map((k) => (
          <button key={k.key} className={`btn ${kind === k.key ? "active" : ""}`} onClick={() => onKindChange(k.key)}>
            {k.short}
          </button>
        ))}
      </div>
      <div className="sidebar__hint">
        Each internal node keeps {KIND_MAP[kind].stores}, and {KIND_MAP[kind].top}. Both play the identical
        tournament — switching resets the runs, because half a merge under one kind is not a state the other would
        have been in.
      </div>

      <div className="dq-cost">
        <div className="dq-cost__row">
          <span>SELECTION TREE</span>
          <b className="is-cheap mono">{levels} per output</b>
        </div>
        <div className="dq-cost__row">
          <span>SCAN ALL HEADS</span>
          <b className={flat > levels ? "is-dear mono" : "mono"}>{flat} per output</b>
        </div>
      </div>

      <div className="sidebar__section">
        <div className="label">SORTED RUNS</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM RUNS
        </button>
        <textarea
          className="text-input textarea-input sm-textarea"
          value={runsInput}
          onChange={(e) => setRunsInput(e.target.value)}
          rows={5}
          spellCheck={false}
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyRuns}>
          APPLY
        </button>
        <div className="sidebar__hint">
          One run per line, 2 to {MAX_RUNS} runs of up to {MAX_RUN_LENGTH} values. Each line is sorted on the way in —
          a selection tree merges runs that are already in order. The tree needs a full bottom row, so {state.live}{" "}
          runs are padded out to {state.k} leaves with empty ones that always offer ∞.
        </div>
        <div className="sm-stat">
          <span className="mono">{state.live} runs</span>
          <span className="mono">{state.k} leaves</span>
          <span className="mono">{left} left</span>
        </div>
      </div>

      <div className="label" style={{ marginTop: 16 }}>
        OPERATIONS
      </div>
      <div className="algo-list">
        {SELECTION_GROUPS.map((group) => {
          const ops = SELECTION_OPERATIONS.filter((op) => op.group === group.key);
          if (ops.length === 0) return null;
          return (
            <div key={group.key} className="algo-group">
              <div className="algo-group__header algo-group__header--static">
                <span className="algo-group__label">{group.label}</span>
              </div>
              <div className="algo-group__body">
                {ops.map((op) => (
                  <button
                    type="button"
                    key={op.key}
                    className={`algo-row ${operation === op.key ? "active" : ""}`}
                    onClick={() => onOperationChange(op.key)}
                    aria-pressed={operation === op.key}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="sidebar__section"
        onSubmit={(e) => {
          e.preventDefault();
          onRun();
        }}
      >
        <button type="submit" className="btn active btn--block-flat">
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>
    </div>
  );
}
