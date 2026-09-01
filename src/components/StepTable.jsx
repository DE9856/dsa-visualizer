/**
 * The printable step table — every frame of the run as a row, with the line
 * of code it was executing and the state it left behind.
 *
 * It is only in the document while a print is actually happening. Rendering a
 * thousand rows permanently, hidden, would cost every view a layout it never
 * shows; and `@media print` alone cannot help, because the browser prints the
 * DOM it has rather than one it is told to build.
 *
 * The print rules live in `index.css` with everything else. They hide the app
 * and re-colour this table for paper — the dark theme would otherwise flood a
 * page with ink, and most printers drop background colours anyway, which
 * would have left light grey text on white.
 */
export default function StepTable({ table }) {
  const { title, subtitle, complexity, columns, rows, pseudocode } = table;

  return (
    <div className="step-table" role="document">
      <header className="step-table__head">
        <h1 className="step-table__title">{title}</h1>
        {subtitle && <p className="step-table__subtitle">{subtitle}</p>}
        <p className="step-table__meta">
          {rows.length} step{rows.length === 1 ? "" : "s"}
          {complexity ? ` · ${complexity}` : ""}
        </p>
      </header>

      {pseudocode?.length > 0 && (
        <section className="step-table__code">
          <h2 className="step-table__section">Pseudocode</h2>
          <ol className="step-table__lines">
            {pseudocode.map((line, i) => (
              <li key={i}>
                <code>{line || " "}</code>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="step-table__section">Steps</h2>
        <table className="step-table__grid">
          {/* A header group repeats itself at the top of every printed page,
              which is the only reason a hundred-page table stays readable. */}
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j} className={j === 0 ? "step-table__n" : undefined}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
