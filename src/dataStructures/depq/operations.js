import {
  KIND_MAP,
  capacityOf,
  checkInvariant,
  cloneQueue,
  frame,
  leavesOf,
  maxIndex,
} from "./helpers";
import { deleteMaxSingle, deleteMinSingle, insertSingle } from "./single";
import { deleteMinMax, insertMinMax } from "./minmax";
import { deleteMaxInterval, deleteMinInterval, insertInterval, nodeCount, showNode } from "./interval";

/**
 * The operations, dispatching on kind.
 *
 * They live in one file rather than one apiece because that is where the
 * comparison is: `insert` is three algorithms with one signature, and having
 * them side by side is the whole reason the three kinds share a view. What
 * differs is the invariant each maintains, and the per-kind modules hold that.
 */

const silent = () => {};

/** The insert for a kind, with frames pushed through `push`. */
function insertInto(queue, value, push) {
  if (queue.kind === "single") insertSingle(queue.items, value, push);
  else if (queue.kind === "minmax") insertMinMax(queue.items, value, push);
  else insertInterval(queue.items, value, push);
}

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["value"],
  desc: "All three kinds put the new value in the only slot that keeps the array full and then move it into place, and all three take O(log n) — the differences are in what 'into place' means. A min heap compares with the parent. A min-max heap spends one comparison finding out which of its two alternating orders the value belongs in, then rises two levels at a time against its grandparents. An interval heap puts it in a node beside its neighbour, decides which end of that interval it is, and then rises through the min heap or the max heap — never both, since it cannot be below its parent's lower end and above its upper end at once.",
  time: "O(log n)",
  space: "O(1)",

  run(queue, { value }) {
    if (queue.items.length >= capacityOf(queue.kind)) {
      return {
        steps: [
          frame(queue, {
            notFound: true,
            overflow: true,
            message: `This visualizer stops at ${capacityOf(
              queue.kind
            )} elements so the tree stays readable — none of these structures has a capacity of its own.`,
          }),
        ],
        finalQueue: queue,
      };
    }

    const next = cloneQueue(queue);
    const steps = [];
    const push = (extra) => steps.push(frame(next, extra));

    insertInto(next, value, push);

    const broken = checkInvariant(next);
    steps.push(
      frame(next, {
        message: broken
          ? `Inserted, but the invariant is broken: ${broken}. That is a bug in this visualizer, not in the algorithm.`
          : `${value} inserted. ${KIND_MAP[next.kind].rule} — and both ends are still where the structure promises they are.`,
      })
    );

    return { steps, finalQueue: next };
  },
};

/** Both deletions, from one maker — they differ by which end and nothing else. */
function deletion({ key, label, which, describe }) {
  return {
    key,
    label,
    group: "core",
    fields: [],
    desc: describe,
    time: which === "max" ? "O(log n), or O(n) on a plain min heap" : "O(log n)",
    space: "O(1)",

    run(queue) {
      if (queue.items.length === 0) {
        return {
          steps: [frame(queue, { notFound: true, underflow: true, message: "The queue is empty." })],
          finalQueue: queue,
        };
      }

      const next = cloneQueue(queue);
      const steps = [];
      const push = (extra) => steps.push(frame(next, extra));
      let gone;

      if (next.kind === "single") {
        gone = which === "min" ? deleteMinSingle(next.items, push) : deleteMaxSingle(next.items, push);
      } else if (next.kind === "minmax") {
        gone = deleteMinMax(next.items, which, push);
      } else {
        gone = which === "min" ? deleteMinInterval(next.items, push) : deleteMaxInterval(next.items, push);
      }

      const broken = checkInvariant(next);
      steps.push(
        frame(next, {
          resultBadge: `REMOVED ${gone.value}`,
          message: broken
            ? `Removed ${gone.value}, but the invariant is broken: ${broken}. That is a bug in this visualizer, not in the algorithm.`
            : next.items.length === 0
              ? `${gone.value} removed — the queue is empty.`
              : `${gone.value} removed. ${
                  next.kind === "single" && which === "max"
                    ? `Note what that cost: ${leavesOf(queue.items.length).length} comparisons just to *find* it, before any repair.`
                    : `Both ends are back where the structure promises: ${next.items[0].value} at the bottom, ${
                        next.items[maxIndex(next)].value
                      } at the top.`
                }`,
        })
      );

      return { steps, finalQueue: next };
    },
  };
}

export const deleteMin = deletion({
  key: "deleteMin",
  label: "Delete Min",
  which: "min",
  describe:
    "The cheap end for all three. Every one of these keeps the minimum at index 0 — the root of a min heap, the root of a min-max heap's min level, the lower end of an interval heap's root node — so finding it costs nothing and only the repair does. The last element fills the hole, because that is the only removal that keeps the array full, and then it sinks: past children in a min heap, past children *and grandchildren* two levels at a time in a min-max heap, and down the lo endpoints alone in an interval heap.",
});

export const deleteMax = deletion({
  key: "deleteMax",
  label: "Delete Max",
  which: "max",
  describe:
    "The end that separates the three. A min heap has no idea where its maximum is: it must be a leaf, so ⌈n/2⌉ of them get examined — run this on the min heap and count the comparisons. A min-max heap knows it is one of the root's two children, so one comparison finds it. An interval heap knows it is the root node's upper end, so none does. Then all three repair in O(log n), and the difference is entirely in the finding.",
});

export const build = {
  key: "build",
  label: "Build by Inserting",
  group: "build",
  fields: ["values"],
  desc: "n inserts, one per value, so O(n log n). Worth doing on all three kinds with the same list: the arrays come out completely different, every one of them correct, and every one of them with the same first element. Watch the interval heap in particular — after the first two values, the root already holds the smallest and the largest of everything inserted so far, and it will keep doing so with no work beyond the insert itself.",
  time: "O(n log n)",
  space: "O(1)",

  run(queue, { values = [] }) {
    const list = values.slice(0, capacityOf(queue.kind));
    if (list.length === 0) {
      return { steps: [frame(queue, { notFound: true, message: "Type some values to build from." })], finalQueue: queue };
    }

    const next = { kind: queue.kind, items: [] };
    const steps = [];

    steps.push(frame(next, { message: `${list.length} values, inserted one at a time: ${list.join(", ")}.` }));

    // One frame per value rather than the whole insert each time — the insert
    // has an operation of its own, and what this shows is the shape emerging.
    // The new entry is found by id rather than by value, because duplicates
    // are allowed and the value alone would not identify it.
    for (const value of list) {
      const before = new Set(next.items.map((e) => e.id));
      insertInto(next, value, silent);
      const fresh = next.items.find((e) => !before.has(e.id));
      steps.push(
        frame(next, {
          active: fresh ? [fresh.id] : [],
          message: `Insert ${value} — ${next.items.length} element${next.items.length === 1 ? "" : "s"} now, minimum ${
            next.items[0].value
          }, maximum ${next.items[maxIndex(next)].value}.`,
        })
      );
    }

    const broken = checkInvariant(next);
    steps.push(
      frame(next, {
        resultBadge: `${next.items.length} ELEMENTS · MIN ${next.items[0].value} · MAX ${next.items[maxIndex(next)].value}`,
        message: broken
          ? `Built, but the invariant is broken: ${broken}. That is a bug in this visualizer, not in the algorithm.`
          : `Built. ${KIND_MAP[next.kind].rule}.`,
      })
    );

    return { steps, finalQueue: next };
  },
};

export const peek = {
  key: "peek",
  label: "Peek Both Ends",
  group: "access",
  fields: [],
  desc: "Reads both answers without changing anything — and shows what each one costs to find, which is the only interesting difference between the three. An interval heap has them adjacent in one node. A min-max heap has the minimum at the root and the maximum one comparison away. A min heap has the minimum at the root and has to search every leaf for the other.",
  time: "O(1), or O(n) for the max on a plain min heap",
  space: "O(1)",

  run(queue) {
    if (queue.items.length === 0) {
      return { steps: [frame(queue, { message: "The queue is empty — no ends to read." })], finalQueue: queue };
    }

    const steps = [];
    const at = maxIndex(queue);
    const min = queue.items[0].value;
    const max = queue.items[at].value;

    steps.push(
      frame(queue, {
        active: [queue.items[0].id],
        current: 0,
        message: `The minimum is at index 0 in all three kinds — ${min}, read with no comparison at all.`,
      })
    );

    if (queue.kind === "single") {
      const leaves = leavesOf(queue.items.length);
      steps.push(
        frame(queue, {
          scan: leaves,
          message: `The maximum is somewhere among the ${leaves.length} leaves and nothing narrows it down — every one has to be looked at.`,
        })
      );
    } else if (queue.kind === "minmax") {
      steps.push(
        frame(queue, {
          compare: queue.items.length > 2 ? [1, 2] : [1],
          message: `The maximum is on the first max level, so it is one of the root's children — ${
            queue.items.length > 2 ? "one comparison" : "and there is only one of them"
          }.`,
        })
      );
    } else {
      steps.push(
        frame(queue, {
          compare: [0, 1],
          message: `Node 0 is ${showNode(queue.items, 0)} — the range of the entire collection, in one node, with ${nodeCount(
            queue.items
          )} node${nodeCount(queue.items) === 1 ? "" : "s"} below and around it.`,
        })
      );
    }

    steps.push(
      frame(queue, {
        active: [queue.items[0].id, queue.items[at].id],
        found: true,
        resultBadge: `MIN ${min} · MAX ${max}`,
        message: `${min} and ${max}, at indices 0 and ${at}. ${
          queue.kind === "single"
            ? `The second one cost ${leavesOf(queue.items.length).length} comparisons; on either double-ended kind it costs at most one.`
            : `Both in constant time, which is what "double-ended" means.`
        }`,
      })
    );

    return { steps, finalQueue: queue };
  },
};

export const status = {
  key: "status",
  label: "Check the Invariant",
  group: "access",
  fields: [],
  desc: "Walks the whole array and verifies the rule this kind is supposed to obey — a min heap against its parents, a min-max heap against every descendant of every node, an interval heap against containment on both ends. Useful after a few inserts and deletions, because the interesting thing about all three is that the array looks like nothing in particular and is nonetheless completely determined by the rule.",
  time: "O(n)",
  space: "O(1)",

  run(queue) {
    const n = queue.items.length;
    if (n === 0) {
      return { steps: [frame(queue, { message: "Empty.", resultBadge: "0 ELEMENTS" })], finalQueue: queue };
    }

    const broken = checkInvariant(queue);
    const at = maxIndex(queue);

    return {
      steps: [
        frame(queue, {
          active: [queue.items[0].id, queue.items[at].id],
          notFound: Boolean(broken),
          resultBadge: broken ? "INVARIANT BROKEN" : `${n} ELEMENTS · HOLDS`,
          message: broken
            ? `Broken: ${broken}.`
            : `${n} elements, ${KIND_MAP[queue.kind].ends}. ${KIND_MAP[queue.kind].rule} — checked everywhere. Minimum ${
                queue.items[0].value
              } at index 0, maximum ${queue.items[at].value} at index ${at}${
                queue.kind === "interval" ? `, and node 0 is ${showNode(queue.items, 0)}` : ""
              }.`,
        }),
      ],
      finalQueue: queue,
    };
  },
};

export const clearQueue = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Empties the array. Nothing to unwind — the structure is the array and the invariant is a property of it, so there is nothing else holding state.",
  time: "O(1)",
  space: "O(1)",

  run(queue) {
    if (queue.items.length === 0) {
      return { steps: [frame(queue, { message: "Already empty." })], finalQueue: queue };
    }
    const next = { kind: queue.kind, items: [] };
    return { steps: [frame(next, { message: "Cleared.", resultBadge: "EMPTY" })], finalQueue: next };
  },
};

/** Silent insert, for shuffles, shared links and switching kind. */
export function buildSilent(values, kind) {
  const queue = { kind, items: [] };
  for (const value of values.slice(0, capacityOf(kind))) insertInto(queue, value, silent);
  return queue;
}
