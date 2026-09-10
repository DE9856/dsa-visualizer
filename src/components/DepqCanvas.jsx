import {
  KIND_MAP,
  depthOf,
  heightOf,
  hiIndex,
  isMinLevel,
  loIndex,
  maxIndex,
  parentOf,
} from "../dataStructures/depq/helpers";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const LEVEL_GAP = 66;
const MARGIN_Y = 34;
const DESKTOP_WIDTH = 660;
const MOBILE_SLOT = 54;
const MOBILE_MIN_WIDTH = 300;

/**
 * A priority queue, drawn as the complete tree its array stands for, with the
 * array itself underneath.
 *
 * All three kinds are one array, so all three get the same picture — which is
 * the argument the view is making. What changes is the annotation: a min-max
 * heap labels each level min or max, because the alternation is the invariant;
 * an interval heap draws two values per node, because a node *is* an interval.
 */

/** How the current step is using an index. */
function stateOf(step, i) {
  const has = (field) => Array.isArray(step[field]) && step[field].includes(i);
  if (has("swap")) return "swap";
  if (step.removing === i) return "removing";
  if (step.pending === i) return "pending";
  if (has("compare")) return "compare";
  if (step.current === i) return "current";
  if (has("scan")) return "scan";
  if (has("path")) return "path";
  return "idle";
}

function idState(step, item) {
  return Array.isArray(step.active) && step.active.includes(item.id) ? "active" : null;
}

/** x/y for tree position p, laid out as a complete binary tree. */
function positionOf(p, width) {
  const depth = depthOf(p);
  const slot = p - (2 ** depth - 1);
  return { x: (width * (slot + 0.5)) / 2 ** depth, y: MARGIN_Y + depth * LEVEL_GAP };
}

export default function DepqCanvas({ step }) {
  const isMobile = useIsMobile();
  const items = step.items || [];
  const n = items.length;
  const kind = KIND_MAP[step.kind] || KIND_MAP.single;
  const interval = step.kind === "interval";

  // An interval heap's tree has one node per *pair*, so it is half as wide.
  const treeNodes = interval ? Math.ceil(n / 2) : n;
  const h = heightOf(treeNodes);
  const width = isMobile ? Math.max(MOBILE_MIN_WIDTH, 2 ** Math.max(0, h) * MOBILE_SLOT) : DESKTOP_WIDTH;
  const height = MARGIN_Y * 2 + Math.max(0, h) * LEVEL_GAP;
  const maxAt = maxIndex(step);

  return (
    <div className="panel canvas graph-canvas dq-canvas">
      <div className="hp-head">
        <span className="hp-head__kind mono">{kind.short}</span>
        <span className="hp-head__rule mono">
          {kind.ends} · {kind.rule}
        </span>
      </div>

      {n === 0 ? (
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          EMPTY — INSERT A VALUE TO BEGIN
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
              {Array.from({ length: treeNodes }, (_, p) => {
                if (p === 0) return null;
                const from = positionOf(parentOf(p), width);
                const to = positionOf(p, width);
                return (
                  <line
                    key={`edge-${p}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    style={{ stroke: "var(--border-strong)" }}
                    strokeWidth={1.6}
                  />
                );
              })}

              {/* Min-max levels are labelled, because the alternation is the
                  entire invariant and nothing else in the picture shows it. */}
              {step.kind === "minmax" &&
                Array.from({ length: h + 1 }, (_, d) => (
                  <text
                    key={`lvl-${d}`}
                    x={4}
                    y={MARGIN_Y + d * LEVEL_GAP + 3}
                    className={`dq-level mono ${d % 2 === 0 ? "is-min" : "is-max"}`}
                  >
                    {d % 2 === 0 ? "MIN" : "MAX"}
                  </text>
                ))}

              {interval
                ? Array.from({ length: treeNodes }, (_, p) => {
                    const lo = items[loIndex(p)];
                    const hi = items[hiIndex(p)];
                    const pos = positionOf(p, width);
                    return (
                      <IntervalNode key={`node-${p}`} p={p} lo={lo} hi={hi} pos={pos} step={step} />
                    );
                  })
                : items.map((item, i) => {
                    const pos = positionOf(i, width);
                    const state = idState(step, item) || stateOf(step, i);
                    return (
                      <g key={item.id} className={`dq-node is-${state}`}>
                        <circle cx={pos.x} cy={pos.y} r={19} />
                        <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="graph-node__label mono">
                          {item.value}
                        </text>
                        <text x={pos.x} y={pos.y + 31} textAnchor="middle" className="hp-node__index mono">
                          {i}
                        </text>
                        {(i === 0 || i === maxAt) && (
                          <text x={pos.x} y={pos.y - 26} textAnchor="middle" className="dq-end mono">
                            {i === 0 && i === maxAt ? "MIN·MAX" : i === 0 ? "MIN" : "MAX"}
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
                {items.map((item, i) => {
                  const state = idState(step, item) || stateOf(step, i);
                  return (
                    <div className="hp-cell-wrap" key={item.id}>
                      <div className={`hp-cell dq-cell is-${state} ${interval && i % 2 === 1 ? "is-hi" : ""}`}>
                        {item.value}
                      </div>
                      <span className="hp-cell__index mono">{i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="dq-formula mono">
            {interval
              ? `node k = items[2k], items[2k+1] · lo values are a min heap, hi values a max heap`
              : step.kind === "minmax"
                ? `index ${step.current ?? 0} is on a ${isMinLevel(step.current ?? 0) ? "MIN" : "MAX"} level · grandparent two levels up`
                : `parent ⌊(i−1)/2⌋ · children 2i+1, 2i+2`}
          </div>
        </>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && (
        <div className="not-found">{step.overflow ? "TOO LARGE" : step.underflow ? "UNDERFLOW" : "CHECK FAILED"}</div>
      )}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

/**
 * One interval-heap node: two half-cells side by side, because that is what
 * the node is — a closed interval, not two unrelated values.
 */
function IntervalNode({ p, lo, hi, pos, step }) {
  const loState = idState(step, lo) || stateOf(step, loIndex(p));
  const hiState = hi ? idState(step, hi) || stateOf(step, hiIndex(p)) : null;
  const W = 30;
  const H = 28;

  return (
    <g className="dq-interval">
      <rect x={pos.x - W} y={pos.y - H / 2} width={W} height={H} rx={5} className={`dq-half is-${loState}`} />
      <text x={pos.x - W / 2} y={pos.y + 4} textAnchor="middle" className="graph-node__label mono">
        {lo.value}
      </text>
      {hi ? (
        <>
          <rect x={pos.x} y={pos.y - H / 2} width={W} height={H} rx={5} className={`dq-half is-${hiState}`} />
          <text x={pos.x + W / 2} y={pos.y + 4} textAnchor="middle" className="graph-node__label mono">
            {hi.value}
          </text>
        </>
      ) : (
        <rect x={pos.x} y={pos.y - H / 2} width={W} height={H} rx={5} className="dq-half is-vacant" />
      )}
      <text x={pos.x} y={pos.y + H / 2 + 12} textAnchor="middle" className="hp-node__index mono">
        {loIndex(p)}
        {hi ? `,${hiIndex(p)}` : ""}
      </text>
      {p === 0 && (
        <text x={pos.x} y={pos.y - H / 2 - 8} textAnchor="middle" className="dq-end mono">
          MIN · MAX
        </text>
      )}
    </g>
  );
}
