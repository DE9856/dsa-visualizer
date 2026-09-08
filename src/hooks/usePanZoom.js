import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pan and zoom over an SVG that is drawn once at a fixed viewBox.
 *
 * The alternative was to rewrite the viewBox as the reader moves, which sounds
 * like the same thing and is not: every node, edge and label would be laid out
 * again on every frame of a pinch. This keeps the drawing exactly as it was and
 * moves one `transform` on the group that holds it, so a pinch costs one
 * attribute write however big the tree is.
 *
 * Coordinates in and out are the SVG's own — the caller converts once, at the
 * edge, because only it knows how its viewBox maps onto the element.
 */

const MIN_SCALE = 0.4;
// Past about four the labels are the only thing left on screen and there is
// nothing to navigate by, which is disorienting rather than useful.
const MAX_SCALE = 4;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function usePanZoom() {
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  // The gesture reads the current transform every pointer move, and reading it
  // from state would close over a stale one between renders.
  const ref = useRef(transform);
  ref.current = transform;

  const reset = useCallback(() => setTransform({ k: 1, x: 0, y: 0 }), []);

  /**
   * Zoom about a fixed point, so whatever is under the cursor or between two
   * fingers stays under it. Without this the view drifts toward the origin on
   * every step of a zoom and the reader spends the whole gesture chasing what
   * they were looking at.
   */
  const zoomAt = useCallback((factor, px, py) => {
    setTransform((prev) => {
      const k = clamp(prev.k * factor, MIN_SCALE, MAX_SCALE);
      // The scale actually applied, which is not the one asked for once it has
      // hit a limit — using the requested one there would pan the view even
      // though the zoom had stopped.
      const applied = k / prev.k;
      return { k, x: px - (px - prev.x) * applied, y: py - (py - prev.y) * applied };
    });
  }, []);

  const panBy = useCallback((dx, dy) => {
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  return { transform, ref, reset, zoomAt, panBy, isZoomed: transform.k !== 1 || transform.x !== 0 || transform.y !== 0 };
}

/**
 * Attaches a non-passive `wheel` listener, which React cannot do: it registers
 * wheel handlers as passive, and a passive listener may not call
 * `preventDefault`, so the page would scroll behind every zoom.
 *
 * It takes the element itself rather than a ref, and the difference is not
 * cosmetic: a canvas that is drawn only once there is something to draw does
 * not exist on the first render, and a ref object does not tell anyone when it
 * finally does. An effect keyed on a ref would look once, find nothing and
 * never run again, leaving the listener permanently unattached. Passed the
 * node — from a callback ref, which *is* a render — the effect re-runs the
 * moment it appears.
 */
export function useWheelZoom(element, handler, enabled = true) {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    if (!element || !enabled) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      latest.current(e);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [element, enabled]);
}

export { MIN_SCALE, MAX_SCALE };
