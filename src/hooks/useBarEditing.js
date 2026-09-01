import { useCallback, useRef, useState } from "react";

/**
 * Direct editing of the bars: click a column to set its value, drag it up and
 * down to scrub, drag it sideways to move it along the array.
 *
 * One press has to serve both edits, so the axis of the first few pixels of
 * movement decides which one it is — the same rule a map uses to tell a pan
 * from a pinch. Below the threshold nothing has been decided yet, and a press
 * that never crosses it is a click, which sets the value where it landed.
 *
 * The array being edited is held as a `draft` and rendered in place of the
 * live one for the length of the gesture. Committing on every pointer move
 * would put a hundred entries on the undo stack and recompute the whole run
 * for each one; this way the picture still tracks the cursor exactly, and the
 * algorithm re-runs once, when the pointer lifts.
 *
 * The state machine below is deliberately pure and exported: the measuring is
 * the only part that needs a browser, so keeping it out of the arithmetic
 * leaves the arithmetic checkable on its own.
 */

// Far enough that the wobble in a click doesn't read as a drag, close enough
// that a deliberate drag feels immediate.
export const DRAG_THRESHOLD = 4;

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Where the bars actually stand, in viewport coordinates. They are laid out
 * inside the container's padding, and the headroom above them belongs to the
 * state glyphs rather than to the scale — measuring the border box would put
 * the top of the scale a glyph's height above the tallest reachable bar.
 */
export function barsGeometry(container) {
  const rect = container.getBoundingClientRect();
  const style = getComputedStyle(container);
  return {
    top: rect.top + parseFloat(style.paddingTop || 0),
    bottom: rect.bottom - parseFloat(style.paddingBottom || 0) - parseFloat(style.borderBottomWidth || 0),
  };
}

/** The value whose bar top would sit under the pointer. */
export function valueAt({ top, bottom }, clientY, scale) {
  const span = Math.max(1, bottom - top);
  return clamp(Math.round(((bottom - clientY) / span) * scale), 1, scale);
}

/** The column the pointer is over, clamped to the ends of the row. */
export function indexAt(rects, clientX) {
  for (let i = 0; i < rects.length; i++) {
    if (clientX < rects[i].right) return i;
  }
  return rects.length - 1;
}

/** `from` lifted out of the list and dropped back in at `to`. */
export function move(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function startDrag({ index, x, y, values }) {
  return { index, startX: x, startY: y, draft: values, mode: null };
}

/**
 * One pointer move. Returns the gesture unchanged while the movement is still
 * inside the threshold, so a hand that shakes on the way to a click does not
 * commit it to being a drag.
 */
export function dragTo(gesture, { x, y }, { geometry, rects, scale, allowReorder }) {
  const dx = x - gesture.startX;
  const dy = y - gesture.startY;

  let mode = gesture.mode;
  if (!mode) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return gesture;
    // A reorder has to be asked for along the axis it happens on; anything
    // else — including any movement at all where reordering is not allowed —
    // is a value being scrubbed.
    mode = Math.abs(dx) > Math.abs(dy) && allowReorder ? "reorder" : "value";
  }

  if (mode === "value") {
    const draft = [...gesture.draft];
    draft[gesture.index] = valueAt(geometry, y, scale);
    return { ...gesture, mode, draft };
  }

  const to = indexAt(rects, x);
  if (to === gesture.index) return { ...gesture, mode };
  return { ...gesture, mode, index: to, draft: move(gesture.draft, gesture.index, to) };
}

/** The array the gesture leaves behind. */
export function endDrag(gesture, { y }, { geometry, scale }) {
  if (gesture.mode) return gesture.draft;
  const draft = [...gesture.draft];
  draft[gesture.index] = valueAt(geometry, y, scale);
  return draft;
}

export function useBarEditing({ enabled, values, ceiling, allowReorder, onBegin, onCommit }) {
  const [gesture, setGesture] = useState(null);
  const live = useRef(null);

  // Held for the whole gesture so the bars don't rescale under the cursor as
  // a value grows past what used to be the tallest one.
  const scale = Math.max(ceiling, ...values, 1);

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled || event.button !== 0) return;
      const container = event.currentTarget;
      // Captured once: the columns keep their widths through a reorder, and
      // re-measuring on every move would read positions mid-transition.
      const rects = [...container.querySelectorAll("[data-bar-index]")].map((el) => el.getBoundingClientRect());
      if (!rects.length) return;

      event.preventDefault();
      container.setPointerCapture?.(event.pointerId);

      // The column is the target, not the bar. Hit-testing on whatever the
      // pointer physically landed on would make the empty space above a short
      // bar dead — and that space is exactly where you press to raise it.
      const index = indexAt(rects, event.clientX);
      const next = startDrag({ index, x: event.clientX, y: event.clientY, values });
      live.current = { gesture: next, container, geometry: barsGeometry(container), rects };
      setGesture(next);
      onBegin?.();
    },
    [enabled, values, onBegin]
  );

  const onPointerMove = useCallback(
    (event) => {
      // Read from the ref, not from state: a pointer is captured before
      // React has re-rendered, so the ref is the only up-to-date copy.
      const state = live.current;
      if (!state) return;
      const next = dragTo(
        state.gesture,
        { x: event.clientX, y: event.clientY },
        { geometry: state.geometry, rects: state.rects, scale, allowReorder }
      );
      if (next === state.gesture) return;
      state.gesture = next;
      setGesture(next);
    },
    [allowReorder, scale]
  );

  const onPointerUp = useCallback(
    (event) => {
      // Read from the ref, not from state: a pointer is captured before
      // React has re-rendered, so the ref is the only up-to-date copy.
      const state = live.current;
      if (!state) return;
      state.container.releasePointerCapture?.(event.pointerId);
      const committed = endDrag(state.gesture, { y: event.clientY }, { geometry: state.geometry, scale });
      live.current = null;
      setGesture(null);
      onCommit(committed);
    },
    [onCommit, scale]
  );

  const onPointerCancel = useCallback(() => {
    live.current = null;
    setGesture(null);
  }, []);

  /** Keyboard equivalents, so editing doesn't require a pointer at all. */
  const onKeyDown = useCallback(
    (event) => {
      if (!enabled) return;
      const bar = event.target.closest?.("[data-bar-index]");
      if (!bar) return;
      const index = Number(bar.dataset.barIndex);
      const step = event.shiftKey ? 10 : 1;

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const next = [...values];
        next[index] = clamp(next[index] + (event.key === "ArrowUp" ? step : -step), 1, scale);
        event.preventDefault();
        onBegin?.();
        onCommit(next);
        return;
      }

      // Alt is the modifier the global transport shortcuts already bow out of,
      // which leaves the bare arrows stepping the run as they do everywhere
      // else in the app.
      if (allowReorder && event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        const to = clamp(index + (event.key === "ArrowRight" ? 1 : -1), 0, values.length - 1);
        if (to === index) return;
        event.preventDefault();
        onBegin?.();
        onCommit(move(values, index, to));
        // Focus rides along with the element that moved, not the slot it left.
        // A timeout rather than an animation frame: rAF never fires in a
        // backgrounded or throttled tab, and focus quietly staying on the
        // wrong bar is precisely the failure a keyboard user cannot see.
        setTimeout(() => {
          bar.parentElement?.querySelector(`[data-bar-index="${to}"]`)?.focus();
        }, 0);
      }
    },
    [enabled, values, scale, allowReorder, onBegin, onCommit]
  );

  return {
    draft: gesture?.draft ?? null,
    active: gesture?.index ?? null,
    mode: gesture?.mode ?? null,
    scale,
    handlers: enabled ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown } : {},
  };
}
