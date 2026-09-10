import { cloneState, frame, headOf, isSpent, levelsOf, replay, showKey, totalRemaining } from "./helpers";

export const mergeAll = {
  key: "mergeAll",
  label: "Merge Everything",
  group: "merge",
  fields: [],
  desc: "Drains every run, one output per step. The figure to watch is the total: n elements at log₂ k comparisons each, against n(k−1) for the obvious repeated scan of all k heads. For four runs that is a factor of two; for a merge sort's final pass over 64 runs it is a factor of ten, which is why external sorting is done this way — the merge is what touches the disk, and the comparison count is what decides how many passes over the data you can afford.",
  time: "O(n log k)",
  space: "O(k)",

  run(state) {
    if (state.champion === null || isSpent(state.runs, state.champion)) {
      return {
        steps: [frame(state, { notFound: true, message: "Every run is already exhausted." })],
        finalTree: state,
      };
    }

    const next = cloneState(state);
    const steps = [];
    const levels = levelsOf(next.k);
    const start = totalRemaining(next.runs);
    let comparisons = 0;

    steps.push(
      frame(next, {
        leafHot: next.runs.map((_, i) => i),
        message: `${start} elements across ${next.live} runs. Each output costs ${levels} comparison${
          levels === 1 ? "" : "s"
        }; scanning all ${next.live} heads every time would cost ${next.live - 1}.`,
      })
    );

    // One frame per output rather than per comparison: the repair has an
    // operation of its own, and what this shows is the running total.
    while (next.champion !== null && !isSpent(next.runs, next.champion)) {
      const run = next.champion;
      const value = headOf(next.runs, run);
      replay(next);
      comparisons += levels;
      steps.push(
        frame(next, {
          leafHot: [run],
          winners: next.champion === null ? [] : [next.champion],
          message: `${showKey(value)} from run ${run}. ${comparisons} comparisons so far, for ${
            next.output.length
          } element${next.output.length === 1 ? "" : "s"} — a flat scan would have spent ${
            next.output.length * (next.live - 1)
          }.`,
        })
      );
    }

    const naive = start * (next.live - 1);
    steps.push(
      frame(next, {
        resultBadge: `${comparisons} vs ${naive} COMPARISONS`,
        message: `Merged: ${next.output.join(", ")}. ${comparisons} comparisons against ${naive} for the flat scan${
          naive > comparisons ? ` — ${(naive / comparisons).toFixed(1)}× fewer` : ""
        }. With four runs the gap is small; the point is that it grows as k does, while log₂ k barely moves.`,
      })
    );

    return { steps, finalTree: next };
  },
};
