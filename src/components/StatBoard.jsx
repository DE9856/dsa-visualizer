/**
 * The live tally every comparison view puts under its canvases.
 *
 * Each cell fills against the largest value in its column, so a bar reaching
 * the right-hand edge means "this row ends up doing the most of this" and you
 * can watch one row overtake another while it happens. Where a row has a
 * final total as well as a current value, the total is shown faint beside it —
 * the run's destination, next to where it has got to.
 *
 * `note` is a free column at the right for whatever a particular comparison
 * needs to say in words: stability for the sorts, the guaranteed height bound
 * for the trees, whether two MSTs came out identical.
 */
export default function StatBoard({
  title,
  hint,
  nameHeader = "NAME",
  columns,
  rows,
  noteHeader = "",
  className = "",
}) {
  const maxima = {};
  for (const column of columns) {
    maxima[column.key] = Math.max(
      1,
      ...rows.map((row) => row.cells[column.key]?.max ?? row.cells[column.key]?.total ?? row.cells[column.key]?.value ?? 0)
    );
  }

  return (
    <div className={`panel scoreboard ${className}`}>
      <div className="scoreboard__head">
        <span className="label">{title}</span>
        {hint && <span className="scoreboard__hint">{hint}</span>}
      </div>

      <div
        className="scoreboard__table"
        role="table"
        style={{
          gridTemplateColumns: `minmax(120px, 1.6fr) repeat(${columns.length}, minmax(56px, 1fr)) minmax(90px, 1.3fr)`,
        }}
      >
        <div className="scoreboard__row scoreboard__row--head" role="row">
          <span className="scoreboard__cell scoreboard__cell--name" role="columnheader">
            {nameHeader}
          </span>
          {columns.map((column) => (
            <span key={column.key} className="scoreboard__cell" role="columnheader" title={column.title}>
              {column.label}
            </span>
          ))}
          <span className="scoreboard__cell scoreboard__cell--stable" role="columnheader">
            {noteHeader}
          </span>
        </div>

        {rows.map((row) => (
          <div
            className={`scoreboard__row ${row.leader ? "scoreboard__row--leader" : ""}`}
            key={row.key}
            role="row"
          >
            <span className="scoreboard__cell scoreboard__cell--name" role="cell">
              {row.label}
            </span>
            {columns.map((column) => {
              const cell = row.cells[column.key] || {};
              const value = cell.value ?? 0;
              const total = cell.total ?? value;
              return (
                <span className="scoreboard__cell" role="cell" key={column.key} data-label={column.label}>
                  <span
                    className="scoreboard__fill"
                    style={{
                      width: `${Math.min(100, (value / maxima[column.key]) * 100)}%`,
                      background: column.color,
                    }}
                    aria-hidden="true"
                  />
                  <span className="scoreboard__value lcd">
                    <strong>{cell.display ?? value}</strong>
                    {total !== value && <em>/{total}</em>}
                  </span>
                </span>
              );
            })}
            <span className="scoreboard__cell scoreboard__cell--stable" role="cell">
              {row.note}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
