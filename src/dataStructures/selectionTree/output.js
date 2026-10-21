import {
  KIND_MAP,
  cloneState,
  frame,
  headOf,
  isSpent,
  leafOf,
  levelsOf,
  replay,
  showHead,
  showKey,
  totalRemaining,
} from "./helpers";

export const output = {
  key: "output",
  label: "Output One Element",
  group: "merge",
  fields: [],
  desc: "Take the winner, advance that run by one, and repair the tree — and only one root-to-leaf path can possibly have changed, because only one leaf did. That is the entire idea: k−1 comparisons per output becomes log₂ k, and the saving is not cleverness about comparing, it is refusing to recompute what did not change. The two kinds diverge here and nowhere else. A winner tree re-plays each match on the path, which means reading both children. A loser tree carries the contender up and beats it against the loser already sitting at each node — one read per level, and the sibling subtree is never consulted.",
  time: "O(log k)",
  space: "O(1)",

  run(state) {
    if (state.champion === null || isSpent(state.runs, state.champion)) {
      return {
        steps: [
          frame(state, {
            notFound: true,
            message: "Every run is exhausted — the merge is finished. There is nothing left to output.",
          }),
        ],
        finalTree: state,
      };
    }

    const next = cloneState(state);
    const steps = [];
    const c = next.champion;
    const value = headOf(next.runs, c);
    const path = [];
    for (let pos = leafOf(next.k, c); pos >= 1; pos >>= 1) path.push(pos);

    steps.push(
      frame(next, {
        active: next.kind === "winner" ? [1] : [0],
        leafHot: [c],
        path,
        message: `${KIND_MAP[next.kind].top}: run ${c}, offering ${showKey(value)}. Output it.`,
      })
    );

    const events = [];
    replay(next, (event) => events.push(event));

    // The frames are built after the replay rather than during it, so each one
    // can describe what the *whole* repair is doing at that point rather than
    // only the one node in front of it.
    for (const event of events) {
      if (event.kind === "output") {
        steps.push(
          frame(next, {
            leafHot: [event.run],
            path,
            message: `${showKey(event.value)} goes to the output and run ${event.run} advances. It now offers ${showHead(
              next.runs,
              event.run
            )}${isSpent(next.runs, event.run) ? " — that run is spent, so it will lose every match from here on" : ""}. Only that one leaf changed, so only the path from it to the root can be wrong.`,
          })
        );
        continue;
      }

      steps.push(
        frame(next, {
          compare: next.kind === "winner" ? [event.pos, 2 * event.pos, 2 * event.pos + 1] : [event.pos],
          active: [event.pos],
          path,
          leafHot: [event.a, event.b],
          winners: [event.won],
          message: event.loserTree
            ? `Node ${event.pos} holds the loser of the match played here — run ${event.b}, offering ${showHead(
                next.runs,
                event.b
              )}. Beat the contender against it: run ${event.won} carries on up${
                event.changed ? `, and run ${event.b} stays here as the new loser` : ", and the node is unchanged"
              }. One value read, no sibling to look at.`
            : `Re-play the match at node ${event.pos}: run ${event.a} offers ${showHead(
                next.runs,
                event.a
              )}, run ${event.b} offers ${showHead(next.runs, event.b)}. Run ${event.won} wins${
                event.changed ? ` — node ${event.pos} changes` : ` — node ${event.pos} was already right, and the path still has to be walked to know it`
              }.`,
        })
      );
    }

    const left = totalRemaining(next.runs);
    steps.push(
      frame(next, {
        active: next.kind === "winner" ? [1] : [0],
        leafHot: next.champion === null ? [] : [next.champion],
        resultBadge: `OUT ${showKey(value)} · ${levelsOf(next.k)} COMPARISONS`,
        message: left
          ? `${showKey(value)} output in ${levelsOf(next.k)} comparisons — against ${
              next.live - 1
            } for a plain scan of every run's head. Next winner: run ${next.champion}, offering ${showHead(
              next.runs,
              next.champion
            )}. ${left} element${left === 1 ? "" : "s"} left.`
          : `${showKey(value)} output, and every run is now spent. The merge is complete: ${next.output.join(", ")}.`,
      })
    );

    return { steps, finalTree: next };
  },
};
