import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { TWO_THREE_OPERATIONS, TWO_THREE_GROUPS } from "../dataStructures/twoThreeTree";

export default function TwoThreeTreeSidebar({
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
  const activeGroup = TWO_THREE_OPERATIONS.find((op) => op.key === operation)?.group;
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
      <div className="label">2-3 TREE</div>
      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM TREE</div>
        <button className="btn" style={{ width: "100%", marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM TREE
        </button>

        <textarea
          className="text-input textarea-input"
          placeholder="8, 3, 10, 1, 6, 14, 4"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          rows={2}
        />
        <button className="btn" style={{ width: "100%", marginTop: 6 }} onClick={onApplyCustom}>
          APPLY
        </button>
      </div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {TWO_THREE_GROUPS.map((group) => {
          const ops = TWO_THREE_OPERATIONS.filter((op) => op.group === group.key);
          if (ops.length === 0) return null;
          const isOpen = openGroups.has(group.key);
          return (
            <div key={group.key} className="algo-group">
              <div className="algo-group__header" onClick={() => toggleGroup(group.key)}>
                <span className="algo-group__label">{group.label}</span>
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </div>
              {isOpen && (
                <div className="algo-group__body">
                  {ops.map((op) => (
                    <div
                      key={op.key}
                      className={`algo-row ${operation === op.key ? "active" : ""}`}
                      onClick={() => selectOperation(op)}
                    >
                      {op.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sidebar__section">
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

        <button className="btn active" style={{ width: "100%" }} onClick={onRun}>
          RUN {opMeta.label.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
