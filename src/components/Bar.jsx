import { tagHue } from "../algorithms/stability.js";

const SORTED_SEARCH_ALGOS = ["binary", "interpolation", "exponential", "jump"];

export default function Bar({ val, index, step, algo, maxVal, showLabel, showPointer, showTags, breakHere }) {
  const isSorted = step.sorted && step.sorted.includes(index);
  const isComparing = step.compare && step.compare.includes(index);
  const isSwapping = step.swap && step.swap.includes(index);
  const isPivot = step.pivot === index;
  const isChecking = step.checking === index;
  const isRangeAlgo = SORTED_SEARCH_ALGOS.includes(algo);
  const isFoundLinear = algo === "linear" && step.found === index;
  const isMid = step.mid === index;
  const isFoundRange = isRangeAlgo && step.found === index;
  const inRange = isRangeAlgo && step.lo !== undefined && index >= step.lo && index <= step.hi;

  let bg = "rgba(255,138,61,0.14)";
  let border = "var(--primary)";
  let glow = "rgba(255,138,61,0.35)";

  if (isSorted) {
    bg = "rgba(95,214,160,0.18)";
    border = "var(--green)";
    glow = "rgba(95,214,160,0.3)";
  }
  if (isRangeAlgo && step.lo !== undefined && !inRange) {
    bg = "rgba(255,255,255,0.03)";
    border = "var(--border)";
    glow = "transparent";
  }
  if (isPivot) {
    border = "var(--purple)";
    glow = "rgba(177,140,255,0.35)";
  }
  if (isComparing || isChecking) {
    bg = "rgba(79,184,224,0.3)";
    border = "var(--blue)";
    glow = "rgba(79,184,224,0.4)";
  }
  if (isMid) {
    bg = "rgba(255,138,61,0.42)";
    border = "var(--primary)";
    glow = "rgba(255,138,61,0.5)";
  }
  if (isSwapping) {
    bg = "rgba(255,107,107,0.4)";
    border = "var(--red)";
    glow = "rgba(255,107,107,0.5)";
  }
  if (isFoundLinear || isFoundRange) {
    bg = "rgba(95,214,160,0.5)";
    border = "var(--green)";
    glow = "rgba(95,214,160,0.55)";
  }

  // Stability view: the fill says where the element *started*, so two equal
  // values — identical as bars — are still told apart, and a sort that moved
  // one past the other is visible. The border keeps saying what the algorithm
  // is doing to the bar right now.
  const tag = step.tags?.[index];
  if (showTags && Number.isFinite(tag)) {
    bg = `hsl(${tagHue(tag, step.tags.length)} 72% 58% / 0.6)`;
    if (!isComparing && !isSwapping) glow = "transparent";
  }

  const pointerLabel = index === step.mid ? "mid" : index === step.lo ? "lo" : index === step.hi ? "hi" : null;

  // Divide-and-conquer frames name the subrange the current call owns.
  // Everything outside it fades back rather than changing colour, so a bar
  // that is already sorted or holding a pivot keeps saying so.
  const outsideRange = step.range && (index < step.range[0] || index > step.range[1]);

  return (
    <div
      className={`bar ${isSwapping ? "swap" : ""} ${outsideRange ? "bar--outside" : ""} ${
        breakHere ? "bar--unstable" : ""
      }`}
      style={{
        height: `${(val / maxVal) * 100}%`,
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: glow !== "transparent" ? `0 0 10px ${glow}` : "none",
      }}
      title={showTags && Number.isFinite(tag) ? `${val} (started at index ${tag})` : String(val)}
    >
      {showLabel && <span className="bar__value">{val}</span>}
      {showPointer && pointerLabel && (
        <span className="bar__pointer" style={{ color: pointerLabel === "mid" ? "var(--primary)" : "var(--blue)" }}>
          {pointerLabel}
        </span>
      )}
    </div>
  );
}