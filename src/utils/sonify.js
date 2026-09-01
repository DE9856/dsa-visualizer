/**
 * The run, heard. Each element's value becomes a pitch, so a sort is a rising
 * scatter that resolves into a scale, and a binary search is a handful of
 * probes closing on one note.
 *
 * It is the classic thing to do with a sorting visualiser, and it is also a
 * third channel beside colour and the state glyphs: pitch says *what the
 * value is*, which neither of the other two carry at all, and it works with
 * the screen off.
 *
 * Pitch is mapped logarithmically. Ears hear ratios, not differences — 200Hz
 * to 400Hz is the same interval as 400Hz to 800Hz — so a linear map would
 * cram the bottom half of the array into a semitone or two and spread the top
 * half over an octave. A log map gives every equal step in value an equal
 * musical step, which is what makes the shape of the data audible.
 */

const MIN_HZ = 180;
const MAX_HZ = 1200;

// More than a few simultaneous notes is mud rather than information, and at
// twenty-five steps a second the tail of one note is still sounding when the
// next three arrive.
const MAX_VOICES = 10;

export function frequencyFor(value, scale) {
  const t = Math.min(1, Math.max(0, value / Math.max(1, scale)));
  return MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, t);
}

export function createSonifier() {
  let ctx = null;
  let master = null;
  let voices = 0;

  /**
   * The context is built on the first note rather than up front: a browser
   * refuses to start audio without a user gesture, and one created on page
   * load is born suspended and stays that way.
   */
  const ensure = () => {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  /** One note, scheduled at an absolute time on the audio clock. */
  const scheduleNote = (audio, note, at, duration, scale) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = note.wave || "sine";
    osc.frequency.value = frequencyFor(note.value, scale);

    // A gain that jumps straight to full is a click, and a linear fade to
    // exactly zero is another one at the end; the short ramp in and the
    // exponential tail are what make this a note rather than a tick.
    const peak = (note.gain ?? 1) * 0.9;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + duration + 0.02);
    osc.onended = () => gain.disconnect();
    return osc;
  };

  const play = (notes, { duration = 0.09, scale = 99 } = {}) => {
    if (!notes.length) return;
    const audio = ensure();
    if (!audio) return;

    const now = audio.currentTime;
    for (const note of notes) {
      // The cap is about how much is sounding at once, which is only a
      // question for notes fired as the run steps — a swept sequence is
      // spaced out in time and counts against nothing.
      if (voices >= MAX_VOICES) break;
      voices++;
      scheduleNote(audio, note, now, duration, scale).addEventListener("ended", () => {
        voices--;
      });
    }
  };

  /**
   * The array played end to end, one note per element.
   *
   * Scheduled against the audio clock rather than fired from a timer: a
   * sequence driven by setTimeout drifts and stutters under any main-thread
   * work, and a sweep whose whole point is that the intervals are even cannot
   * afford that. Returns how long it will take, so a caller can wait for it.
   */
  const sweep = (notes, { gap = 0.045, duration = 0.07, scale = 99 } = {}) => {
    if (!notes.length) return 0;
    const audio = ensure();
    if (!audio) return 0;
    // A beat of lead-in, so the first note isn't scheduled in the past by the
    // time the graph is built.
    const start = audio.currentTime + 0.03;
    notes.forEach((note, i) => scheduleNote(audio, note, start + i * gap, duration, scale));
    return (0.03 + notes.length * gap + duration) * 1000;
  };

  return {
    play,
    sweep,
    /** Called from the click that turns sound on, which is what unlocks it. */
    unlock: () => ensure(),
    setVolume: (v) => {
      if (master) master.gain.value = v;
    },
    close: () => {
      ctx?.close();
      ctx = null;
      master = null;
      voices = 0;
    },
  };
}
