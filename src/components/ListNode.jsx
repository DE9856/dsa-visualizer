const ARROW_RIGHT = "\u2192";
const ARROW_LEFT = "\u2190";

export default function ListNode({ node, index, allNodes, step, pointerMap, prevMap, isHead, isTail, headId, circular, doubly }) {
  const isPending = step.pending === node.id;
  const isRemoving = step.removing === node.id;
  const isActive = step.active && step.active.includes(node.id);
  const isFound = step.found === node.id;
  const isUpdating = step.updating === node.id;
  const isSwap = step.swap && step.swap.includes(node.id);
  const isMerged = step.mergedIds && step.mergedIds.includes(node.id);
  const pointerTags = (step.pointers || []).filter((p) => p.id === node.id);

  let border = "var(--border-strong)";
  let bg = "var(--panel-alt)";
  let glow = "transparent";

  if (isMerged) {
    border = "var(--green)";
    bg = "rgba(95,214,160,0.10)";
  }
  if (isActive) {
    border = "var(--blue)";
    bg = "rgba(79,184,224,0.16)";
    glow = "rgba(79,184,224,0.4)";
  }
  if (isSwap) {
    border = "var(--purple)";
    bg = "rgba(177,140,255,0.18)";
    glow = "rgba(177,140,255,0.5)";
  }
  if (isPending) {
    border = "var(--primary)";
    bg = "rgba(255,138,61,0.18)";
    glow = "rgba(255,138,61,0.5)";
  }
  if (isUpdating) {
    border = "var(--primary)";
    bg = "rgba(255,138,61,0.18)";
    glow = "rgba(255,138,61,0.5)";
  }
  if (isRemoving) {
    border = "var(--red)";
    bg = "rgba(255,107,107,0.22)";
    glow = "rgba(255,107,107,0.5)";
  }
  if (isFound) {
    border = "var(--green)";
    bg = "rgba(95,214,160,0.22)";
    glow = "rgba(95,214,160,0.5)";
  }

  const next = allNodes[index + 1];
  const target = pointerMap[node.id];
  let arrowState = "none";
  if (next) {
    if (target === next.id) arrowState = "forward";
    else if (pointerMap[next.id] === node.id) arrowState = "backward";
  }
  const pointsToNull = target === null || target === undefined;
  const pointsToHead = circular && isTail && target !== null && target !== undefined && target === headId;

  let backArrowState = "none";
  if (doubly && next && prevMap) {
    if (prevMap[next.id] === node.id) backArrowState = "back";
  }

  return (
    <div className="ll-node-wrap">
      {isHead && <div className="ll-head-tag">HEAD</div>}
      {pointerTags.map((p) => (
        <div key={p.label} className={`ll-pointer-tag ll-pointer-${p.label}`}>
          {p.label}
        </div>
      ))}
      <div
        className={`ll-node ${isRemoving ? "ll-node--removing" : ""} ${isPending || isUpdating ? "ll-node--pending" : ""}`}
        style={{ borderColor: border, background: bg, boxShadow: glow !== "transparent" ? `0 0 12px ${glow}` : "none" }}
      >
        <span className="ll-node__value">{node.value}</span>
      </div>
      {next && (
        <div className={`ll-arrow ${doubly ? "ll-arrow--col" : ""}`}>
          {arrowState === "forward" && <span>{ARROW_RIGHT}</span>}
          {arrowState === "backward" && <span className="ll-arrow--back">{ARROW_LEFT}</span>}
          {arrowState === "none" && <span className="ll-arrow--empty">&middot;&middot;&middot;</span>}
          {doubly && (
            <span className="ll-arrow--back ll-arrow--sub">{backArrowState === "back" ? ARROW_LEFT : "\u00b7"}</span>
          )}
        </div>
      )}
      {!next && (
        <div className="ll-arrow">
          {pointsToHead ? (
            <span className="ll-wrap-tag">&#8635; HEAD</span>
          ) : pointsToNull ? (
            <>
              <span>{ARROW_RIGHT}</span>
              <span className="ll-null">NULL</span>
            </>
          ) : (
            <span className="ll-arrow--empty">&middot;&middot;&middot;</span>
          )}
        </div>
      )}
    </div>
  );
}