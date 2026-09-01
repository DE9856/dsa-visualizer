import { childrenOf, componentsOf, isRoot, labelOf, rootsOf } from "../dataStructures/unionFind/helpers";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const RADIUS = 17;
const LEVEL_GAP = 54;
const MARGIN_Y = 30;
const SLOT_X = 52;
const MOBILE_SLOT_X = 42;
const MIN_WIDTH = 300;
const TREE_GAP = 1; // one empty column between neighbouring trees

/**
 * The forest, with one tree per set, above the parent array that actually
 * stores it. Path compression is the reason both are on screen: the trees
 * visibly flatten while the array row shows the pointers being rewritten.
 */
function layout(uf) {
  const kids = childrenOf(uf);
  const pos = {};
  let column = 0;
  let maxDepth = 0;

  const walk = (i, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const children = kids[i];
    if (children.length === 0) {
      pos[i] = { x: column++, depth };
      return pos[i];
    }
    const spans = children.map((child) => walk(child, depth + 1));
    pos[i] = { x: (spans[0].x + spans[spans.length - 1].x) / 2, depth };
    return pos[i];
  };

  for (const root of rootsOf(uf)) {
    walk(root, 0);
    column += TREE_GAP;
  }

  const columns = Math.max(1, Math.max(...Object.values(pos).map((p) => p.x), 0) + 1);
  return { pos, columns, maxDepth };
}

function stateOf(step, i) {
  const has = (field) => Array.isArray(step[field]) && step[field].includes(i);
  if (has("compressed")) return "compressed";
  if (step.linked === i) return "linked";
  if (step.root === i || has("roots")) return "root";
  if (step.current === i) return "current";
  if (has("pair")) return "pair";
  if (has("path")) return "path";
  if (has("active")) return "active";
  return "idle";
}

const STYLES = {
  compressed: { stroke: "var(--primary)", fill: "rgb(var(--primary-rgb) / 0.26)", glow: "rgb(var(--primary-rgb) / 0.6)" },
  linked: { stroke: "var(--primary)", fill: "rgb(var(--primary-rgb) / 0.2)", glow: "rgb(var(--primary-rgb) / 0.5)" },
  root: { stroke: "var(--green)", fill: "rgb(var(--green-rgb) / 0.2)", glow: "rgb(var(--green-rgb) / 0.45)" },
  current: { stroke: "var(--primary)", fill: "rgb(var(--primary-rgb) / 0.16)", glow: "rgb(var(--primary-rgb) / 0.35)" },
  pair: { stroke: "var(--blue)", fill: "rgb(var(--blue-rgb) / 0.2)" },
  path: { stroke: "var(--blue)", fill: "rgb(var(--blue-rgb) / 0.12)" },
  active: { stroke: "var(--blue)", fill: "rgb(var(--blue-rgb) / 0.1)" },
  idle: { stroke: "var(--border-strong)", fill: "var(--panel-alt)" },
};

export default function UnionFindCanvas({ step }) {
  const isMobile = useIsMobile();
  const uf = { n: step.n || 0, parent: step.parent || [], size: step.size || [] };

  if (uf.n === 0) {
    return (
      <div className="panel canvas graph-canvas uf-canvas">
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          {"NO ELEMENTS"}
        </div>
        <div className="ll-message mono">{step.message}</div>
      </div>
    );
  }

  const { pos, columns, maxDepth } = layout(uf);
  const slot = isMobile ? MOBILE_SLOT_X : SLOT_X;
  const width = Math.max(MIN_WIDTH, MARGIN_Y * 2 + (columns - 1) * slot);
  const height = MARGIN_Y * 2 + maxDepth * LEVEL_GAP;
  const sets = componentsOf(uf).length;

  const xy = (i) => ({
    x: (width - (columns - 1) * slot) / 2 + pos[i].x * slot,
    y: MARGIN_Y + pos[i].depth * LEVEL_GAP,
  });

  const indices = Array.from({ length: uf.n }, (_, i) => i);

  return (
    <div className="panel canvas graph-canvas uf-canvas">
      <div className="uf-head">
        <span className="uf-head__count mono">
          {uf.n} ELEMENTS &middot; {sets} SET{sets === 1 ? "" : "S"}
        </span>
      </div>

      <div className="canvas-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`graph-svg ${isMobile ? "graph-svg--fixed" : ""}`}
          width={isMobile ? width : undefined}
          height={isMobile ? height : undefined}
        >
          {indices.map((i) => {
            if (isRoot(uf, i)) return null;
            const from = xy(i);
            const to = xy(uf.parent[i]);
            const onPath =
              Array.isArray(step.path) && step.path.includes(i) && step.path.includes(uf.parent[i]);
            const justCompressed = Array.isArray(step.compressed) && step.compressed.includes(i);
            const stroke = justCompressed ? "var(--primary)" : onPath ? "var(--blue)" : "var(--border-strong)";
            return (
              <line
                key={`edge-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                style={{ stroke, transition: "stroke var(--step-anim) ease" }}
                strokeWidth={justCompressed || onPath ? 2.2 : 1.5}
              />
            );
          })}

          {indices.map((i) => {
            const p = xy(i);
            const style = STYLES[stateOf(step, i)];
            const root = isRoot(uf, i);
            return (
              <g key={i} className="uf-node">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={RADIUS}
                  style={{
                    fill: style.fill,
                    stroke: style.stroke,
                    strokeWidth: 2,
                    filter: style.glow ? `drop-shadow(0 0 6px ${style.glow})` : "none",
                  }}
                />
                {/* A root is its own parent — the ring marks where a walk stops. */}
                {root && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={RADIUS - 4}
                    style={{ fill: "none", stroke: "var(--green)", strokeWidth: 1.4, opacity: 0.85 }}
                  />
                )}
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="graph-node__label mono">
                  {labelOf(i)}
                </text>
                {root && (
                  <text x={p.x} y={p.y - RADIUS - 6} textAnchor="middle" className="uf-node__size mono">
                    size {uf.size[i]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="uf-array-wrap">
        <span className="uf-array__label mono">PARENT</span>
        <div className="canvas-scroll">
          <div className="uf-array">
            {indices.map((i) => {
              const style = STYLES[stateOf(step, i)];
              const root = isRoot(uf, i);
              return (
                <div className="uf-cell-wrap" key={i}>
                  <span className="uf-cell__index mono">{labelOf(i)}</span>
                  <div
                    className={`uf-cell ${root ? "uf-cell--root" : ""}`}
                    style={{
                      borderColor: style.stroke,
                      background: style.fill,
                      boxShadow: style.glow ? `0 0 10px ${style.glow}` : "none",
                    }}
                  >
                    {labelOf(uf.parent[i])}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">{step.overflow ? "FULL" : "NOT CONNECTED"}</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
