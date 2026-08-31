import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { STRING_ALGOS, STRING_GROUPS } from "../algorithms/strings";
import { MAX_PATTERN, MAX_TEXT } from "../algorithms/strings/helpers.js";

const FIELDS = {
  text: { label: "TEXT", placeholder: "ABABDABACDABABCABAB", hint: `up to ${MAX_TEXT} characters, spaces ignored` },
  pattern: { label: "PATTERN", placeholder: "ABABCABAB", hint: `up to ${MAX_PATTERN} characters` },
};

export default function StringSidebar({
  algo,
  onAlgoChange,
  meta,
  inputs,
  onInputChange,
  onRun,
  onRandom,
  error,
}) {
  const activeGroup = STRING_ALGOS.find((a) => a.key === algo)?.group;
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAlgo = (a) => {
    onAlgoChange(a.key);
    setOpenGroups((prev) => new Set(prev).add(a.group));
  };

  return (
    <div className="panel sidebar">
      <div className="label">STRING ALGORITHMS</div>

      <div className="algo-list">
        {STRING_GROUPS.map((group) => {
          const algos = STRING_ALGOS.filter((a) => a.group === group.key);
          if (algos.length === 0) return null;
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
                  {algos.map((a) => (
                    <button
                      type="button"
                      key={a.key}
                      className={`algo-row ${algo === a.key ? "active" : ""}`}
                      onClick={() => selectAlgo(a)}
                      aria-pressed={algo === a.key}
                    >
                      {a.label}
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
        <div className="label">INPUT</div>
        <button type="button" className="btn btn--block-flat" style={{ marginBottom: 10 }} onClick={onRandom}>
          <Shuffle size={13} /> RANDOM EXAMPLE
        </button>

        {meta.fields.map((key) => {
          const field = FIELDS[key];
          if (!field) return null;
          return (
            <div key={key} className="dp-field">
              <div className="label">{field.label}</div>
              <input
                type="text"
                className="text-input str-input"
                placeholder={field.placeholder}
                value={inputs[key] ?? ""}
                onChange={(e) => onInputChange(key, e.target.value)}
                spellCheck="false"
                autoComplete="off"
              />
              {field.hint && <div className="dp-hint">{field.hint}</div>}
            </div>
          );
        })}

        {error && <div className="dp-error mono">{error}</div>}

        <button type="submit" className="btn active btn--block-flat">
          RUN {meta.short}
        </button>
      </form>
    </div>
  );
}
