import {
  MAX_PATTERN,
  MAX_TEXT,
  charRow,
  indexRow,
  numberRow,
  parseText,
  pointer,
  randomTextWith,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "build the failure function π over the pattern:",
  "    π[0] = 0;  k = 0",
  "    for i = 1..m-1:",
  "        while k > 0 and P[i] != P[k]:  k = π[k-1]",
  "        if P[i] == P[k]:  k = k + 1",
  "        π[i] = k",
  "search the text:",
  "    j = 0",
  "    for i = 0..n-1:",
  "        while j > 0 and T[i] != P[j]:  j = π[j-1]",
  "        if T[i] == P[j]:  j = j + 1",
  "        if j == m:  report a match;  j = π[j-1]",
];

const LINE = {
  buildHead: 0,
  buildBase: 1,
  buildLoop: 2,
  buildFall: 3,
  buildGrow: 4,
  buildSet: 5,
  searchHead: 6,
  searchLoop: 8,
  searchFall: 9,
  searchGrow: 10,
  searchHit: 11,
};

export const kmp = {
  key: "kmp",
  label: "KMP",
  short: "KMP",
  group: "matching",
  fields: ["text", "pattern"],
  defaults: { text: "ABABDABACDABABCABAB", pattern: "ABABCABAB" },
  desc: "Knuth–Morris–Pratt never re-reads a character of the text. When a match fails part-way through the pattern, the naive search throws away everything it just proved and restarts one position along; KMP asks a better question — of the part that *did* match, how much of it is also a prefix of the pattern? — and slides the pattern forward by exactly the rest. That number, for every position in the pattern, is the failure function, and it is computed by matching the pattern against itself before the search starts. Watching it being built is the part worth watching: each π[i] is the length of the longest proper prefix of P[0..i] that is also a suffix of it, and the two ends it names are highlighted as they are found.",
  time: "O(n + m) — O(m) to build π, O(n) to search",
  space: "O(m) for the failure function",
  pseudocode: PSEUDOCODE,

  random: () => {
    const pattern = "ABABCABAB".slice(0, 5 + Math.floor(Math.random() * 5));
    return { pattern, text: randomTextWith(pattern, 20, "AB") };
  },

  parse(raw) {
    const text = parseText(raw.text, MAX_TEXT);
    const pattern = parseText(raw.pattern, MAX_PATTERN);
    if (!text || !pattern) return { error: "Both a text and a pattern are needed." };
    if (pattern.length > text.length) return { error: "The pattern is longer than the text." };
    return { text, pattern };
  },

  run({ text, pattern }) {
    const n = text.length;
    const m = pattern.length;
    const steps = [];
    const pi = new Array(m).fill(null);

    // ---- phase 1: the pattern against itself ----

    /**
     * The pattern with its border marked: the prefix π[i] long and the suffix
     * of the same length ending at i. Those two spans being equal is the whole
     * content of the failure function, so they are drawn rather than described.
     */
    const buildRows = (tones = {}) => [
      indexRow(m),
      charRow("PATTERN", pattern, tones),
      numberRow("π", pi),
    ];

    const borderTones = (i, k) => {
      const tones = {};
      for (let x = 0; x < k; x++) tones[x] = "border";
      for (let x = i - k + 1; x <= i; x++) if (x >= 0) tones[x] = "border";
      return tones;
    };

    steps.push(
      snap({
        width: m,
        rows: buildRows(),
        phase: "build",
        line: LINE.buildHead,
        message: `First, the pattern against itself. π[i] is the length of the longest proper prefix of P[0..i] that is also a suffix of it.`,
      })
    );

    pi[0] = 0;
    steps.push(
      snap({
        width: m,
        rows: buildRows({ 0: "active" }),
        pointers: [pointer("i", 0, "active")],
        phase: "build",
        line: LINE.buildBase,
        message: `π[0] = 0 always — a single character has no *proper* prefix, so there is nothing to fall back on.`,
      })
    );

    let k = 0;
    for (let i = 1; i < m; i++) {
      while (k > 0 && pattern[i] !== pattern[k]) {
        const from = k;
        k = pi[k - 1];
        steps.push(
          snap({
            width: m,
            rows: buildRows({ [i]: "mismatch", [from]: "mismatch" }),
            pointers: [pointer("i", i, "active"), pointer("k", from, "mismatch")],
            phase: "build",
            line: LINE.buildFall,
            message: `P[${i}] = ${pattern[i]} but P[${from}] = ${pattern[from]} — the border of length ${from} cannot grow. Fall back to π[${
              from - 1
            }] = ${k}, the next shorter border, instead of starting over.`,
          })
        );
      }

      if (pattern[i] === pattern[k]) {
        k += 1;
        pi[i] = k;
        steps.push(
          snap({
            width: m,
            rows: buildRows({ ...borderTones(i, k), [i]: "match", [k - 1]: "match" }),
            pointers: [pointer("i", i, "active"), pointer("k", k - 1, "match")],
            phase: "build",
            line: LINE.buildGrow,
            message: `P[${i}] = P[${k - 1}] = ${pattern[i]}, so the border grows to ${k}. "${pattern.slice(
              0,
              k
            )}" is both a prefix of the pattern and a suffix of P[0..${i}].`,
          })
        );
      } else {
        pi[i] = 0;
        steps.push(
          snap({
            width: m,
            rows: buildRows({ [i]: "mismatch", 0: "mismatch" }),
            pointers: [pointer("i", i, "active")],
            phase: "build",
            line: LINE.buildSet,
            message: `P[${i}] = ${pattern[i]} does not match P[0] = ${pattern[0]}, and there is no shorter border left — π[${i}] = 0.`,
          })
        );
      }
    }

    steps.push(
      snap({
        width: m,
        rows: buildRows(),
        phase: "build",
        line: LINE.searchHead,
        aux: { label: "FAILURE FUNCTION", items: pi.map((v, i) => ({ text: `π${i}=${v}`, tone: "plain" })) },
        message: `π is built: [${pi.join(", ")}]. Every entry says how much of a partial match survives a mismatch — and it was computed without looking at the text at all.`,
      })
    );

    // ---- phase 2: the search ----

    const matches = [];
    const searchRows = (textTones, patTones, offset) => [
      indexRow(n),
      charRow("TEXT", text, textTones),
      charRow("PATTERN", pattern, patTones, offset),
      numberRow("π", pi, {}, offset),
    ];

    /** Everything already confirmed as a match, so found occurrences stay lit. */
    const foundTones = () => {
      const tones = {};
      matches.forEach((at) => {
        for (let x = at; x < at + m; x++) tones[x] = "found";
      });
      return tones;
    };

    const auxNow = () => ({
      label: "MATCHES",
      items: matches.length
        ? matches.map((at) => ({ text: `at ${at}`, tone: "take" }))
        : [{ text: "none yet", tone: "plain" }],
    });

    let j = 0;
    steps.push(
      snap({
        width: n,
        rows: searchRows(foundTones(), {}, 0),
        phase: "search",
        line: LINE.searchHead,
        aux: auxNow(),
        message: `Now the text. The pattern never moves backwards, and neither does i — that is what makes this O(n).`,
      })
    );

    for (let i = 0; i < n; i++) {
      while (j > 0 && text[i] !== pattern[j]) {
        const kept = pi[j - 1];
        steps.push(
          snap({
            width: n,
            rows: searchRows(
              { ...foundTones(), [i]: "mismatch" },
              { ...Object.fromEntries(Array.from({ length: kept }, (_, x) => [x, "border"])), [j]: "mismatch" },
              i - j
            ),
            pointers: [pointer("i", i, "active"), pointer("j", i, "mismatch")],
            phase: "search",
            line: LINE.searchFall,
            message: `Mismatch: T[${i}] = ${text[i]} against P[${j}] = ${pattern[j]}. ${j} characters matched, and π[${
              j - 1
            }] = ${kept} of them are also a prefix — so slide the pattern ${j - kept} right and keep those ${kept}. i never moves back.`,
          })
        );
        j = kept;
      }

      if (text[i] === pattern[j]) {
        j += 1;
        const done = j === m;
        if (!done) {
          steps.push(
            snap({
              width: n,
              rows: searchRows(
                { ...foundTones(), ...Object.fromEntries(Array.from({ length: j }, (_, x) => [i - j + 1 + x, "match"])) },
                Object.fromEntries(Array.from({ length: j }, (_, x) => [x, "match"])),
                i - j + 1
              ),
              pointers: [pointer("i", i, "active")],
              phase: "search",
              line: LINE.searchGrow,
              aux: auxNow(),
              message: `T[${i}] = P[${j - 1}] = ${text[i]} — ${j} of ${m} matched.`,
            })
          );
        }
      }

      if (j === m) {
        const at = i - m + 1;
        matches.push(at);
        const kept = pi[j - 1];
        steps.push(
          snap({
            width: n,
            rows: searchRows(
              foundTones(),
              Object.fromEntries(Array.from({ length: m }, (_, x) => [x, "found"])),
              at
            ),
            pointers: [pointer("i", i, "active")],
            phase: "match",
            line: LINE.searchHit,
            aux: auxNow(),
            message: `The whole pattern matched at index ${at}. Rather than restart, fall back to π[${
              m - 1
            }] = ${kept} — overlapping occurrences are found for free.`,
          })
        );
        j = kept;
      }
    }

    steps.push(
      snap({
        width: n,
        rows: searchRows(foundTones(), {}, 0),
        phase: "done",
        line: null,
        aux: auxNow(),
        resultBadge: matches.length
          ? `${matches.length} MATCH${matches.length === 1 ? "" : "ES"} — AT ${matches.join(", ")}`
          : "NO MATCH",
        message: matches.length
          ? `Found at ${matches.join(", ")}. The text pointer moved forward ${n} times and never once went back, which is the whole promise of KMP — a naive search would have restarted at every one of the ${n - m + 1} alignments.`
          : `The pattern does not occur. Even so the text was read once, left to right, with no backtracking.`,
      })
    );

    return { steps };
  },
};
