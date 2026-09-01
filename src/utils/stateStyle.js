/**
 * The vocabulary of algorithm states, and the two channels that carry them.
 *
 * Colour was the app's entire encoding: comparing was blue, swapping red,
 * sorted green. That fails three ways at once — for red-green colour
 * blindness, which is where most of the app's meaning collapsed into one
 * hue; in greyscale, which is what a printed step table or a photocopied
 * handout is; and for anyone whose particular deficiency no palette covers.
 *
 * So every state now carries a glyph as well, and either channel alone is
 * enough to read the picture. The glyphs are deliberately shape-distinct
 * rather than merely different characters — a bidirectional arrow, a crossed
 * pair, a tick, a diamond — because at ten pixels a glyph is a silhouette.
 *
 * The colours are never named here, only pointed at: `--state-compare-rgb`
 * and friends are re-pointed by the palette in `index.css`, so switching to
 * the colour-blind-safe set changes no component.
 */

/**
 * `tone` is the third channel: pitch carries the element's *value*, which
 * neither colour nor glyph says at all, and the waveform carries the state —
 * a comparison and a swap at the same pitch are still told apart by timbre.
 * States with no tone are ones that would fire on nearly every frame; sound
 * is only information while it is still occasional.
 */
export const STATES = {
  idle: { glyph: "", label: "untouched", fill: "var(--fill-soft)" },
  compare: { glyph: "↔", label: "comparing", fill: "var(--fill-mid)", tone: { wave: "sine", gain: 0.8 } },
  swap: { glyph: "⇄", label: "swapping", fill: "var(--fill-strong)", tone: { wave: "triangle", gain: 1 } },
  sorted: { glyph: "✓", label: "in place", fill: "var(--fill-soft)" },
  probe: { glyph: "◎", label: "probing", fill: "var(--fill-strong)", tone: { wave: "square", gain: 0.5 } },
  found: { glyph: "★", label: "found", fill: "var(--fill-strong)", tone: { wave: "sine", gain: 1 } },
  // Outside the range a search has narrowed to. It is the absence of a state
  // rather than one of its own, so it gets no glyph — marking every excluded
  // bar would drown the two that matter.
  muted: { glyph: "", label: "out of range", fill: "0.05" },
};

/** Pivots ride alongside a state rather than replacing it. */
export const PIVOT = { glyph: "◆", label: "pivot" };

/**
 * The fill, border and glow for a state, entirely in tokens — so a theme or
 * palette change re-derives them and no component holds a colour of its own.
 */
export function stateColors(state) {
  const rgb = `var(--state-${state}-rgb)`;
  return {
    background: `rgb(${rgb} / ${STATES[state].fill})`,
    border: `rgb(${rgb})`,
    glow: `rgb(${rgb} / var(--glow-alpha))`,
  };
}

/**
 * Which of the states a frame has put this index in. The order is the one the
 * picture has always used: what the algorithm is doing *right now* outranks
 * what it decided earlier, so a sorted element being compared reads as a
 * comparison.
 */
export function stateOfBar({ found, swapping, mid, comparing, outOfRange, sorted }) {
  if (found) return "found";
  if (swapping) return "swap";
  if (mid) return "probe";
  if (comparing) return "compare";
  if (outOfRange) return "muted";
  if (sorted) return "sorted";
  return "idle";
}
