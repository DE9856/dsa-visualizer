import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { DP_GROUPS, DP_PROBLEMS } from "../algorithms/dp";
import {
  MAX_AMOUNT,
  MAX_CAPACITY,
  MAX_SEQUENCE,
  MAX_STRING,
} from "../algorithms/dp/helpers.js";

// Every field any problem can ask for, in one table. A problem lists the keys
// it wants and gets the right input for each — which is what keeps adding a
// seventh problem to one line of its own file rather than a branch in here.
const FIELDS = {
  stringA: { label: "STRING A", type: "text", placeholder: "AGCAT", hint: `up to ${MAX_STRING} characters` },
  stringB: { label: "STRING B", type: "text", placeholder: "GAC", hint: `up to ${MAX_STRING} characters` },
  items: {
    label: "ITEMS — WEIGHT:VALUE",
    type: "textarea",
    placeholder: "2:3, 3:4, 4:5, 5:6",
    hint: "one pair per item",
  },
  capacity: { label: "BAG CAPACITY", type: "number", min: 1, max: MAX_CAPACITY },
  coins: { label: "COIN VALUES", type: "text", placeholder: "1, 3, 4", hint: "reusable, any number of each" },
  amount: { label: "AMOUNT", type: "number", min: 0, max: MAX_AMOUNT },
  sequence: {
    label: "SEQUENCE",
    type: "text",
    placeholder: "3, 10, 2, 1, 20, 4, 6",
    hint: `up to ${MAX_SEQUENCE} numbers`,
  },
  dims: {
    label: "DIMENSIONS",
    type: "text",
    placeholder: "30, 35, 15, 5, 10, 20",
    hint: "n+1 numbers describe n matrices",
  },
};

export default function DpSidebar({
  problem,
  onProblemChange,
  meta,
  inputs,
  onInputChange,
  onRun,
  onRandom,
  error,
}) {
  const activeGroup = DP_PROBLEMS.find((p) => p.key === problem)?.group;
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectProblem = (p) => {
    onProblemChange(p.key);
    setOpenGroups((prev) => new Set(prev).add(p.group));
  };

  return (
    <div className="panel sidebar">
      <div className="label">DYNAMIC PROGRAMMING</div>

      <div className="algo-list">
        {DP_GROUPS.map((group) => {
          const problems = DP_PROBLEMS.filter((p) => p.group === group.key);
          if (problems.length === 0) return null;
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
                  {problems.map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      className={`algo-row ${problem === p.key ? "active" : ""}`}
                      onClick={() => selectProblem(p)}
                      aria-pressed={problem === p.key}
                    >
                      {p.label}
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
        <button
          type="button"
          className="btn btn--block-flat"
          style={{ marginBottom: 10 }}
          onClick={onRandom}
        >
          <Shuffle size={13} /> RANDOM EXAMPLE
        </button>

        {meta.fields.map((key) => {
          const field = FIELDS[key];
          if (!field) return null;
          return (
            <div key={key} className="dp-field">
              <div className="label">{field.label}</div>
              {field.type === "textarea" ? (
                <textarea
                  className="text-input textarea-input"
                  placeholder={field.placeholder}
                  value={inputs[key] ?? ""}
                  onChange={(e) => onInputChange(key, e.target.value)}
                  rows={2}
                />
              ) : (
                <input
                  type={field.type}
                  className="text-input"
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  value={inputs[key] ?? ""}
                  onChange={(e) => onInputChange(key, e.target.value)}
                />
              )}
              {field.hint && <div className="dp-hint">{field.hint}</div>}
            </div>
          );
        })}

        {error && <div className="dp-error mono">{error}</div>}

        <button type="submit" className="btn active btn--block-flat">
          FILL THE TABLE
        </button>
      </form>
    </div>
  );
}
