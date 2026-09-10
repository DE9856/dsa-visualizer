import { KIND_MAP, rightSpine } from "../dataStructures/leftist/helpers";

const RADIUS = 17;
const X_GAP = 44;
const LEVEL_GAP = 58;
const MARGIN = 26;

/**
 * A leftist tree, with every node's null-path length on it.
 *
 * The right spine is drawn heavier than the rest, because it is the only
 * thing any operation touches — the picture should make it obvious that a
 * meld walks that path and nothing else, however tall the tree gets. The `s`
 * badge sits beside each node rather than inside it so the value stays the
 * thing you read first.
 *
 * Laid out by in-order position, so the drawing never overlaps however
 * lopsided the tree is — and lopsided is normal here. A leftist tree is
 * *supposed* to lean left; that is what pays for the short right spine.
 */
function layout(root) {
  const nodes = [];
  const edges = [];
  let slot = 0;

  const walk = (node, depth) => {
    if (!node) return null;
    const left = walk(node.left, depth + 1);
    const x = MARGIN + slot++ * X_GAP;
    const y = MARGIN + depth * LEVEL_GAP;
    const self = { node, x, y };
    nodes.push(self);
    const right = walk(node.right, depth + 1);
    if (left) edges.push({ from: self, to: left, side: "left" });
    if (right) edges.push({ from: self, to: right, side: "right" });
    return self;
  };

  walk(root, 0);
  const depth = nodes.reduce((max, n) => Math.max(max, n.y), MARGIN);
  return { nodes, edges, width: Math.max(120, slot * X_GAP + MARGIN), height: depth + MARGIN + 8 };
}

function stateOf(view, node) {
  const has = (field) => Array.isArray(view[field]) && view[field].includes(node.id);
  if (view.removing === node.id) return "removing";
  if (has("swap")) return "swap";
  if (has("compare")) return "compare";
  if (has("active")) return "active";
  if (has("onSpine")) return "spine";
  return "idle";
}

function Tree({ view, label }) {
  const { nodes, edges, width, height } = layout(view.root);
  const spine = new Set((view.onSpine || []).map(String));

  if (!view.root) {
    return (
      <div className="lt-tree">
        {label && <div className="lt-tree__label mono">{label}</div>}
        <div className="ll-empty mono">EMPTY</div>
      </div>
    );
  }

  return (
    <div className="lt-tree">
      {label && <div className="lt-tree__label mono">{label}</div>}
      <div className="canvas-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="graph-svg graph-svg--fixed">
          {edges.map((edge) => {
            // An edge is on the spine only if it *is* a right pointer between
            // two spine nodes — a left edge between two of them is not.
            const onSpine =
              edge.side === "right" && spine.has(String(edge.from.node.id)) && spine.has(String(edge.to.node.id));
            return (
              <line
                key={`${edge.from.node.id}-${edge.to.node.id}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                className={`lt-edge ${onSpine ? "is-spine" : ""}`}
              />
            );
          })}

          {nodes.map(({ node, x, y }) => (
            <g key={node.id} className={`lt-node is-${stateOf(view, node)}`}>
              <circle cx={x} cy={y} r={RADIUS} />
              <text x={x} y={y + 4} textAnchor="middle" className="graph-node__label mono">
                {node.value}
              </text>
              <text x={x + RADIUS + 2} y={y - RADIUS + 4} className="lt-node__s mono">
                s{node.s}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function LeftistCanvas({ step }) {
  const kind = KIND_MAP[step.kind] || KIND_MAP.min;
  const spineLength = step.root ? rightSpine(step.root).length : 0;

  return (
    <div className="panel canvas graph-canvas lt-canvas">
      <div className="hp-head">
        <span className="hp-head__kind mono">{kind.short} LEFTIST</span>
        <span className="hp-head__rule mono">
          {kind.rule} · s(left) ≥ s(right) · right spine {spineLength}
        </span>
      </div>

      <div className="lt-trees">
        <Tree view={step} label={step.label} />
        {step.second && <Tree view={step.second} label={step.second.label} />}
      </div>

      {step.spine && (
        <div className="lt-spine-wrap">
          <span className="lt-spine__label mono">MERGED RIGHT SPINE</span>
          <div className="canvas-scroll">
            <div className="lt-spine">
              {step.spine.map((entry, i) => (
                <span
                  key={entry.id}
                  className={[
                    "lt-spine__item mono",
                    `is-${entry.from}`,
                    step.spinePlaced !== undefined && i < step.spinePlaced ? "is-pending" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {entry.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {step.forest && (
        <div className="lt-spine-wrap">
          <span className="lt-spine__label mono">QUEUE · {step.forest.length} TREES</span>
          <div className="canvas-scroll">
            <div className="lt-spine">
              {step.forest.map((entry) => (
                <span key={entry.id} className="lt-forest__item mono">
                  <b>{entry.value}</b>
                  <i>{entry.size}</i>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && (
        <div className="not-found">{step.overflow ? "TOO LARGE" : step.underflow ? "UNDERFLOW" : "NOTHING TO DO"}</div>
      )}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
