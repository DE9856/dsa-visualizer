import Bar from "./Bar.jsx";
import { checkStability } from "../algorithms/stability.js";

const SORTED_SEARCH_ALGOS = ["binary", "interpolation", "exponential", "jump"];

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

export default function Canvas({ step, algo, displayArr, maxVal, showTags, meta }) {
  const n = displayArr.length;
  const isSortedSearch = SORTED_SEARCH_ALGOS.includes(algo);

  // Reordered ties only mean something once everything has landed; before
  // that, equal neighbours are just two bars that happen to match.
  const finished = n > 0 && step.sorted?.length === n;
  const stability = showTags && finished ? checkStability(step) : null;

  return (
    <div className="panel canvas">
      {isSortedSearch && (
        <div className="canvas__note">ARRAY SORTED FOR SEARCH</div>
      )}
      {showTags && (
        <div className="canvas__note">COLOUR = THE INDEX EACH ELEMENT STARTED AT</div>
      )}
      <div className="bars">
        {displayArr.map((val, i) => (
          <Bar
            key={i}
            val={val}
            index={i}
            step={step}
            algo={algo}
            maxVal={maxVal}
            showLabel={n <= 22}
            showPointer={isSortedSearch && n <= 30}
            showTags={showTags}
            breakHere={stability?.breaks.includes(i)}
          />
        ))}
      </div>
      {step.bands?.length > 0 && <BandRuler bands={step.bands} n={n} />}
      {step.aux && <AuxRow aux={step.aux} />}
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
