import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "../hooks/useMediaQuery.js";

// A phone is portrait, so the ring of vertices is laid out tall-and-narrow
// there — the landscape viewBox would otherwise scale down to letterbox-sized
// nodes on a 360px screen. rx/ry are given rather than derived so the phone's
// ring can stretch into an ellipse that fills a portrait canvas, while the
// desktop one stays circular.
const DESKTOP_VIEW = { width: 640, height: 300, radius: 22, rx: 104, ry: 104 };
const MOBILE_VIEW = { width: 330, height: 370, radius: 21, rx: 118, ry: 138 };

// How long a finger has to rest before the press becomes a gesture of its own
// — picking a vertex up, or dropping a new one on empty canvas.
const LONG_PRESS_MS = 400;
// A finger is never perfectly still; anything past this (in CSS pixels) is a
// scroll, not a press, and cancels the pending gesture.
const PRESS_SLOP_PX = 10;
// A cursor is steady enough that this only separates a click from a drag,
// which is what lets one press both connect and move.
const DRAG_THRESHOLD_PX = 3;

// The loop's shape, measured in its own frame: how much of the rim it stands
// on, and where its two control points sit — along the loop's axis, and out to
// either side of it. The last two are multiples of the vertex radius, so the
// loop shrinks with the phone's smaller vertices instead of swamping them.
const LOOP_SPREAD = 0.5; // radians, half the footprint on the rim
const LOOP_CTRL_OUT = 2.31;
const LOOP_CTRL_WIDE = 1.15;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * A self-loop has no far endpoint to run to, so it is drawn as a loop that
 * leaves the vertex's rim and comes back to it.
 *
 * It points away from the centre of the canvas, which on the default ring is
 * the side with no other edges on it — but a vertex near an edge of the canvas
 * would have its loop hanging off, so the direction turns away from outward in
 * steps until the loop lands back inside.
 */
function selfLoopPath(node, radius, { width, height }, directed) {
  const outward = Math.atan2(node.y - height / 2, node.x - width / 2);
  // Where the curve actually peaks — a cubic at t = 0.5 — rather than where
  // its control points are, which is nowhere the loop ever reaches.
  const tip = (radius * (2 * Math.cos(LOOP_SPREAD) + 6 * LOOP_CTRL_OUT)) / 8;

  let angle = outward;
  for (const turn of [0, 0.7, -0.7, 1.4, -1.4, 2.1, -2.1, Math.PI]) {
    const x = node.x + tip * Math.cos(outward + turn);
    const y = node.y + tip * Math.sin(outward + turn);
    if (x > 2 && x < width - 2 && y > 2 && y < height - 2) {
      angle = outward + turn;
      break;
    }
  }

  // The loop's own frame: `out` runs along it, `side` across it.
  const ox = Math.cos(angle);
  const oy = Math.sin(angle);
  const at = (out, side) => [node.x + out * ox - side * oy, node.y + out * oy + side * ox];

  // The arrowhead's tip lands just off the rim, where a directed edge's does.
  const endScale = directed ? (radius + 3) / radius : 1;
  const rimOut = radius * Math.cos(LOOP_SPREAD);
  const rimSide = radius * Math.sin(LOOP_SPREAD);
  const [x1, y1] = at(rimOut, -rimSide);
  const [x2, y2] = at(rimOut * endScale, rimSide * endScale);
  const [c1x, c1y] = at(radius * LOOP_CTRL_OUT, -radius * LOOP_CTRL_WIDE);
  const [c2x, c2y] = at(radius * LOOP_CTRL_OUT, radius * LOOP_CTRL_WIDE);
  const [labelX, labelY] = at(tip, 0);

  return {
    d: `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`,
    // On the loop's crown, so the badge sits on the curve exactly as a
    // straight edge's sits on its line.
    labelX,
    labelY,
  };
}

function EdgeWeight({ x, y, weight }) {
  return (
    <g>
      <rect x={x - 11} y={y - 9} width={22} height={16} rx={4} style={{ fill: "var(--bg)", opacity: 0.85 }} />
      <text x={x} y={y + 3} textAnchor="middle" className="graph-edge-label mono">
        {weight}
      </text>
    </g>
  );
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
  onAddVertexAt,
  onHoverVertex,
  onDeleteVertex,
}) {
  const isMobile = useIsMobile();
  const view = isMobile ? MOBILE_VIEW : DESKTOP_VIEW;
  const { width: WIDTH, height: HEIGHT, radius: RADIUS } = view;

  const nodes = step.nodes || [];
  const edges = step.edges || [];

  const svgRef = useRef(null);
  const [linkFrom, setLinkFrom] = useState(null); // click/tap-to-connect
  // The vertex currently being repositioned. Its live coordinates are kept
  // here rather than pushed up on every pointermove: the committed position
  // only matters once it lands, and re-rendering just this canvas per frame
  // keeps the drag smooth even with a big adjacency matrix alongside it.
  const [moving, setMoving] = useState(null); // { id, dx, dy, x, y }

  const movingRef = useRef(null);
  // The press in progress, before it has become anything: { kind: "node" |
  // "space", id, grab, clientX, clientY, timer }. What resolves it differs by
  // input — a cursor by moving far enough, a finger by resting long enough.
  const pressRef = useRef(null);
  const suppressClickRef = useRef(false);

  // A vertex that was tapped and then deleted must not stay armed.
  const pendingLink = nodes.some((n) => n.id === linkFrom) ? linkFrom : null;
  const hasNodes = nodes.length > 0;

  const laidOut = layout(nodes, view, positions);
  // Max flow writes "flow/capacity" onto every edge, which is unreadable if
  // the weighted toggle happens to be off — so a frame can ask for labels.
  const showWeights = weighted || step.showWeights;
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
  }, []);

  const cancelPress = () => {
    if (pressRef.current) clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };

  // Leaving the graph view mid-press must not pick a vertex up afterwards.
  useEffect(() => () => cancelPress(), []);

  const beginMove = (nodeId, grab, p) => {
    cancelPress();
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

  // A press can land in the margin the viewBox is letterboxed inside, which is
  // indistinguishable from the canvas but maps to a coordinate outside it.
  // Clamping here keeps a stored fraction meaningful — it ends up in the
  // shared link, where a negative one would be nothing but noise.
  const toFraction = (p) => ({
    nx: clamp(p.x, RADIUS + 2, WIDTH - RADIUS - 2) / WIDTH,
    ny: clamp(p.y, RADIUS + 2, HEIGHT - RADIUS - 2) / HEIGHT,
  });

  const endMove = () => {
    const m = movingRef.current;
    movingRef.current = null;
    setMoving(null);
    if (m) onMoveVertex?.(m.id, m.x / WIDTH, m.y / HEIGHT);
    return m;
  };

  // Two vertices are connected by picking one and then the other, on both a
  // cursor and a finger. Dragging is what moves a vertex, so it can't also be
  // what draws an edge, and touch could never drag-to-connect anyway: the
  // browser claims a finger drag off an SVG shape as a page scroll. Picking
  // the same vertex twice names it as both endpoints, which is a self-loop.
  const handleNodeClick = (e, nodeId) => {
    // The click a drag leaves behind is not a click on the vertex.
    if (suppressClickRef.current) return;

    // Third click of a triple. `detail` is the browser's own count of clicks
    // in one burst, so this uses the same interval the OS calls a double
    // click rather than inventing a second timing rule.
    if (e.detail >= 3) {
      setLinkFrom(null);
      onDeleteVertex?.(nodeId);
      return;
    }

    if (pendingLink === null) setLinkFrom(nodeId);
    else if (pendingLink === nodeId) {
      // Inside a burst, this is the second click of a double- or triple-click,
      // both of which mean something else on a cursor — only a click standing
      // on its own makes the loop, so a double-click still just disarms. Touch
      // has no rival gesture here, and its synthesized clicks don't carry a
      // reliable count anyway.
      if (isMobile || e.detail === 1) onCreateEdge?.(nodeId, nodeId);
      setLinkFrom(null);
    } else {
      onCreateEdge?.(pendingLink, nodeId);
      setLinkFrom(null);
    }
  };

  // Pointer (not mouse) events so a stylus works like a cursor too.
  const handleNodeDown = (e, nodeId) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toSvgPoint(e.clientX, e.clientY);
    const node = posById[nodeId];
    // Grab offset, so a vertex picked up by its rim doesn't jump to put its
    // centre under the pointer.
    const grab = node ? { dx: node.x - p.x, dy: node.y - p.y } : { dx: 0, dy: 0 };
    suppressClickRef.current = false;
    cancelPress();
    // Deliberately no preventDefault: connecting two vertices now depends on
    // the click that follows this press, and suppressing a pointerdown's
    // default action is specified to swallow the compatibility mouse events.
    // Text selection during a drag is held off by user-select in the CSS
    // instead, which costs nothing here.

    pressRef.current = {
      kind: "node",
      id: nodeId,
      grab,
      clientX: e.clientX,
      clientY: e.clientY,
      // A finger has to commit to holding, because the alternative reading of
      // a finger on a vertex is a page scroll. A cursor has no such rival, so
      // it picks the vertex up the moment it moves — see handleMove.
      timer: isMobile ? setTimeout(() => beginMove(nodeId, grab, p), LONG_PRESS_MS) : null,
    };
  };

  // Presses that land on the canvas itself rather than on a vertex. Node
  // presses bubble through here too, hence the guard.
  const handleSvgDown = (e) => {
    if (e.target.closest?.(".graph-node")) return;
    // Whatever the last gesture left behind, this one starts clean.
    suppressClickRef.current = false;
    if (!isMobile) return; // a cursor makes a vertex by double-clicking
    cancelPress();
    const p = toSvgPoint(e.clientX, e.clientY);
    pressRef.current = {
      kind: "space",
      clientX: e.clientX,
      clientY: e.clientY,
      timer: setTimeout(() => {
        pressRef.current = null;
        suppressClickRef.current = true;
        navigator.vibrate?.(12);
        const f = toFraction(p);
        onAddVertexAt?.(f.nx, f.ny);
      }, LONG_PRESS_MS),
    };
  };

  // A cursor adds a vertex where it double-clicks, which is free now that
  // nothing else claims a double-click on the canvas.
  const handleSvgDoubleClick = (e) => {
    if (isMobile || e.target.closest?.(".graph-node")) return;
    const f = toFraction(toSvgPoint(e.clientX, e.clientY));
    onAddVertexAt?.(f.nx, f.ny);
  };

  // Clicking past the vertices calls off a half-made edge — the only way out
  // of an armed vertex other than clicking it again.
  const handleSvgClick = (e) => {
    if (e.target.closest?.(".graph-node")) return;
    if (suppressClickRef.current) return;
    setLinkFrom(null);
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
    if (!press) return;
    const travelled = Math.hypot(e.clientX - press.clientX, e.clientY - press.clientY);

    if (isMobile) {
      // The finger is going somewhere, so it was a scroll, not a hold.
      if (travelled > PRESS_SLOP_PX) cancelPress();
      return;
    }
    if (press.kind === "node" && travelled > DRAG_THRESHOLD_PX) {
      beginMove(press.id, press.grab, toSvgPoint(e.clientX, e.clientY));
    }
  };

  const handleUp = () => {
    cancelPress();
    if (!movingRef.current) return; // a press that never moved is a click
    endMove();
    // A drag ends over the vertex it started on, so a click follows it.
    suppressClickRef.current = true;
  };

  const handleCancel = () => {
    cancelPress();
    // A cancelled pointer still leaves the vertex where it had been dragged to;
    // silently springing it back to the ring would read as a bug.
    if (movingRef.current) endMove();
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
        ? "NOW TAP THE VERTEX TO CONNECT IT TO · OR THIS ONE AGAIN FOR A SELF-LOOP"
        : "TAP TWO VERTICES TO CONNECT · HOLD ONE TO MOVE IT · HOLD SPACE TO ADD ONE"
      : pendingLink
        ? "NOW CLICK THE VERTEX TO CONNECT IT TO · OR THIS ONE AGAIN FOR A SELF-LOOP"
        : "CLICK TWO TO CONNECT · DRAG TO MOVE · TRIPLE-CLICK TO DELETE · DOUBLE-CLICK SPACE TO ADD";

  return (
    <div className="panel canvas graph-canvas">
      <div className="canvas__note graph-canvas__note">
        <span>{hint}</span>
      </div>

      {/* The canvas is drawn even with nothing on it, because the gesture that
          makes the first vertex is a press on the canvas itself. */}
      <div className="graph-canvas__stage">
        {!hasNodes && (
          <div className="graph-canvas__empty mono">
            {isMobile
              ? "EMPTY GRAPH \u2014 HOLD ANYWHERE TO ADD A VERTEX"
              : "EMPTY GRAPH \u2014 DOUBLE-CLICK ANYWHERE TO ADD A VERTEX"}
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={`graph-svg ${isMobile ? "graph-svg--portrait" : ""}`}
          onPointerDown={handleSvgDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleCancel}
          onClick={handleSvgClick}
          onDoubleClick={handleSvgDoubleClick}
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
            const stroke = active ? "var(--blue)" : inTree ? "var(--green)" : "var(--border-strong)";
            const strokeWidth = active || inTree ? 2.5 : 1.6;
            const markerEnd = directed
              ? `url(#${active ? "graph-arrow-active" : inTree ? "graph-arrow-tree" : "graph-arrow"})`
              : undefined;

            if (edge.from === edge.to) {
              const loop = selfLoopPath(from, RADIUS, view, directed);
              return (
                <g key={edge.id}>
                  <path d={loop.d} fill="none" style={{ stroke }} strokeWidth={strokeWidth} markerEnd={markerEnd} />
                  {showWeights && <EdgeWeight x={loop.labelX} y={loop.labelY} weight={edge.weight} />}
                </g>
              );
            }

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
                  style={{ stroke }}
                  strokeWidth={strokeWidth}
                  markerEnd={markerEnd}
                />
                {showWeights && <EdgeWeight x={midX} y={midY} weight={edge.weight} />}
              </g>
            );
          })}

          {positioned.map((node) => {
            let stroke = "var(--border-strong)";
            let fill = "var(--panel-alt)";
            let glow = null;

            if (isVisited(node.id)) {
              stroke = "var(--green)";
              fill = "rgb(var(--green-rgb) / 0.14)";
            }
            if (isActive(node.id)) {
              stroke = "var(--blue)";
              fill = "rgb(var(--blue-rgb) / 0.18)";
              glow = "rgb(var(--blue-rgb) / 0.5)";
            }
            if (isCurrent(node.id) || isPending(node.id)) {
              stroke = "var(--primary)";
              fill = "rgb(var(--primary-rgb) / 0.2)";
              glow = "rgb(var(--primary-rgb) / 0.55)";
            }
            if (isRemoving(node.id)) {
              stroke = "var(--red)";
              fill = "rgb(var(--red-rgb) / 0.22)";
              glow = "rgb(var(--red-rgb) / 0.5)";
            }
            const armed = pendingLink === node.id;
            if (armed) {
              stroke = "var(--primary)";
              glow = "rgb(var(--primary-rgb) / 0.55)";
            }
            const isMoving = moving?.id === node.id;

            return (
              <g
                key={node.id}
                className={`graph-node${isMoving ? " graph-node--moving" : ""}`}
                onClick={(e) => handleNodeClick(e, node.id)}
                onPointerDown={(e) => handleNodeDown(e, node.id)}
                // Ctrl+C copies the vertex under the cursor, or the whole
                // graph when the cursor is on none.
                onPointerEnter={() => onHoverVertex?.({ id: node.id, nx: node.x / WIDTH, ny: node.y / HEIGHT })}
                onPointerLeave={() => onHoverVertex?.(null)}
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
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && !step.resultBadge && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}