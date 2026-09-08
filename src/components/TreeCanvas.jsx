import { useCallback, useEffect, useRef, useState } from "react";
import { avlBalanceFactor, describeNode } from "../dataStructures/tree/helpers";
import { computeThreads, isDoubleThreaded } from "../dataStructures/tree/threads";
import { useIsMobile } from "../hooks/useMediaQuery.js";
import { usePanZoom, useWheelZoom } from "../hooks/usePanZoom.js";

const RADIUS = 20;
const HEIGHT = 300;
// A wide tree is drawn wide and then navigated, rather than squeezed: the slot
// per node is what keeps two nodes from sharing a pixel at any depth, and the
// pan/zoom is what makes the result reachable on a screen narrower than it.
const MOBILE_SLOT = 54;
const MOBILE_MIN_WIDTH = 300;

// How long a finger has to rest before the press becomes a gesture of its own
// — deleting the node under it, or inserting on empty canvas. Shared with the
// graph deliberately: one press-and-hold means "act on this" everywhere.
const LONG_PRESS_MS = 400;
// A finger is never perfectly still; anything past this (in CSS pixels) is a
// pan, not a press, and cancels the pending gesture.
const PRESS_SLOP_PX = 10;
// A trackpad pinch arrives as a wheel event with ctrlKey set, and at a much
// finer grain than a mouse wheel's notches.
const WHEEL_STEP = 0.0016;
const PINCH_STEP = 0.0035;
// How long after one press a second one still counts as a double, and how far
// it may land from the first. Both are looser than the browser's own dblclick,
// which is the point: a second press is never a pan, so nothing is lost by
// accepting an imprecise one, and a missed double-click reads as the canvas
// ignoring you.
const DOUBLE_PRESS_MS = 450;
const DOUBLE_PRESS_SLOP_PX = 26;
// Keeps the value box off the canvas edge, so a press in a corner still opens
// one that can be read and typed into.
const INSERT_EDGE_PAD = 52;
// How long after opening the value box ignores a blur. Long enough to outlast
// the focus change the opening press itself causes, short enough that it is
// still the same gesture.
const BLUR_GRACE_MS = 350;

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

/** One labelled fact in the inspector. */
function Fact({ label, value, warn = false }) {
  return (
    <span className="tree-inspect__fact">
      <span className="tree-inspect__label">{label}</span>
      <span className={`tree-inspect__datum${warn ? " tree-inspect__datum--warn" : ""}`}>{value}</span>
    </span>
  );
}

export default function TreeCanvas({ step, treeType, threadMode, onSelectNode, onDeleteNode, onInsertValue }) {
  const isMobile = useIsMobile();
  const root = step.root;
  const nodes = flattenNodes(root);
  const WIDTH = isMobile ? Math.max(MOBILE_MIN_WIDTH, nodes.length * MOBILE_SLOT) : 640;
  const positions = layout(root, WIDTH);

  // A callback ref rather than a ref object: the canvas is not rendered until
  // there is a tree to draw, and the effects that attach the wheel and
  // touchmove listeners have to run when it appears, not before it exists.
  const [svgEl, setSvgEl] = useState(null);
  const { transform, ref: viewRef, reset, zoomAt, panBy } = usePanZoom();
  // A tree edited by gesture is still a tree the sidebar can edit, so the two
  // have to agree on which node is being talked about.
  const [picked, setPicked] = useState(null);
  const [inserting, setInserting] = useState(null);
  const [draft, setDraft] = useState("");
  const insertRef = useRef(null);

  const gestures = Boolean(onSelectNode || onDeleteNode || onInsertValue);
  // Recomputed from the frame's own tree, so the facts follow the run: step
  // through a rebalance with a node selected and its depth and height change
  // under it, which is the thing a still picture of the finished tree never
  // shows.
  const inspected = picked ? describeNode(root, picked, treeType) : null;

  // Pointer bookkeeping for the whole canvas: a pan, a pinch and a long press
  // are all "a pointer went down and something happened next", and telling
  // them apart needs the ones still down and where they started.
  const pointers = useRef(new Map());
  const pressTimer = useRef(null);
  const pinchDist = useRef(0);
  const panning = useRef(false);
  const lastPress = useRef({ at: 0, x: 0, y: 0 });

  const cancelPress = useCallback(() => {
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }, []);

  useEffect(() => cancelPress, [cancelPress]);

  // A tree that has been replaced outright — a new random one, a different
  // type, an undo — is not the one the reader had zoomed into, so the view
  // goes back to showing all of it rather than stranding them over blank
  // canvas where a subtree used to be.
  useEffect(() => {
    reset();
    setPicked(null);
    setInserting(null);
  }, [treeType, reset]);

  useEffect(() => {
    if (inserting) insertRef.current?.focus();
  }, [inserting]);

  /** Element coordinates to the SVG's own, undoing the current pan and zoom. */
  const toSvg = useCallback(
    (clientX, clientY) => {
      const rect = svgEl?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      // The viewBox is fitted with the default `xMidYMid meet`, so the drawing
      // is scaled by whichever axis runs out first and centred in the slack of
      // the other. Both have to be undone or the gesture lands somewhere else
      // on a panel that isn't the viewBox's shape.
      const fit = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
      const vx = (clientX - rect.left - (rect.width - WIDTH * fit) / 2) / fit;
      const vy = (clientY - rect.top - (rect.height - HEIGHT * fit) / 2) / fit;
      const t = viewRef.current;
      return { x: (vx - t.x) / t.k, y: (vy - t.y) / t.k, vx, vy };
    },
    [WIDTH, viewRef, svgEl]
  );

  useWheelZoom(
    svgEl,
    (e) => {
      const { vx, vy } = toSvg(e.clientX, e.clientY);
      const step = e.ctrlKey ? PINCH_STEP : WHEEL_STEP;
      zoomAt(Math.exp(-e.deltaY * step), vx, vy);
    },
    gestures
  );

  // A finger panning the canvas would otherwise scroll the page, and
  // `touch-action` cannot stop it here — it is ignored on SVG children, so the
  // listener has to refuse the scroll itself, which needs to be non-passive
  // and therefore cannot go through React.
  useEffect(() => {
    if (!svgEl || !gestures) return undefined;
    const refuse = (e) => e.preventDefault();
    svgEl.addEventListener("touchmove", refuse, { passive: false });
    return () => svgEl.removeEventListener("touchmove", refuse);
  }, [svgEl, gestures]);

  /**
   * Open the value box where the press landed.
   *
   * The position is kept in the stage's own pixels, not the SVG's coordinates.
   * The viewBox is fitted with `xMidYMid meet`, so its coordinates only cover
   * the letterboxed strip the drawing actually occupies — treating them as a
   * fraction of the panel put the box wherever the letterboxing happened to be
   * that render, which is why it appeared to land at random. It is also
   * clamped, so a press near an edge opens a box that is still on screen.
   */
  const openInsert = (clientX, clientY) => {
    const rect = svgEl?.getBoundingClientRect();
    if (!rect) return;
    setInserting({
      sx: Math.min(rect.width - INSERT_EDGE_PAD, Math.max(INSERT_EDGE_PAD, clientX - rect.left)),
      sy: Math.min(rect.height - INSERT_EDGE_PAD, Math.max(INSERT_EDGE_PAD, clientY - rect.top)),
      at: performance.now(),
    });
    setDraft("");
  };

  const midpoint = () => {
    const pts = [...pointers.current.values()];
    return {
      x: (pts[0].vx + pts[1].vx) / 2,
      y: (pts[0].vy + pts[1].vy) / 2,
      d: Math.hypot(pts[0].vx - pts[1].vx, pts[0].vy - pts[1].vy),
    };
  };

  const handlePointerDown = (e, nodeId) => {
    if (!gestures) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toSvg(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, {
      ...p,
      clientX: e.clientX,
      clientY: e.clientY,
      downX: e.clientX,
      downY: e.clientY,
      nodeId,
    });

    if (pointers.current.size === 2) {
      // A second finger turns whatever was happening into a pinch.
      cancelPress();
      panning.current = false;
      pinchDist.current = midpoint().d;
      return;
    }

    panning.current = !nodeId;
    setInserting(null);

    // Hold to act. On a cursor the same intent is a double-click or a
    // triple-click, because a mouse held still is how a menu opens, not how a
    // node is deleted.
    if (!isMobile) {
      // The second press of a double-click is counted here rather than left to
      // the browser's `dblclick`. That event is strict about how far the
      // pointer may drift between the two presses and about nothing else
      // intervening, and this canvas captures the pointer and re-renders on
      // every press — so it was being missed often enough to feel broken. The
      // window and the radius below are deliberately generous: a press meant
      // as the second of a pair is never a pan, so there is nothing to lose by
      // accepting a sloppy one.
      const since = e.timeStamp - lastPress.current.at;
      const near = Math.hypot(e.clientX - lastPress.current.x, e.clientY - lastPress.current.y);
      if (!nodeId && since < DOUBLE_PRESS_MS && near < DOUBLE_PRESS_SLOP_PX) {
        // Refuse the compatibility mouse events this press would otherwise
        // generate. Their default action moves focus to the canvas, and it
        // lands *after* the box below has mounted and focused its input — so
        // the gesture that opens the box was the same one that blurred it shut
        // again, milliseconds later. Touch never showed this, because a tap
        // does not drive focus the same way.
        e.preventDefault();
        lastPress.current = { at: 0, x: 0, y: 0 };
        panning.current = false;
        openInsert(e.clientX, e.clientY);
        return;
      }
      lastPress.current = { at: e.timeStamp, x: e.clientX, y: e.clientY };
      return;
    }

    cancelPress();
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      panning.current = false;
      if (nodeId) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) onDeleteNode?.(node.value);
      } else {
        openInsert(e.clientX, e.clientY);
      }
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e) => {
    if (!gestures) return;
    const rec = pointers.current.get(e.pointerId);
    if (!rec) return;
    const p = toSvg(e.clientX, e.clientY);
    const dx = p.vx - rec.vx;
    const dy = p.vy - rec.vy;
    Object.assign(rec, p, { clientX: e.clientX, clientY: e.clientY });

    if (pointers.current.size === 2) {
      const m = midpoint();
      if (pinchDist.current > 0) zoomAt(m.d / pinchDist.current, m.x, m.y);
      pinchDist.current = m.d;
      return;
    }

    // Distance from where the pointer went down, not from the last move: a
    // slow drag never travels far enough in one event to cancel the press, and
    // would otherwise sit there until the hold fired underneath it.
    if (Math.hypot(e.clientX - rec.downX, e.clientY - rec.downY) > PRESS_SLOP_PX) cancelPress();
    if (panning.current) panBy(dx, dy);
  };

  const handlePointerUp = (e, nodeId) => {
    if (!gestures) return;
    const rec = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
    const wasPress = pressTimer.current !== null;
    cancelPress();
    panning.current = false;
    if (!rec) return;

    // A tap on a node names it — but only a tap. A pointer that travelled was
    // panning, and on a phone a press whose timer has already fired has done
    // its gesture (it deleted the node) and must not also count as a tap;
    // `wasPress` is still true exactly when the timer had not yet fired.
    const travelled = Math.hypot(e.clientX - rec.downX, e.clientY - rec.downY);
    if (!nodeId || travelled > PRESS_SLOP_PX) return;
    if (isMobile && !wasPress) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setPicked(node.id);
    onSelectNode?.(node.value);
  };

  const commitInsert = () => {
    const value = parseInt(draft, 10);
    setInserting(null);
    setDraft("");
    if (!Number.isNaN(value)) onInsertValue?.(value);
  };
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

  const hint = inserting
    ? "TYPE A VALUE · ENTER TO INSERT · ESC TO CANCEL"
    : isMobile
      ? // "SPACE" on a phone reads as the spacebar, which is not there. Each
        // gesture names what it acts on instead: a node, or the canvas around
        // one.
        "TAP A NODE TO INSPECT · LONG-PRESS A NODE TO DELETE · LONG-PRESS EMPTY CANVAS TO INSERT · DRAG TO PAN · PINCH TO ZOOM"
      : "CLICK A NODE TO INSPECT · TRIPLE-CLICK A NODE TO DELETE · DOUBLE-CLICK EMPTY CANVAS TO INSERT · DRAG TO PAN · SCROLL TO ZOOM";

  const moved = transform.k !== 1 || transform.x !== 0 || transform.y !== 0;

  return (
    <div className="panel canvas graph-canvas tree-canvas">
      {gestures && root && (
        <div className="canvas__note graph-canvas__note">
          <span>{hint}</span>
        </div>
      )}
      {!root && !gestures ? (
        <div className="ll-empty mono" style={{ justifyContent: "center", width: "100%" }}>
          {"EMPTY TREE \u2014 INSERT A VALUE TO BEGIN"}
        </div>
      ) : (
        <div className="tree-canvas__stage">
          <svg
            ref={setSvgEl}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={`graph-svg ${gestures ? "graph-svg--grab" : ""}`}
            onPointerDown={(e) => handlePointerDown(e, null)}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e, null)}
            onPointerCancel={(e) => handlePointerUp(e, null)}
          >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
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
                    filter: lit ? "drop-shadow(0 0 5px rgb(var(--primary-rgb) / 0.5))" : "none",
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
                fill = "rgb(var(--green-rgb) / 0.14)";
              }
              if (isOnPath(node.id)) {
                stroke = "var(--blue)";
                fill = "rgb(var(--blue-rgb) / 0.18)";
              }
              if (isCurrent(node.id) || isActive(node.id)) {
                stroke = "var(--primary)";
                fill = "rgb(var(--primary-rgb) / 0.2)";
                glow = "rgb(var(--primary-rgb) / 0.55)";
              }

              // A red-black node's colour IS its data — it decides every
              // rotation — so it wins over the default fill. Highlights still
              // override it, because knowing which node the step is talking
              // about matters more for one frame than knowing its colour.
              const rbColor = node.color;
              if (rbColor && !isCurrent(node.id) && !isActive(node.id) && !isOnPath(node.id)) {
                if (rbColor === "R") {
                  fill = "rgb(var(--red-rgb) / 0.28)";
                  stroke = "var(--red)";
                } else {
                  fill = "rgb(var(--ink-rgb) / 0.06)";
                  stroke = "var(--text-dim)";
                }
              }

              // The node the reader last named. It is a ring outside the
              // circle rather than another fill, because a step's own
              // highlight is what the run is saying and must not be painted
              // over by a selection the reader made before pressing play.
              const isPicked = picked === node.id;

              return (
                <g key={node.id}>
                  {isPicked && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={RADIUS + 4}
                      style={{ fill: "none", stroke: "var(--primary)", strokeWidth: 1.5, strokeDasharray: "3 3", opacity: 0.9 }}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={RADIUS}
                    className={gestures ? "tree-node--hit" : undefined}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handlePointerDown(e, node.id);
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      handlePointerUp(e, node.id);
                    }}
                    // Three clicks to delete, matching the graph. Two is what
                    // a reader does by accident when a click already means
                    // something; three is unambiguously deliberate.
                    onClick={(e) => {
                      if (!gestures || isMobile || e.detail < 3) return;
                      onDeleteNode?.(node.value);
                    }}
                    style={{
                      fill,
                      stroke,
                      strokeWidth: 2,
                      filter: glow ? `drop-shadow(0 0 6px ${glow})` : "none",
                    }}
                  />
                  {/* A treap's priority is the other half of what it is: keys
                      obey the search rule, priorities obey the heap rule. */}
                  {node.priority !== undefined && (
                    <text
                      x={pos.x}
                      y={pos.y - RADIUS - 6}
                      textAnchor="middle"
                      className="tree-priority mono"
                    >
                      {node.priority}
                    </text>
                  )}
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
          </g>
          </svg>

          {/* The message sits over the canvas rather than replacing it: the
              gesture that makes the first node is a press on the canvas, so
              there has to be a canvas to press even with nothing on it. */}
          {!root && (
            <div className="graph-canvas__empty mono">
              {isMobile
                ? "EMPTY TREE — LONG-PRESS ANYWHERE TO INSERT"
                : "EMPTY TREE — DOUBLE-CLICK ANYWHERE TO INSERT"}
            </div>
          )}

          {moved && (
            <button type="button" className="btn tree-canvas__reset mono" onClick={reset}>
              RESET VIEW
            </button>
          )}

          {inserting && (
            <form
              className="tree-canvas__insert"
              style={{ left: `${inserting.sx}px`, top: `${inserting.sy}px` }}
              onSubmit={(e) => {
                e.preventDefault();
                commitInsert();
              }}
            >
              <input
                ref={insertRef}
                className="input mono"
                inputMode="numeric"
                value={draft}
                placeholder="value"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setInserting(null);
                }}
                // A press that landed somewhere else was a change of mind,
                // not an insert of whatever had been typed. Guarded by the
                // moment it opened: the press that opens the box is itself
                // capable of blurring it, and a box that closes before it can
                // be typed into is worse than one that outstays its welcome.
                onBlur={() => {
                  if (performance.now() - inserting.at > BLUR_GRACE_MS) setInserting(null);
                }}
              />
            </form>
          )}
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

      {/* Below the drawing rather than floating over it, like the thread
          legend: the tree fills its box at every depth, so any card placed on
          the canvas covers the siblings you selected the node to compare it
          against. */}
      {inspected && (
        <div className="tree-inspect mono">
          <span className="tree-inspect__value">{inspected.value}</span>
          <Fact label="DEPTH" value={inspected.depth} />
          <Fact label="HEIGHT" value={inspected.height} />
          <Fact label="SUBTREE" value={inspected.size} />
          {inspected.balance !== undefined && (
            <Fact
              label="BALANCE"
              value={`${inspected.balance > 0 ? "+" : ""}${inspected.balance}`}
              warn={Math.abs(inspected.balance) > 1}
            />
          )}
          {inspected.color && <Fact label="COLOUR" value={inspected.color} />}
          {inspected.blackHeight !== undefined && <Fact label="BLACK-HEIGHT" value={inspected.blackHeight} />}
          {inspected.priority !== undefined && <Fact label="PRIORITY" value={inspected.priority} />}
          <Fact label="PARENT" value={inspected.isRoot ? "none (root)" : inspected.parent} />
          <Fact
            label="CHILDREN"
            value={
              inspected.isLeaf
                ? "none (leaf)"
                : [inspected.left ?? "—", inspected.right ?? "—"].join(" / ")
            }
          />
          <button type="button" className="tree-inspect__clear" onClick={() => setPicked(null)}>
            CLEAR
          </button>
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && !step.resultBadge && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
