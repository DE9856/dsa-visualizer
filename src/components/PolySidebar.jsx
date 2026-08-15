import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { POLY_OPERATIONS, POLY_GROUPS } from "../dataStructures/polynomial";

export default function PolySidebar({
  operation,
  onOperationChange,
  opMeta,
  polyInput,
  setPolyInput,
  onApplyPolynomial,
  onRandomPolynomial,
  secondPolyInput,
  setSecondPolyInput,
  xValueInput,
  setXValueInput,
  onRun,
}) {
  const activeGroup = POLY_OPERATIONS.find((op) => op.key === operation)?.group;
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
      <div className="label">POLYNOMIAL A (this list)</div>
      <input
        type="text"
        className="text-input"
        placeholder="4x^3 + 3x^2 - 5x + 7"
        value={polyInput}
        onChange={(e) => setPolyInput(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn" style={{ flex: 1 }} onClick={onApplyPolynomial}>
          APPLY
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={onRandomPolynomial}>
          <Shuffle size={13} /> RANDOM
        </button>
      </div>

      {opMeta.fields.includes("secondList") && (
        <>
          <div className="label" style={{ marginTop: 16 }}>POLYNOMIAL B</div>
          <input
            type="text"
            className="text-input"
            placeholder="2x + 1"
            value={secondPolyInput}
            onChange={(e) => setSecondPolyInput(e.target.value)}
          />
        </>
      )}

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {POLY_GROUPS.map((group) => {
          const ops = POLY_OPERATIONS.filter((op) => op.group === group.key);
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
        {opMeta.fields.includes("xValue") && (
          <>
            <div className="label">X VALUE</div>
            <input
              type="number"
              className="text-input"
              value={xValueInput}
              onChange={(e) => setXValueInput(e.target.value)}
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