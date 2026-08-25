import { STAT_COLUMNS } from "../algorithms/metrics.js";
import StatBoard from "./StatBoard.jsx";

/**
 * The sorting race's tally. Every number here is counted by the algorithm
 * itself as it runs, not inferred from what a frame happened to highlight.
 */
export default function Scoreboard({ lanes, leader }) {
  const columns = [
    ...STAT_COLUMNS,
    { key: "ops", label: "OPS", title: "Comparisons + writes", color: "var(--primary)" },
  ];

  const rows = lanes.map((lane) => {
    const live = lane.step.stats || {};
    const cells = Object.fromEntries(
      STAT_COLUMNS.map((column) => [
        column.key,
        { value: live[column.key] ?? 0, total: lane.stats[column.key] ?? 0 },
      ])
    );
    cells.ops = { value: lane.spent, total: lane.totalOps };
    return {
      key: lane.key,
      label: lane.meta.label,
      leader: leader === lane.key,
      cells,
      note: <StabilityCell lane={lane} />,
    };
  });

  return (
    <StatBoard
      title="SCOREBOARD"
      nameHeader="ALGORITHM"
      hint="counted by the algorithms as they run — comparisons, array reads and writes, auxiliary memory high-water mark, deepest recursion"
      columns={columns}
      rows={rows}
      noteHeader="TIES"
    />
  );
}

/**
 * Stability can only be *observed* where the input actually had ties, so an
 * input with none says so rather than claiming a pass the run never earned.
 * The theoretical answer is on the algorithm either way.
 */
function StabilityCell({ lane }) {
  const claimed = lane.meta.stable;
  if (!lane.finished) {
    return (
      <span className="scoreboard__stable scoreboard__stable--pending" title="Finishes the run to check">
        {claimed ? "stable" : "unstable"}
      </span>
    );
  }
  if (!lane.stability.ties) {
    return (
      <span className="scoreboard__stable" title="No two elements were equal, so nothing could be reordered">
        no ties
      </span>
    );
  }
  return lane.stability.stable ? (
    <span
      className="scoreboard__stable scoreboard__stable--ok"
      title={`${lane.stability.ties} tied elements, every one left in its original order`}
    >
      order kept
    </span>
  ) : (
    <span
      className="scoreboard__stable scoreboard__stable--bad"
      title={`${lane.stability.breaks.length} of ${lane.stability.ties} tied elements came out reordered`}
    >
      {lane.stability.breaks.length} reordered
    </span>
  );
}
