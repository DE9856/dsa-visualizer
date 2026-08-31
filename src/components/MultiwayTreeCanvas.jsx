import { useIsMobile } from "../hooks/useMediaQuery.js";

const HEIGHT = 300;
const BOX_H = 28;
const KEY_W = 38;
// The gap a node box needs beyond its own width before it touches its neighbour.
const SLOT_PAD = 12;
// See TreeCanvas: a phone scrolls the tree sideways rather than shrinking it.
const MOBILE_SLOT = 96;
const MOBILE_MIN_WIDTH = 300;
const DESKTOP_MIN_WIDTH = 640;

// Any node with a `keys` array and a `children` array: a 2-3 node, or a B-tree
// node of any order.
const isLeaf = (node) => !node.children || node.children.length === 0;

const widestBox = (node) =>
  !node ? 0 : Math.max(node.keys.length * KEY_W, ...(node.children || []).map(widestBox));

function countLeaves(node) {
  if (!node) return 0;
  if (isLeaf(node)) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

// Leaves get sequential x-slots left to right; an internal node's x is the
// average of its children's x. This keeps subtrees non-overlapping without
// a heavier layout algorithm, the same trick TreeCanvas uses for binary
// trees but generalized to multi-child nodes.
function layout(root, WIDTH) {
  const positions = {};
  let leafCounter = 0;
  let maxDepth = 0;

  function assign(node, depth) {
    maxDepth = Math.max(maxDepth, depth);
    if (isLeaf(node)) {
      const x = leafCounter;
      leafCounter += 1;
      positions[node.id] = { x, depth };
      return x;
    }
    const childXs = node.children.map((c) => assign(c, depth + 1));
    const x = childXs.reduce((a, b) => a + b, 0) / childXs.length;
    positions[node.id] = { x, depth };
    return x;
  }
  if (root) assign(root, 0);

  const count = leafCounter;
  const marginX = 46;
  const marginY = 30;
  const usableW = WIDTH - marginX * 2;
  const usableH = HEIGHT - marginY * 2 - BOX_H;
  const stepX = count > 1 ? usableW / (count - 1) : 0;
  const stepY = maxDepth > 0 ? usableH / maxDepth : 0;

  Object.keys(positions).forEach((id) => {
    const p = positions[id];
    p.px = count > 1 ? marginX + p.x * stepX : WIDTH / 2;
    p.py = marginY + p.depth * stepY;
  });
  return positions;
}

function flattenNodes(node, arr = []) {
  if (!node) return arr;
  arr.push(node);
  node.children.forEach((c) => flattenNodes(c, arr));
  return arr;
}

function collectEdges(node, edges = []) {
  if (!node) return edges;
  node.children.forEach((c, i) => {
    edges.push({ id: `${node.id}-${c.id}`, from: node.id, to: c.id, slot: i, of: node.children.length });
    collectEdges(c, edges);
  });
  return edges;
}

export default function MultiwayTreeCanvas({ step }) {
  const isMobile = useIsMobile();
  const root = step.root;
  // A node of order 5 is four times as wide as a 2-3 leaf, so the slot a leaf
  // occupies has to be derived from the widest node in the tree rather than
  // fixed — otherwise sibling boxes overlap instead of the canvas scrolling.
  const leaves = countLeaves(root);
  const slot = Math.max(isMobile ? MOBILE_SLOT : 0, widestBox(root) + SLOT_PAD);
  const WIDTH = Math.max(isMobile ? MOBILE_MIN_WIDTH : DESKTOP_MIN_WIDTH, leaves * slot + 92);
  const positions = layout(root, WIDTH);
  const nodes = flattenNodes(root);
  const edges = collectEdges(root);
  const leafNodes = nodes.filter(isLeaf);

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
            className={`graph-svg ${isMobile || WIDTH > DESKTOP_MIN_WIDTH ? "graph-svg--fixed" : ""}`}
            width={isMobile || WIDTH > DESKTOP_MIN_WIDTH ? WIDTH : undefined}
            height={isMobile || WIDTH > DESKTOP_MIN_WIDTH ? HEIGHT : undefined}
          >
            {edges.map((edge) => {
              const from = positions[edge.from];
              const to = positions[edge.to];
              if (!from || !to) return null;
              const fromNode = nodes.find((n) => n.id === edge.from);
              const boxW = fromNode.keys.length * KEY_W;
              const startX = from.px - boxW / 2 + ((edge.slot + 0.5) * boxW) / edge.of;
              return (
                <line
                  key={edge.id}
                  x1={startX}
                  y1={from.py + BOX_H / 2}
                  x2={to.px}
                  y2={to.py - BOX_H / 2}
                  style={{ stroke: "var(--border-strong)" }}
                  strokeWidth={1.6}
                />
              );
            })}

            {/* B+ trees chain their leaves, which is what makes a range scan
                one walk along the bottom instead of a tour of the tree. */}
            {step.leafLinks &&
              leafNodes.slice(0, -1).map((leaf, i) => {
                const from = positions[leaf.id];
                const nextLeaf = leafNodes[i + 1];
                const to = positions[nextLeaf.id];
                if (!from || !to) return null;
                return (
                  <line
                    key={`leaflink-${leaf.id}`}
                    x1={from.px + (leaf.keys.length * KEY_W) / 2}
                    y1={from.py}
                    x2={to.px - (nextLeaf.keys.length * KEY_W) / 2}
                    y2={to.py}
                    className="mw-leaflink"
                  />
                );
              })}

            {nodes.map((node) => {
              const pos = positions[node.id];
              const boxW = node.keys.length * KEY_W;
              const left = pos.px - boxW / 2;
              const top = pos.py - BOX_H / 2;

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
                  <rect
                    x={left}
                    y={top}
                    width={boxW}
                    height={BOX_H}
                    rx={6}
                    style={{
                      fill,
                      stroke,
                      strokeWidth: 2,
                      filter: glow ? `drop-shadow(0 0 6px ${glow})` : "none",
                    }}
                  />
                  {node.keys.slice(1).map((k, i) => (
                    <line
                      key={`div-${k}`}
                      x1={left + (i + 1) * KEY_W}
                      y1={top}
                      x2={left + (i + 1) * KEY_W}
                      y2={top + BOX_H}
                      style={{ stroke, strokeWidth: 1.4 }}
                    />
                  ))}
                  {node.keys.map((k, i) => (
                    <text
                      key={k}
                      x={left + (i + 0.5) * KEY_W}
                      y={pos.py + 4}
                      textAnchor="middle"
                      className="graph-node__label mono"
                    >
                      {k}
                    </text>
                  ))}
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
