const NODE_R = 17;
const LEVEL_H = 58;
const SLOT_W = 46;
const GAP = 34;

/**
 * A forest of binary trees, laid out side by side.
 *
 * Huffman is a forest for all but its last step, which is exactly what makes
 * the algorithm legible — you watch trees get eaten. So this lays out every
 * root independently: leaves take consecutive slots left to right, an internal
 * node sits over the midpoint of its children, and each tree is shifted right
 * of the one before it.
 */
function layoutForest(forest) {
  const nodes = [];
  const links = [];
  let offset = 0;

  forest.forEach((root) => {
    let slot = 0;
    const place = (node, depth) => {
      if (!node) return 0;
      if (!node.left && !node.right) {
        const x = offset + slot * SLOT_W + SLOT_W / 2;
        slot += 1;
        nodes.push({ ...node, x, y: depth * LEVEL_H + NODE_R + 6, leaf: true });
        return x;
      }
      const lx = place(node.left, depth + 1);
      const rx = place(node.right, depth + 1);
      const x = (lx + rx) / 2;
      const y = depth * LEVEL_H + NODE_R + 6;
      nodes.push({ ...node, x, y, leaf: false });
      links.push({ x1: x, y1: y, x2: lx, y2: (depth + 1) * LEVEL_H + NODE_R + 6, bit: "0" });
      links.push({ x1: x, y1: y, x2: rx, y2: (depth + 1) * LEVEL_H + NODE_R + 6, bit: "1" });
      return x;
    };
    place(root, 0);
    offset += slot * SLOT_W + GAP;
  });

  return { nodes, links, width: Math.max(offset, SLOT_W) };
}

const depthOf = (node) => (!node ? 0 : 1 + Math.max(depthOf(node.left), depthOf(node.right)));

export default function HuffmanCanvas({ step }) {
  const forest = step.forest || [];
  const active = new Set(step.active || []);

  if (!forest.length) {
    return (
      <div className="panel canvas hf-canvas">
        <div className="hf-empty mono">{step.message ? "" : "NOTHING BUILT YET"}</div>
        {step.aux && <AuxRow aux={step.aux} />}
        <div className="ll-message mono">{step.message}</div>
      </div>
    );
  }

  const { nodes, links, width } = layoutForest(forest);
  const height = Math.max(...forest.map(depthOf)) * LEVEL_H + NODE_R * 2 + 12;

  return (
    <div className="panel canvas hf-canvas">
      <div className="hf-wrap canvas-scroll">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="hf-svg"
          role="img"
          aria-label={step.message}
        >
          {links.map((l, i) => (
            <g key={i}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="hf-link" />
              {/* The bit each branch contributes — the code is the path. */}
              <text
                x={(l.x1 + l.x2) / 2 + (l.bit === "0" ? -8 : 8)}
                y={(l.y1 + l.y2) / 2}
                className="hf-bit mono"
                textAnchor="middle"
              >
                {l.bit}
              </text>
            </g>
          ))}

          {nodes.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={NODE_R}
                className={`hf-node ${n.leaf ? "is-leaf" : "is-internal"} ${active.has(n.id) ? "is-active" : ""}`}
              />
              <text x={n.x} y={n.y + 4} textAnchor="middle" className="hf-node__label mono">
                {n.leaf ? n.char : n.weight}
              </text>
              {n.leaf && (
                <text x={n.x} y={n.y + NODE_R + 12} textAnchor="middle" className="hf-node__weight mono">
                  {n.weight}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {step.aux && <AuxRow aux={step.aux} />}
      <div className="ll-message mono">{step.message}</div>
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

function AuxRow({ aux }) {
  return (
    <div className="dp-aux">
      <span className="label label--tight">{aux.label}</span>
      <div className="dp-aux__items">
        {aux.items.map((item, i) => (
          <span key={i} className={`dp-chip mono dp-chip--${item.tone}`}>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
