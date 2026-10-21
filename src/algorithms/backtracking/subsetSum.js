import {
  MAX_SUBSET,
  MODES,
  board,
  filled,
  isAll,
  makeRecorder,
  parseBounded,
  parseNumbers,
} from "./helpers";

const PSEUDOCODE = [
  "search(i, sum):",
  "    if sum == target:  record a solution",
  "    if i == n:  return",
  "    if sum + nums[i] <= target:      ← prune: overshooting is final",
  "        take nums[i];  search(i+1, sum + nums[i])",
  "        put it back                  ← the backtrack",
  "    if sum + rest(i+1) >= target:    ← prune: what's left must be enough",
  "        skip nums[i];  search(i+1, sum)",
];

const LINE = { enter: 0, hit: 1, end: 2, canTake: 3, take: 4, undo: 5, canSkip: 6, skip: 7 };

export const subsetSum = {
  key: "subset",
  label: "Subset Sum",
  short: "SUBSET SUM",
  group: "lists",
  fields: ["numbers", "target", "mode"],
  defaults: { numbers: "3, 34, 4, 12, 5, 2", target: 9, mode: "first" },
  desc: "Find a subset of the numbers that adds up exactly to the target. Every number is a yes-or-no question, so the search tree is binary and 2ⁿ leaves wide — and two cheap tests keep almost all of it from ever being built. Overshoot the target and no number added later can bring the total back down, so that branch dies immediately. Fall short by more than everything remaining could cover and the branch is equally hopeless. Both tests are only valid because the numbers are positive, which is worth noticing: allow negatives and neither prune is sound, and the same tree has to be explored in full.",
  time: "O(2ⁿ) worst case; the two bounds cut most of it",
  space: "O(n) for the recursion stack",
  pseudocode: PSEUDOCODE,

  random: () => {
    const count = 5 + Math.floor(Math.random() * 2);
    const numbers = Array.from({ length: count }, () => 2 + Math.floor(Math.random() * 18));
    // A target built from a real subset, so there is something to find.
    const picked = numbers.filter(() => Math.random() < 0.5);
    const target = picked.length ? picked.reduce((a, b) => a + b, 0) : numbers[0] + numbers[1];
    return { numbers: numbers.join(", "), target: String(target), mode: "first" };
  },

  parse(raw) {
    const numbers = parseNumbers(raw.numbers, MAX_SUBSET).filter((n) => n > 0);
    if (numbers.length < 2) return { error: "Give at least two positive numbers — the prunes need them positive." };
    const total = numbers.reduce((a, b) => a + b, 0);
    const target = parseBounded(raw.target, 1, total, Math.min(9, total));
    const mode = MODES.some((m) => m.key === raw.mode) ? raw.mode : "first";
    return { numbers, target, mode };
  },

  run({ numbers, target, mode }) {
    const rec = makeRecorder();
    const n = numbers.length;
    const chosen = filled(n, false);
    // decided[i] is true once the search has committed to a yes or a no for i.
    const decided = filled(n, false);
    const solutions = [];
    const findAll = isAll(mode);

    // Suffix sums, so "could everything left still reach the target?" is a
    // lookup rather than a loop inside the loop.
    const rest = new Array(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) rest[i] = rest[i + 1] + numbers[i];

    const boardNow = (cur, tone) => {
      const values = numbers.map(String);
      const tones = numbers.map((_, i) =>
        !decided[i] ? null : chosen[i] ? "in" : "out"
      );
      if (cur !== undefined && cur >= 0) tones[cur] = tone;
      return board({
        rows: 1,
        cols: n,
        values,
        tones,
        labels: numbers.map((_, i) => String(i)),
      });
    };

    const sumOf = () => numbers.reduce((total, v, i) => total + (decided[i] && chosen[i] ? v : 0), 0);

    const auxNow = () => {
      const picked = numbers.filter((_, i) => decided[i] && chosen[i]);
      return {
        label: `RUNNING TOTAL ${sumOf()} / ${target}`,
        items: picked.length
          ? picked.map((v) => ({ text: String(v), tone: "take" }))
          : [{ text: "nothing taken yet", tone: "plain" }],
      };
    };

    rec.emit({
      board: boardNow(),
      line: LINE.enter,
      aux: auxNow(),
      message: `Find a subset of these ${n} numbers adding to ${target}. Each number is one yes-or-no question, so the tree has 2^${n} = ${(
        2 ** n
      ).toLocaleString()} leaves — before any pruning.`,
    });

    const root = rec.open(null, 0, "start");

    function search(i, sum, parent, depth) {
      if (sum === target) {
        solutions.push(numbers.filter((_, k) => decided[k] && chosen[k]));
        rec.stats.solutions += 1;
        rec.emit({
          board: boardNow(),
          callId: parent,
          depth,
          line: LINE.hit,
          phase: "solution",
          aux: auxNow(),
          message: `${solutions[solutions.length - 1].join(" + ")} = ${target} — solution ${solutions.length}.`,
        });
        if (!findAll) return true;
      }

      if (i === n) return false;
      if (rec.exhausted()) return true;

      const value = numbers[i];

      // ---- branch one: take it ----
      const takeId = rec.open(parent, depth + 1, `+${value}`);
      if (sum + value > target) {
        rec.close(takeId, "pruned");
        rec.emit({
          board: boardNow(i, "conflict"),
          callId: takeId,
          depth: depth + 1,
          line: LINE.canTake,
          aux: auxNow(),
          message: `Taking ${value} would make ${sum + value}, past ${target}. Every number left is positive, so nothing can bring it back down — this whole branch is dead without looking at it.`,
        });
      } else {
        decided[i] = true;
        chosen[i] = true;
        rec.emit({
          board: boardNow(i, "current"),
          callId: takeId,
          depth: depth + 1,
          line: LINE.take,
          aux: auxNow(),
          message: `Take ${value} — the total is now ${sum + value} of ${target}.`,
        });

        if (search(i + 1, sum + value, takeId, depth + 1)) {
          rec.close(takeId, "solution");
          return true;
        }

        chosen[i] = false;
        decided[i] = false;
        rec.close(takeId, "dead");
        rec.emit({
          board: boardNow(i, "undo"),
          callId: takeId,
          depth: depth + 1,
          line: LINE.undo,
          phase: "backtrack",
          aux: auxNow(),
          message: `Nothing below reached ${target} with ${value} in the set — put it back and try leaving it out instead.`,
        });
      }

      if (rec.exhausted()) return true;

      // ---- branch two: leave it out ----
      const skipId = rec.open(parent, depth + 1, `−${value}`);
      if (sum + rest[i + 1] < target) {
        rec.close(skipId, "pruned");
        rec.emit({
          board: boardNow(i, "conflict"),
          callId: skipId,
          depth: depth + 1,
          line: LINE.canSkip,
          aux: auxNow(),
          message: `Skipping ${value} leaves only ${rest[i + 1]} on the table, and ${sum} + ${
            rest[i + 1]
          } = ${sum + rest[i + 1]} falls short of ${target} — dead before it starts.`,
        });
        return false;
      }

      decided[i] = true;
      chosen[i] = false;
      rec.emit({
        board: boardNow(i, "current"),
        callId: skipId,
        depth: depth + 1,
        line: LINE.skip,
        aux: auxNow(),
        message: `Leave ${value} out. Still ${target - sum} to find from the ${n - i - 1} number${
          n - i - 1 === 1 ? "" : "s"
        } after it.`,
      });

      if (search(i + 1, sum, skipId, depth + 1)) {
        rec.close(skipId, "solution");
        return true;
      }

      decided[i] = false;
      rec.close(skipId, "dead");
      return false;
    }

    search(0, 0, root, 0);
    rec.close(root, solutions.length ? "solution" : "dead");

    const { nodes, pruned } = rec.stats;
    const capped = rec.exhausted();
    const best = solutions[solutions.length - 1];

    rec.emit({
      board: boardNow(),
      line: null,
      phase: "done",
      aux: best
        ? { label: `SOLUTION = ${target}`, items: best.map((v) => ({ text: String(v), tone: "take" })) }
        : null,
      resultBadge: capped
        ? `STOPPED AT ${nodes} NODES`
        : best
          ? findAll
            ? `${solutions.length} SUBSET${solutions.length === 1 ? "" : "S"} SUM TO ${target}`
            : `${best.join(" + ")} = ${target}`
          : `NO SUBSET SUMS TO ${target}`,
      message: capped
        ? `The search hit its ${nodes}-node budget.`
        : best
          ? `${nodes} nodes visited out of a possible ${(2 ** (n + 1) - 1).toLocaleString()}, with ${pruned} branches rejected by the two bounds before being entered.`
          : `No subset of these numbers adds to ${target}, and ${nodes} nodes were enough to prove it — ${pruned} branches never had to be explored at all.`,
    });

    return { steps: rec.steps };
  },
};
