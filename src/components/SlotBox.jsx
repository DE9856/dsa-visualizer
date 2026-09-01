// A single element box shared by the Stack and Queue canvases. Reuses the
// same active/pending/removing/found color language as ListNode so the
// whole app feels consistent.
export default function SlotBox({ node, step, tag, tagClass = "" }) {
  const isPending = step.pending === node.id;
  const isRemoving = step.removing === node.id;
  const isActive = step.active && step.active.includes(node.id);
  const isFound = step.found === node.id;

  let border = "var(--border-strong)";
  let bg = "var(--panel-alt)";
  let glow = "transparent";

  if (isActive) {
    border = "var(--blue)";
    bg = "rgb(var(--blue-rgb) / 0.16)";
    glow = "rgb(var(--blue-rgb) / 0.4)";
  }
  if (isPending) {
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

  return (
    <div className="sq-slot-wrap">
      {tag && <div className={`sq-tag ${tagClass}`}>{tag}</div>}
      <div
        className={`sq-slot ${isRemoving ? "sq-slot--removing" : ""} ${isPending ? "sq-slot--pending" : ""}`}
        style={{ borderColor: border, background: bg, boxShadow: glow !== "transparent" ? `0 0 12px ${glow}` : "none" }}
      >
        <span className="sq-slot__value">{node.value}</span>
      </div>
    </div>
  );
}
