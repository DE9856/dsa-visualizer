/**
 * The aligned character grid every string algorithm draws on.
 *
 * All four are the same picture — characters in a row, sometimes a second row
 * under it starting at some column, and an array of numbers beneath — so a
 * frame is a list of rows sharing one set of columns, and this renders it.
 * Alignment is the whole point: KMP's search draws the pattern as a row that
 * starts at the column it is currently aligned with, so a shift is the row
 * physically moving right, and Z's mirror is two spans lit up in the same
 * columns their indices name.
 *
 * A row's `offset` is applied by giving its first cell an explicit grid column;
 * everything after it auto-places, so the columns stay locked to the ruler
 * without any spacer elements.
 */
export default function StringCanvas({ step }) {
  const width = step.width || 0;
  const rows = step.rows || [];

  if (!width || !rows.length) {
    return (
      <div className="panel canvas str-canvas">
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
    <div className="panel canvas str-canvas">
      <div className="str-grid-wrap canvas-scroll">
        <div className="str-grid">
          {hasPointers && (
            <div className="str-row str-row--pointers">
              <span className="str-row__label mono" />
              <div className="str-row__cells" style={{ "--cols": width }}>
                {pointerCells.map((p, i) => (
                  <span key={i} className={`str-pointer mono ${p ? `is-${p.tone || "active"}` : ""}`}>
                    {p ? p.label : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rows.map((row, r) => (
            <div key={r} className={`str-row ${row.index ? "str-row--index" : ""}`}>
              <span className="str-row__label mono">{row.label}</span>
              <div className="str-row__cells" style={{ "--cols": width }}>
                {row.cells.map((c, i) => (
                  <span
                    key={i}
                    className={`str-cell mono ${c.tone ? `is-${c.tone}` : ""} ${c.text === "" ? "is-blank" : ""}`}
                    style={i === 0 && row.offset ? { gridColumnStart: row.offset + 1 } : undefined}
                  >
                    {c.text}
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
