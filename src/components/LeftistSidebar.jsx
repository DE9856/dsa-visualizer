import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { KIND_MAP, LEFTIST_GROUPS, LEFTIST_KINDS, LEFTIST_OPERATIONS } from "../dataStructures/leftist";

export default function LeftistSidebar({
  kind,
  onKindChange,
  operation,
  onOperationChange,
  opMeta,
  valueInput,
  setValueInput,
  secondInput,
  setSecondInput,
  valuesInput,
  setValuesInput,
  onShuffle,
  onRun,
}) {
  const activeGroup = LEFTIST_OPERATIONS.find((op) => op.key === operation)?.group;
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

  return (
    <div className="panel sidebar">
      <div className="label">ORDER</div>
      <div className="type-toggle">
        {LEFTIST_KINDS.map((k) => (
          <button key={k.key} className={`btn ${kind === k.key ? "active" : ""}`} onClick={() => onKindChange(k.key)}>
            {k.short}
          </button>
        ))}
      </div>
      <div className="sidebar__hint">
        {KIND_MAP[kind].rule}; the {KIND_MAP[kind].root} value is the root. The leftist rule is separate from that:
        s(left) ≥ s(right) at every node, where s is the distance to the nearest missing child.
      </div>

      <div className="sidebar__section">
        <button className="btn btn--block-flat" onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM TREE
        </button>
      </div>

      <div className="label" style={{ marginTop: 16 }}>
        OPERATIONS
      </div>
      <div className="algo-list">
        {LEFTIST_GROUPS.map((group) => {
          const ops = LEFTIST_OPERATIONS.filter((op) => op.group === group.key);
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
                      {op.key === "deleteRoot" ? KIND_MAP[kind].take : op.label}
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

        {opMeta.fields.includes("secondValues") && (
          <>
            <div className="label">TREE B — VALUES</div>
            <textarea
              className="text-input textarea-input"
              value={secondInput}
              onChange={(e) => setSecondInput(e.target.value)}
              rows={2}
              placeholder="35, 8, 60, 25"
            />
            <div className="sidebar__hint">Melded into a leftist tree of its own first, then melded with A.</div>
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
              placeholder="40, 15, 70, 5, 55, 90, 30"
            />
            <div className="sidebar__hint">
              Run both builds on the same list and compare the spine-work totals — and the shapes.
            </div>
          </>
        )}

        <button type="submit" className="btn active btn--block-flat" style={{ marginTop: 10 }}>
          RUN {(opMeta.key === "deleteRoot" ? KIND_MAP[kind].take : opMeta.label).toUpperCase()}
        </button>
      </form>
    </div>
  );
}
