import { Shuffle } from "lucide-react";
import { EXPR_GROUPS, NOTATIONS, NOTATION_MAP, operationsFor } from "../dataStructures/expression";
import { OPERATORS } from "../dataStructures/expression/helpers";

// Highest precedence first — the order the pop rule reads them in.
const PRECEDENCE_ROWS = [
  { ops: ["^"], prec: 4, assoc: "right" },
  { ops: ["*", "/", "%"], prec: 3, assoc: "left" },
  { ops: ["+", "-"], prec: 2, assoc: "left" },
];

export default function ExpressionSidebar({
  notation,
  onNotationChange,
  operation,
  onOperationChange,
  opMeta,
  exprInput,
  setExprInput,
  inputError,
  onApplyExpression,
  onShuffle,
  onRun,
}) {
  // Not collapsed into groups the way the structure sidebars are: filtering
  // by notation already leaves two or three operations, and a group header
  // per operation would be all the furniture and none of the choice.
  const available = operationsFor(notation);

  return (
    <div className="panel sidebar">
      <div className="label">NOTATION</div>
      <div className="type-toggle">
        {NOTATIONS.map((n) => (
          <button
            key={n.key}
            className={`btn ${notation === n.key ? "active" : ""}`}
            onClick={() => onNotationChange(n.key)}
          >
            {n.short}
          </button>
        ))}
      </div>
      <div className="sidebar__hint">{NOTATION_MAP[notation].hint}</div>

      <div className="sidebar__section">
        <div className="label">EXPRESSION</div>
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM EXPRESSION
        </button>
        <textarea
          className="text-input textarea-input"
          value={exprInput}
          onChange={(e) => setExprInput(e.target.value)}
          rows={2}
          spellCheck={false}
        />
        {inputError && <div className="expr-input-error mono">{inputError}</div>}
        <button className="btn btn--block-flat btn--tight" onClick={onApplyExpression}>
          APPLY
        </button>
        <div className="sidebar__hint">
          Names or numbers as operands; <span className="mono">+ - * / % ^</span> and brackets. Evaluation needs
          numbers.
        </div>
      </div>

      <div className="label" style={{ marginTop: 16 }}>
        OPERATIONS
      </div>
      <div className="algo-list">
        {EXPR_GROUPS.map((group) => {
          const ops = available.filter((op) => op.group === group.key);
          if (ops.length === 0) return null;
          return (
            <div key={group.key} className="algo-group">
              <div className="algo-group__header algo-group__header--static">
                <span className="algo-group__label">{group.label}</span>
              </div>
              <div className="algo-group__body">
                {ops.map((op) => (
                  <button
                    type="button"
                    key={op.key}
                    className={`algo-row ${operation === op.key ? "active" : ""}`}
                    onClick={() => onOperationChange(op.key)}
                    aria-pressed={operation === op.key}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
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
        <button type="submit" className="btn active btn--block-flat">
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>

      <div className="sidebar__section">
        <div className="label">PRECEDENCE</div>
        <div className="expr-prec">
          {PRECEDENCE_ROWS.map((row) => (
            <div className="expr-prec__row" key={row.prec}>
              <span className="expr-prec__ops mono">{row.ops.join(" ")}</span>
              <span className="expr-prec__prec mono">{row.prec}</span>
              <span className="expr-prec__assoc">{row.assoc}</span>
            </div>
          ))}
        </div>
        <div className="sidebar__hint">
          A waiting operator is popped by an incoming one of lower or equal precedence — except for{" "}
          <span className="mono">^</span>, where equal precedence stays put, because{" "}
          <span className="mono">{`2^3^2 = 2^(3^2)`}</span>. That single{" "}
          <span className="mono">{`>`}</span> against <span className="mono">{`>=`}</span> is the whole of
          associativity. {Object.keys(OPERATORS).length} operators, three levels.
        </div>
      </div>
    </div>
  );
}
