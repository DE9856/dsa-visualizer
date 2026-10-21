import { useCallback, useEffect, useRef, useState } from "react";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

/**
 * The engine every data-structure view runs on: the structure itself, the
 * frames of whatever operation is being watched, playback over those frames,
 * and undo/redo across edits.
 *
 * It exists because those four things were written out longhand in every
 * structure hook and were the same in all of them — `useStack` and `useQueue`
 * differed by three lines once you renamed the noun. What genuinely varies is
 * a view's structure, its inputs and its operations, and those stay in the
 * view's own hook; only the machinery lives here.
 *
 * There are three ways the picture changes, and the differences are visible:
 *
 *   apply(steps, final)   an operation was watched happening — play its frames
 *   load(next, message)   the structure was replaced outright — one still frame
 *   reframe(message)      same structure, drawn differently — no history entry
 *
 * The first two record history *before* changing anything, which is the rule every
 * caller was already following by hand and the one this is most useful for
 * centralising: a missed `record()` is an edit you cannot undo, and it is
 * invisible until someone tries.
 *
 * `snapshot`/`restore` are for views whose document is more than the structure
 * alone — the heap's max/min `kind`, the tree's type and threading. Whatever
 * `snapshot` returns is merged into the undo entry and handed back to
 * `restore` on the way out, so those settings travel with the structure they
 * describe rather than being left behind by an undo.
 */
export function useStructureRun({ initial, toFrame, emptyStep, readyMessage = "Ready", snapshot, restore }) {
  const [value, setValue] = useState(initial);

  // Read through a ref for the same reason `useHistory` reads its two: a view
  // describes its frame shape with an inline closure, and a fresh one every
  // render must not give `load` a new identity — that would invalidate the
  // callbacks the views build on top of it.
  const fns = useRef({ toFrame, snapshot, restore });
  fns.current = { toFrame, snapshot, restore };

  // Seeded with the empty frame and filled in on mount rather than built
  // straight from `initial`, which is what the hooks this replaces did. The
  // first paint is therefore of an empty structure; see the note in DOCS.
  const [steps, setSteps] = useState(() => [{ ...emptyStep }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const history = useHistory(
    () => ({ value, ...fns.current.snapshot?.() }),
    (doc, message) => {
      setValue(doc.value);
      fns.current.restore?.(doc);
      setSteps([fns.current.toFrame(doc.value, message)]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([fns.current.toFrame(value, readyMessage)]);
    setStepIdx(0);
    // Mount only: this is the opening frame, not a reaction to later edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** An operation was watched happening: play its frames, keep its result. */
  const apply = useCallback(
    (newSteps, final) => {
      history.record();
      setSteps(newSteps);
      setStepIdx(0);
      setValue(final);
      setPlaying(newSteps.length > 1);
    },
    [history, setStepIdx, setPlaying]
  );

  /** The structure was replaced outright: one still frame saying so. */
  const load = useCallback(
    (next, message) => {
      history.record();
      setValue(next);
      setSteps([fns.current.toFrame(next, message)]);
      setStepIdx(0);
      setPlaying(false);
    },
    [history, setStepIdx, setPlaying]
  );

  /**
   * The structure did not change, but how it is drawn did — the range-query
   * view swapping a segment tree for a Fenwick tree over the same array.
   *
   * Deliberately does *not* record: nothing about the document changed, so
   * there is nothing for an undo to come back to, and recording would make
   * the undo stack fill with entries that restore the state they were taken
   * from. A view whose *document* changed while its structure did not wants
   * `load(value, message)` instead, which records.
   */
  const reframe = useCallback(
    (message) => {
      setSteps([fns.current.toFrame(value, message)]);
      setStepIdx(0);
      setPlaying(false);
    },
    [value, setStepIdx, setPlaying]
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)] || emptyStep;

  // `view` is exactly what a hook passes straight out to the components —
  // spreading it is the whole of the boilerplate this replaces. The mutators
  // sit outside it so that a hook which never reframes doesn't publish a
  // `reframe` nothing calls.
  //
  // `setValue` is deliberately not here at all: every change to the structure
  // is either an operation that was watched or an outright replacement, and
  // both have to record history first. Handing out the raw setter would make
  // it possible to change the structure without recording — the one mistake
  // this hook exists to prevent.
  return {
    view: {
      ...player,
      steps,
      step,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    },
    value,
    apply,
    load,
    reframe,
  };
}
