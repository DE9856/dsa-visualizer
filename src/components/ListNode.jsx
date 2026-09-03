const ARROW_RIGHT = "→";
const ARROW_LEFT = "←";

/**
 * One node, drawn the way the textbooks draw it: a rectangle divided into the
 * fields the struct actually has. A singly linked node is `data | next`; a
 * doubly linked one is `prev | data | next`, with the payload in the middle so
 * each pointer sits on the side it points to. A circular list is a singly
 * linked one whose last `next` happens to hold the head.
 *
 * A pointer field holds a dot when it points at something and is struck
 * through when it is null — so a list's shape is readable from the boxes
 * alone, before following a single arrow.
 */
function PointerCell({ nulled, label }) {
  return (
    <span
      className={`ll-node__cell ll-node__cell--ptr ${nulled ? "ll-node__cell--null" : ""}`}
      title={nulled ? `${label}: null` : label}
    >
      {!nulled && <span className="ll-node__dot" />}
    </span>
  );
}

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
    bg = "rgb(var(--green-rgb) / 0.10)";
  }
  if (isActive) {
    border = "var(--blue)";
    bg = "rgb(var(--blue-rgb) / 0.16)";
    glow = "rgb(var(--blue-rgb) / 0.4)";
  }
  if (isSwap) {
    border = "var(--purple)";
    bg = "rgb(var(--purple-rgb) / 0.18)";
    glow = "rgb(var(--purple-rgb) / 0.5)";
  }
  if (isPending) {
    border = "var(--primary)";
    bg = "rgb(var(--primary-rgb) / 0.18)";
    glow = "rgb(var(--primary-rgb) / 0.5)";
  }
  if (isUpdating) {
    border = "var(--primary)";
    bg = "rgb(var(--primary-rgb) / 0.18)";
    glow = "rgb(var(--primary-rgb) / 0.5)";
  }
  if (isRemoving) {
    border = "var(--red)";
    bg = "rgb(var(--red-rgb) / 0.22)";
    glow = "rgb(var(--red-rgb) / 0.5)";
  }
  if (isFound) {
    border = "var(--green)";
    bg = "rgb(var(--green-rgb) / 0.22)";
    glow = "rgb(var(--green-rgb) / 0.5)";
  }

  const next = allNodes[index + 1];
  const target = pointerMap[node.id];
  const pointsToNull = target === null || target === undefined;
  const pointsToHead = circular && isTail && target !== null && target !== undefined && target === headId;

  // The link this node draws is the one *arriving* at it, not the one leaving.
  // The two say the same thing about the same pair of nodes, but the arrow then
  // sits at the front of the flex item rather than the back — so a row that
  // wraps breaks after a node instead of after that node's arrow, and no line
  // ever ends with an arrow pointing at nothing. It reappears at the head of
  // the next line, where it reads as the chain continuing.
  const prev = allNodes[index - 1];
  let arrowState = "none";
  if (prev) {
    if (pointerMap[prev.id] === node.id) arrowState = "forward";
    else if (target === prev.id) arrowState = "backward";
  }

  let backArrowState = "none";
  if (doubly && prev && prevMap) {
    if (prevMap[node.id] === prev.id) backArrowState = "back";
  }

  // Read off the same map the back arrows are drawn from, so a node's own box
  // and the link leaving it can never disagree.
  const prevTarget = prevMap ? prevMap[node.id] : null;
  const prevIsNull = prevTarget === null || prevTarget === undefined;

  return (
    <div className="ll-node-wrap">
      {prev && (
        <div className={`ll-arrow ${doubly ? "ll-arrow--col" : ""}`}>
          {arrowState === "forward" && <span>{ARROW_RIGHT}</span>}
          {arrowState === "backward" && <span className="ll-arrow--back">{ARROW_LEFT}</span>}
          {arrowState === "none" && <span className="ll-arrow--empty">&middot;&middot;&middot;</span>}
          {doubly && (
            <span className="ll-arrow--back ll-arrow--sub">{backArrowState === "back" ? ARROW_LEFT : "·"}</span>
          )}
        </div>
      )}
      {/* The tags belong to the node, not to the node-and-its-arrow: hanging
          them off this box is what keeps them centred over the box they name. */}
      <div className="ll-node-box">
        {isHead && <div className="ll-head-tag">HEAD</div>}
        {pointerTags.map((p) => (
          <div key={p.label} className={`ll-pointer-tag ll-pointer-${p.label}`}>
            {p.label}
          </div>
        ))}
        <div
          data-ll-node={node.id}
          className={`ll-node ${doubly ? "ll-node--doubly" : ""} ${isRemoving ? "ll-node--removing" : ""} ${
            isPending || isUpdating ? "ll-node--pending" : ""
          }`}
          // The border colour is handed to the cells as a variable as well as
          // applied to the outside, so the dividers and the pointer dots pick
          // up the node's state instead of staying a fixed grey inside a lit-up
          // box.
          style={{
            borderColor: border,
            background: bg,
            "--ll-node-border": border,
            boxShadow: glow !== "transparent" ? `0 0 12px ${glow}` : "none",
          }}
        >
          {doubly && <PointerCell nulled={prevIsNull} label="prev" />}
          <span className="ll-node__cell ll-node__cell--data" title={`data: ${node.value}`}>
            <span className="ll-node__value">{node.value}</span>
          </span>
          <PointerCell nulled={pointsToNull} label="next" />
        </div>
      </div>
      {/* A tail that wraps draws no trailing anything: the link back to the head
          is a real curve, drawn across the row by ListCanvas, because a badge
          reading "HEAD" is a label for the pointer rather than the pointer. */}
      {!next && !pointsToHead && (
        <div className="ll-arrow">
          {pointsToNull ? (
            // The strike through the node's own next field already says the
            // pointer goes nowhere; an arrow as well would draw a link that
            // isn't there. The word stays, because null is worth naming.
            <span className="ll-null">NULL</span>
          ) : (
            <span className="ll-arrow--empty">&middot;&middot;&middot;</span>
          )}
        </div>
      )}
    </div>
  );
}
