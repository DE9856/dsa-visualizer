import { useRef, useState, useCallback } from "react";
import { useIsMobile } from "../hooks/useMediaQuery.js";

// A phone is portrait, so the ring of vertices is laid out tall-and-narrow
// there — the landscape viewBox would otherwise scale down to letterbox-sized
// nodes on a 360px screen. rx/ry are given rather than derived so the phone's
// ring can stretch into an ellipse that fills a portrait canvas, while the
// desktop one stays circular.
const DESKTOP_VIEW = { width: 640, height: 300, radius: 22, rx: 104, ry: 104 };
const MOBILE_VIEW = { width: 330, height: 370, radius: 21, rx: 118, ry: 138 };

function layout(nodes, { width, height, rx, ry }) {
  const cx = width / 2;
  const cy = height / 2;
  const n = nodes.length;
  return nodes.map((node, i) => {
    const angle = n > 0 ? (2 * Math.PI * i) / n - Math.PI / 2 : 0;
    return { ...node, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
}

export default function GraphCanvas({ step, directed, weighted, onCreateEdge }) {
  const isMobile = useIsMobile();
  const view = isMobile ? MOBILE_VIEW : DESKTOP_VIEW;
  const { width: WIDTH, height: HEIGHT, radius: RADIUS } = view;

  const nodes = step.nodes || [];
  const edges = step.edges || [];
  const positioned = layout(nodes, view);
  const posById = Object.fromEntries(positioned.map((n) => [n.id, n]));

  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null); // { fromId, x, y } — cursor only
  const [linkFrom, setLinkFrom] = useState(null); // tap-to-connect, touch only

  // A vertex that was tapped and then deleted must not stay armed.
  const pendingLink = nodes.some((n) => n.id === linkFrom) ? linkFrom : null;

  const toSvgPoint = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * WIDTH,
        y: ((clientY - rect.top) / rect.height) * HEIGHT,
      };
    },
    [WIDTH, HEIGHT]
  );

  // Touch can't use drag-to-connect: the browser claims a finger drag off an
  // SVG shape as a page scroll and cancels the pointer mid-gesture (it ignores
  // touch-action on SVG children). So a phone connects two vertices by tapping
  // one and then the other, which is the friendlier gesture there anyway.
  const handleNodeTap = (nodeId) => {
    if (pendingLink === null) setLinkFrom(nodeId);
    else if (pendingLink === nodeId) setLinkFrom(null);
    else {
      onCreateEdge?.(pendingLink, nodeId);
      setLinkFrom(null);
    }
  };

  // Pointer (not mouse) events so a stylus works like a cursor too.
  const handleNodeDown = (e, nodeId) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toSvgPoint(e.clientX, e.clientY);
    setDrag({ fromId: nodeId, x: p.x, y: p.y });
  };

  const handleMove = (e) => {
    if (!drag) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : d));
  };

  const handleUp = (e) => {
    if (!drag) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    let target = null;
    let bestDist = RADIUS + 12;
    for (const n of positioned) {
      const dist = Math.hypot(n.x - p.x, n.y - p.y);
      if (dist < bestDist) {
        bestDist = dist;
        target = n;
      }
    }
    if (target && target.id !== drag.fromId && onCreateEdge) {
      onCreateEdge(drag.fromId, target.id);
    }
    setDrag(null);
  };

  const isVisited = (id) => step.visited && step.visited.includes(id);
  const isActive = (id) => step.active && step.active.includes(id);
  const isCurrent = (id) => step.current === id;
  const isPending = (id) => step.pending === id;
  const isRemoving = (id) => step.removing === id;
  const isActiveEdge = (id) => step.activeEdges && step.activeEdges.includes(id);
  const isTreeEdge = (id) => step.treeEdges && step.treeEdges.includes(id);

  return (
    <div className="panel canvas graph-canvas">
      <div className="canvas__note">
        {isMobile
          ? pendingLink
            ? "NOW TAP THE VERTEX TO CONNECT IT TO"
            : "TAP TWO VERTICES TO CONNECT THEM"
          : "DRAG FROM ONE VERTEX TO ANOTHER TO CONNECT THEM"}
      </div>

      {nodes.length === 0 ? (
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          {"EMPTY GRAPH \u2014 ADD A VERTEX TO BEGIN"}
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={`graph-svg ${isMobile ? "graph-svg--portrait" : ""}`}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={() => setDrag(null)}
        >
          <defs>
            <marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--text-dim)" }} />
            </marker>
            <marker id="graph-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--blue)" }} />
            </marker>
            <marker id="graph-arrow-tree" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--green)" }} />
            </marker>
          </defs>

          {edges.map((edge) => {
            const from = posById[edge.from];
            const to = posById[edge.to];
            if (!from || !to) return null;
            const active = isActiveEdge(edge.id);
            const inTree = isTreeEdge(edge.id);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            const x2 = to.x - ux * (RADIUS + 3);
            const y2 = to.y - uy * (RADIUS + 3);

            return (
              <g key={edge.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={directed ? x2 : to.x}
                  y2={directed ? y2 : to.y}
                  style={{ stroke: active ? "var(--blue)" : inTree ? "var(--green)" : "var(--border-strong)" }}
                  strokeWidth={active ? 2.5 : inTree ? 2.5 : 1.6}
                  markerEnd={
                    directed
                      ? `url(#${active ? "graph-arrow-active" : inTree ? "graph-arrow-tree" : "graph-arrow"})`
                      : undefined
                  }
                />
                {weighted && (
                  <g>
                    <rect x={midX - 11} y={midY - 9} width={22} height={16} rx={4} style={{ fill: "var(--bg)", opacity: 0.85 }} />
                    <text x={midX} y={midY + 3} textAnchor="middle" className="graph-edge-label mono">
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {drag && posById[drag.fromId] && (
            <line
              x1={posById[drag.fromId].x}
              y1={posById[drag.fromId].y}
              x2={drag.x}
              y2={drag.y}
              style={{ stroke: "var(--primary)" }}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {positioned.map((node) => {
            let stroke = "var(--border-strong)";
            let fill = "var(--panel-alt)";
            let glow = null;

            if (isVisited(node.id)) {
              stroke = "var(--green)";
              fill = "rgba(95,214,160,0.14)";
            }
            if (isActive(node.id)) {
              stroke = "var(--blue)";
              fill = "rgba(79,184,224,0.18)";
              glow = "rgba(79,184,224,0.5)";
            }
            if (isCurrent(node.id) || isPending(node.id)) {
              stroke = "var(--primary)";
              fill = "rgba(255,138,61,0.2)";
              glow = "rgba(255,138,61,0.55)";
            }
            if (isRemoving(node.id)) {
              stroke = "var(--red)";
              fill = "rgba(255,107,107,0.22)";
              glow = "rgba(255,107,107,0.5)";
            }
            const armed = pendingLink === node.id;
            if (armed) {
              stroke = "var(--primary)";
              glow = "rgba(255,138,61,0.55)";
            }

            return (
              <g
                key={node.id}
                className="graph-node"
                onClick={isMobile ? () => handleNodeTap(node.id) : undefined}
                onPointerDown={isMobile ? undefined : (e) => handleNodeDown(e, node.id)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={RADIUS}
                  style={{
                    fill,
                    stroke,
                    strokeWidth: armed ? 2.5 : 2,
                    strokeDasharray: armed ? "5 4" : undefined,
                    filter: glow ? `drop-shadow(0 0 6px ${glow})` : "none",
                  }}
                />
                <text x={node.x} y={node.y + 5} textAnchor="middle" className="graph-node__label mono">
                  {node.label}
                </text>
                {step.distances && (
                  <text x={node.x} y={node.y - RADIUS - 8} textAnchor="middle" className="graph-node__dist mono">
                    {step.distances[node.id] === Infinity ? "\u221e" : step.distances[node.id]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && !step.resultBadge && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}