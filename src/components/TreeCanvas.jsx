import { avlBalanceFactor } from "../dataStructures/tree/helpers";
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

export default function TreeCanvas({ step, treeType }) {
  const isMobile = useIsMobile();
  const root = step.root;
  const nodes = flattenNodes(root);
  const WIDTH = isMobile ? Math.max(MOBILE_MIN_WIDTH, nodes.length * MOBILE_SLOT) : 640;
  const positions = layout(root, WIDTH);
  const edges = collectEdges(root);

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

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && !step.resultBadge && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
