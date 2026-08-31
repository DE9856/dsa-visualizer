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
  "build(node, lo, hi):",
  "    if lo == hi:  node = a[lo]            ← a leaf is one cell",
  "    else:",
  "        build(2·node, lo, mid)",
  "        build(2·node+1, mid+1, hi)",
  "        node = combine(left, right)       ← post-order: children first",
];

const FENWICK_CODE = [
  "for i = 1..n:",
  "    bit[i] += a[i]",
  "    parent = i + lowbit(i)                ← the next range that contains this one",
  "    if parent <= n:  bit[parent] += bit[i]",
];

export const buildStructure = {
  key: "build",
  label: "Build",
  group: "build",
  fields: [],
  desc: "Constructs the structure from the array below it. A segment tree is built depth-first and finished post-order — a node cannot be combined until both of its children exist, so the leaves are filled first and the answers grow upward. A Fenwick tree is built in one forward pass with no recursion at all: index i takes its own cell, then hands its running total to i + lowbit(i), the next index whose range contains its own. That is O(n) for both, and the Fenwick version is four lines.",
  time: "O(n)",
  space: "O(n) — a segment tree needs about 2n nodes, a Fenwick tree exactly n",
  code: { segment: SEGMENT_CODE, fenwick: FENWICK_CODE },

  run(values, { kind, combine }) {
    const steps = [];
    if (!values.length) {
      steps.push(frame([], [], { message: "The array is empty — load some values first." }));
      return { steps, finalValues: values };
    }

    if (isFenwick(kind)) {
      steps.push(
        frame(values, [], {
          line: 0,
          message: `Fenwick index i will stand for the range (i − lowbit(i), i]. Nothing is stored yet.`,
        })
      );

      buildFenwick(values, (i, parent, bit) => {
        const { lo, hi } = fenwickRange(i);
        const tones = { [i]: "active" };
        if (parent) tones[parent] = "target";
        steps.push(
          frame(values, fenwickSpans(bit, tones), {
            array: toneArray(values, { [i - 1]: "active" }),
            line: parent ? 3 : 1,
            message: parent
              ? `bit[${i}] = ${show(bit[i])}, covering a[${lo}..${hi}] — lowbit(${i}) = ${lowbit(
                  i
                )}, so it is ${lowbit(i)} cell${lowbit(i) === 1 ? "" : "s"} wide. Pass it up to bit[${parent}], the next range that contains this one.`
              : `bit[${i}] = ${show(bit[i])}, covering a[${lo}..${hi}]. ${i} + lowbit(${i}) is past the end, so nothing contains it — it is a top-level range.`,
          })
        );
      });

      const bit = buildFenwick(values);
      steps.push(
        frame(values, fenwickSpans(bit), {
          line: null,
          resultBadge: `${values.length} INDICES · ${new Set(bit.slice(1).map((_, i) => lowbit(i + 1))).size} RANGE WIDTHS`,
          message: `Built in one forward pass. Each row holds ranges of one width, and ranges of the same width can never overlap — which is exactly why walking them by adding or subtracting a lowbit works.`,
        })
      );
      return { steps, finalValues: values };
    }

    const comb = combineFor(kind, combine);
    steps.push(
      frame(values, [], {
        line: 0,
        message: `The root will cover a[0..${values.length - 1}], and each node splits its range in half until every leaf is a single cell.`,
      })
    );

    const collected = new Map();
    buildSegmentNodes(values, comb, (node, left, right) => {
      collected.set(node.id, node);
      const tones = { [node.id]: "active" };
      if (left) tones[left.id] = "read";
      if (right) tones[right.id] = "read";
      steps.push(
        frame(values, segmentSpans(collected, tones), {
          array: toneArray(values, node.lo === node.hi ? { [node.lo]: "active" } : {}),
          line: left ? 5 : 1,
          message: left
            ? `a[${node.lo}..${node.hi}] = ${comb.symbol === "+" ? `${show(left.value)} + ${show(right.value)}` : `${comb.symbol}(${show(left.value)}, ${show(right.value)})`} = ${show(
                node.value
              )} — combined from its two halves, which is why the build has to finish the children first.`
            : `Leaf a[${node.lo}] = ${show(node.value)}.`,
        })
      );
    });

    const { nodes } = buildSegmentNodes(values, comb);
    steps.push(
      frame(values, segmentSpans(nodes), {
        line: null,
        resultBadge: `${nodes.size} NODES · DEPTH ${Math.max(...[...nodes.values()].map((n) => n.depth))}`,
        message: `${nodes.size} nodes over ${values.length} cells — under 2n, and every one of them is a partial answer waiting to be reused. Any range at all can be assembled from a handful of them.`,
      })
    );
    return { steps, finalValues: values };
  },
};
