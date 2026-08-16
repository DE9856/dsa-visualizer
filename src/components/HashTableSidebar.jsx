import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { HASH_OPERATIONS, HASH_GROUPS, HASH_STRATEGIES, STRATEGY_MAP } from "../dataStructures/hashTable";

export default function HashTableSidebar({
  strategy,
  onStrategyChange,
  operation,
  onOperationChange,
  opMeta,
  keyInput,
  setKeyInput,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
}) {
  const activeGroup = HASH_OPERATIONS.find((op) => op.key === operation)?.group;
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

  const active = STRATEGY_MAP[strategy];

  return (
    <div className="panel sidebar">
      <div className="label">COLLISION HANDLING</div>
      <div className="type-toggle type-toggle--stacked">
        {HASH_STRATEGIES.map((s) => (
          <button
            key={s.key}
            className={`btn ${strategy === s.key ? "active" : ""}`}
            onClick={() => onStrategyChange(s.key)}
          >
            {s.short}
          </button>
        ))}
      </div>
      <div className="sidebar__hint">
        On a collision, {active.resolution}. Resizes past &alpha; {active.loadLimit.toFixed(2)}.
      </div>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM KEYS</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM KEYS
        </button>

        <textarea
          className="text-input textarea-input"
          placeholder="42, 13, 7, 20, 34"
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
        {HASH_GROUPS.map((group) => {
          const ops = HASH_OPERATIONS.filter((op) => op.group === group.key);
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
        {opMeta.fields.includes("key") && (
          <>
            <div className="label">KEY</div>
            <input
              type="number"
              className="text-input"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
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
