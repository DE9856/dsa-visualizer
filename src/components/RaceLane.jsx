import { Trophy, Check } from "lucide-react";
import Bar from "./Bar.jsx";
import { variantSummary } from "../algorithms";

/**
 * One competitor in the race: the same bars the single-algorithm canvas
 * draws, shrunk, with the run's own read-out underneath.
 *
 * A lane that has reached its last frame stays on it. Freezing rather than
 * blanking is deliberate — the finished array sitting there next to one still
 * being churned is the comparison.
 */
export default function RaceLane({ lane, maxVal, showTags, isLeader, compact }) {
  const step = lane.step;
  const values = step.array || [];
  const variant = variantSummary(lane.key, lane.options);
  // Only mark reordered ties once the run has actually finished — mid-run the
  // array isn't sorted yet, so equal neighbours mean nothing.
  const breaks = lane.finished ? lane.stability.breaks : [];

  return (
    <div className={`lane ${isLeader ? "lane--leader" : ""} ${lane.finished ? "lane--done" : ""}`}>
      <div className="lane__head">
        <span className="lane__name">{lane.meta.label}</span>
        {variant && <span className="lane__variant mono">{variant}</span>}
        <span className="lane__spacer" />
        {isLeader && (
          <span className="lane__badge lane__badge--leader" title="Fewest total operations">
            <Trophy size={11} /> FEWEST OPS
          </span>
        )}
        {lane.finished && (
          <span className="lane__badge">
            <Check size={11} /> DONE
          </span>
        )}
      </div>

      <div className={`lane__bars ${compact ? "lane__bars--compact" : ""}`}>
        {values.map((val, i) => (
          <Bar
            key={i}
            val={val}
            index={i}
            step={step}
            algo={lane.key}
            maxVal={maxVal}
            showLabel={false}
            showTags={showTags}
            breakHere={breaks.includes(i)}
          />
        ))}
      </div>

      <div className="lane__foot">
        <span className="lcd">
          CMP <strong style={{ color: "var(--blue)" }}>{step.stats?.comparisons ?? 0}</strong>
        </span>
        <span className="lcd">
          WR <strong style={{ color: "var(--red)" }}>{step.stats?.writes ?? 0}</strong>
        </span>
        <span className="lcd lane__total">
          {lane.spent}/{lane.totalOps} OPS
        </span>
      </div>
    </div>
  );
}
