import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { LL_OPERATIONS, LL_GROUPS, LL_TYPES } from "../dataStructures/linkedList";

export default function ListSidebar({
  listType,
  onListTypeChange,
  operation,
  onOperationChange,
  opMeta,
  valueInput,
  setValueInput,
  positionInput,
  setPositionInput,
  secondListInput,
  setSecondListInput,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
  listLength,
}) {
  const activeGroup = LL_OPERATIONS.find((op) => op.key === operation)?.group;
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
      <div className="label">LIST TYPE</div>
      <div className="type-toggle">
        {LL_TYPES.map((t) => (
          <button
            key={t.key}
            className={`btn ${listType === t.key ? "active" : ""}`}
            onClick={() => onListTypeChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {LL_GROUPS.map((group) => {
          const ops = LL_OPERATIONS.filter((op) => op.group === group.key);
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
            <div className="label">{opMeta.key === "updateNode" ? "NEW VALUE" : "VALUE"}</div>
            <input
              type="number"
              className="text-input"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}
        {opMeta.fields.includes("position") && (
          <>
            <div className="label">POSITION (0 = head, max {listLength})</div>
            <input
              type="number"
              className="text-input"
              value={positionInput}
              min={0}
              onChange={(e) => setPositionInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}
        {opMeta.fields.includes("secondList") && (
          <>
            <div className="label">SECOND LIST (comma-separated)</div>
            <input
              type="text"
              className="text-input"
              placeholder="2, 4, 6"
              value={secondListInput}
              onChange={(e) => setSecondListInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}
        <button type="submit" className="btn active btn--block-flat">
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM LIST</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM LIST
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