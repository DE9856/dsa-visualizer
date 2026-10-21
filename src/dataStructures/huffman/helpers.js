/**
 * Huffman coding — the tree is built from the bottom, and that is the whole
 * idea.
 *
 * A fixed-width code spends the same number of bits on every symbol, which is
 * only sensible if every symbol is equally common. Huffman instead gives the
 * common symbols short codes and the rare ones long ones, and it finds the
 * best possible such assignment by an argument that runs backwards: the two
 * *rarest* symbols must end up deepest in the tree, so merge them first and
 * treat the pair as a single symbol of their combined weight. Repeat until one
 * tree is left, and the depth each leaf ended up at is the length of its code.
 *
 * The codes are prefix-free for free — every symbol is a leaf, so no code can
 * be a prefix of another, and a decoder never needs a separator.
 */

export const MAX_TEXT = 40;
export const MAX_SYMBOLS = 12;

let counter = 0;
const nextId = () => `hf${(counter += 1)}`;

export const isLeaf = (node) => !!node && !node.left && !node.right;

/** Symbol counts, in first-appearance order so ties break deterministically. */
export function frequenciesOf(text) {
  const counts = new Map();
  for (const ch of text) counts.set(ch, (counts.get(ch) || 0) + 1);
  return [...counts.entries()].map(([char, weight]) => ({ char, weight }));
}

export function parseText(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, MAX_TEXT);
}

export const randomText = () => {
  const words = ["ABRACADABRA", "MISSISSIPPI", "BOOKKEEPER", "TENNESSEE", "BANANABREAD", "COMMITTEE"];
  return words[Math.floor(Math.random() * words.length)];
};

/** A leaf per distinct symbol — the starting forest. */
export const leavesFor = (freqs) =>
  freqs.map(({ char, weight }) => ({ id: nextId(), char, weight, left: null, right: null }));

export const mergeNodes = (a, b) => ({
  id: nextId(),
  weight: a.weight + b.weight,
  char: null,
  left: a,
  right: b,
});

/**
 * The forest, lightest first. Ties keep the order they were created in, which
 * is what makes the same text always produce the same tree — Huffman does not
 * *require* a particular tie-break (several trees are equally optimal) but a
 * view that redrew differently on every run would be unreadable.
 */
export const sortForest = (forest) => [...forest].sort((a, b) => a.weight - b.weight);

/** Walks the finished tree handing out codes: left is 0, right is 1. */
export function assignCodes(root, onLeaf) {
  const codes = {};
  const walk = (node, prefix) => {
    if (!node) return;
    if (isLeaf(node)) {
      // A one-symbol text has a tree of one node and no branches at all, so it
      // still needs a bit to encode — "0" by convention.
      const code = prefix || "0";
      codes[node.char] = code;
      onLeaf?.(node, code);
      return;
    }
    walk(node.left, `${prefix}0`);
    walk(node.right, `${prefix}1`);
  };
  walk(root, "");
  return codes;
}

export function encodedBits(text, codes) {
  let bits = 0;
  for (const ch of text) bits += (codes[ch] || "").length;
  return bits;
}

/** What a fixed-width code would have cost — the thing Huffman is beating. */
export const fixedWidthBits = (text, symbolCount) =>
  text.length * Math.max(1, Math.ceil(Math.log2(Math.max(1, symbolCount))));

export function frame(forest, extra = {}) {
  return {
    forest,
    active: [],
    codes: null,
    aux: null,
    line: null,
    message: "",
    ...extra,
  };
}

/** Deep copy, so a frame owns the forest it is drawing. */
export function cloneNode(node) {
  if (!node) return null;
  return { ...node, left: cloneNode(node.left), right: cloneNode(node.right) };
}

export const cloneForest = (forest) => forest.map(cloneNode);
