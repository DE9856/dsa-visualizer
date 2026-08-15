import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { STACK_OPERATIONS, STACK_GROUPS, STACK_CAPACITY } from "../dataStructures/stack";

export default function StackSidebar({
  operation,
  onOperationChange,
  opMeta,
  valueInput,
  setValueInput,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
}) {
  const activeGroup = STACK_OPERATIONS.find((op) => op.key === operation)?.group;
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
      <div className="label">STACK (LIFO) &middot; CAPACITY {STACK_CAPACITY}</div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {STACK_GROUPS.map((group) => {
          const ops = STACK_OPERATIONS.filter((op) => op.group === group.key);
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
        <button type="submit" className="btn active btn--block-flat">
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM STACK</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM STACK
        </button>
        <input
          type="text"
          className="text-input"
          placeholder="5, 12, 3, 8..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyCustom}>
          APPLY
        </button>
      </div>
    </div>
  );
}
