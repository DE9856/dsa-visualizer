import { depthOf, heightOf, leftOf, parentOf, rightOf, KIND_MAP } from "../dataStructures/heap/helpers";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const RADIUS = 19;
const LEVEL_GAP = 62;
const MARGIN_Y = 30;
const DESKTOP_WIDTH = 640;
const MOBILE_SLOT = 46;
const MOBILE_MIN_WIDTH = 300;

/**
 * How every index is being used by the current step. The tree and the array
 * both read it, so a node and its array cell can never disagree — which is the
 * one thing this canvas exists to show.
 */
function stateOf(step, i) {
  const has = (field) => Array.isArray(step[field]) && step[field].includes(i);
  if (has("swap")) return "swap";
  if (step.removing === i) return "removing";
  if (step.found === i) return "found";
  if (step.pending === i) return "pending";
  if (has("compare")) return "compare";
  if (step.current === i) return "current";
  if (has("pruned")) return "pruned";
  if (has("active")) return "active";
  if (has("visited")) return "visited";
  if (has("heapified")) return "heapified";
  if (has("path")) return "path";
  return "idle";
}

const STYLES = {
  swap: { stroke: "var(--primary)", fill: "rgba(255,138,61,0.24)", glow: "rgba(255,138,61,0.6)" },
  pending: { stroke: "var(--primary)", fill: "rgba(255,138,61,0.18)", glow: "rgba(255,138,61,0.5)" },
  current: { stroke: "var(--primary)", fill: "rgba(255,138,61,0.12)" },
  compare: { stroke: "var(--blue)", fill: "rgba(79,184,224,0.18)", glow: "rgba(79,184,224,0.35)" },
  removing: { stroke: "var(--red)", fill: "rgba(255,107,107,0.22)", glow: "rgba(255,107,107,0.5)" },
  found: { stroke: "var(--green)", fill: "rgba(95,214,160,0.22)", glow: "rgba(95,214,160,0.5)" },
  heapified: { stroke: "var(--green)", fill: "rgba(95,214,160,0.1)" },
  active: { stroke: "var(--blue)", fill: "rgba(79,184,224,0.12)" },
  visited: { stroke: "var(--border-strong)", fill: "rgba(79,184,224,0.07)" },
  pruned: { stroke: "rgba(255,107,107,0.4)", fill: "var(--panel-alt)", opacity: 0.4 },
  path: { stroke: "rgba(79,184,224,0.5)", fill: "var(--panel-alt)" },
  idle: { stroke: "var(--border-strong)", fill: "var(--panel-alt)" },
};

/** x/y for index i in a complete tree: level from the depth, slot within it. */
function positionOf(i, width) {
  const depth = depthOf(i);
  const slot = i - (2 ** depth - 1);
  return {
    x: (width * (slot + 0.5)) / 2 ** depth,
    y: MARGIN_Y + depth * LEVEL_GAP,
  };
}

export default function HeapCanvas({ step }) {
  const isMobile = useIsMobile();
  const nodes = step.nodes || [];
  const n = nodes.length;
  const kind = KIND_MAP[step.kind] || KIND_MAP.max;
  const h = heightOf(n);

  const width = isMobile ? Math.max(MOBILE_MIN_WIDTH, 2 ** h * MOBILE_SLOT) : DESKTOP_WIDTH;
  const height = MARGIN_Y * 2 + Math.max(0, h) * LEVEL_GAP;

  // The index whose arithmetic the caption spells out — whatever the step is
  // working on right now.
  const focus =
    step.current ??
    (Array.isArray(step.swap) ? step.swap[0] : undefined) ??
    (Array.isArray(step.compare) ? step.compare[0] : undefined) ??
    step.pending ??
    step.found ??
    null;

  return (
    <div className="panel canvas graph-canvas hp-canvas">
      <div className="hp-head">
        <span className="hp-head__kind mono">{kind.short}</span>
        <span className="hp-head__rule mono">{kind.rule}</span>
      </div>

      {n === 0 ? (
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          {"EMPTY HEAP — INSERT A VALUE TO BEGIN"}
        </div>
      ) : (
        <>
          <div className="canvas-scroll">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className={`graph-svg ${isMobile ? "graph-svg--fixed" : ""}`}
              width={isMobile ? width : undefined}
              height={isMobile ? height : undefined}
            >
              {nodes.map((node, i) => {
                if (i === 0) return null;
                const from = positionOf(parentOf(i), width);
                const to = positionOf(i, width);
                const onPath = Array.isArray(step.path) && step.path.includes(i) && step.path.includes(parentOf(i));
                return (
                  <line
                    key={`edge-${node.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    style={{ stroke: onPath ? "var(--blue)" : "var(--border-strong)" }}
                    strokeWidth={onPath ? 2.2 : 1.6}
                  />
                );
              })}

              {nodes.map((node, i) => {
                const pos = positionOf(i, width);
                const style = STYLES[stateOf(step, i)];
                return (
                  <g key={node.id} style={{ opacity: style.opacity ?? 1 }} className="hp-node">
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={RADIUS}
                      style={{
                        fill: style.fill,
                        stroke: style.stroke,
                        strokeWidth: 2,
                        filter: style.glow ? `drop-shadow(0 0 6px ${style.glow})` : "none",
                      }}
                    />
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="graph-node__label mono">
                      {node.value}
                    </text>
                    <text x={pos.x} y={pos.y + RADIUS + 12} textAnchor="middle" className="hp-node__index mono">
                      {i}
                    </text>
                    {step.pendingId === node.id && (
                      <text x={pos.x} y={pos.y - RADIUS - 7} textAnchor="middle" className="hp-node__tag mono">
                        NEW
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="hp-array-wrap">
            <span className="hp-array__label mono">ARRAY</span>
            <div className="canvas-scroll">
              <div className="hp-array">
                {nodes.map((node, i) => {
                  const style = STYLES[stateOf(step, i)];
                  return (
                    <div className="hp-cell-wrap" key={node.id}>
                      <div
                        className="hp-cell"
                        style={{
                          borderColor: style.stroke,
                          background: style.fill,
                          opacity: style.opacity ?? 1,
                          boxShadow: style.glow ? `0 0 10px ${style.glow}` : "none",
                        }}
                      >
                        {node.value}
                      </div>
                      <span className="hp-cell__index mono">{i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {focus !== null && focus < n && (
            <div className="hp-formula mono">
              i = {focus}
              {focus > 0 && <span> · parent ⌊({focus}−1)/2⌋ = {parentOf(focus)}</span>}
              {leftOf(focus) < n && <span> · left 2·{focus}+1 = {leftOf(focus)}</span>}
              {rightOf(focus) < n && <span> · right 2·{focus}+2 = {rightOf(focus)}</span>}
            </div>
          )}
        </>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && (
        <div className="not-found">{step.overflow ? "TOO LARGE" : step.underflow ? "UNDERFLOW" : "NOT FOUND"}</div>
      )}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
