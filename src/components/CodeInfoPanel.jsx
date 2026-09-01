import SourcePanel from "./SourcePanel.jsx";

/**
 * A problem's description, its costs, and its code with the line the current
 * step is executing lit up. Shared by the dynamic programming and backtracking
 * views, which is why the code block's heading is a prop: one shows a
 * recurrence, the other a recursive procedure.
 *
 * The structure views get `ListInfoPanel`, which has no code block at all —
 * "insert into a BST" is a sentence. A DP problem *is* its recurrence and a
 * backtracking problem *is* its choose/check/undo loop, and in both the thing
 * worth watching beside the picture is which branch of the code each step
 * took, so these show the code the way the sorting view does.
 */
export default function CodeInfoPanel({ meta, step, codeLabel = "PSEUDOCODE" }) {
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

      <SourcePanel
        algoKey={meta.key}
        pseudocode={meta.pseudocode}
        activeLine={activeLine}
        codeLabel={codeLabel}
      />
    </div>
  );
}
