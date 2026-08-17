import { avlBalanceFactor } from "../dataStructures/tree/helpers";
import { computeThreads, isDoubleThreaded } from "../dataStructures/tree/threads";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const RADIUS = 20;
const HEIGHT = 300;
// Phone screens can't fit a wide tree at a readable size, so the canvas keeps
// a fixed slot per node and scrolls sideways instead of shrinking.
const MOBILE_SLOT = 54;
const MOBILE_MIN_WIDTH = 300;

// Assigns each node an (x, y): x comes from inorder position (so left
// subtrees always land left of their parent, right subtrees right of it),
// y comes from depth. This gives a clean, non-overlapping binary tree
// layout without needing a heavier layout algorithm.
function layout(root, WIDTH) {
  const positions = {};
  let order = 0;
  let maxDepth = 0;

  function walk(node, depth) {
    if (!node) return;
    walk(node.left, depth + 1);
    positions[node.id] = { depth };
    positions[node.id].order = order;
    order += 1;
    maxDepth = Math.max(maxDepth, depth);
    walk(node.right, depth + 1);
  }
  walk(root, 0);

  const count = order;
  const marginX = 40;
  const marginY = 34;
  const usableW = WIDTH - marginX * 2;
  const usableH = HEIGHT - marginY * 2;
  const stepX = count > 1 ? usableW / (count - 1) : 0;
  const stepY = maxDepth > 0 ? usableH / maxDepth : 0;

  Object.keys(positions).forEach((id) => {
    const p = positions[id];
    p.x = count > 1 ? marginX + p.order * stepX : WIDTH / 2;
    p.y = marginY + p.depth * stepY;
  });
  return positions;
}

function collectEdges(node, edges = []) {
  if (!node) return edges;
  if (node.left) {
    edges.push({ id: `${node.id}-${node.left.id}`, from: node.id, to: node.left.id });
    collectEdges(node.left, edges);
  }
  if (node.right) {
    edges.push({ id: `${node.id}-${node.right.id}`, from: node.id, to: node.right.id });
    collectEdges(node.right, edges);
  }
  return edges;
}

function flattenNodes(node, arr = []) {
  if (!node) return arr;
  arr.push(node);
  flattenNodes(node.left, arr);
  flattenNodes(node.right, arr);
  return arr;
}

// A thread joins two nodes that can sit far apart with unrelated subtrees in
// between, so it is drawn as a curve bowing below the straight parent-child
// edges instead of cutting across them. The bow grows with the span, and the
// endpoints are pulled back to the circles' edges so the arrowhead lands on
// the node it points at rather than inside it.
function threadPath(from, to) {
  const dist = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const bow = Math.min(46, Math.max(18, dist * 0.22));
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 + bow;

  const trim = (px, py, qx, qy, by) => {
    const len = Math.hypot(qx - px, qy - py) || 1;
    return [px + ((qx - px) / len) * by, py + ((qy - py) / len) * by];
  };
  const [x1, y1] = trim(from.x, from.y, cx, cy, RADIUS);
  const [x2, y2] = trim(to.x, to.y, cx, cy, RADIUS + 5);
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export default function TreeCanvas({ step, treeType, threadMode }) {
  const isMobile = useIsMobile();
  const root = step.root;
  const nodes = flattenNodes(root);
  const WIDTH = isMobile ? Math.max(MOBILE_MIN_WIDTH, nodes.length * MOBILE_SLOT) : 640;
  const positions = layout(root, WIDTH);
  const edges = collectEdges(root);
  const threaded = treeType === "threaded";
  const threads = threaded ? computeThreads(root, threadMode) : [];
  // The step being replayed highlights the thread it is following, if any.
  const isLitThread = (thread) =>
    (step.threads || []).some((t) => t.from === thread.from && t.to === thread.to);

  const isVisited = (id) => step.visited && step.visited.includes(id);
  const isOnPath = (id) => step.path && step.path.includes(id);
  const isActive = (id) => step.active && step.active.includes(id);
  const isCurrent = (id) => step.current === id;

  return (
    <div className="panel canvas graph-canvas tree-canvas">
      {!root ? (
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          {"EMPTY TREE \u2014 INSERT A VALUE TO BEGIN"}
        </div>
      ) : (
        <div className="canvas-scroll">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={`graph-svg ${isMobile ? "graph-svg--fixed" : ""}`}
            width={isMobile ? WIDTH : undefined}
            height={isMobile ? HEIGHT : undefined}
          >
            {threaded && (
              <defs>
                <marker id="thread-arrow-right" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--purple)" }} />
                </marker>
                <marker id="thread-arrow-left" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--yellow)" }} />
                </marker>
                <marker id="thread-arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--primary)" }} />
                </marker>
              </defs>
            )}

            {edges.map((edge) => {
              const from = positions[edge.from];
              const to = positions[edge.to];
              if (!from || !to) return null;
              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  style={{ stroke: "var(--border-strong)" }}
                  strokeWidth={1.6}
                />
              );
            })}

            {threads.map((thread) => {
              const from = positions[thread.from];
              const to = positions[thread.to];
              if (!from || !to) return null;
              const lit = isLitThread(thread);
              const color = lit ? "var(--primary)" : thread.side === "right" ? "var(--purple)" : "var(--yellow)";
              return (
                <path
                  key={thread.id}
                  d={threadPath(from, to)}
                  fill="none"
                  style={{
                    stroke: color,
                    opacity: lit ? 1 : 0.5,
                    filter: lit ? "drop-shadow(0 0 5px rgba(255,138,61,0.5))" : "none",
                  }}
                  strokeWidth={lit ? 2.2 : 1.4}
                  strokeDasharray="5 4"
                  markerEnd={`url(#thread-arrow-${lit ? "lit" : thread.side})`}
                />
              );
            })}

            {nodes.map((node) => {
              const pos = positions[node.id];
              let stroke = "var(--border-strong)";
              let fill = "var(--panel-alt)";
              let glow = null;

              if (isVisited(node.id)) {
                stroke = "var(--green)";
                fill = "rgba(95,214,160,0.14)";
              }
              if (isOnPath(node.id)) {
                stroke = "var(--blue)";
                fill = "rgba(79,184,224,0.18)";
              }
              if (isCurrent(node.id) || isActive(node.id)) {
                stroke = "var(--primary)";
                fill = "rgba(255,138,61,0.2)";
                glow = "rgba(255,138,61,0.55)";
              }

              return (
                <g key={node.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={RADIUS}
                    style={{
                      fill,
                      stroke,
                      strokeWidth: 2,
                      filter: glow ? `drop-shadow(0 0 6px ${glow})` : "none",
                    }}
                  />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="graph-node__label mono">
                    {node.value}
                  </text>
                  {treeType === "avl" &&
                    (() => {
                      const bf = avlBalanceFactor(node);
                      const unbalanced = Math.abs(bf) > 1;
                      return (
                        <text
                          x={pos.x}
                          y={pos.y - RADIUS - 7}
                          textAnchor="middle"
                          className="mono"
                          style={{ fontSize: 9, fontWeight: 700, fill: unbalanced ? "var(--red)" : "var(--text-dim)" }}
                        >
                          {`bf:${bf > 0 ? "+" : ""}${bf}`}
                        </text>
                      );
                    })()}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {threaded && root && (
        <div className="thread-legend mono">
          <span className="thread-legend__item">
            <span className="thread-legend__swatch thread-legend__swatch--right" /> RIGHT THREAD → SUCCESSOR
          </span>
          {isDoubleThreaded(threadMode) && (
            <span className="thread-legend__item">
              <span className="thread-legend__swatch thread-legend__swatch--left" /> LEFT THREAD → PREDECESSOR
            </span>
          )}
          <span className="thread-legend__note">
            {`${threads.length} thread${threads.length === 1 ? "" : "s"} — ${
              isDoubleThreaded(threadMode)
                ? "the first and last node thread to the header"
                : "the last node threads to the header"
            }, which isn't drawn`}
          </span>
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && !step.resultBadge && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
