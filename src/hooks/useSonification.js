import { useCallback, useEffect, useRef, useState } from "react";
import { createSonifier } from "../utils/sonify.js";
import { STATES } from "../utils/stateStyle.js";

/**
 * Turns each step into notes, and owns the on/off and volume the reader sets.
 *
 * Off by default and remembered: a page that starts making noise on its own
 * is the thing everyone hates about pages that make noise.
 */

const STORE = "dsa-viz:sound";

/**
 * The notes one frame is worth. A frame that both compares and swaps is
 * reported as the swap: it is the louder event and the one the comparison
 * existed to decide, and playing both would double every note in a bubble
 * sort.
 */
export function notesFor(step) {
  const array = step.array;
  if (!array) return [];

  const at = (index, state) =>
    array[index] === undefined ? null : { value: array[index], ...STATES[state].tone };

  const notes = [];
  if (step.swap?.length) notes.push(...step.swap.map((i) => at(i, "swap")));
  else if (step.compare?.length) notes.push(...step.compare.map((i) => at(i, "compare")));
  else if (step.mid >= 0) notes.push(at(step.mid, "probe"));
  else if (step.checking >= 0) notes.push(at(step.checking, "compare"));

  if (step.found >= 0) notes.push(at(step.found, "found"));
  return notes.filter(Boolean);
}

/**
 * The last frame of a run, for the views a sweep would say nothing about. A
 * search ends on an answer, and the pitch of the element it found is the
 * whole result — playing the array at it would bury that.
 */
function finaleFor(step) {
  const array = step.array;
  if (!array?.length) return [];
  if (step.found >= 0) return [{ value: array[step.found], ...STATES.found.tone }];
  // Nothing found: one note pitched below anything the data can reach, so a
  // miss is unmistakable against every value that could have been a hit.
  if (step.found === -2) return [{ value: 0, wave: "sine", gain: 0.6 }];
  return [];
}

/**
 * How fast to play an array end to end. Held to about a second and a quarter
 * whatever the length: long enough to hear the shape, short enough that it is
 * a count-in rather than an interruption.
 */
function gapFor(n) {
  return Math.min(0.06, Math.max(0.018, 1.25 / Math.max(1, n)));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    return {
      enabled: saved.enabled === true,
      volume: typeof saved.volume === "number" ? Math.min(1, Math.max(0, saved.volume)) : 0.25,
    };
  } catch {
    return { enabled: false, volume: 0.25 };
  }
}

export function useSonification() {
  const [settings, setSettings] = useState(load);
  const sonifier = useRef(null);
  if (!sonifier.current) sonifier.current = createSonifier();

  useEffect(() => {
    sonifier.current.setVolume(settings.volume);
    try {
      localStorage.setItem(STORE, JSON.stringify(settings));
    } catch {
      /* the setting just won't outlive the tab */
    }
  }, [settings]);

  // A browser will not start audio until the reader has interacted with the
  // page, so a setting restored from a previous visit has nothing to attach
  // to until they do something. This waits for the first thing they do.
  useEffect(() => {
    if (!settings.enabled) return undefined;
    const unlock = () => sonifier.current.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [settings.enabled]);

  useEffect(() => () => sonifier.current.close(), []);

  const playStep = useCallback(
    (step, { scale, duration, done }) => {
      if (!settings.enabled) return;
      const notes = done ? finaleFor(step) : notesFor(step);
      sonifier.current.play(notes, { scale, duration: done ? 0.2 : duration });
    },
    [settings.enabled]
  );

  /**
   * The whole array, left to right. Played once before a run starts and once
   * after it ends, which is the point of the whole feature: the same data,
   * scattered and then in order, is the difference you can hear without
   * looking at anything. Returns how long it lasts, in milliseconds, so a
   * caller can hold the run back until it finishes.
   */
  const playSweep = useCallback(
    (values, { scale } = {}) => {
      if (!settings.enabled || !values?.length) return 0;
      const gap = gapFor(values.length);
      return sonifier.current.sweep(
        values.map((value) => ({ value, wave: "sine", gain: 0.75 })),
        { scale: scale ?? Math.max(...values, 1), gap, duration: gap * 1.5 }
      );
    },
    [settings.enabled]
  );

  const toggle = useCallback(() => {
    setSettings((prev) => {
      // Turning it on *is* the gesture that unlocks audio, so take it.
      if (!prev.enabled) sonifier.current.unlock();
      return { ...prev, enabled: !prev.enabled };
    });
  }, []);

  return {
    enabled: settings.enabled,
    volume: settings.volume,
    toggle,
    playSweep,
    setVolume: (volume) => setSettings((prev) => ({ ...prev, volume })),
    playStep,
  };
}
