import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { GREEDY_ALGOS, GREEDY_GROUPS } from "../algorithms/greedy";
import {
  MAX_ACTIVITIES,
  MAX_ITEMS,
  MAX_SIEVE,
  MAX_TIME,
  MAX_EXPONENT,
  MAX_GCD,
} from "../algorithms/greedy/helpers.js";

const FIELDS = {
  activities: {
    label: "ACTIVITIES",
    placeholder: "1-4, 3-5, 0-6, 5-7",
    hint: `start-end pairs, up to ${MAX_ACTIVITIES} of them, times 0 to ${MAX_TIME}`,
  },
  items: {
    label: "ITEMS",
    placeholder: "60/10, 100/20, 120/30",
    hint: `value/weight pairs, up to ${MAX_ITEMS}`,
  },
  capacity: { label: "CAPACITY", placeholder: "50", hint: "how much the sack holds" },
  limit: { label: "UP TO", placeholder: "60", hint: `find every prime up to this, at most ${MAX_SIEVE}` },
  base: { label: "BASE", placeholder: "3" },
  exponent: { label: "EXPONENT", placeholder: "13", hint: `at most ${MAX_EXPONENT}` },
  modulus: { label: "MODULUS", placeholder: "0", hint: "0 for exact arithmetic, or a modulus to keep the numbers small" },
  a: { label: "A", placeholder: "1071", hint: `at most ${MAX_GCD}` },
  b: { label: "B", placeholder: "462" },
};

export default function GreedySidebar({
  algo,
  onAlgoChange,
  meta,
  inputs,
  onInputChange,
  onRun,
  onRandom,
  error,
}) {
  const activeGroup = GREEDY_ALGOS.find((a) => a.key === algo)?.group;
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
      <div className="label">GREEDY &amp; MATH</div>

      <div className="algo-list">
        {GREEDY_GROUPS.map((group) => {
          const algos = GREEDY_ALGOS.filter((a) => a.group === group.key);
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
