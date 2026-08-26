/**
 * The DP table, one component for all six problems.
 *
 * Every frame carries the whole table plus what that step was doing to it, so
 * this draws a frame and nothing else — no accumulation, no diffing against
 * the last one. That is what makes scrubbing to the middle of a backtrack show
 * exactly the state that step had.
 *
 * Four things are marked, and they have to stay visually distinct because the
 * whole idea is that they mean different things:
 *
 *   current   the cell being written this step
 *   read      a cell this step looked at and rejected
 *   chosen    the cell this step's answer actually came from
 *   path      a cell on the recovered solution, during the backtrack
 *
 * The distinction between *read* and *chosen* is the one that carries the
 * recurrence: a knapsack cell looks at two neighbours and takes one, and which
 * one it took is the difference between putting the item in the bag or not.
 */
export default function DpCanvas({ step }) {
  const rows = step.rows || [];
  const cols = step.cols || [];
  const table = step.table || [];

  // Flat lookups, because a 9 × 25 table would otherwise scan the deps array
  // 225 times per render.
  const deps = new Map((step.deps || []).map((d) => [`${d.r}:${d.c}`, d.kind]));
  const path = new Set((step.path || []).map((p) => `${p.r}:${p.c}`));
  const cur = step.cur ? `${step.cur.r}:${step.cur.c}` : null;

  if (!rows.length) {
    return (
      <div className="panel canvas dp-canvas">
        <div className="ll-empty mono">NO TABLE</div>
      </div>
    );
  }

  return (
    <div className="panel canvas dp-canvas">
      <div className="canvas__note">
        {step.rowAxis} &#8595;&nbsp;&nbsp;·&nbsp;&nbsp;{step.colAxis} &#8594;
      </div>

      <div className="dp-table-wrap canvas-scroll">
        <table className="dp-table mono">
          <thead>
            <tr>
              <th className="dp-corner" aria-hidden="true" />
              {cols.map((col, c) => (
                <th key={c} className="dp-head">
                  {col.label}
                  {col.sub !== undefined && <span className="dp-sub">{col.sub}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <th className="dp-head dp-head--row">
                  {row.label}
                  {row.sub !== undefined && <span className="dp-sub">{row.sub}</span>}
                </th>
                {cols.map((_, c) => {
                  const key = `${r}:${c}`;
                  const value = table[r]?.[c];
                  const dep = deps.get(key);
                  const classes = [
                    "dp-cell",
                    value?.void ? "is-void" : value ? "is-filled" : "is-empty",
                    cur === key ? "is-cur" : "",
                    dep === "chosen" ? "is-chosen" : dep === "read" ? "is-read" : "",
                    path.has(key) ? "is-path" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <td key={c} className={classes}>
                      {value && !value.void && (
                        <>
                          <span className="dp-cell__value">{value.value}</span>
                          {value.mark && <span className="dp-cell__mark">{value.mark}</span>}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {step.aux && (
        <div className="dp-aux">
          <span className="label label--tight">{step.aux.label}</span>
          {step.aux.items.length === 0 ? (
            <span className="dp-aux__empty mono">nothing yet</span>
          ) : (
            <div className="dp-aux__items">
              {step.aux.items.map((item, i) => (
                <span key={i} className={`dp-chip mono dp-chip--${item.tone}`}>
                  {item.text}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
