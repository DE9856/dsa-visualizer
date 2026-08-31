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
  "query(node, lo, hi, l, r):",
  "    if hi < l or r < lo:  return identity   ← no overlap, ignore",
  "    if l <= lo and hi <= r:  return node    ← fully inside, take it whole",
  "    return combine(query(left…), query(right…))",
];

const FENWICK_CODE = [
  "prefix(r):                          ← sum of a[0..r]",
  "    total = 0;  i = r + 1",
  "    while i > 0:",
  "        total += bit[i]",
  "        i -= lowbit(i)              ← jump to the range just before this one",
  "range(l, r) = prefix(r) − prefix(l−1)",
];

export const query = {
  key: "query",
  label: "Range Query",
  group: "query",
  fields: ["from", "to"],
  desc: "Ask for the combined value of a range. A segment tree answers by descending from the root and stopping at every node that lies entirely inside the range — those nodes tile the range exactly, and there are never more than about 2 log n of them. A Fenwick tree cannot descend, because there is no tree; instead it walks a prefix backwards, repeatedly subtracting the lowest set bit, and each step lands on the range ending just before the one it left. That gives a prefix in O(log n), and a range is the difference of two prefixes — which is also the reason a Fenwick tree cannot do minimum: subtraction undoes a sum, and nothing undoes a min.",
  time: "O(log n)",
  space: "O(log n) for the segment tree's recursion, O(1) for Fenwick",
  code: { segment: SEGMENT_CODE, fenwick: FENWICK_CODE },

  run(values, { kind, combine, from, to }) {
    const steps = [];
    const n = values.length;
    if (!n) {
      steps.push(frame([], [], { message: "The array is empty." }));
      return { steps, finalValues: values };
    }

    const l = Math.min(from, to);
    const r = Math.max(from, to);
    const rangeTones = () => Object.fromEntries(Array.from({ length: r - l + 1 }, (_, k) => [l + k, "range"]));

    if (isFenwick(kind)) {
      const bit = buildFenwick(values);
      const used = {};
      let answer = 0;

      steps.push(
        frame(values, fenwickSpans(bit), {
          array: toneArray(values, rangeTones()),
          line: 5,
          message: `Sum of a[${l}..${r}]. A Fenwick tree has no way to start in the middle, so it computes prefix(${r}) and subtracts prefix(${
            l - 1
          }) — the part of the answer that was never wanted.`,
        })
      );

      /** One prefix walk: keep adding bit[i] and stripping the lowest set bit. */
      const walk = (end, sign, label) => {
        let total = 0;
        let i = end + 1;
        if (i <= 0) {
          steps.push(
            frame(values, fenwickSpans(bit, used), {
              array: toneArray(values, rangeTones()),
              line: 1,
              message: `prefix(${end}) is empty — the range starts at 0, so nothing has to be subtracted.`,
            })
          );
          return 0;
        }
        while (i > 0) {
          total += bit[i];
          used[i] = sign > 0 ? "take" : "subtract";
          const { lo, hi } = fenwickRange(i);
          const next = i - lowbit(i);
          steps.push(
            frame(values, fenwickSpans(bit, { ...used }), {
              array: toneArray(values, rangeTones()),
              line: 3,
              message: `${label}: add bit[${i}] = ${show(bit[i])}, which covers a[${lo}..${hi}]. Strip lowbit(${i}) = ${lowbit(
                i
              )} and jump to ${next}${next > 0 ? `, the range ending just before this one` : ` — done`}. Running total ${show(total)}.`,
            })
          );
          i = next;
        }
        return total;
      };

      const high = walk(r, +1, `prefix(${r})`);
      const low = l > 0 ? walk(l - 1, -1, `prefix(${l - 1})`) : 0;
      answer = high - low;

      steps.push(
        frame(values, fenwickSpans(bit, used), {
          array: toneArray(values, rangeTones()),
          line: 5,
          resultBadge: `SUM a[${l}..${r}] = ${show(answer)}`,
          message: `prefix(${r}) = ${show(high)} minus prefix(${l - 1}) = ${show(low)} gives ${show(
            answer
          )} — from ${Object.keys(used).length} array reads rather than ${r - l + 1}.`,
        })
      );
      return { steps, finalValues: values };
    }

    const comb = combineFor(kind, combine);
    const { nodes } = buildSegmentNodes(values, comb);
    const tones = {};
    let visited = 0;

    steps.push(
      frame(values, segmentSpans(nodes), {
        array: toneArray(values, rangeTones()),
        line: 0,
        message: `${comb.label.toLowerCase()} of a[${l}..${r}]. Descend from the root, and stop at any node that lies entirely inside the range — those nodes tile it exactly.`,
      })
    );

    const descend = (id) => {
      const node = nodes.get(id);
      if (!node) return comb.identity;
      visited += 1;

      if (node.hi < l || r < node.lo) {
        tones[id] = "skip";
        steps.push(
          frame(values, segmentSpans(nodes, { ...tones }), {
            array: toneArray(values, rangeTones()),
            line: 1,
            message: `a[${node.lo}..${node.hi}] is entirely outside a[${l}..${r}] — ignore it and everything beneath it.`,
          })
        );
        return comb.identity;
      }

      if (l <= node.lo && node.hi <= r) {
        tones[id] = "take";
        steps.push(
          frame(values, segmentSpans(nodes, { ...tones }), {
            array: toneArray(values, rangeTones()),
            line: 2,
            message: `a[${node.lo}..${node.hi}] sits entirely inside the range, so take its stored ${show(
              node.value
            )} whole — there is no need to look at a single one of its ${node.hi - node.lo + 1} cells.`,
          })
        );
        return node.value;
      }

      tones[id] = "partial";
      steps.push(
        frame(values, segmentSpans(nodes, { ...tones }), {
          array: toneArray(values, rangeTones()),
          line: 3,
          message: `a[${node.lo}..${node.hi}] overlaps the range but is not contained by it — split and ask both halves.`,
        })
      );
      return comb.fn(descend(id * 2), descend(id * 2 + 1));
    };

    const answer = descend(1);
    const taken = Object.values(tones).filter((t) => t === "take").length;

    steps.push(
      frame(values, segmentSpans(nodes, tones), {
        array: toneArray(values, rangeTones()),
        line: null,
        resultBadge: `${comb.label} a[${l}..${r}] = ${show(answer)}`,
        message: `${show(answer)}, assembled from ${taken} whole node${
          taken === 1 ? "" : "s"
        } after visiting ${visited}. Scanning the range directly would have read ${r - l + 1} cells — and the gap widens with every element you add.`,
      })
    );
    return { steps, finalValues: values };
  },
};
