import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "../hooks/useMediaQuery.js";

// A phone is portrait, so the ring of vertices is laid out tall-and-narrow
// there — the landscape viewBox would otherwise scale down to letterbox-sized
// nodes on a 360px screen. rx/ry are given rather than derived so the phone's
// ring can stretch into an ellipse that fills a portrait canvas, while the
// desktop one stays circular.
const DESKTOP_VIEW = { width: 640, height: 300, radius: 22, rx: 104, ry: 104 };
const MOBILE_VIEW = { width: 330, height: 370, radius: 21, rx: 118, ry: 138 };

// How long a finger has to rest on a vertex before it picks it up, and how
// close together two clicks have to be to count as the double that does the
// same thing with a cursor.
const LONG_PRESS_MS = 400;
const DOUBLE_CLICK_MS = 350;
// A finger is never perfectly still; anything past this (in CSS pixels) is a
// scroll, not a press, and cancels the pending pick-up.
const PRESS_SLOP_PX = 10;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// `positions` holds the vertices the user has dragged, as 0..1 fractions of
// the canvas. Everything else falls back to its slot on the ring.
function layout(nodes, { width, height, radius, rx, ry }, positions) {
  const cx = width / 2;
  const cy = height / 2;
  const n = nodes.length;
  return nodes.map((node, i) => {
    const custom = positions[node.id];
    // Clamped on the way out as well as on the way in: a position can arrive
    // from a hand-edited link, or from the other layout's aspect ratio, and a
    // vertex hanging half off the canvas isn't something the app would draw.
    if (custom) {
      return {
        ...node,
        x: clamp(custom.nx * width, radius + 2, width - radius - 2),
        y: clamp(custom.ny * height, radius + 2, height - radius - 2),
      };
    }
    const angle = n > 0 ? (2 * Math.PI * i) / n - Math.PI / 2 : 0;
    return { ...node, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
}

export default function GraphCanvas({
  step,
  directed,
  weighted,
  onCreateEdge,
  positions = {},
  onMoveVertex,
  onResetLayout,
  hasCustomLayout = false,
}) {
  const isMobile = useIsMobile();
  const view = isMobile ? MOBILE_VIEW : DESKTOP_VIEW;
  const { width: WIDTH, height: HEIGHT, radius: RADIUS } = view;

  const nodes = step.nodes || [];
  const edges = step.edges || [];

  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null); // { fromId, x, y } — cursor only
  const [linkFrom, setLinkFrom] = useState(null); // tap-to-connect, touch only
  // The vertex currently being repositioned. Its live coordinates are kept
  // here rather than pushed up on every pointermove: the committed position
  // only matters once it lands, and re-rendering just this canvas per frame
  // keeps the drag smooth even with a big adjacency matrix alongside it.
  const [moving, setMoving] = useState(null); // { id, dx, dy, x, y }

  const movingRef = useRef(null);
  const pressRef = useRef(null); // pending long-press: { id, timer, clientX, clientY, grab }
  const lastDownRef = useRef(null); // { id, time } — double-click detection
  const suppressTapRef = useRef(false);

  // A vertex that was tapped and then deleted must not stay armed.
  const pendingLink = nodes.some((n) => n.id === linkFrom) ? linkFrom : null;
  const hasNodes = nodes.length > 0;

  const laidOut = layout(nodes, view, positions);
  const positioned = moving
    ? laidOut.map((n) => (n.id === moving.id ? { ...n, x: moving.x, y: moving.y } : n))
    : laidOut;
  const posById = Object.fromEntries(positioned.map((n) => [n.id, n]));

  // The SVG's own transform, so the mapping stays exact however the viewBox is
  // letterboxed inside the element — a node has to sit under the cursor, not
  // near it, and the rect-ratio approximation drifts as you move away from the
  // centre. Falls back to that approximation if the element isn't rendered.
  const toSvgPoint = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      const ctm = svg?.getScreenCTM?.();
      if (ctm) {
        const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
      }
      const rect = svg.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * WIDTH,
        y: ((clientY - rect.top) / rect.height) * HEIGHT,
      };
    },
    [WIDTH, HEIGHT]
  );

  // A finger dragging a vertex would otherwise scroll the page, and the
  // browser cancels the pointer the moment it decides the gesture is a scroll.
  // touch-action can't prevent that here (it is ignored on SVG children), so
  // the scroll is refused directly — but only while a vertex is actually being
  // moved, so the canvas stays scrollable past the rest of the time. The
  // listener has to be non-passive, which React's own onTouchMove is not.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const refuseScroll = (e) => {
      if (movingRef.current) e.preventDefault();
    };
    svg.addEventListener("touchmove", refuseScroll, { passive: false });
    return () => svg.removeEventListener("touchmove", refuseScroll);
  }, [hasNodes]);

  const cancelPress = () => {
    if (pressRef.current) clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };

  // Leaving the graph view mid-press must not pick a vertex up afterwards.
  useEffect(() => () => cancelPress(), []);

  const beginMove = (nodeId, grab, p) => {
    cancelPress();
    setDrag(null);
    const next = {
      id: nodeId,
      dx: grab.dx,
      dy: grab.dy,
      x: clamp(p.x + grab.dx, RADIUS + 2, WIDTH - RADIUS - 2),
      y: clamp(p.y + grab.dy, RADIUS + 2, HEIGHT - RADIUS - 2),
    };
    movingRef.current = next;
    setMoving(next);
    // A phone gives no cursor to change, so the pick-up is confirmed by feel.
    if (isMobile) navigator.vibrate?.(12);
  };

  const endMove = () => {
    const m = movingRef.current;
    movingRef.current = null;
    setMoving(null);
    if (m) onMoveVertex?.(m.id, m.x / WIDTH, m.y / HEIGHT);
    return m;
  };

  // Touch can't use drag-to-connect: the browser claims a finger drag off an
  // SVG shape as a page scroll and cancels the pointer mid-gesture. So a phone
  // connects two vertices by tapping one and then the other, which is the
  // friendlier gesture there anyway.
  const handleNodeTap = (nodeId) => {
    // The click that closes a long-press drag isn't a tap on the vertex.
    if (suppressTapRef.current) return;
    if (pendingLink === null) setLinkFrom(nodeId);
    else if (pendingLink === nodeId) setLinkFrom(null);
    else {
      onCreateEdge?.(pendingLink, nodeId);
      setLinkFrom(null);
    }
  };

  // Pointer (not mouse) events so a stylus works like a cursor too.
  const handleNodeDown = (e, nodeId) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toSvgPoint(e.clientX, e.clientY);
    const node = posById[nodeId];
    // Grab offset, so a vertex picked up by its edge doesn't jump so that its
    // centre snaps under the pointer.
    const grab = node ? { dx: node.x - p.x, dy: node.y - p.y } : { dx: 0, dy: 0 };
    suppressTapRef.current = false;

    if (isMobile) {
      // Hold to pick up. The tap-to-connect gesture is unaffected: it resolves
      // on click, long after this timer has been cancelled by the release.
      cancelPress();
      pressRef.current = {
        id: nodeId,
        clientX: e.clientX,
        clientY: e.clientY,
        timer: setTimeout(() => beginMove(nodeId, grab, p), LONG_PRESS_MS),
      };
      return;
    }

    e.preventDefault();
    const now = Date.now();
    const last = lastDownRef.current;
    lastDownRef.current = { id: nodeId, time: now };
    if (last && last.id === nodeId && now - last.time < DOUBLE_CLICK_MS) {
      // Second press of a double-click on the same vertex: pick it up instead
      // of starting another edge. A third press starts over rather than
      // re-arming, so a rapid triple-click can't drop and re-grab.
      lastDownRef.current = null;
      beginMove(nodeId, grab, p);
      return;
    }
    setDrag({ fromId: nodeId, x: p.x, y: p.y });
  };

  const handleMove = (e) => {
    if (movingRef.current) {
      const p = toSvgPoint(e.clientX, e.clientY);
      const m = movingRef.current;
      // Clamped so a vertex can't be parked outside the canvas, where it would
      // be invisible and unrecoverable.
      const next = {
        ...m,
        x: clamp(p.x + m.dx, RADIUS + 2, WIDTH - RADIUS - 2),
        y: clamp(p.y + m.dy, RADIUS + 2, HEIGHT - RADIUS - 2),
      };
      movingRef.current = next;
      setMoving(next);
      return;
    }

    const press = pressRef.current;
    if (press && Math.hypot(e.clientX - press.clientX, e.clientY - press.clientY) > PRESS_SLOP_PX) {
      cancelPress();
    }

    if (!drag) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : d));
  };

  const handleUp = (e) => {
    cancelPress();
    if (movingRef.current) {
      endMove();
      // A drag that ends on the vertex it started on still emits a click.
      suppressTapRef.current = true;
      return;
    }
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

  const handleCancel = () => {
    cancelPress();
    // A cancelled pointer still leaves the vertex where it had been dragged to;
    // silently springing it back to the ring would read as a bug.
    if (movingRef.current) endMove();
    setDrag(null);
  };

  const isVisited = (id) => step.visited && step.visited.includes(id);
  const isActive = (id) => step.active && step.active.includes(id);
  const isCurrent = (id) => step.current === id;
  const isPending = (id) => step.pending === id;
  const isRemoving = (id) => step.removing === id;
  const isActiveEdge = (id) => step.activeEdges && step.activeEdges.includes(id);
  const isTreeEdge = (id) => step.treeEdges && step.treeEdges.includes(id);

  const hint = moving
    ? isMobile
      ? "DRAG TO REPOSITION · LIFT YOUR FINGER TO DROP"
      : "DRAG TO REPOSITION · RELEASE TO DROP"
    : isMobile
      ? pendingLink
        ? "NOW TAP THE VERTEX TO CONNECT IT TO"
        : "TAP TWO VERTICES TO CONNECT · HOLD ONE TO MOVE IT"
      : "DRAG BETWEEN VERTICES TO CONNECT · DOUBLE-CLICK AND DRAG TO MOVE ONE";

  return (
    <div className="panel canvas graph-canvas">
      <div className="canvas__note graph-canvas__note">
        <span>{hint}</span>
        {hasCustomLayout && (
          <button type="button" className="graph-canvas__reset mono" onClick={onResetLayout}>
            RESET LAYOUT
          </button>
        )}
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
          onPointerCancel={handleCancel}
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
            const isMoving = moving?.id === node.id;

            return (
              <g
                key={node.id}
                className={`graph-node${isMoving ? " graph-node--moving" : ""}`}
                onClick={isMobile ? () => handleNodeTap(node.id) : undefined}
                onPointerDown={(e) => handleNodeDown(e, node.id)}
              >
                {isMoving && <circle cx={node.x} cy={node.y} r={RADIUS + 7} className="graph-node__halo" />}
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