/**
 * Real, runnable implementations of every algorithm, in five languages, kept
 * in step with the pseudocode the step frames already highlight.
 *
 * A frame's `line` is an index into its algorithm's `pseudocode` array, and
 * that is the only thing the rest of the app knows about. So a source listing
 * doesn't get its own line numbering: each of its lines is *tagged* with the
 * pseudocode index it implements, with a trailing `@@n` marker that is
 * stripped before the code is ever shown or copied. Highlighting a step then
 * means lighting up every line tagged with that step's pseudocode index —
 * one mapping, authored next to the code it describes, that cannot drift the
 * way a separate table of line numbers would.
 *
 * The listings are ~200 kB of string across all the algorithms, and most
 * visits never leave the pseudocode tab, so they live in per-category chunks
 * loaded the first time someone picks a language.
 */

export const LANGUAGES = [
  { key: "c", label: "C", ext: "c" },
  { key: "cpp", label: "C++", ext: "cpp" },
  { key: "java", label: "Java", ext: "java" },
  { key: "python", label: "Python", ext: "py" },
  { key: "javascript", label: "JavaScript", ext: "js" },
];

export const LANGUAGE_KEYS = LANGUAGES.map((l) => l.key);

/**
 * Which chunk holds each algorithm's listings. A flat registry rather than
 * something derived from the algorithm modules, because importing those here
 * would pull every category into the initial bundle — the exact thing the
 * dynamic import is avoiding.
 */
const CATEGORY_OF = {
  // sorting
  bubble: "sorting",
  selection: "sorting",
  insertion: "sorting",
  merge: "sorting",
  quick: "sorting",
  quick3: "sorting",
  heap: "sorting",
  shell: "sorting",
  comb: "sorting",
  cycle: "sorting",
  counting: "sorting",
  comparisonCounting: "sorting",
  radix: "sorting",
  bucket: "sorting",
  bitonic: "sorting",
  intro: "sorting",
  tim: "sorting",
  // searching
  linear: "searching",
  binary: "searching",
  jump: "searching",
  interpolation: "searching",
  exponential: "searching",
  // dynamic programming
  lcs: "dp",
  edit: "dp",
  knapsack: "dp",
  coins: "dp",
  lis: "dp",
  matrixchain: "dp",
  // backtracking
  queens: "backtracking",
  sudoku: "backtracking",
  subset: "backtracking",
  perms: "backtracking",
  // greedy and number theory
  activity: "greedy",
  fracknap: "greedy",
  sieve: "greedy",
  fastpow: "greedy",
  gcd: "greedy",
  // strings
  kmp: "strings",
  z: "strings",
  rabinkarp: "strings",
  manacher: "strings",
  // and one that lives with the data structures
  huffman: "huffman",
};

const LOADERS = {
  sorting: () => import("./sorting.js"),
  searching: () => import("./searching.js"),
  dp: () => import("./dp.js"),
  backtracking: () => import("./backtracking.js"),
  greedy: () => import("./greedy.js"),
  strings: () => import("./strings.js"),
  huffman: () => import("./huffman.js"),
};

/** Whether this algorithm has source listings at all. */
export function hasSource(key) {
  return Boolean(CATEGORY_OF[key]);
}

const chunks = new Map();

/**
 * The listings for one algorithm, parsed and ready to render:
 * `{ [language]: { text, lines: [{ text, tag }] } }`. Resolves to null for an
 * algorithm with no listings, so a caller can fall back to pseudocode alone.
 */
export async function loadSource(key) {
  const category = CATEGORY_OF[key];
  if (!category) return null;
  if (!chunks.has(category)) chunks.set(category, LOADERS[category]());
  const module = await chunks.get(category);
  const raw = module.default[key];
  if (!raw) return null;
  return parseListings(raw);
}

const parsed = new Map();

function parseListings(raw) {
  if (!parsed.has(raw)) {
    parsed.set(
      raw,
      Object.fromEntries(LANGUAGE_KEYS.filter((lang) => raw[lang]).map((lang) => [lang, parseSource(raw[lang])]))
    );
  }
  return parsed.get(raw);
}

// A line's tag: the pseudocode index it implements, written at the end of the
// line so the code itself stays readable in the source file.
const TAG = /[ \t]*@@(\d+)[ \t]*$/;

/**
 * Splits a tagged listing into the clean text (what gets shown and copied)
 * and the per-line pseudocode index used for highlighting.
 */
export function parseSource(source) {
  const lines = source.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const rows = lines.map((line) => {
    const match = line.match(TAG);
    return { text: match ? line.slice(0, match.index) : line, tag: match ? Number(match[1]) : null };
  });
  return { lines: rows, text: rows.map((r) => r.text).join("\n") };
}
