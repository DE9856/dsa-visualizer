import { MAX_PERM, board, filled, makeRecorder, parseNumbers } from "./helpers";

const PSEUDOCODE = [
  "permute(k):",
  "    if k == n:  record the arrangement;  return",
  "    for each value still unused:",
  "        put it in slot k",
  "        permute(k + 1)",
  "        take it back out             ← the backtrack",
];

const LINE = { enter: 0, record: 1, loop: 2, place: 3, recurse: 4, undo: 5 };

export const permutations = {
  key: "perms",
  label: "Permutations",
  short: "PERMUTATIONS",
  group: "lists",
  fields: ["values"],
  defaults: { values: "1, 2, 3, 4" },
  desc: "Every ordering of the given values. This is backtracking with the constraint check removed — nothing is ever rejected, every branch runs to the bottom, and every leaf is an answer. That makes it the baseline the other three are measured against: the tree here is exactly the size of the answer (n! leaves, and the search visits all of them), whereas the tree for n-queens or subset sum is mostly branches that get cut. Watching this one first is the fastest way to see what pruning is actually buying elsewhere. It also shows the backtrack in its purest form, since taking a value back out of a slot is the only thing that ever happens on the way up.",
  time: "O(n · n!) — there are n! answers and each is n long",
  space: "O(n) for the slots plus the recursion stack",
  pseudocode: PSEUDOCODE,

  random: () => {
    const count = 3 + Math.floor(Math.random() * 2);
    return { values: Array.from({ length: count }, (_, i) => i + 1).join(", ") };
  },

  parse(raw) {
    const values = [...new Set(parseNumbers(raw.values, MAX_PERM))];
    if (values.length < 2) return { error: "Give at least two distinct numbers." };
    return { values };
  },

  run({ values }) {
    const rec = makeRecorder();
    const n = values.length;
    const slots = filled(n, null);
    const used = filled(n, false);
    const found = [];

    const boardNow = (cur, tone) => {
      const cells = slots.map((v) => (v === null ? "" : String(v)));
      const tones = slots.map((v) => (v === null ? null : "placed"));
      if (cur !== undefined && cur >= 0) tones[cur] = tone;
      return board({
        rows: 1,
        cols: n,
        values: cells,
        tones,
        labels: slots.map((_, i) => `slot ${i}`),
      });
    };

    const auxNow = () => {
      const left = values.filter((_, i) => !used[i]);
      return {
        label: "STILL UNUSED",
        items: left.length
          ? left.map((v) => ({ text: String(v), tone: "plain" }))
          : [{ text: "none — every slot is filled", tone: "take" }],
      };
    };

    const total = factorial(n);

    rec.emit({
      board: boardNow(),
      line: LINE.enter,
      aux: auxNow(),
      message: `${n} values, ${n} slots, and no constraint at all — so all ${total} orderings are answers and the search visits every one.`,
    });

    const root = rec.open(null, 0, "start");

    function permute(k, parent, depth) {
      if (k === n) {
        found.push([...slots]);
        rec.stats.solutions += 1;
        rec.emit({
          board: boardNow(),
          callId: parent,
          depth,
          line: LINE.record,
          phase: "solution",
          aux: auxNow(),
          message: `${slots.join(", ")} — arrangement ${found.length} of ${total}.`,
        });
        return;
      }

      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        if (rec.exhausted()) return;

        const id = rec.open(parent, depth + 1, String(values[i]));
        used[i] = true;
        slots[k] = values[i];

        rec.emit({
          board: boardNow(k, "current"),
          callId: id,
          depth: depth + 1,
          line: LINE.place,
          aux: auxNow(),
          message: `Slot ${k} takes ${values[i]}. ${
            k + 1 === n ? "That fills the last slot." : `${n - k - 1} slot${n - k - 1 === 1 ? "" : "s"} left, from ${n - k - 1} unused value${n - k - 1 === 1 ? "" : "s"}.`
          }`,
        });

        permute(k + 1, id, depth + 1);

        used[i] = false;
        slots[k] = null;
        // Every branch here is a success, so a closed node is never a dead
        // end — it is a finished subtree. That is the difference between this
        // problem and the other three, stated in one line of colour.
        rec.close(id, "solution");
        rec.emit({
          board: boardNow(k, "undo"),
          callId: id,
          depth: depth + 1,
          line: LINE.undo,
          phase: "backtrack",
          aux: auxNow(),
          message: `Every arrangement starting ${slots
            .slice(0, k)
            .filter((v) => v !== null)
            .concat(values[i])
            .join(", ")} has been listed — take ${values[i]} back out of slot ${k} and free it for the next one.`,
        });
      }
    }

    permute(0, root, 0);
    rec.close(root, "solution");

    const { nodes } = rec.stats;
    const capped = rec.exhausted();

    rec.emit({
      board: boardNow(),
      line: null,
      phase: "done",
      aux: {
        label: `ARRANGEMENTS (${found.length})`,
        items: found.slice(0, 24).map((p) => ({ text: p.join(""), tone: "take" })),
      },
      resultBadge: capped
        ? `STOPPED AT ${nodes} NODES`
        : `${found.length} ARRANGEMENT${found.length === 1 ? "" : "S"} — ${nodes} NODES`,
      message: capped
        ? `The search hit its ${nodes}-node budget. n! grows fast enough that ${n} values is already near the edge of what is worth animating.`
        : `${found.length} arrangements from ${nodes} nodes, and not one branch was ever rejected — there was no rule to reject it with. Compare that with n-queens, where most of the tree is pruned: the difference between those two trees is exactly what a constraint buys you.`,
    });

    return { steps: rec.steps };
  },
};

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
