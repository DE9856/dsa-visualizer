import { Shuffle } from "lucide-react";
import { LAYOUTS, LAYOUT_GROUPS, LAYOUT_MAP, MAX_DIM, MAX_N, MAX_RANK, MD_GROUPS, operationsFor } from "../dataStructures/mdArray";
import { isSquare, logicalCount, slotCount } from "../dataStructures/mdArray/helpers";

export default function MdArraySidebar({
  dims,
  layout,
  onLayoutChange,
  operation,
  onOperationChange,
  opMeta,
  dimsInput,
  setDimsInput,
  onApplyDims,
  indexInput,
  setIndexInput,
  onShuffle,
  onRun,
}) {
  const meta = LAYOUT_MAP[layout];
  const square = isSquare(layout);
  const available = operationsFor(layout);
  const slots = slotCount(layout, dims);
  const cells = logicalCount(dims);

  return (
    <div className="panel sidebar">
      <div className="label">LAYOUT</div>
      <div className="md-layouts">
        {LAYOUT_GROUPS.map((group) => (
          <div key={group.key} className="md-layouts__group">
            <div className="md-layouts__label">{group.label}</div>
            <div className="md-layouts__row">
              {LAYOUTS.filter((l) => l.kind === group.key).map((l) => (
                <button
                  key={l.key}
                  className={`btn btn--chip ${layout === l.key ? "active" : ""}`}
                  onClick={() => onLayoutChange(l.key)}
                >
                  {l.short}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar__hint">{meta.hint}</div>
      <div className="md-formula-chip mono">offset = {meta.formula}</div>

      <div className="sidebar__section">
        <div className="label">{square ? "ORDER n" : "SHAPE"}</div>
        <input
          type="text"
          className="text-input"
          value={dimsInput}
          onChange={(e) => setDimsInput(e.target.value)}
          placeholder={square ? "5" : "3, 4"}
          inputMode="numeric"
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyDims}>
          APPLY
        </button>
        <button className="btn btn--block-flat" style={{ marginTop: 6 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM SHAPE
        </button>
        <div className="sidebar__hint">
          {square
            ? `A packed layout is square by definition, so one number is the whole shape. Up to ${MAX_N}.`
            : `Up to ${MAX_RANK} dimensions, each up to ${MAX_DIM}. A third dimension is drawn as a stack of slices.`}
        </div>
        <div className="sm-stat">
          <span className="mono">{dims.join(" × ")}</span>
          <span className="mono">{cells} cells</span>
          <span className="mono">{slots} slots</span>
        </div>
      </div>

      <div className="label" style={{ marginTop: 16 }}>
        OPERATIONS
      </div>
      <div className="algo-list">
        {MD_GROUPS.map((group) => {
          const ops = available.filter((op) => op.group === group.key);
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
        {opMeta.fields.includes("indices") && (
          <>
            <div className="label">INDICES</div>
            <input
              type="text"
              className="text-input"
              value={indexInput}
              onChange={(e) => setIndexInput(e.target.value)}
              placeholder={dims.map(() => "0").join(", ")}
              style={{ marginBottom: 6 }}
            />
            <div className="sidebar__hint">
              One per dimension, from 0. Out-of-range values are clamped to the array.
            </div>
          </>
        )}

        <button type="submit" className="btn active btn--block-flat">
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>
    </div>
  );
}
