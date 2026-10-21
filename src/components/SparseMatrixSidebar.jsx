import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { SPARSE_GROUPS, SPARSE_OPERATIONS, MAX_DIM } from "../dataStructures/sparseMatrix";
import { density, storageOf } from "../dataStructures/sparseMatrix/helpers";

export default function SparseMatrixSidebar({
  matrix,
  operation,
  onOperationChange,
  opMeta,
  matrixInput,
  setMatrixInput,
  onApplyMatrix,
  onShuffle,
  secondInput,
  setSecondInput,
  secondMatrix,
  onRandomSecond,
  rowInput,
  setRowInput,
  colInput,
  setColInput,
  onRun,
}) {
  const activeGroup = SPARSE_OPERATIONS.find((op) => op.key === operation)?.group;
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

  const { dense, sparse, wins } = storageOf(matrix);

  return (
    <div className="panel sidebar">
      <div className="label">MATRIX A</div>
      <div className="sm-stat">
        <span className="mono">
          {matrix.rows}×{matrix.cols}
        </span>
        <span className="mono">{matrix.triples.length} terms</span>
        <span className="mono">{(density(matrix) * 100).toFixed(0)}% dense</span>
      </div>
      <div className="sidebar__hint">
        {sparse} numbers as triples against {dense} as a grid — {wins ? "the sparse form wins here" : "the grid is cheaper at this density"}.
      </div>

      <div className="sidebar__section">
        <button className="btn btn--block-flat" style={{ marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM SPARSE MATRIX
        </button>
        <textarea
          className="text-input textarea-input sm-textarea"
          value={matrixInput}
          onChange={(e) => setMatrixInput(e.target.value)}
          rows={5}
          spellCheck={false}
        />
        <button className="btn btn--block-flat btn--tight" onClick={onApplyMatrix}>
          APPLY
        </button>
        <div className="sidebar__hint">
          One row per line, values separated by commas. Up to {MAX_DIM}×{MAX_DIM}; short rows are padded with zeros.
        </div>
      </div>

      <div className="label" style={{ marginTop: 16 }}>
        OPERATIONS
      </div>
      <div className="algo-list">
        {SPARSE_GROUPS.map((group) => {
          const ops = SPARSE_OPERATIONS.filter((op) => op.group === group.key);
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
        {opMeta.fields.includes("secondMatrix") && (
          <>
            <div className="label">MATRIX B</div>
            <textarea
              className="text-input textarea-input sm-textarea"
              value={secondInput}
              onChange={(e) => setSecondInput(e.target.value)}
              rows={5}
              spellCheck={false}
            />
            <button type="button" className="btn btn--block-flat btn--tight" onClick={onRandomSecond}>
              <Shuffle size={13} /> RANDOM B
            </button>
            <div className="sidebar__hint">
              {secondMatrix
                ? `B is ${secondMatrix.rows}×${secondMatrix.cols}, ${secondMatrix.triples.length} terms. ${
                    operation === "add"
                      ? "Addition needs the same shape as A."
                      : "A product needs A's column count to equal B's row count."
                  }`
                : "Type a matrix, one row per line."}
            </div>
          </>
        )}

        {opMeta.fields.includes("row") && (
          <div className="sm-cell-fields">
            <div>
              <div className="label">ROW i</div>
              <input
                type="number"
                className="text-input"
                min={0}
                max={matrix.rows - 1}
                value={rowInput}
                onChange={(e) => setRowInput(e.target.value)}
              />
            </div>
            <div>
              <div className="label">COLUMN j</div>
              <input
                type="number"
                className="text-input"
                min={0}
                max={matrix.cols - 1}
                value={colInput}
                onChange={(e) => setColInput(e.target.value)}
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn active btn--block-flat" style={{ marginTop: 10 }}>
          RUN {opMeta.label.toUpperCase()}
        </button>
      </form>
    </div>
  );
}
