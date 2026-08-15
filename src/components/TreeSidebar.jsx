import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { TREE_OPERATIONS, TREE_GROUPS, TREE_TYPES } from "../dataStructures/tree";

export default function TreeSidebar({
  treeType,
  onTreeTypeChange,
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
  const activeGroup = TREE_OPERATIONS.find((op) => op.key === operation)?.group;
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
      <div className="label">TREE TYPE</div>
      <div className="type-toggle">
        {TREE_TYPES.map((t) => (
          <button
            key={t.key}
            className={`btn ${treeType === t.key ? "active" : ""}`}
            onClick={() => onTreeTypeChange(t.key)}
          >
            {t.short}
          </button>
        ))}
      </div>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM TREE</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM TREE
        </button>

        <textarea
          className="text-input textarea-input"
          placeholder="8, 3, 10, 1, 6, 14, 4"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          rows={2}
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyCustom}>
          APPLY
        </button>
      </div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {TREE_GROUPS.map((group) => {
          const ops = TREE_OPERATIONS.filter((op) => op.group === group.key);
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
    </div>
  );
}
