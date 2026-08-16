import { nextId } from "../linkedList/nodeId";

/**
 * A trie (prefix tree). Every edge is one character and every node is the
 * prefix spelled by the path that reaches it, so nothing stores a whole word —
 * shared prefixes are shared storage.
 *
 *   node = { id, char, children: { a: node, ... }, isWord }
 *   trie = { root }
 *
 * `isWord` is what separates "cat is stored here" from "cat is only on the way
 * to cathode", and most of the interesting behaviour comes down to that flag.
 */

// Wide tries stop being readable long before they stop being interesting.
export const MAX_WORDS = 12;
export const MAX_WORD_LENGTH = 10;

export const makeNode = (char = null) => ({ id: nextId(), char, children: {}, isWord: false });

export const emptyTrie = () => ({ root: makeNode() });

/** Children in alphabetical order — the layout and every traversal rely on it. */
export const childList = (node) => Object.keys(node.children).sort().map((c) => node.children[c]);

export const hasChildren = (node) => Object.keys(node.children).length > 0;

export function cloneNode(node) {
  const copy = { id: node.id, char: node.char, isWord: node.isWord, children: {} };
  for (const key of Object.keys(node.children)) copy.children[key] = cloneNode(node.children[key]);
  return copy;
}

export const cloneTrie = (trie) => ({ root: cloneNode(trie.root) });

/** A step frame: a snapshot of the whole trie plus this step's highlights. */
export const frame = (trie, extra) => ({ root: cloneNode(trie.root), ...extra });

/**
 * Follows `word` from the root as far as the trie goes. Returns the nodes
 * visited (root first) and how many characters were matched — every operation
 * starts with this same walk.
 */
export function walkWord(trie, word) {
  const path = [trie.root];
  let node = trie.root;
  let matched = 0;

  for (const char of word) {
    const next = node.children[char];
    if (!next) break;
    node = next;
    path.push(node);
    matched += 1;
  }

  return { path, matched, node, complete: matched === word.length };
}

/** Every word stored at or below `node`, in alphabetical order. */
export function collectWords(node, prefix = "", out = []) {
  if (node.isWord) out.push(prefix);
  for (const child of childList(node)) collectWords(child, prefix + child.char, out);
  return out;
}

export const trieWords = (trie) => collectWords(trie.root);

export function countNodes(node) {
  return childList(node).reduce((total, child) => total + countNodes(child), 1);
}

/** Total characters across all stored words — what a plain list would cost. */
export const totalCharacters = (trie) => trieWords(trie).reduce((sum, word) => sum + word.length, 0);

/** Inserts with no frames, used for shared links, shuffles and custom input. */
export function insertWordSilent(trie, word) {
  let node = trie.root;
  for (const char of word) {
    if (!node.children[char]) node.children[char] = makeNode(char);
    node = node.children[char];
  }
  node.isWord = true;
  return trie;
}

export function buildTrieFromWords(words) {
  const trie = emptyTrie();
  for (const word of words.slice(0, MAX_WORDS)) insertWordSilent(trie, word);
  return trie;
}

// Sets that actually share prefixes — a trie of unrelated words is just an
// expensive tree, and shows none of what the structure is for.
const WORD_SETS = [
  ["car", "card", "care", "cat", "dog", "do"],
  ["ant", "and", "ape", "apt", "an"],
  ["ten", "tea", "team", "ted", "i", "in", "inn"],
  ["bat", "bath", "bad", "bar", "be", "bee"],
  ["sun", "sunny", "sum", "so", "song", "son"],
];

export const randomWords = () => [...WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)]];

/**
 * Parses the words box: comma or space separated, letters only. Non-letters
 * are stripped from each token rather than rejecting it, which is what the
 * single-word field does too — "card!" should mean "card", not nothing.
 */
export function parseWordList(input, limit = MAX_WORDS) {
  const seen = new Set();
  return String(input)
    .toLowerCase()
    .split(/[\s,]+/)
    .map((w) => w.replace(/[^a-z]/g, "").slice(0, MAX_WORD_LENGTH))
    .filter(Boolean)
    .filter((w) => (seen.has(w) ? false : seen.add(w)))
    .slice(0, limit);
}

/** Normalizes a single word from the sidebar's text field. */
export function normalizeWord(input) {
  const word = String(input).toLowerCase().replace(/[^a-z]/g, "");
  return word.slice(0, MAX_WORD_LENGTH);
}
