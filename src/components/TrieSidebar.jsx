import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { TRIE_OPERATIONS, TRIE_GROUPS, MAX_WORDS } from "../dataStructures/trie";

export default function TrieSidebar({
  operation,
  onOperationChange,
  opMeta,
  wordInput,
  setWordInput,
  onRun,
  customInput,
  setCustomInput,
  onApplyCustom,
  onShuffle,
  wordCount,
}) {
  const activeGroup = TRIE_OPERATIONS.find((op) => op.key === operation)?.group;
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
      <div className="label">
        TRIE &middot; {wordCount}/{MAX_WORDS} WORDS
      </div>
      <div className="sidebar__hint">
        Every edge is one character; a ring marks a node where a word ends.
      </div>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM WORDS</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM WORDS
        </button>

        <textarea
          className="text-input textarea-input"
          placeholder="car, card, care, cat, dog"
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
        {TRIE_GROUPS.map((group) => {
          const ops = TRIE_OPERATIONS.filter((op) => op.group === group.key);
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
        {opMeta.fields.includes("word") && (
          <>
            <div className="label">{operation === "prefix" ? "PREFIX" : "WORD"}</div>
            <input
              type="text"
              className="text-input"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
              placeholder="letters only"
              autoComplete="off"
              spellCheck="false"
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
