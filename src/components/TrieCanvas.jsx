import { childList, countNodes, trieWords } from "../dataStructures/trie/helpers";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const RADIUS = 16;
const ROOT_RADIUS = 9;
const LEVEL_GAP = 56;
const MARGIN_Y = 26;
const SLOT_X = 46;
const MOBILE_SLOT_X = 38;
const MIN_WIDTH = 300;

/**
 * Tidy layout for a multi-way tree: leaves take the next free column, and
 * every parent centres itself over its children. Children are laid out in
 * alphabetical order, so the picture reads left to right like a dictionary.
 */
function layout(root) {
  const pos = {};
  let leaves = 0;
  let maxDepth = 0;

  const walk = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = childList(node);
    if (kids.length === 0) {
      pos[node.id] = { x: leaves++, depth };
      return pos[node.id];
    }
    const spans = kids.map((kid) => walk(kid, depth + 1));
    pos[node.id] = { x: (spans[0].x + spans[spans.length - 1].x) / 2, depth };
    return pos[node.id];
  };

  walk(root, 0);
  return { pos, columns: Math.max(1, leaves), maxDepth };
}

function flatten(node, out = []) {
  out.push(node);
  for (const child of childList(node)) flatten(child, out);
  return out;
}

function stateOf(step, id) {
  if (step.removing === id) return "removing";
  if (step.found === id) return "found";
  if (step.wordEnd === id) return "wordEnd";
  if (step.pending === id) return "pending";
  if (step.current === id) return "current";
  if (Array.isArray(step.created) && step.created.includes(id)) return "created";
  if (Array.isArray(step.path) && step.path.includes(id)) return "path";
  return "idle";
}

const STYLES = {
  removing: { stroke: "var(--red)", fill: "rgba(255,107,107,0.22)", glow: "rgba(255,107,107,0.5)" },
  found: { stroke: "var(--green)", fill: "rgba(95,214,160,0.24)", glow: "rgba(95,214,160,0.5)" },
  wordEnd: { stroke: "var(--green)", fill: "rgba(95,214,160,0.24)", glow: "rgba(95,214,160,0.5)" },
  pending: { stroke: "var(--primary)", fill: "rgba(255,138,61,0.22)", glow: "rgba(255,138,61,0.55)" },
  current: { stroke: "var(--primary)", fill: "rgba(255,138,61,0.16)", glow: "rgba(255,138,61,0.35)" },
  created: { stroke: "var(--primary)", fill: "rgba(255,138,61,0.1)" },
  path: { stroke: "var(--blue)", fill: "rgba(79,184,224,0.16)" },
  idle: { stroke: "var(--border-strong)", fill: "var(--panel-alt)" },
};

export default function TrieCanvas({ step }) {
  const isMobile = useIsMobile();
  const root = step.root;
  const words = root ? trieWords({ root }) : [];
  const nodeCount = root ? countNodes(root) - 1 : 0;

  const { pos, columns, maxDepth } = root ? layout(root) : { pos: {}, columns: 1, maxDepth: 0 };
  const slot = isMobile ? MOBILE_SLOT_X : SLOT_X;
  const width = Math.max(MIN_WIDTH, MARGIN_Y * 2 + (columns - 1) * slot);
  const height = MARGIN_Y * 2 + maxDepth * LEVEL_GAP;
  const nodes = root ? flatten(root) : [];

  const xy = (id) => ({
    x: (width - (columns - 1) * slot) / 2 + pos[id].x * slot,
    y: MARGIN_Y + pos[id].depth * LEVEL_GAP,
  });

  return (
    <div className="panel canvas graph-canvas tr-canvas">
      <div className="tr-head">
        <span className="tr-head__count mono">
          {words.length} WORD{words.length === 1 ? "" : "S"} &middot; {nodeCount} NODE{nodeCount === 1 ? "" : "S"}
        </span>
        {step.prefix !== undefined && step.prefix !== "" && (
          <span className="tr-head__prefix mono">{step.prefix.split("").join(" → ")}</span>
        )}
      </div>

      {nodeCount === 0 ? (
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          {"EMPTY TRIE — INSERT A WORD TO BEGIN"}
        </div>
      ) : (
        <div className="canvas-scroll">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`graph-svg ${isMobile ? "graph-svg--fixed" : ""}`}
            width={isMobile ? width : undefined}
            height={isMobile ? height : undefined}
          >
            {nodes.map((node) =>
              childList(node).map((child) => {
                const from = xy(node.id);
                const to = xy(child.id);
                const onPath =
                  Array.isArray(step.path) && step.path.includes(node.id) && step.path.includes(child.id);
                return (
                  <line
                    key={`${node.id}-${child.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    style={{ stroke: onPath ? "var(--blue)" : "var(--border-strong)" }}
                    strokeWidth={onPath ? 2.2 : 1.4}
                  />
                );
              })
            )}

            {nodes.map((node) => {
              const p = xy(node.id);
              const isRoot = node.char === null;
              const style = STYLES[stateOf(step, node.id)];
              const r = isRoot ? ROOT_RADIUS : RADIUS;

              return (
                <g key={node.id} className="tr-node">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    style={{
                      fill: style.fill,
                      stroke: style.stroke,
                      strokeWidth: 2,
                      filter: style.glow ? `drop-shadow(0 0 6px ${style.glow})` : "none",
                    }}
                  />
                  {/* The inner ring is the end-of-word flag — the only thing
                      separating a stored word from a passing prefix. */}
                  {node.isWord && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r - 4}
                      style={{ fill: "none", stroke: "var(--green)", strokeWidth: 1.5, opacity: 0.9 }}
                    />
                  )}
                  {!isRoot && (
                    <text x={p.x} y={p.y + 4} textAnchor="middle" className="graph-node__label mono">
                      {node.char}
                    </text>
                  )}
                  {isRoot && (
                    <text x={p.x} y={p.y - r - 7} textAnchor="middle" className="tr-node__root mono">
                      root
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {Array.isArray(step.collected) && step.collected.length > 0 && (
        <div className="tr-collected">
          {step.collected.map((word) => (
            <span className="tr-chip mono" key={word}>
              {word}
            </span>
          ))}
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">{step.overflow ? "TRIE FULL" : "NOT FOUND"}</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
