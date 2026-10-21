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
function notesFor(step) {
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
 * The other half of the vocabulary: every view that is not bars.
 *
 * Outside sorting and searching nothing on screen is a value on a scale — a
 * tree node, a hash bucket, a DP cell and a graph vertex have no pitch they
 * ought to be, and inventing one would be saying something untrue about the
 * data. So pitch here carries the other thing every run has: how far through
 * it you are. Each frame takes the next degree of a pentatonic scale, which
 * makes an operation a phrase whose length is its cost — a push is two notes,
 * a search down a deep tree is a long climb — while the timbre says what kind
 * of frame it is.
 *
 * Pentatonic because the tune is written by the algorithm rather than by
 * anyone: no two of its degrees clash, so no sequence of frames can come out
 * sour, which is not true of a diatonic scale.
 */
const PENTATONIC = [0, 2, 4, 7, 9];
const ROOT_HZ = 262; // middle C
const DEGREES = PENTATONIC.length * 2; // two octaves, then it wraps

function degreeHz(index) {
  const degree = ((index % DEGREES) + DEGREES) % DEGREES;
  const semitones = 12 * Math.floor(degree / PENTATONIC.length) + PENTATONIC[degree % PENTATONIC.length];
  return ROOT_HZ * Math.pow(2, semitones / 12);
}

/** Timbre per kind of frame, so two frames on the same pitch still differ. */
const EVENT_TONES = {
  step: { wave: "sine", gain: 0.45 },
  compare: { wave: "sine", gain: 0.75 },
  swap: { wave: "triangle", gain: 1 },
  // A structural change shares the refusal's sawtooth deliberately: both are
  // the run doing something it cannot take back, and the register tells them
  // apart — a write lands on the scale, a refusal below it.
  write: { wave: "sawtooth", gain: 0.85 },
  probe: { wave: "square", gain: 0.5 },
  found: { wave: "sine", gain: 1 },
};

// A field counts as set when it names something: an id, a non-empty list, a
// flag. `-1` and `null` are how the frames spell "nothing here".
const marks = (field) => {
  if (Array.isArray(field)) return field.length > 0;
  if (typeof field === "number") return field >= 0;
  return field !== undefined && field !== null && field !== false;
};

/**
 * Which of the five kinds a frame is. Read in the order the picture uses —
 * a rejection outranks whatever it was rejecting, an answer outranks the
 * comparison that found it — and deliberately tolerant about field names,
 * because twenty views wrote their frames before there was any sound to play
 * and each named the same idea slightly differently.
 */
export function eventFor(step) {
  if (!step) return "step";
  if (step.notFound || step.overflow || step.underflow || step.pruned || step.phase === "backtrack") return "fail";
  if (marks(step.found) || step.match || step.phase === "solution" || step.phase === "match") return "found";
  if (marks(step.swap) || marks(step.swapping)) return "swap";
  // The structure itself changed here — a node left, nodes were created, two
  // lists became one. Occasional by nature, and previously inaudible: a
  // delete sounded exactly like the search that found what to delete.
  if (marks(step.removing) || marks(step.created) || marks(step.mergedIds)) return "write";
  if (marks(step.probe) || marks(step.mid)) return "probe";
  if (marks(step.compare) || marks(step.comparing) || marks(step.current)) return "compare";
  return "step";
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

  /**
   * One frame of a run that isn't bars. `index` is the frame's position in
   * the run, which is what the pitch is drawn from.
   */
  const playEvent = useCallback(
    (step, { index = 0, duration = 0.1, done = false } = {}) => {
      if (!settings.enabled) return;
      const kind = eventFor(step);
      if (kind === "fail") {
        // Below the scale entirely, so a rejected operation — a full stack, a
        // key that isn't there — cannot be mistaken for any note a successful
        // one could have played.
        sonifier.current.play([{ freq: 98, wave: "sawtooth", gain: 0.5 }], { duration: 0.22 });
        return;
      }
      const hz = degreeHz(index);
      const notes = [{ freq: hz, ...EVENT_TONES[kind] }];
      // An answer, and the end of a run, resolve: the degree it landed on
      // with the octave above it, which is the only interval here that sounds
      // like an arrival rather than another step.
      if (done || kind === "found") notes.push({ freq: hz * 2, wave: "sine", gain: 0.7 });
      sonifier.current.play(notes, { duration: done ? 0.24 : duration });
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
    playEvent,
  };
}
