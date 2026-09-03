import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Direct editing of the bars: press a column to set its value, drag it up and
 * down to scrub, drag it sideways to move it along the array.
 *
 * One press has to serve both edits, so the axis of the first few pixels of
 * movement decides which one it is — the same rule a map uses to tell a pan
 * from a pinch. Below the threshold nothing has been decided yet, and a press
 * that never crosses it is a click, which sets the value where it landed.
 *
 * A finger reaches the same three gestures by a different route. The canvas is
 * a third of a phone screen tall, so a swipe across it has to stay the page
 * scroll it looks like; the bar is therefore picked up by *holding* it, and a
 * press that lifts or travels before then is a tap or a scroll. Nothing about
 * the cursor's route changes — it has no rival gesture to give way to.
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

// A finger is nowhere near as steady as a cursor, and this threshold is what
// picks the axis. Reading a four-pixel tremor as an axis would reorder the
// array every time the reader meant to scrub a value.
export const TOUCH_DRAG_THRESHOLD = 12;

// How long a finger has to rest on a bar before it picks it up. The same hold
// picks a vertex up on the graph canvas — one gesture to learn, not two.
export const LONG_PRESS_MS = 400;

// A finger is never perfectly still; anything past this before the hold fires
// is a page scroll, and gives up the press.
export const PRESS_SLOP_PX = 10;

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
export function dragTo(gesture, { x, y }, { geometry, rects, scale, allowReorder, threshold = DRAG_THRESHOLD }) {
  const dx = x - gesture.startX;
  const dy = y - gesture.startY;

  let mode = gesture.mode;
  if (!mode) {
    if (Math.hypot(dx, dy) < threshold) return gesture;
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
  // A finger down on a bar that has not yet become anything: it is still a
  // tap, a scroll, or a hold, and only time and travel tell them apart.
  const press = useRef(null);
  const containerRef = useRef(null);

  // Held for the whole gesture so the bars don't rescale under the cursor as
  // a value grows past what used to be the tallest one.
  const scale = Math.max(ceiling, ...values, 1);

  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };

  // Leaving the view mid-press must not pick a bar up afterwards.
  useEffect(() => () => cancelPress(), []);

  // Once a bar has been picked up the finger belongs to it, not to the page.
  // `touch-action: pan-y` on the strip lets the page scroll up to that moment;
  // from it on the scroll is refused outright, because a browser that decides
  // mid-drag that the gesture was a scroll cancels the pointer and drops the
  // edit halfway through. The listener has to be non-passive, which React's
  // own onTouchMove is not.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const refuseScroll = (event) => {
      if (live.current) event.preventDefault();
    };
    el.addEventListener("touchmove", refuseScroll, { passive: false });
    return () => el.removeEventListener("touchmove", refuseScroll);
  }, []);

  const begin = useCallback(
    (container, { index, x, y, rects }) => {
      const next = startDrag({ index, x, y, values });
      live.current = { gesture: next, container, geometry: barsGeometry(container), rects };
      setGesture(next);
      onBegin?.();
    },
    [values, onBegin]
  );

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled || event.button !== 0) return;
      const container = event.currentTarget;
      // Captured once: the columns keep their widths through a reorder, and
      // re-measuring on every move would read positions mid-transition.
      const rects = [...container.querySelectorAll("[data-bar-index]")].map((el) => el.getBoundingClientRect());
      if (!rects.length) return;

      // The column is the target, not the bar. Hit-testing on whatever the
      // pointer physically landed on would make the empty space above a short
      // bar dead — and that space is exactly where you press to raise it.
      const index = indexAt(rects, event.clientX);
      cancelPress();
      // Captured for a finger as well as for a cursor: it is what guarantees
      // the pointerup arrives, so a press can never be left armed.
      container.setPointerCapture?.(event.pointerId);

      if (event.pointerType === "touch") {
        // Deliberately no preventDefault here: suppressing a touch
        // pointerdown's default action is specified to swallow the
        // compatibility events, and the page still has to be free to scroll
        // off this press. Text selection is held off by user-select instead.
        press.current = {
          container,
          rects,
          index,
          startX: event.clientX,
          startY: event.clientY,
          x: event.clientX,
          y: event.clientY,
          timer: setTimeout(() => {
            const p = press.current;
            if (!p) return;
            press.current = null;
            // Re-based on where the finger has come to rest rather than where
            // it first landed: it has had the whole hold to drift, and the
            // next few pixels are what choose scrubbing over reordering.
            begin(p.container, { index: p.index, x: p.x, y: p.y, rects: p.rects });
            // A phone gives no cursor to change, so the pick-up is confirmed
            // by feel.
            navigator.vibrate?.(12);
          }, LONG_PRESS_MS),
        };
        return;
      }

      event.preventDefault();
      begin(container, { index, x: event.clientX, y: event.clientY, rects });
    },
    [enabled, begin]
  );

  const onPointerMove = useCallback(
    (event) => {
      const p = press.current;
      if (p) {
        // The finger is going somewhere, so it was a scroll, not a hold.
        if (Math.hypot(event.clientX - p.startX, event.clientY - p.startY) > PRESS_SLOP_PX) cancelPress();
        else {
          p.x = event.clientX;
          p.y = event.clientY;
        }
        return;
      }

      // Read from the ref, not from state: a pointer is captured before
      // React has re-rendered, so the ref is the only up-to-date copy.
      const state = live.current;
      if (!state) return;
      const next = dragTo(
        state.gesture,
        { x: event.clientX, y: event.clientY },
        {
          geometry: state.geometry,
          rects: state.rects,
          scale,
          allowReorder,
          threshold: event.pointerType === "touch" ? TOUCH_DRAG_THRESHOLD : DRAG_THRESHOLD,
        }
      );
      if (next === state.gesture) return;
      state.gesture = next;
      setGesture(next);
    },
    [allowReorder, scale]
  );

  const onPointerUp = useCallback(
    (event) => {
      const p = press.current;
      if (p) {
        // Lifted before the hold: that is the tap, and it sets the value at
        // the height it landed at, exactly as a click does.
        cancelPress();
        p.container.releasePointerCapture?.(event.pointerId);
        const draft = [...values];
        draft[p.index] = valueAt(barsGeometry(p.container), event.clientY, scale);
        onBegin?.();
        onCommit(draft);
        return;
      }

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
    [values, onBegin, onCommit, scale]
  );

  const onPointerCancel = useCallback(() => {
    cancelPress();
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
    ref: containerRef,
    draft: gesture?.draft ?? null,
    active: gesture?.index ?? null,
    mode: gesture?.mode ?? null,
    scale,
    handlers: enabled ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown } : {},
  };
}
