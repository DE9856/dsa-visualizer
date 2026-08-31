/**
 * The array, with the stored partial answers drawn as spans underneath it.
 *
 * This is one picture for two structures, which is the argument for showing
 * them together. A segment tree's row is a depth; a Fenwick tree's row is a
 * lowbit class. Neither can have two overlapping spans on one row, so both lay
 * out the same way — and a query lighting up three spans that happen to tile
 * the requested range looks identical in both, which is exactly the point.
 *
 * Spans are placed by grid column, so a span physically covers the array cells
 * it stands for. That is the whole reason this reads at a glance: containment
 * is drawn rather than described.
 */
export default function RangeQueryCanvas({ step }) {
  const n = step.n || 0;
  const spans = step.spans || [];
  const array = step.array || [];

  if (!n) {
    return (
      <div className="panel canvas rq-canvas">
        <div className="ll-empty mono">EMPTY ARRAY</div>
        <div className="ll-message mono">{step.message}</div>
      </div>
    );
  }

  const rows = [];
  spans.forEach((s) => {
    (rows[s.row] ||= []).push(s);
  });

  return (
    <div className="panel canvas rq-canvas">
      <div className="rq-wrap canvas-scroll">
        <div className="rq-grid">
          <div className="rq-row">
            <span className="rq-row__label mono" />
            <div className="rq-cells rq-cells--index" style={{ "--cols": n }}>
              {Array.from({ length: n }, (_, i) => (
                <span key={i} className="rq-index mono">
                  {i}
                </span>
              ))}
            </div>
          </div>

          <div className="rq-row">
            <span className="rq-row__label mono">ARRAY</span>
            <div className="rq-cells" style={{ "--cols": n }}>
              {array.map((cell, i) => (
                <span key={i} className={`rq-cell mono ${cell.tone ? `is-${cell.tone}` : ""}`}>
                  {cell.text}
                </span>
              ))}
            </div>
          </div>

          {rows.map((row, depth) =>
            row ? (
              <div className="rq-row" key={depth}>
                <span className="rq-row__label mono">{depth === 0 ? "STORED" : ""}</span>
                <div className="rq-cells" style={{ "--cols": n }}>
                  {row.map((s) => (
                    <span
                      key={s.id}
                      className={`rq-span mono ${s.tone ? `is-${s.tone}` : ""}`}
                      style={{ gridColumnStart: s.lo + 1, gridColumnEnd: s.hi + 2 }}
                      title={
                        s.index !== undefined
                          ? `bit[${s.index}] covers a[${s.lo}..${s.hi}]`
                          : `a[${s.lo}..${s.hi}]`
                      }
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
