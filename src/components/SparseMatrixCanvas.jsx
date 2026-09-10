/**
 * A sparse matrix, drawn twice: as the dense grid it stands for, and as the
 * triplet list it actually is.
 *
 * They are side by side because the whole subject is the correspondence
 * between them, and every step highlights the same entry in both — the term
 * being read and the cell it stands for. A grid cell that holds zero is drawn
 * as empty rather than as "0", because in the representation on the right it
 * genuinely is not there.
 */
export default function SparseMatrixCanvas({ step }) {
  return (
    <div className="panel canvas sm-canvas">
      <div className="sm-row">
        <MatrixBlock
          label={step.label || "A"}
          rows={step.rows}
          cols={step.cols}
          dense={step.dense}
          triples={step.triples}
          active={step.active}
          cell={step.cell}
          scanCol={step.scanCol}
          range={step.range}
          probe={step.probe}
        />
        {step.second && <MatrixBlock {...step.second} dense={step.second.dense} />}
        {step.aux && <MatrixBlock {...step.aux} dense={step.aux.dense} />}
      </div>

      {step.counts && <CountStrip counts={step.counts} />}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">NOT STORED</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

function MatrixBlock({ label, rows, cols, dense, triples, active = [], cell, scanCol, range, probe }) {
  const hot = new Set(active);

  return (
    <div className="sm-block">
      <div className="sm-block__head mono">
        {label} · {rows}×{cols} · {triples.length} terms
      </div>

      {/* Side by side rather than stacked: the correspondence between them is
          the whole subject, and a tall matrix stacked above its own list runs
          off the bottom of the panel. */}
      <div className="sm-block__body">
        <div className="canvas-scroll">
          <div className="sm-grid" style={{ gridTemplateColumns: `auto repeat(${cols}, auto)` }}>
            <span className="sm-grid__corner" aria-hidden="true" />
            {Array.from({ length: cols }, (_, c) => (
              <span key={`ch-${c}`} className={`sm-grid__head mono ${scanCol === c ? "is-scan" : ""}`}>
                {c}
              </span>
            ))}
            {dense.map((row, r) => (
              <Row key={`r-${r}`} r={r} row={row} cell={cell} scanCol={scanCol} />
            ))}
          </div>
        </div>

        <div className="sm-triples">
          <div className="sm-triples__head mono">
            <span>i</span>
            <span>j</span>
            <span>value</span>
          </div>
          {triples.length === 0 ? (
            <div className="sm-triples__empty mono">no terms</div>
          ) : (
            triples.map((t, i) => (
              <div
                key={t.id}
                className={[
                  "sm-triple mono",
                  hot.has(t.id) ? "is-active" : "",
                  probe === i ? "is-probe" : "",
                  range && (i < range[0] || i > range[1]) ? "is-muted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span>{t.r}</span>
                <span>{t.c}</span>
                <span>{t.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Split out so the row header and its cells stay one grid row without a
// wrapper element, which a subgrid would need.
function Row({ r, row, cell, scanCol }) {
  return (
    <>
      <span className="sm-grid__head mono">{r}</span>
      {row.map((value, c) => (
        <span
          key={c}
          className={[
            "sm-cell mono",
            value === 0 ? "is-zero" : "is-set",
            cell && cell.r === r && cell.c === c ? "is-cur" : "",
            scanCol === c ? "is-scan" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value === 0 ? "" : value}
        </span>
      ))}
    </>
  );
}

/** The count / starting-position arrays the fast transpose works through. */
function CountStrip({ counts }) {
  const rows = [counts, counts.secondary].filter(Boolean);
  return (
    <div className="sm-counts">
      {rows.map((row, i) => (
        <div className="sm-counts__row" key={i}>
          <span className="sm-counts__label mono">{row.label}</span>
          <div className="canvas-scroll">
            <div className="sm-counts__cells">
              {row.values.map((value, c) => (
                <span key={c} className={`sm-count mono ${row.at === c && i === 0 ? "is-cur" : ""}`}>
                  <b>{value}</b>
                  <i>{c}</i>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
