/**
 * The aligned grid every string, greedy and number-theory algorithm draws on.
 *
 * They are all the same picture: rows sharing one set of columns, sometimes
 * starting part-way along, with pointers above them. That covers characters
 * aligned under a pattern, activities laid out on a timeline, a sieve's ten-
 * wide number grid, the bits of an exponent with the running square under
 * each, and the rows of a Euclidean descent. Alignment is the whole point:
 * KMP's search draws the pattern as a row starting at the column it is
 * currently aligned with, so a shift is the row physically moving right, and
 * an activity that runs from 3 to 9 is a bar that starts at column 3.
 *
 * A row's `offset` is applied by giving its first cell an explicit grid column;
 * everything after it auto-places, so the columns stay locked to the ruler
 * without any spacer elements.
 */
export default function GridCanvas({ step }) {
  const width = step.width || 0;
  const rows = step.rows || [];

  if (!width || !rows.length) {
    return (
      <div className="panel canvas grid-canvas">
        <div className="ll-empty mono">NOTHING TO SHOW</div>
      </div>
    );
  }

  // Pointers share the grid, so several landing on one column are merged into
  // that cell rather than stacked on top of each other.
  const pointerCells = new Array(width).fill(null);
  (step.pointers || []).forEach((p) => {
    if (p.at < 0 || p.at >= width) return;
    const existing = pointerCells[p.at];
    pointerCells[p.at] = existing
      ? { label: `${existing.label}/${p.label}`, tone: existing.tone }
      : { label: p.label, tone: p.tone };
  });
  const hasPointers = pointerCells.some(Boolean);

  return (
    <div className="panel canvas grid-canvas">
      <div className="grid-wrap canvas-scroll">
        <div
          className="grid-board"
          style={step.cellWidth ? { "--cell-w": `${step.cellWidth}px` } : undefined}
        >
          {hasPointers && (
            <div className="grid-row grid-row--pointers">
              <span className="grid-row__label mono" />
              <div className="grid-row__cells" style={{ "--cols": width }}>
                {pointerCells.map((p, i) => (
                  <span key={i} className={`grid-pointer mono ${p ? `is-${p.tone || "active"}` : ""}`}>
                    {p ? p.label : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rows.map((row, r) => (
            <div key={r} className={`grid-row ${row.index ? "grid-row--index" : ""}`}>
              <span className="grid-row__label mono">{row.label}</span>
              <div className="grid-row__cells" style={{ "--cols": width }}>
                {row.cells.map((c, i) => (
                  <span
                    key={i}
                    className={`grid-cell mono ${c.tone ? `is-${c.tone}` : ""} ${c.text === "" ? "is-blank" : ""}`}
                    style={i === 0 && row.offset ? { gridColumnStart: row.offset + 1 } : undefined}
                  >
                    {c.text}
                    {c.sub !== undefined && <span className="grid-cell__sub">{c.sub}</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
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
