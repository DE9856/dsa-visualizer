import {
  buildFenwick,
  buildSegmentNodes,
  combineFor,
  fenwickRange,
  fenwickSpans,
  frame,
  isFenwick,
  lowbit,
  segmentSpans,
  show,
  toneArray,
} from "./helpers";

const SEGMENT_CODE = [
  "update(node, lo, hi, i, v):",
  "    if lo == hi:  node = v                  ← the leaf itself",
  "    else:",
  "        recurse into the half containing i",
  "        node = combine(left, right)         ← every ancestor, on the way back up",
];

const FENWICK_CODE = [
  "update(i, delta):",
  "    while i <= n:",
  "        bit[i] += delta",
  "        i += lowbit(i)                      ← the next range that contains i",
];

export const update = {
  key: "update",
  label: "Point Update",
  group: "build",
  fields: ["index", "value"],
  desc: "Change one cell and repair everything that depended on it. In a segment tree exactly one leaf changes, and only the nodes on the path from that leaf to the root contain it — so the update is that path recombined, about log n nodes. In a Fenwick tree the same question is answered by arithmetic: index i is contained by i + lowbit(i), which is contained by the next one up, and so on past the end of the array. Both touch about log n stored values, which is what makes these structures worth building over a prefix-sum array that would need O(n) to repair.",
  time: "O(log n)",
  space: "O(log n) for the segment tree's recursion, O(1) for Fenwick",
  code: { segment: SEGMENT_CODE, fenwick: FENWICK_CODE },

  run(values, { kind, combine, index, value }) {
    const steps = [];
    const n = values.length;
    if (!n) {
      steps.push(frame([], [], { message: "The array is empty." }));
      return { steps, finalValues: values };
    }

    const i = Math.max(0, Math.min(n - 1, index));
    const was = values[i];
    const next = [...values];
    next[i] = value;

    if (isFenwick(kind)) {
      const delta = value - was;
      const bit = buildFenwick(values);
      const touched = {};

      steps.push(
        frame(values, fenwickSpans(bit), {
          array: toneArray(values, { [i]: "active" }),
          line: 0,
          message: `a[${i}] goes from ${show(was)} to ${show(value)}, a change of ${
            delta >= 0 ? "+" : ""
          }${show(delta)}. A Fenwick update adds that difference to every range containing the cell — and finds them by arithmetic, not by searching.`,
        })
      );

      let idx = i + 1;
      while (idx <= n) {
        bit[idx] += delta;
        touched[idx] = "active";
        const { lo, hi } = fenwickRange(idx);
        const parent = idx + lowbit(idx);
        steps.push(
          frame(next, fenwickSpans(bit, { ...touched }), {
            array: toneArray(next, { [i]: "active" }),
            line: 2,
            message: `bit[${idx}] covers a[${lo}..${hi}], which contains a[${i}] — add ${
              delta >= 0 ? "+" : ""
            }${show(delta)} to make it ${show(bit[idx])}. Next is ${idx} + lowbit(${idx}) = ${parent}${
              parent > n ? ", which is past the end, so the walk is finished" : ""
            }.`,
          })
        );
        idx = parent;
      }

      steps.push(
        frame(next, fenwickSpans(bit), {
          array: toneArray(next, { [i]: "take" }),
          line: null,
          resultBadge: `a[${i}] = ${show(value)} — ${Object.keys(touched).length} INDICES UPDATED`,
          message: `${Object.keys(touched).length} of ${n} stored values changed. A prefix-sum array would have had to rewrite every entry from ${i} onwards.`,
        })
      );
      return { steps, finalValues: next };
    }

    const comb = combineFor(kind, combine);
    const { nodes } = buildSegmentNodes(values, comb);
    const tones = {};

    steps.push(
      frame(values, segmentSpans(nodes), {
        array: toneArray(values, { [i]: "active" }),
        line: 0,
        message: `a[${i}] goes from ${show(was)} to ${show(
          value
        )}. Only the nodes whose range contains ${i} can be affected — that is one path from the leaf to the root.`,
      })
    );

    // Down to the leaf, marking the path, then back up recombining.
    const path = [];
    const descend = (id) => {
      const node = nodes.get(id);
      path.push(id);
      tones[id] = "partial";
      if (node.lo === node.hi) return;
      const mid = Math.floor((node.lo + node.hi) / 2);
      descend(i <= mid ? id * 2 : id * 2 + 1);
    };
    descend(1);

    steps.push(
      frame(values, segmentSpans(nodes, { ...tones }), {
        array: toneArray(values, { [i]: "active" }),
        line: 3,
        message: `The path down to leaf ${i} is ${path.length} node${
          path.length === 1 ? "" : "s"
        } deep. Everything off this path covers ranges that do not contain ${i}, so nothing else can change.`,
      })
    );

    const { nodes: after } = buildSegmentNodes(next, comb);
    for (let k = path.length - 1; k >= 0; k--) {
      const id = path[k];
      const node = after.get(id);
      tones[id] = "take";
      const partial = new Map(nodes);
      path.slice(k).forEach((pid) => partial.set(pid, after.get(pid)));
      steps.push(
        frame(next, segmentSpans(partial, { ...tones }), {
          array: toneArray(next, { [i]: "active" }),
          line: node.lo === node.hi ? 1 : 4,
          message:
            node.lo === node.hi
              ? `The leaf becomes ${show(value)}.`
              : `a[${node.lo}..${node.hi}] recombines to ${show(node.value)} from its two children.`,
        })
      );
    }

    steps.push(
      frame(next, segmentSpans(after), {
        array: toneArray(next, { [i]: "take" }),
        line: null,
        resultBadge: `a[${i}] = ${show(value)} — ${path.length} NODES REBUILT`,
        message: `${path.length} of ${after.size} nodes changed. That is the whole trade these structures make: a little redundancy, so that neither queries nor updates ever have to touch the array itself.`,
      })
    );
    return { steps, finalValues: next };
  },
};
