import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { BT_GROUPS, BT_PROBLEMS } from "../algorithms/backtracking";
import {
  MAX_PERM,
  MAX_SUBSET,
  MODES,
  QUEENS_MAX,
  QUEENS_MIN,
} from "../algorithms/backtracking/helpers.js";
import { PUZZLES } from "../algorithms/backtracking/sudoku.js";

const FIELDS = {
  n: {
    label: "BOARD SIZE",
    type: "number",
    min: QUEENS_MIN,
    max: QUEENS_MAX,
    hint: `${QUEENS_MIN} to ${QUEENS_MAX} queens`,
  },
  mode: { label: "FIND", type: "modes" },
  puzzle: { label: "PUZZLE", type: "puzzle" },
  numbers: {
    label: "NUMBERS",
    type: "text",
    placeholder: "3, 34, 4, 12, 5, 2",
    hint: `positive only, up to ${MAX_SUBSET} — the prunes depend on it`,
  },
  target: { label: "TARGET", type: "number", min: 1, max: 999 },
  values: {
    label: "VALUES",
    type: "text",
    placeholder: "1, 2, 3, 4",
    hint: `distinct, up to ${MAX_PERM} — ${MAX_PERM}! is already 720 answers`,
  },
};

export default function BacktrackSidebar({
  problem,
  onProblemChange,
  meta,
  inputs,
  onInputChange,
  onRun,
  onRandom,
  error,
}) {
  const activeGroup = BT_PROBLEMS.find((p) => p.key === problem)?.group;
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
      <div className="label">BACKTRACKING</div>

      <div className="algo-list">
        {BT_GROUPS.map((group) => {
          const problems = BT_PROBLEMS.filter((p) => p.group === group.key);
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
        <div className="label">SETUP</div>
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

          if (field.type === "modes") {
            return (
              <div key={key} className="dp-field">
                <div className="label">{field.label}</div>
                <div className="seg">
                  {MODES.map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      className={`seg__btn ${inputs[key] === m.key ? "active" : ""}`}
                      onClick={() => onInputChange(key, m.key)}
                      title={m.desc}
                      aria-pressed={inputs[key] === m.key}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="dp-hint">
                  {inputs[key] === "all"
                    ? "The whole tree. Practical up to 7 queens; past that the node budget stops it."
                    : "Stops as soon as one answer is found."}
                </div>
              </div>
            );
          }

          if (field.type === "puzzle") {
            return (
              <div key={key} className="dp-field">
                <div className="label">{field.label}</div>
                <div className="bt-puzzles">
                  {PUZZLES.map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      className={`bt-puzzle ${inputs[key] === p.grid ? "active" : ""}`}
                      onClick={() => onInputChange(key, p.grid)}
                      title={p.blurb}
                      aria-pressed={inputs[key] === p.grid}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="text-input textarea-input bt-grid-input"
                  value={inputs[key] ?? ""}
                  onChange={(e) => onInputChange(key, e.target.value)}
                  rows={3}
                  spellCheck="false"
                  aria-label="Sudoku grid, 81 characters"
                />
                <div className="dp-hint">81 characters, 0 or . for a blank</div>
              </div>
            );
          }

          return (
            <div key={key} className="dp-field">
              <div className="label">{field.label}</div>
              <input
                type={field.type}
                className="text-input"
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                value={inputs[key] ?? ""}
                onChange={(e) => onInputChange(key, e.target.value)}
              />
              {field.hint && <div className="dp-hint">{field.hint}</div>}
            </div>
          );
        })}

        {error && <div className="dp-error mono">{error}</div>}

        <button type="submit" className="btn active btn--block-flat">
          RUN THE SEARCH
        </button>
      </form>
    </div>
  );
}
