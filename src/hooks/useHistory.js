import { useCallback, useReducer, useRef } from "react";

// Deep enough to cover a run of edits, shallow enough that a long session
// can't grow without bound. Snapshots hold references, not copies (see below),
// so each one costs almost nothing.
const LIMIT = 50;

/**
 * Undo/redo over whole-document snapshots, shared by every structure view.
 *
 * A view describes itself with two functions: `snapshot()` returns the state
 * worth restoring, and `restore(doc, message)` puts it back. Everything else —
 * which operation is selected, what is half-typed in a field, where playback
 * had got to — is deliberately outside the document. Undo is meant to take
 * back an *edit*, not to rewind the session around it.
 *
 * Snapshots store references rather than clones, which is safe because every
 * operation in this codebase builds a new structure instead of mutating the
 * one it was given. That is what makes the frames precomputed and the stepping
 * reversible in the first place, so the same property is already load-bearing.
 *
 * Both functions are read through a ref, so a view can pass fresh closures on
 * every render without the recorded stack going stale.
 */
export function useHistory(snapshot, restore) {
  const fns = useRef({ snapshot, restore });
  fns.current = { snapshot, restore };

  const past = useRef([]);
  const future = useRef([]);
  // The stacks live in refs so recording doesn't re-render; this only exists
  // to refresh canUndo/canRedo for whatever is drawing them.
  const [, bump] = useReducer((n) => n + 1, 0);

  /** Call immediately *before* changing anything. */
  const record = useCallback(() => {
    past.current = past.current.concat([fns.current.snapshot()]).slice(-LIMIT);
    // A fresh edit is a new branch: whatever had been undone is unreachable.
    future.current = [];
    bump();
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return false;
    const previous = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = future.current.concat([fns.current.snapshot()]);
    fns.current.restore(previous, "Undone");
    bump();
    return true;
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return false;
    const next = future.current[future.current.length - 1];
    future.current = future.current.slice(0, -1);
    past.current = past.current.concat([fns.current.snapshot()]);
    fns.current.restore(next, "Redone");
    bump();
    return true;
  }, []);

  return {
    record,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
