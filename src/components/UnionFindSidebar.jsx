import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { UF_OPERATIONS, UF_GROUPS, MAX_ELEMENTS } from "../dataStructures/unionFind";
import { labelOf } from "../dataStructures/unionFind/helpers";

export default function UnionFindSidebar({
  operation,
  onOperationChange,
  opMeta,
  elementA,
  setElementA,
  elementB,
  setElementB,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
  elementCount,
}) {
  const activeGroup = UF_OPERATIONS.find((op) => op.key === operation)?.group;
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

  const range = `${labelOf(0)}–${labelOf(elementCount - 1)}`;

  return (
    <div className="panel sidebar">
      <div className="label">DISJOINT SETS &middot; {elementCount} ELEMENTS</div>
      <div className="sidebar__hint">
        Each tree is one set; the ringed node is its root. Union by size, with path compression on every find.
      </div>

      <div className="sidebar__section">
        <div className="label">NEW SETS</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM SETS
        </button>
        <input
          type="number"
          className="text-input"
          min={2}
          max={MAX_ELEMENTS}
          placeholder={`elements (2–${MAX_ELEMENTS})`}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyCustom}>
          APPLY (ALL SINGLETONS)
        </button>
      </div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {UF_GROUPS.map((group) => {
          const ops = UF_OPERATIONS.filter((op) => op.group === group.key);
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
        {opMeta.fields.includes("a") && (
          <>
            <div className="label">ELEMENT{opMeta.fields.includes("b") ? "S" : ""} ({range})</div>
            <div className="target-row" style={{ marginBottom: 10 }}>
              <input
                type="text"
                className="text-input"
                value={elementA}
                maxLength={2}
                onChange={(e) => setElementA(e.target.value.toUpperCase())}
                aria-label="First element"
              />
              {opMeta.fields.includes("b") && (
                <input
                  type="text"
                  className="text-input"
                  value={elementB}
                  maxLength={2}
                  onChange={(e) => setElementB(e.target.value.toUpperCase())}
                  aria-label="Second element"
                />
              )}
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
