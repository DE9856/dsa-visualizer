import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import ListNode from "./ListNode.jsx";
import { forwardChain, backwardChain } from "../dataStructures/linkedList";

// How far below the row the wrap-around link swings before it comes back up.
// The curve reaches roughly three quarters of this, and the row reserves the
// whole of it so the link never draws over the message underneath.
const LOOP_DROP = 44;

// Below this much horizontal travel the link is doubling back on itself rather
// than crossing the row, and gets bowed outward by LOOP_SPREAD to stay legible.
const TIGHT_LOOP_PX = 80;
const LOOP_SPREAD = 30;

// The route taken when the row has wrapped and the head is on an earlier line:
// down into a lane under the tail, left into a gutter beside the block, up it,
// and back in through the head's left edge. The gutter is negative because it
// runs outside the row, in the canvas's own padding.
const LANE_DROP = 22;
const GUTTER_X = -10;
const CORNER = 10;

/**
 * Offset of an element inside an ancestor, walked up the `offsetParent` chain.
 *
 * Deliberately not `getBoundingClientRect`: a pending node pulses with a CSS
 * `scale`, and a rect includes that transform — the link back to the head
 * would twitch in and out with the animation. `offsetTop`/`offsetLeft` are
 * layout positions and ignore transforms entirely.
 */
function offsetIn(el, ancestor) {
  let x = 0;
  let y = 0;
  let node = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y };
}

/**
 * The tail's `next` pointer, drawn as the link it actually is rather than
 * captioned as one. It leaves the bottom of the tail's own `next` field, drops
 * into a lane under the row and comes back up into the head — so it still
 * reads when the row has wrapped onto several lines and the head is nowhere
 * near the tail.
 */
function useWrapLink({ enabled, nodes, headId, tailId }) {
  const wrapRef = useRef(null);
  const [link, setLink] = useState(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!enabled || !wrap) {
      setLink(null);
      return;
    }
    const headEl = wrap.querySelector(`[data-ll-node="${headId}"]`);
    const tailEl = wrap.querySelector(`[data-ll-node="${tailId}"]`);
    if (!headEl || !tailEl) {
      setLink(null);
      return;
    }

    // The last cell of a node is its `next` field, whether or not there is a
    // `prev` field in front of the data — so the link leaves the very box that
    // holds the pointer it is drawing.
    const nextCell = tailEl.lastElementChild ?? tailEl;
    const from = offsetIn(nextCell, wrap);
    const to = offsetIn(headEl, wrap);

    const sx = from.x + nextCell.offsetWidth / 2;
    const sy = from.y + nextCell.offsetHeight;

    // The row wraps at narrow widths, and then a curve drawn straight from the
    // tail to the head cuts diagonally across every line of nodes between them.
    // Only a link whose two ends share a line can be drawn as one sweep; the
    // rest are routed around the outside of the block.
    if (Math.abs(from.y - to.y) > 4) {
      const laneY = from.y + nextCell.offsetHeight + LANE_DROP;
      const hx = to.x;
      const hy = to.y + headEl.offsetHeight / 2;
      setLink({
        d:
          `M ${sx} ${sy} V ${laneY - CORNER} Q ${sx} ${laneY} ${sx - CORNER} ${laneY} ` +
          `H ${GUTTER_X + CORNER} Q ${GUTTER_X} ${laneY} ${GUTTER_X} ${laneY - CORNER} ` +
          `V ${hy + CORNER} Q ${GUTTER_X} ${hy} ${GUTTER_X + CORNER} ${hy} H ${hx}`,
        width: wrap.offsetWidth,
        height: laneY + CORNER,
      });
      return;
    }

    const ex = to.x + headEl.offsetWidth / 2;
    const ey = to.y + headEl.offsetHeight;

    // A one-node list points at itself, and then the two ends of the link are
    // half a node apart — a curve drawn straight between them collapses into a
    // hairpin. Pushing the control points outward opens it back into a loop.
    const spread = Math.abs(sx - ex) < TIGHT_LOOP_PX ? LOOP_SPREAD : 0;

    setLink({
      d: `M ${sx} ${sy} C ${sx + spread} ${sy + LOOP_DROP}, ${ex - spread} ${ey + LOOP_DROP}, ${ex} ${ey}`,
      width: wrap.offsetWidth,
      height: Math.max(sy, ey) + LOOP_DROP,
    });
  }, [enabled, headId, tailId]);

  // Layout effect rather than an effect: the path is measured off the DOM the
  // nodes have just been laid out in, and painting one frame without it would
  // make the link flicker on every step.
  useLayoutEffect(measure, [measure, nodes]);

  // The row wraps at whatever width it is given, so the link has to be
  // remeasured when the canvas resizes and not only when the list changes.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!enabled || !wrap || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [enabled, measure]);

  return { wrapRef, link };
}

function ListRow({ nodes, step, listType, label }) {
  const circular = listType === "circular";
  const doubly = listType === "doubly";
  const pointerMap = step.pointerMap || forwardChain(nodes, circular);
  const prevMap = doubly ? backwardChain(nodes, false) : null;
  const headId = step.headId !== undefined ? step.headId : nodes[0]?.id ?? null;
  const tailId = nodes.length ? nodes[nodes.length - 1].id : null;

  // Only when the tail really does point at the head: mid-operation a step can
  // hand over a pointerMap where it doesn't yet, and drawing the link anyway
  // would show a pointer the algorithm hasn't written.
  const wraps = circular && nodes.length > 0 && tailId !== null && pointerMap[tailId] === headId;
  const { wrapRef, link } = useWrapLink({ enabled: wraps, nodes, headId, tailId });

  // Two rows are on screen at once in the polynomial view, and a marker is
  // addressed by id — a shared one would leave the second row's arrowhead
  // pointing wherever the first row's ended up.
  const markerId = `ll-loop-head-${useId().replace(/:/g, "")}`;

  return (
    <>
      {label && <div className="ll-row-label mono">{label}</div>}
      <div className={`ll-row-wrap ${wraps ? "ll-row-wrap--looped" : ""}`} ref={wrapRef}>
        <div className="ll-row">
          {nodes.length === 0 ? (
            <div className="ll-empty">
              <span className="ll-head-tag ll-head-tag--static">HEAD</span>
              <span className="ll-arrow">&#8594;</span>
              <span className="ll-null">NULL</span>
            </div>
          ) : (
            nodes.map((node, i) => (
              <ListNode
                key={node.id}
                node={node}
                index={i}
                allNodes={nodes}
                step={step}
                pointerMap={pointerMap}
                prevMap={prevMap}
                isHead={node.id === headId}
                isTail={node.id === tailId}
                headId={headId}
                circular={circular}
                doubly={doubly}
              />
            ))
          )}
        </div>
        {link && (
          <svg
            className="ll-loop"
            width={link.width}
            height={link.height}
            viewBox={`0 0 ${link.width} ${link.height}`}
            aria-hidden="true"
          >
            <defs>
              {/* userSpaceOnUse, so the head keeps one size instead of being
                  scaled by the stroke width it happens to sit on. */}
              <marker
                id={markerId}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="9"
                markerHeight="9"
                markerUnits="userSpaceOnUse"
                orient="auto"
              >
                <path d="M 0.5 0.5 L 9.5 5 L 0.5 9.5 z" fill="currentColor" />
              </marker>
            </defs>
            <path d={link.d} fill="none" markerEnd={`url(#${markerId})`} />
          </svg>
        )}
      </div>
    </>
  );
}

export default function ListCanvas({
  step,
  listType = "singly",
  secondNodes = null,
  primaryLabel,
  secondaryLabel,
}) {
  const nodes = step.nodes || [];

  return (
    <div className="panel canvas ll-canvas">
      <ListRow nodes={nodes} step={step} listType={listType} label={primaryLabel} />

      {secondNodes && (
        <div style={{ marginTop: 18 }}>
          <ListRow nodes={secondNodes} step={{ nodes: secondNodes }} listType="singly" label={secondaryLabel} />
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
