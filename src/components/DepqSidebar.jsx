import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { DEPQ_GROUPS, DEPQ_KINDS, DEPQ_OPERATIONS, KIND_MAP, capacityOf } from "../dataStructures/depq";
import { leavesOf } from "../dataStructures/depq/helpers";

export default function DepqSidebar({
  queue,
  kind,
  onKindChange,
  operation,
  onOperationChange,
  opMeta,
  valueInput,
  setValueInput,
  valuesInput,
  setValuesInput,
  onShuffle,
  onRun,
}) {
  const activeGroup = DEPQ_OPERATIONS.find((op) => op.key === operation)?.group;
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectOperation = (op) => {
    onOperationChange(op.key);
    setOpenGroups((prev) => new Set(prev).add(op.group));
  };

  const n = queue.items.length;
  const leafCount = n ? leavesOf(n).length : 0;

  return (
    <div className="panel sidebar">
      <div className="label">STRUCTURE</div>
      <div className="dq-kinds">
        {DEPQ_KINDS.map((k) => (
          <button
            key={k.key}
            className={`btn btn--chip ${kind === k.key ? "active" : ""}`}
            onClick={() => onKindChange(k.key)}
          >
            {k.short}
          </button>
        ))}
      </div>
      <div className="sidebar__hint">{KIND_MAP[kind].hint}</div>

      {/* The cost of the far end, stated in the sidebar rather than only in a
          step message — it is the reason all three kinds share this view. */}
      <div className="dq-cost">
        <div className="dq-cost__row">
          <span>FIND MIN</span>
          <b className="is-cheap mono">O(1)</b>
        </div>
        <div className="dq-cost__row">
          <span>FIND MAX</span>
          {kind === "single" ? (
            <b className="is-dear mono">O(n) — {leafCount || "⌈n/2⌉"} leaves</b>
          ) : (
            <b className="is-cheap mono">O(1)</b>
          )}
        </div>
      </div>

      <div className="sidebar__section">
        <button className="btn btn--block-flat" onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM QUEUE
        </button>
        <div className="sidebar__hint">
          {n} of up to {capacityOf(kind)} elements.
        </div>
      </div>

      <div className="label" style={{ marginTop: 16 }}>
        OPERATIONS
      </div>
      <div className="algo-list">
        {DEPQ_GROUPS.map((group) => {
          const ops = DEPQ_OPERATIONS.filter((op) => op.group === group.key);
          if (ops.length === 0) return null;
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
                      onClick={() => selectOperation(op)}
                      aria-pressed={operation === op.key}
                    >
                      {op.label}
                      {op.key === "deleteMax" && kind === "single" && <span className="algo-row__note">O(n)</span>}
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
        {opMeta.fields.includes("value") && (
          <>
            <div className="label">VALUE</div>
            <input
              type="number"
              className="text-input"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}

        {opMeta.fields.includes("values") && (
          <>
            <div className="label">VALUES TO BUILD FROM</div>
            <textarea
              className="text-input textarea-input"
              value={valuesInput}
              onChange={(e) => setValuesInput(e.target.value)}
              rows={2}
              placeholder="40, 15, 70, 5, 55, 90"
            />
            <div className="sidebar__hint">
              Build the same list under all three kinds and compare the arrays — same elements, same first slot,
              nothing else alike.
            </div>
          </>
        )}

        <button type="submit" className="btn active btn--block-flat" style={{ marginTop: 10 }}>
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>
    </div>
  );
}
