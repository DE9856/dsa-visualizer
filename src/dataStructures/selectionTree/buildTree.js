import { KIND_MAP, cloneState, frame, headOf, isLeafPos, playMatches, runAtLeaf, showHead, showKey } from "./helpers";

export const buildTree = {
  key: "build",
  label: "Play the Tournament",
  group: "build",
  fields: [],
  desc: "One bottom-up pass, k−1 matches, and at every one of them two facts are learned at once: who won and who lost. That is the whole relationship between the two kinds of tree — they are the same tournament, and they differ only in which of the two facts each node keeps. A winner tree stores the winners, so the root is the answer. A loser tree stores the losers and keeps the champion above the root, which sounds perverse until you replay a path: the loser sitting at a node is exactly the opponent the next contender has to beat there, so it is the useful half to have kept.",
  time: "O(k)",
  space: "O(k)",

  run(state) {
    const next = cloneState(state);
    const steps = [];
    const { plays, winner, loser, champion } = playMatches(next);

    // Rebuilt from nothing, one match at a time, so the array on screen only
    // ever holds results that have actually been played.
    next.tree = new Array(next.k).fill(-1);
    next.champion = null;

    steps.push(
      frame(next, {
        leafHot: next.runs.map((_, i) => i),
        message: `${next.live} run${next.live === 1 ? "" : "s"} at the leaves${
          next.k > next.live ? `, padded out to ${next.k} so the bottom row is full — the extra leaves are empty and compare as ∞` : ""
        }. Every internal node is one match.`,
      })
    );

    // `plays` comes out root-first; playing them in reverse is the bottom-up
    // order, which is the only order in which a node's children are known.
    for (const play of [...plays].reverse()) {
      const { pos, a, b } = play;
      steps.push(
        frame(next, {
          compare: [pos, 2 * pos, 2 * pos + 1],
          leafHot: [a, b],
          message: `Match at node ${pos}: run ${a} offers ${showHead(next.runs, a)}, run ${b} offers ${showHead(
            next.runs,
            b
          )}.`,
        })
      );

      next.tree[pos] = next.kind === "winner" ? winner[pos] : loser[pos];
      steps.push(
        frame(next, {
          active: [pos],
          leafHot: [winner[pos]],
          winners: [winner[pos]],
          message: `Run ${winner[pos]} wins with ${showHead(next.runs, winner[pos])}, run ${loser[pos]} loses with ${showHead(
            next.runs,
            loser[pos]
          )}. Node ${pos} keeps the ${next.kind === "winner" ? `winner, run ${winner[pos]}` : `loser, run ${loser[pos]}`}.`,
        })
      );
    }

    if (next.kind === "loser") {
      next.tree[0] = champion;
      steps.push(
        frame(next, {
          active: [0],
          leafHot: [champion],
          message: `The overall winner came out of the final match at node 1 and there is nowhere in the tree left to put it, so it goes above the root, at position 0 — run ${champion}, with ${showHead(
            next.runs,
            champion
          )}.`,
        })
      );
    }

    next.champion = champion;
    steps.push(
      frame(next, {
        active: next.kind === "winner" ? [1] : [0],
        leafHot: [champion],
        resultBadge: `${plays.length} MATCHES · WINNER ${showKey(headOf(next.runs, champion))}`,
        message: `${plays.length} matches for the first element, and ${
          KIND_MAP[next.kind].top
        }. Every one after this costs only log₂ ${next.k} = ${Math.log2(next.k)} — the tournament is never replayed, only patched.`,
      })
    );

    return { steps, finalTree: next };
  },
};

/** Which run a position names, for the canvas. */
export const nameAt = (state, pos) => (isLeafPos(state.k, pos) ? runAtLeaf(state.k, pos) : state.tree[pos]);
