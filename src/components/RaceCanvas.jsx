import RaceLane from "./RaceLane.jsx";

/**
 * The race track: two to four lanes over the same input, under one transport.
 *
 * Every lane is scaled against the same maximum value, so a bar of a given
 * height means the same thing in every lane — scaling each to its own max
 * would make identical arrays look different.
 */
export default function RaceCanvas({ lanes, array, showTags, leader, syncMode, distributionMeta }) {
  const maxVal = Math.max(...array, 1);
  const compact = array.length > 28;

  return (
    <div className="panel race">
      <div className="race__note">
        <span className="mono">{distributionMeta?.label?.toUpperCase()}</span>
        <span className="race__note-sep">·</span>
        <span>n = {array.length}</span>
        <span className="race__note-sep">·</span>
        <span>{syncMode === "op" ? "synced by work done" : "synced by frame index"}</span>
        {showTags && (
          <>
            <span className="race__note-sep">·</span>
            <span>colour = original position</span>
          </>
        )}
      </div>

      <div className={`race__grid race__grid--${lanes.length}`}>
        {lanes.map((lane) => (
          <RaceLane
            key={lane.key}
            lane={lane}
            maxVal={maxVal}
            showTags={showTags}
            isLeader={leader === lane.key}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
