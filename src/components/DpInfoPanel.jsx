/**
 * The DP problem's description, its costs, and the recurrence with the line
 * the current step is executing lit up.
 *
 * The structure views get `ListInfoPanel`, which has no pseudocode block —
 * "insert into a BST" is a sentence. A DP problem *is* its recurrence, and the
 * one thing worth watching alongside the table is which branch of it each cell
 * took, so this one shows the code the way the sorting view does.
 */
export default function DpInfoPanel({ meta, step }) {
  const activeLine = step?.line ?? null;

  return (
    <div className="panel info">
      <div className="info__summary">
        <div className="info__title">{meta.label}</div>
        <p className="info__desc">{meta.desc}</p>
        <div className="info__complexity">
          <div>
            <span>TIME </span>
            {meta.time}
          </div>
          <div>
            <span>SPACE </span>
            {meta.space}
          </div>
        </div>
      </div>

      <div className="info__code">
        <div className="label">RECURRENCE</div>
        {meta.pseudocode.map((line, i) => (
          <div
            key={i}
            className={`info__code-line ${i === activeLine ? "is-active" : ""}`}
            aria-current={i === activeLine ? "step" : undefined}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
