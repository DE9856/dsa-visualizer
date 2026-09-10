import { KIND_MAP, headOf, remainingOf, showKey } from "../dataStructures/selectionTree/helpers";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const LEVEL_GAP = 58;
const MARGIN_Y = 40;
const DESKTOP_WIDTH = 680;
const MOBILE_SLOT = 72;
const MOBILE_MIN_WIDTH = 300;
const R = 18;

/**
 * A selection tree over its runs.
 *
 * Every node is labelled with the *run* it names and the value that run is
 * currently offering, because that pair is the thing the structure trades in:
 * the array stores run indices, and the values move underneath them. The runs
 * themselves hang below the leaves, head first, draining left to right as the
 * merge proceeds.
 *
 * A loser tree's champion is drawn above the root, unattached, because that is
 * literally where it lives — position 0, outside the tree.
 */
function positionOf(pos, depth, width) {
  const slot = pos - 2 ** depth;
  return { x: (width * (slot + 0.5)) / 2 ** depth, y: MARGIN_Y + depth * LEVEL_GAP };
}

const depthOfPos = (pos) => 31 - Math.clz32(pos);

function stateOf(step, pos) {
  const has = (field) => Array.isArray(step[field]) && step[field].includes(pos);
  if (has("compare")) return "compare";
  if (has("active")) return "active";
  if (has("path")) return "path";
  return "idle";
}

export default function SelectionTreeCanvas({ step }) {
  const isMobile = useIsMobile();
  const k = step.k || 0;
  const runs = step.runs || [];
  const kind = KIND_MAP[step.kind] || KIND_MAP.winner;

  if (k === 0 || runs.length === 0) {
    return (
      <div className="panel canvas st-canvas">
        <div className="ll-empty mono">NO RUNS</div>
      </div>
    );
  }

  const levels = Math.log2(k);
  const width = isMobile ? Math.max(MOBILE_MIN_WIDTH, k * MOBILE_SLOT) : DESKTOP_WIDTH;
  const height = MARGIN_Y * 2 + levels * LEVEL_GAP;
  const hotRuns = new Set(step.leafHot || []);
  const winners = new Set(step.winners || []);
  const champion = step.champion;

  // Internal nodes 1..k-1, then the leaves at k..2k-1.
  const internal = Array.from({ length: k - 1 }, (_, i) => i + 1);
  const leaves = Array.from({ length: k }, (_, i) => k + i);

  const label = (pos) => {
    const run = pos >= k ? pos - k : step.tree[pos];
    if (run === undefined || run < 0) return { run: null, key: null };
    return { run, key: headOf(runs, run) };
  };

  return (
    <div className="panel canvas graph-canvas st-canvas">
      <div className="hp-head">
        <span className="hp-head__kind mono">{kind.short} TREE</span>
        <span className="hp-head__rule mono">
          each node keeps {kind.stores} · {levels} comparison{levels === 1 ? "" : "s"} per output
        </span>
      </div>

      {step.kind === "loser" && (
        <div className={`st-champion mono ${stateOf(step, 0) === "active" ? "is-active" : ""}`}>
          <span className="st-champion__tag">CHAMPION · POSITION 0</span>
          {champion === null || champion === undefined || champion < 0 ? (
            <span className="st-champion__value">not yet played</span>
          ) : (
            <span className="st-champion__value">
              run {champion} · {showKey(headOf(runs, champion))}
            </span>
          )}
        </div>
      )}

      <div className="canvas-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`graph-svg ${isMobile ? "graph-svg--fixed" : ""}`}
          width={isMobile ? width : undefined}
          height={isMobile ? height : undefined}
        >
          {[...internal, ...leaves].map((pos) => {
            if (pos === 1) return null;
            const from = positionOf(pos >> 1, depthOfPos(pos >> 1), width);
            const to = positionOf(pos, depthOfPos(pos), width);
            const onPath = Array.isArray(step.path) && step.path.includes(pos) && step.path.includes(pos >> 1);
            return (
              <line
                key={`e-${pos}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                style={{ stroke: onPath ? "var(--blue)" : "var(--border-strong)" }}
                strokeWidth={onPath ? 2.4 : 1.6}
              />
            );
          })}

          {internal.map((pos) => {
            const { run, key } = label(pos);
            const p = positionOf(pos, depthOfPos(pos), width);
            return (
              <g key={`n-${pos}`} className={`st-node is-${stateOf(step, pos)}`}>
                <circle cx={p.x} cy={p.y} r={R} />
                {/* The run index above the value it is currently offering: the
                    array stores the index, and the value moves underneath it. */}
                <text x={p.x} y={p.y - 3} textAnchor="middle" className="st-node__run mono">
                  {run === null ? "—" : `r${run}`}
                </text>
                <text x={p.x} y={p.y + 10} textAnchor="middle" className="st-node__key mono">
                  {run === null ? "" : showKey(key)}
                </text>
                <text x={p.x - R - 3} y={p.y - R + 2} className="st-node__pos mono">
                  {pos}
                </text>
              </g>
            );
          })}

          {leaves.map((pos) => {
            const run = pos - k;
            const p = positionOf(pos, depthOfPos(pos), width);
            const spent = headOf(runs, run) === Infinity;
            return (
              <g key={`l-${pos}`} className={`st-leaf ${hotRuns.has(run) ? "is-hot" : ""} ${spent ? "is-spent" : ""} ${winners.has(run) ? "is-winner" : ""}`}>
                <rect x={p.x - 22} y={p.y - 14} width={44} height={28} rx={6} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="st-leaf__label mono">
                  {showKey(headOf(runs, run))}
                </text>
                <text x={p.x} y={p.y + 26} textAnchor="middle" className="st-leaf__run mono">
                  run {run}
                  {runs[run]?.padded ? " · pad" : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="st-runs">
        {runs.map((run, i) => {
          if (run.padded) return null;
          const rest = remainingOf(runs, i);
          return (
            <div className={`st-run ${hotRuns.has(i) ? "is-hot" : ""}`} key={run.id}>
              <span className="st-run__label mono">run {i}</span>
              <div className="st-run__cells">
                {rest.length === 0 ? (
                  <span className="st-run__spent mono">spent · ∞</span>
                ) : (
                  rest.map((value, j) => (
                    <span key={j} className={`st-run__cell mono ${j === 0 ? "is-head" : ""}`}>
                      {value}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="st-output-wrap">
        <span className="st-output__label mono">MERGED OUTPUT · {step.output.length}</span>
        <div className="canvas-scroll">
          <div className="st-output">
            {step.output.length === 0 ? (
              <span className="st-output__empty mono">nothing yet</span>
            ) : (
              step.output.map((value, i) => (
                <span key={i} className="st-output__cell mono">
                  {value}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">EXHAUSTED</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
