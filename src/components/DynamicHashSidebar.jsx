import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle, Eraser } from "lucide-react";
import { DYNAMIC_OPERATIONS, DYNAMIC_GROUPS, DYNAMIC_KINDS, KIND_MAP, BUCKET_SIZE } from "../dataStructures/dynamicHash";

export default function DynamicHashSidebar({
  kind,
  onKindChange,
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
  onReset,
}) {
  const activeGroup = DYNAMIC_OPERATIONS.find((op) => op.key === operation)?.group;
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

  const active = KIND_MAP[kind];

  return (
    <div className="panel sidebar">
      <div className="label">SCHEME</div>
      <div className="type-toggle type-toggle--stacked">
        {DYNAMIC_KINDS.map((k) => (
          <button key={k.key} className={`btn ${kind === k.key ? "active" : ""}`} onClick={() => onKindChange(k.key)}>
            {k.short}
            <span className="dh-kind__tag mono">{k.tag}</span>
          </button>
        ))}
      </div>
      <div className="sidebar__hint">
        {active.summary} Buckets hold {BUCKET_SIZE} keys.
      </div>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM KEYS</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM KEYS
        </button>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onReset}>
          <Eraser size={13} /> START EMPTY
        </button>

        <textarea
          className="text-input textarea-input"
          placeholder="12, 5, 30, 3, 8, 21"
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
        {DYNAMIC_GROUPS.map((group) => {
          const ops = DYNAMIC_OPERATIONS.filter((op) => op.group === group.key);
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
