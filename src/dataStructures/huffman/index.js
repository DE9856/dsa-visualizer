import {
  MAX_SYMBOLS,
  assignCodes,
  cloneForest,
  cloneNode,
  encodedBits,
  fixedWidthBits,
  frame,
  frequenciesOf,
  leavesFor,
  mergeNodes,
  parseText,
  randomText,
  sortForest,
} from "./helpers";

const CODE = [
  "count how often each symbol occurs",
  "make a leaf per symbol; the forest is the queue",
  "while more than one tree remains:",
  "    take the two lightest",
  "    merge them under a parent of their combined weight",
  "    put the parent back",
  "assign codes: left is 0, right is 1, leaves get the path",
];

const LINE = { count: 0, leaves: 1, loop: 2, pick: 3, merge: 4, back: 5, codes: 6 };

export const HUFFMAN_META = {
  key: "huffman",
  label: "Huffman Coding",
  short: "HUFFMAN",
  desc: "A fixed-width code spends the same number of bits on every symbol, which only makes sense if every symbol is equally common. Huffman gives common symbols short codes and rare ones long codes, and finds the best possible such assignment by reasoning backwards: the two rarest symbols must end up deepest in the tree, so merge them first and treat the pair as one symbol of their combined weight. Repeat until a single tree remains, and the depth a leaf ended up at is the length of its code. Because every symbol is a leaf, no code can be a prefix of another — the codes come out unambiguous for free, with no separators needed.",
  time: "O(n log n) — a heap pop per merge",
  space: "O(n)",
  pseudocode: CODE,
  parse(raw) {
    const text = parseText(raw.text);
    if (text.length < 2) return { error: "Give at least two characters." };
    const freqs = frequenciesOf(text);
    if (freqs.length < 2) return { error: "Give at least two *different* characters — one symbol has nothing to compare against." };
    if (freqs.length > MAX_SYMBOLS) return { error: `At most ${MAX_SYMBOLS} distinct symbols; this has ${freqs.length}.` };
    return { text, freqs };
  },
  random: () => ({ text: randomText() }),

  run({ text, freqs }) {
    const steps = [];
    const sorted = [...freqs].sort((a, b) => a.weight - b.weight);

    steps.push(
      frame([], {
        line: LINE.count,
        aux: {
          label: "FREQUENCIES",
          items: sorted.map((f) => ({ text: `${f.char}×${f.weight}`, tone: "plain" })),
        },
        message: `"${text}" has ${freqs.length} distinct symbols across ${text.length} characters. The rarest will end up deepest in the tree, so they are what gets merged first.`,
      })
    );

    let forest = sortForest(leavesFor(freqs));
    steps.push(
      frame(cloneForest(forest), {
        line: LINE.leaves,
        aux: {
          label: "QUEUE (LIGHTEST FIRST)",
          items: forest.map((n) => ({ text: `${n.char}:${n.weight}`, tone: "plain" })),
        },
        message: `One leaf per symbol. This forest is the priority queue — every step takes the two lightest trees out of it and puts one heavier tree back.`,
      })
    );

    while (forest.length > 1) {
      forest = sortForest(forest);
      const [a, b] = forest;

      steps.push(
        frame(cloneForest(forest), {
          active: [a.id, b.id],
          line: LINE.pick,
          aux: {
            label: "QUEUE (LIGHTEST FIRST)",
            items: forest.map((n) => ({
              text: `${n.char ? n.char : "•"}:${n.weight}`,
              tone: n.id === a.id || n.id === b.id ? "take" : "plain",
            })),
          },
          message: `The two lightest trees weigh ${a.weight} and ${b.weight}. Whatever is inside them, everything in both is about to get one more bit — so it has to be the two lightest, or something common would be pushed deeper than something rare.`,
        })
      );

      const parent = mergeNodes(a, b);
      forest = sortForest([...forest.slice(2), parent]);

      steps.push(
        frame(cloneForest(forest), {
          active: [parent.id],
          line: LINE.merge,
          aux: {
            label: "QUEUE (LIGHTEST FIRST)",
            items: forest.map((n) => ({
              text: `${n.char ? n.char : "•"}:${n.weight}`,
              tone: n.id === parent.id ? "take" : "plain",
            })),
          },
          message: `Merge them under a parent of weight ${parent.weight} and put it back. ${
            forest.length === 1
              ? "That was the last merge — one tree remains."
              : `${forest.length} trees left in the queue.`
          }`,
        })
      );
    }

    const root = forest[0];
    const assigned = {};
    const codes = assignCodes(root, (leaf, code) => {
      assigned[leaf.char] = code;
      steps.push(
        frame([cloneNode(root)], {
          active: [leaf.id],
          line: LINE.codes,
          codes: { ...assigned },
          aux: {
            label: "CODES",
            items: Object.entries(assigned).map(([ch, c]) => ({ text: `${ch} = ${c}`, tone: "take" })),
          },
          message: `${leaf.char} sits ${code.length} level${code.length === 1 ? "" : "s"} down, so its code is ${code} — the path taken to reach it, left as 0 and right as 1.`,
        })
      );
    });

    const bits = encodedBits(text, codes);
    const fixed = fixedWidthBits(text, freqs.length);
    const saved = fixed > 0 ? Math.round((1 - bits / fixed) * 100) : 0;
    const encoded = [...text].map((ch) => codes[ch]).join("");

    steps.push(
      frame([cloneNode(root)], {
        line: null,
        codes,
        aux: {
          label: "CODES",
          items: Object.entries(codes)
            .sort((a, b) => a[1].length - b[1].length)
            .map(([ch, c]) => ({ text: `${ch} = ${c}`, tone: "take" })),
        },
        resultBadge: `${bits} BITS vs ${fixed} FIXED-WIDTH — ${saved}% SAVED`,
        message: `"${text}" encodes to ${bits} bits against ${fixed} for a ${Math.ceil(
          Math.log2(freqs.length)
        )}-bit fixed-width code — ${saved}% smaller. No code is a prefix of another, because every symbol is a leaf, so the decoder never needs a separator: ${encoded.slice(
          0,
          48
        )}${encoded.length > 48 ? "…" : ""}`,
      })
    );

    return { steps };
  },
};

export { MAX_TEXT, MAX_SYMBOLS } from "./helpers";
