/**
 * The board, for all four backtracking problems.
 *
 * Every frame carries one grid — a row of numbers is a grid one row tall — so
 * a chessboard, a sudoku and a list of candidates all render through the same
 * component. `values` and `tones` are flat arrays of primitives rather than
 * per-cell objects, because a sudoku search is a couple of hundred frames each
 * holding 81 cells and the copies add up.
 *
 * The tones are the argument the view is making:
 *
 *   attacked / conflict   a choice the constraint has already ruled out
 *   current               the choice being made this step
 *   undo                  a choice being taken back — the backtrack itself
 *   placed / given        settled, either by the search or by the puzzle
 */
export default function BacktrackCanvas({ step }) {
  const board = step.board;
  if (!board || !board.values) {
    return (
      <div className="panel canvas bt-canvas">
        <div className="ll-empty mono">NO BOARD</div>
      </div>
    );
  }

  const { rows, cols, values, tones, labels, blocks } = board;

  return (
    <div className="panel canvas bt-canvas">
      <div className="bt-board-wrap canvas-scroll">
        <div
          className={`bt-board ${rows === 1 ? "bt-board--row" : ""}`}
          style={{ "--cols": cols }}
          role="img"
          aria-label={step.message}
        >
          {values.map((value, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            // The heavier rules between sudoku's 3×3 boxes. Drawn as borders on
            // the cells rather than as separate elements, so nothing has to be
            // positioned over the grid.
            const blockEdge = blocks
              ? [
                  c % blocks === 0 && c > 0 ? "bt-cell--bx" : "",
                  r % blocks === 0 && r > 0 ? "bt-cell--by" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              : "";
            return (
              <div key={i} className={`bt-cell ${tones[i] ? `is-${tones[i]}` : ""} ${blockEdge}`}>
                <span className="bt-cell__value mono">{value}</span>
                {labels && labels[i] !== undefined && <span className="bt-cell__label">{labels[i]}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {step.aux && (
        <div className="dp-aux">
          <span className="label label--tight">{step.aux.label}</span>
          <div className="dp-aux__items">
            {step.aux.items.map((item, i) => (
              <span key={i} className={`dp-chip mono dp-chip--${item.tone}`}>
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
