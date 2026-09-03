import Bar from "./Bar.jsx";
import { checkStability } from "../algorithms/stability.js";
import { PIVOT, STATES } from "../utils/stateStyle.js";
import { useBarEditing } from "../hooks/useBarEditing.js";
import { useIsTouch } from "../hooks/useMediaQuery.js";

const SORTED_SEARCH_ALGOS = ["binary", "interpolation", "exponential", "jump"];

// The sorts that actually hold a pivot. Listing the pivot glyph for the rest
// would be documenting a marker that never appears.
const PIVOT_ALGOS = ["quick", "quick3", "intro"];

/**
 * The key to the glyphs. Only the states this algorithm can actually reach
 * are listed — a legend that names things the picture never shows is worse
 * than none, because it makes the reader hunt for them.
 */
function Legend({ algo, category }) {
  const entries =
    category === "searching"
      ? [
          ["probe", STATES.probe],
          ["found", STATES.found],
        ]
      : [
          ["compare", STATES.compare],
          ["swap", STATES.swap],
          ["sorted", STATES.sorted],
          ...(PIVOT_ALGOS.includes(algo) ? [["pivot", PIVOT]] : []),
        ];

  return (
    <div className="canvas__legend">
      {entries.map(([state, { glyph, label }]) => (
        <span className="canvas__legend-item" key={state} style={{ color: `rgb(var(--state-${state}-rgb))` }}>
          <span className="canvas__legend-glyph">{glyph}</span>
          <span className="canvas__legend-swatch" aria-hidden="true" />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * The ruler under the bars, naming the regions a frame has divided the array
 * into: the three bands of a Dutch-flag partition, the runs on Timsort's
 * stack, which sort introsort has handed a range to, the direction a bitonic
 * sub-network is sorting in. Bar colour is already carrying comparisons and
 * swaps, so regions get their own row rather than a sixth shade.
 */
function BandRuler({ bands, n }) {
  // Gaps between bands are filled so the ruler always spans the full width and
  // every segment lines up with the bar above it.
  const segments = [];
  let cursor = 0;
  for (const band of [...bands].sort((a, b) => a.from - b.from)) {
    if (band.from < cursor || band.to >= n) continue;
    if (band.from > cursor) segments.push({ from: cursor, to: band.from - 1, gap: true });
    segments.push(band);
    cursor = band.to + 1;
  }
  if (cursor < n) segments.push({ from: cursor, to: n - 1, gap: true });

  return (
    <div className="bands">
      {segments.map((seg) => (
        <div
          key={seg.from}
          className={`band ${seg.gap ? "band--gap" : `band--${seg.tone}`}`}
          style={{ flexGrow: seg.to - seg.from + 1 }}
          title={seg.gap ? undefined : `${seg.label} — indices ${seg.from} to ${seg.to}`}
        >
          {!seg.gap && <span className="band__label">{seg.label}</span>}
        </div>
      ))}
    </div>
  );
}

/**
 * The working array a non-comparison sort keeps beside the input — counting
 * sort's tallies, bucket sort's bucket sizes. Without it the interesting half
 * of those algorithms happens off screen.
 */
function AuxRow({ aux }) {
  return (
    <div className="aux">
      <div className="aux__label">{aux.label}</div>
      <div className="aux__cells">
        {aux.cells.map((cell, i) => (
          <div key={i} className={`aux__cell ${i === aux.active ? "aux__cell--active" : ""}`}>
            <span className="aux__cell-key">{cell.label}</span>
            <span className="aux__cell-value">{cell.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Canvas({ step, algo, displayArr, maxVal, showTags, meta, baseArray, onEdit, onEditBegin }) {
  const isSortedSearch = SORTED_SEARCH_ALGOS.includes(algo);
  // The hint names gestures, not layouts, so it follows the input device
  // rather than the breakpoint — a touchscreen laptop gets the finger's rules.
  const isTouch = useIsTouch();

  const editable = Boolean(onEdit);
  const edit = useBarEditing({
    enabled: editable,
    values: baseArray ?? displayArr,
    // The domain the input shapes themselves draw from, so a hand-set bar can
    // reach the same heights a generated one can.
    ceiling: Math.max(99, (baseArray ?? displayArr).length),
    // Reordering a run that sorts its input first would be undone before the
    // first frame; the value is still the reader's to set.
    allowReorder: !isSortedSearch,
    onBegin: onEditBegin,
    onCommit: onEdit,
  });

  // Mid-gesture the draft is the truth: it tracks the pointer, and the run it
  // will produce hasn't been computed yet.
  const bars = edit.draft ?? displayArr;
  const n = bars.length;
  const scale = edit.draft ? edit.scale : maxVal;
  // A draft is a picture of the array, not of the algorithm's progress, so the
  // frame's highlights are dropped while one is being dragged.
  const frame = edit.draft ? { array: bars } : step;

  // Reordered ties only mean something once everything has landed; before
  // that, equal neighbours are just two bars that happen to match.
  const finished = n > 0 && step.sorted?.length === n;
  const stability = showTags && finished && !edit.draft ? checkStability(step) : null;

  return (
    <div className="panel canvas">
      {isSortedSearch && (
        <div className="canvas__note">ARRAY SORTED FOR SEARCH</div>
      )}
      {showTags && (
        <div className="canvas__note">COLOUR = THE INDEX EACH ELEMENT STARTED AT</div>
      )}
      <div
        ref={edit.ref}
        className={`bars ${editable ? "bars--editable" : ""} ${edit.draft ? "bars--editing" : ""}`}
        {...edit.handlers}
      >
        {bars.map((val, i) => (
          <Bar
            key={i}
            val={val}
            index={i}
            step={frame}
            algo={algo}
            maxVal={scale}
            showLabel={n <= 22}
            showPointer={isSortedSearch && n <= 30 && !edit.draft}
            showTags={showTags && !edit.draft}
            breakHere={stability?.breaks.includes(i)}
            editable={editable}
            dragging={edit.active === i}
            editMode={edit.active === i ? edit.mode : null}
            ceiling={edit.scale}
          />
        ))}
      </div>
      {!edit.draft && step.bands?.length > 0 && <BandRuler bands={step.bands} n={n} />}
      {!edit.draft && step.aux && <AuxRow aux={step.aux} />}
      <Legend algo={algo} category={meta?.category} />
      {editable && (
        <div className="canvas__hint">
          {isTouch ? (
            <>
              Tap a bar to set its value · hold it, then drag up and down to scrub
              {isSortedSearch ? "" : " · or sideways to move it"}
            </>
          ) : (
            <>
              Click a bar to set its value · drag up and down to scrub
              {isSortedSearch ? "" : " · drag sideways to move it"}
            </>
          )}
        </div>
      )}
      {step.found === -2 && <div className="not-found">TARGET NOT FOUND</div>}
      {stability && (
        <div className={`canvas__verdict ${stability.stable ? "ok" : "bad"}`}>
          {!stability.ties
            ? `No two elements were equal, so this run couldn't show whether ${meta?.label ?? "the sort"} is stable. Try the FEW UNIQUE or ALL EQUAL input shape.`
            : stability.stable
              ? `${stability.ties} tied elements, every one left in its original order — stable on this input.`
              : `${stability.breaks.length} of ${stability.ties} tied elements came out reordered — not stable.`}
        </div>
      )}
    </div>
  );
}
