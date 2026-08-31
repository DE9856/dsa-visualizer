import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { BTREE_OPERATIONS, BTREE_GROUPS } from "../dataStructures/bTree";
import { ORDERS, VARIANTS, maxKeys, minKeys } from "../dataStructures/bTree/helpers";

export default function BTreeSidebar({
  operation,
  onOperationChange,
  opMeta,
  order,
  onOrderChange,
  variant,
  onVariantChange,
  valueInput,
  setValueInput,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
}) {
  const activeGroup = BTREE_OPERATIONS.find((op) => op.key === operation)?.group;
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

  const activeVariant = VARIANTS.find((v) => v.key === variant);

  return (
    <div className="panel sidebar">
      <div className="label">B-TREE</div>

      <div className="label" style={{ marginTop: 4 }}>VARIANT</div>
      <div className="type-toggle">
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            className={`btn ${variant === v.key ? "active" : ""}`}
            onClick={() => onVariantChange(v.key)}
          >
            {v.short}
          </button>
        ))}
      </div>
      <p className="sidebar__note">{activeVariant?.summary}</p>

      <div className="label" style={{ marginTop: 14 }}>ORDER</div>
      <div className="type-toggle type-toggle--grid">
        {ORDERS.map((o) => (
          <button key={o} className={`btn ${order === o ? "active" : ""}`} onClick={() => onOrderChange(o)}>
            {o}
          </button>
        ))}
      </div>
      <p className="sidebar__note">
        Up to {order} children and {maxKeys(order)} keys per node; every node but the root keeps at least{" "}
        {minKeys(order)}.
      </p>

      <div className="sidebar__section" style={{ marginTop: 14 }}>
        <div className="label">NEW / CUSTOM TREE</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM TREE
        </button>

        <textarea
          className="text-input textarea-input"
          placeholder="10, 20, 5, 6, 12, 30, 7, 17"
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
        {BTREE_GROUPS.map((group) => {
          const ops = BTREE_OPERATIONS.filter((op) => op.group === group.key);
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
