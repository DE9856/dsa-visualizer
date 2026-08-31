import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { COMBINES, KINDS, MAX_N, RANGE_GROUPS, RANGE_OPERATIONS } from "../dataStructures/rangeQuery";

export default function RangeQuerySidebar({
  kind,
  onKindChange,
  combine,
  onCombineChange,
  operation,
  onOperationChange,
  opMeta,
  indexInput,
  setIndexInput,
  valueInput,
  setValueInput,
  fromInput,
  setFromInput,
  toInput,
  setToInput,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
  n,
}) {
  const activeGroup = RANGE_OPERATIONS.find((op) => op.key === operation)?.group;
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isFenwick = kind === "fenwick";

  return (
    <div className="panel sidebar">
      <div className="label">STRUCTURE</div>
      <div className="seg seg--stack">
        {KINDS.map((k) => (
          <button
            type="button"
            key={k.key}
            className={`seg__btn ${kind === k.key ? "active" : ""}`}
            onClick={() => onKindChange(k.key)}
            title={k.summary}
            aria-pressed={kind === k.key}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="label" style={{ marginTop: 14 }}>COMBINE</div>
      <div className="seg">
        {COMBINES.map((c) => (
          <button
            type="button"
            key={c.key}
            className={`seg__btn ${(isFenwick ? "sum" : combine) === c.key ? "active" : ""}`}
            onClick={() => !isFenwick && onCombineChange(c.key)}
            disabled={isFenwick && c.key !== "sum"}
            title={
              isFenwick && c.key !== "sum"
                ? "A Fenwick tree gets a range by subtracting one prefix from another, and nothing undoes a min or a max — so it can only do sums."
                : `Combine ranges with ${c.label.toLowerCase()}`
            }
            aria-pressed={(isFenwick ? "sum" : combine) === c.key}
          >
            {c.label}
          </button>
        ))}
      </div>
      {isFenwick && (
        <div className="dp-hint">
          A Fenwick tree only does invertible operations — a range is one prefix minus another.
        </div>
      )}

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM ARRAY</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM ARRAY
        </button>
        <textarea
          className="text-input textarea-input"
          placeholder="5, 2, 9, 1, 7, 3, 8, 4"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          rows={2}
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyCustom}>
          APPLY
        </button>
        <div className="dp-hint">up to {MAX_N} values</div>
      </div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {RANGE_GROUPS.map((group) => {
          const ops = RANGE_OPERATIONS.filter((op) => op.group === group.key);
          if (!ops.length) return null;
          const isOpen = openGroups.has(group.key);
          return (
            <div key={group.key} className="algo-group">
              <button
                type="button"
                className="algo-group__header"
                onClick={() => toggleGroup(group.key)}
                aria-expanded={isOpen}
              >
                <span className="algo-group__label">{group.label}</span>
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {isOpen && (
                <div className="algo-group__body">
                  {ops.map((op) => (
                    <button
                      type="button"
                      key={op.key}
                      className={`algo-row ${operation === op.key ? "active" : ""}`}
                      onClick={() => {
                        onOperationChange(op.key);
                        setOpenGroups((prev) => new Set(prev).add(op.group));
                      }}
                      aria-pressed={operation === op.key}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              )}
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
        {opMeta.fields.includes("index") && (
          <>
            <div className="label">INDEX</div>
            <input
              type="number"
              className="text-input"
              min={0}
              max={Math.max(0, n - 1)}
              value={indexInput}
              onChange={(e) => setIndexInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}
        {opMeta.fields.includes("value") && (
          <>
            <div className="label">NEW VALUE</div>
            <input
              type="number"
              className="text-input"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}
        {opMeta.fields.includes("from") && (
          <>
            <div className="label">FROM</div>
            <input
              type="number"
              className="text-input"
              min={0}
              max={Math.max(0, n - 1)}
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div className="label">TO</div>
            <input
              type="number"
              className="text-input"
              min={0}
              max={Math.max(0, n - 1)}
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}

        <button type="submit" className="btn active btn--block-flat">
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>
    </div>
  );
}
