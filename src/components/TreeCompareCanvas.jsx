import { Trophy } from "lucide-react";
import TreeCanvas from "./TreeCanvas.jsx";
import TwoThreeTreeCanvas from "./TwoThreeTreeCanvas.jsx";

/**
 * Three structures, the same keys, the same order.
 *
 * The lanes wrap the real canvases rather than redrawing the trees — a lane
 * has to be the same picture the tree view would give you, and duplicating
 * the layout maths is how that stops being true.
 */
export default function TreeCompareCanvas({ lanes, order, keys, tick, shortest }) {
  const inserted = keys.slice(0, tick);
  const next = keys[tick];

  return (
    <div className="panel treecmp">
      <div className="treecmp__note">
        <span className="mono">{order?.label?.toUpperCase()}</span>
        <span className="race__note-sep">·</span>
        <span>
          {tick} of {keys.length} keys inserted
        </span>
        {next !== undefined && (
          <>
            <span className="race__note-sep">·</span>
            <span>
              next: <strong>{next}</strong>
            </span>
          </>
        )}
      </div>

      <div className="treecmp__keys mono" aria-label="Insertion order">
        {keys.map((key, i) => (
          <span key={i} className={`treecmp__key ${i < tick ? "done" : ""} ${i === tick ? "next" : ""}`}>
            {key}
          </span>
        ))}
      </div>

      <div className="treecmp__grid">
        {lanes.map((lane) => (
          <div
            className={`treelane ${shortest.includes(lane.key) ? "treelane--best" : ""}`}
            key={lane.key}
          >
            <div className="treelane__head">
              <span className="lane__name">{lane.label}</span>
              <span className="lane__spacer" />
              {shortest.includes(lane.key) && (
                <span className="lane__badge lane__badge--leader" title="Shortest tree at this point">
                  <Trophy size={11} /> SHORTEST
                </span>
              )}
              <span className="lcd">
                h <strong style={{ color: lane.color }}>{lane.state.height}</strong>
              </span>
            </div>

            <div className="treelane__canvas">
              {lane.key === "twothree" ? (
                <TwoThreeTreeCanvas step={{ root: lane.state.root, active: lane.state.active }} />
              ) : (
                <TreeCanvas
                  step={{ root: lane.state.root, active: lane.state.active }}
                  treeType={lane.key}
                  threadMode="double"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {inserted.length === 0 && (
        <p className="treecmp__hint">
          All three start empty. Press play and watch what the insertion order does to the shape.
        </p>
      )}
    </div>
  );
}
