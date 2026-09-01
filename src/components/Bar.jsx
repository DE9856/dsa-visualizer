import { tagHue } from "../algorithms/stability.js";
import { PIVOT, STATES, stateColors, stateOfBar } from "../utils/stateStyle.js";

const SORTED_SEARCH_ALGOS = ["binary", "interpolation", "exponential", "jump"];

export default function Bar({
  val,
  index,
  step,
  algo,
  maxVal,
  showLabel,
  showPointer,
  showTags,
  breakHere,
  editable = false,
  dragging = false,
  editMode = null,
  ceiling,
}) {
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

  // One name for what this bar is doing, rather than a cascade of colour
  // assignments: the name then picks both the colour and the glyph, so the
  // two channels cannot drift apart.
  const state = stateOfBar({
    found: isFoundLinear || isFoundRange,
    swapping: isSwapping,
    mid: isMid,
    comparing: isComparing || isChecking,
    outOfRange: isRangeAlgo && step.lo !== undefined && !inRange,
    sorted: isSorted,
  });

  const colors = stateColors(state);
  let bg = colors.background;
  let border = colors.border;
  let glow = colors.glow;

  // A pivot keeps whatever fill its state gave it and is marked on the edge,
  // because it is a role the element holds rather than something being done
  // to it — and it has to stay legible while that element is also being
  // compared or swapped.
  const marksPivot = isPivot && state !== "swap" && state !== "found";
  if (marksPivot) {
    border = "rgb(var(--state-pivot-rgb))";
    glow = "rgb(var(--state-pivot-rgb) / var(--glow-alpha))";
  }

  // Stability view: the fill says where the element *started*, so two equal
  // values — identical as bars — are still told apart, and a sort that moved
  // one past the other is visible. The border keeps saying what the algorithm
  // is doing to the bar right now.
  const tag = step.tags?.[index];
  if (showTags && Number.isFinite(tag)) {
    bg = `hsl(${tagHue(tag, step.tags.length)} 72% 58% / 0.6)`;
    if (state !== "compare" && state !== "swap") glow = "transparent";
  }

  const glyph = marksPivot ? PIVOT.glyph : STATES[state].glyph;
  const stateLabel = marksPivot ? PIVOT.label : STATES[state].label;

  const pointerLabel = index === step.mid ? "mid" : index === step.lo ? "lo" : index === step.hi ? "hi" : null;

  // Divide-and-conquer frames name the subrange the current call owns.
  // Everything outside it fades back rather than changing colour, so a bar
  // that is already sorted or holding a pivot keeps saying so.
  const outsideRange = step.range && (index < step.range[0] || index > step.range[1]);

  const title = showTags && Number.isFinite(tag) ? `${val} (started at index ${tag})` : String(val);

  // A vertical slider is what this is once it can be edited: up and down
  // change the value, which is exactly what a screen reader will announce and
  // what the arrow keys already do.
  const editing = editable
    ? {
        "data-bar-index": index,
        tabIndex: 0,
        role: "slider",
        "aria-orientation": "vertical",
        "aria-label": `Element ${index + 1}`,
        "aria-valuenow": val,
        "aria-valuemin": 1,
        "aria-valuemax": ceiling ?? maxVal,
      }
    : {};

  return (
    <div
      className={`bar ${isSwapping ? "swap" : ""} ${outsideRange ? "bar--outside" : ""} ${
        breakHere ? "bar--unstable" : ""
      } ${glyph ? "bar--marked" : ""} ${editable ? "bar--editable" : ""} ${
        dragging ? `bar--dragging bar--drag-${editMode ?? "hold"}` : ""
      }`}
      style={{
        height: `${(val / maxVal) * 100}%`,
        background: bg,
        border: `var(--stroke-width) solid ${border}`,
        boxShadow: glow !== "transparent" ? `0 0 10px ${glow}` : "none",
      }}
      title={glyph ? `${title} — ${stateLabel}` : title}
      {...editing}
    >
      {/* While a value is being scrubbed the number matters more than
          anything else on the bar, and the ordinary label is hidden on wide
          arrays — so this one is always shown, and only to the bar in hand. */}
      {dragging && editMode === "value" && <span className="bar__scrub">{val}</span>}
      {/* The second channel. Hidden from screen readers because the bar's
          title already says the state in words, and a lone "↔" read aloud is
          noise. */}
      {glyph && (
        <span className="bar__state" style={{ color: border }} aria-hidden="true">
          {glyph}
        </span>
      )}
      {showLabel && <span className="bar__value">{val}</span>}
      {showPointer && pointerLabel && (
        <span
          className="bar__pointer"
          style={{ color: pointerLabel === "mid" ? "rgb(var(--state-probe-rgb))" : "rgb(var(--state-compare-rgb))" }}
        >
          {pointerLabel}
        </span>
      )}
    </div>
  );
}
