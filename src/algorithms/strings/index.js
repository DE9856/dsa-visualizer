import { kmp } from "./kmp";
import { zAlgorithm } from "./zAlgorithm";
import { rabinKarp } from "./rabinKarp";
import { manacher } from "./manacher";

/**
 * Four string algorithms, grouped by what they are looking for.
 *
 * The three matchers are the same problem solved three ways, and the order is
 * deliberate: KMP precomputes what a mismatch is worth, Z precomputes how far
 * every position agrees with the prefix, and Rabin-Karp gives up on characters
 * entirely and compares numbers. Manacher is a different question — the
 * longest palindrome — but the same idea as Z: a window you have already
 * matched tells you about positions inside it for free.
 */
export const STRING_ALGOS = [kmp, zAlgorithm, rabinKarp, manacher];

export const STRING_ALGO_MAP = Object.fromEntries(STRING_ALGOS.map((a) => [a.key, a]));

export const STRING_KEYS = STRING_ALGOS.map((a) => a.key);

export const STRING_GROUPS = [
  { key: "matching", label: "Finding a Pattern" },
  { key: "palindromes", label: "Palindromes" },
];

/** Every raw input field any algorithm can ask for, as the text its box holds. */
export const STRING_DEFAULT_INPUTS = STRING_ALGOS.reduce(
  (inputs, algo) => ({ ...inputs, ...toStrings(algo.defaults) }),
  {}
);

export function toStrings(defaults) {
  return Object.fromEntries(Object.entries(defaults || {}).map(([key, value]) => [key, String(value)]));
}
