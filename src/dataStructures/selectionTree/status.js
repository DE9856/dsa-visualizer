import { KIND_MAP, frame, isSpent, levelsOf, showHead, totalRemaining } from "./helpers";

export const status = {
  key: "status",
  label: "Cost Per Output",
  group: "status",
  fields: [],
  desc: "The arithmetic the structure exists for, on the runs currently loaded. A flat scan of k run heads costs k−1 comparisons per element and the tree costs ⌈log₂ k⌉, so the saving is the gap between those two — negligible at k = 2, a factor of two at k = 4, and a factor of ten by the time k is 64. Note also what the tree does not need: it never re-reads a run head it has already compared, so a k-way merge over data too big for memory does one sequential pass per run and nothing else.",
  time: "O(1)",
  space: "O(1)",

  run(state) {
    const levels = levelsOf(state.k);
    const flat = Math.max(1, state.live - 1);
    const left = totalRemaining(state.runs);
    const spent = state.runs.filter((run, i) => !run.padded && isSpent(state.runs, i)).length;

    return {
      steps: [
        frame(state, {
          active: state.kind === "winner" ? [1] : [0],
          leafHot: state.champion === null ? [] : [state.champion],
          resultBadge: `${levels} vs ${flat} COMPARISONS PER OUTPUT`,
          message: `${state.live} runs, padded to ${state.k} leaves, ${state.k - 1} internal nodes storing ${
            KIND_MAP[state.kind].stores
          }. Each output costs ${levels} comparison${levels === 1 ? "" : "s"} against ${flat} for a flat scan${
            flat > levels ? ` — ${(flat / levels).toFixed(1)}× fewer` : ", which at this k is no saving at all"
          }. ${left} element${left === 1 ? "" : "s"} left${spent ? `, ${spent} run${spent === 1 ? "" : "s"} spent` : ""}${
            state.champion !== null && !isSpent(state.runs, state.champion)
              ? `, next out is ${showHead(state.runs, state.champion)} from run ${state.champion}`
              : ""
          }.`,
        }),
      ],
      finalTree: state,
    };
  },
};
