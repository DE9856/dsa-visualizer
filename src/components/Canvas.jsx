import Bar from "./Bar.jsx";
import { checkStability } from "../algorithms/stability.js";

const SORTED_SEARCH_ALGOS = ["binary", "interpolation", "exponential", "jump"];

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
      {step.found === -2 && <div className="not-found">TARGET NOT FOUND</div>}
      {stability && (
        <div className={`canvas__verdict ${stability.stable ? "ok" : "bad"}`}>
          {!stability.ties
            ? `No two elements were equal, so this run couldn't show whether ${meta?.label ?? "the sort"} is stable. Try the FEW UNIQUE or ALL EQUAL input shape.`
            : stability.stable
              ? `${stability.ties} tied elements, every one left in its original order \u2014 stable on this input.`
              : `${stability.breaks.length} of ${stability.ties} tied elements came out reordered \u2014 not stable.`}
        </div>
      )}
    </div>
  );
}
