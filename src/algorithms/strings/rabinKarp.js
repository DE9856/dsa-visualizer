import {
  MAX_PATTERN,
  MAX_TEXT,
  charRow,
  indexRow,
  parseText,
  pointer,
  randomTextWith,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "h = BASE^(m-1) mod MOD",
  "hash(P) and hash(T[0..m-1]), computed once",
  "for each window start i = 0..n-m:",
  "    if hash(window) == hash(P):",
  "        compare the characters — the hashes may collide",
  "        if equal:  report a match",
  "    roll to the next window:",
  "        drop T[i]:      h_w = (h_w - T[i]·h) mod MOD",
  "        shift and add:  h_w = (h_w·BASE + T[i+m]) mod MOD",
];

const LINE = { setup: 0, initial: 1, loop: 2, compare: 3, verify: 4, hit: 5, roll: 6, drop: 7, add: 8 };

// Prime, and chosen by searching for one that actually produces a spurious hit
// on the default text — otherwise the most interesting step in the algorithm
// never fires and the verification loop looks like pointless ceremony. A real
// implementation uses a modulus near 2^31 and collides essentially never;
// small hashes here are a teaching decision, not a good one.
const BASE = 31;
const MOD = 233;

const codeOf = (ch) => ch.charCodeAt(0) - 64;

export const rabinKarp = {
  key: "rabinkarp",
  label: "Rabin-Karp",
  short: "RABIN-KARP",
  group: "matching",
  fields: ["text", "pattern"],
  defaults: { text: "ABABDABACDABABCABAB", pattern: "ABABC" },
  desc: "Compare whole windows instead of characters, by comparing numbers. Each window of the text is hashed, and a window whose hash differs from the pattern's cannot possibly match — one integer comparison rules out m character comparisons. The trick that makes it worth doing is the rolling hash: moving the window one place right does not rehash m characters, it subtracts the departing one and adds the arriving one in constant time. The catch is that equal hashes do not mean equal strings, so every hash hit has to be verified character by character; the ones that fail are spurious hits, and this view uses a deliberately small modulus so you can actually see one happen.",
  time: "O(n + m) expected, O(n·m) worst case when every window collides",
  space: "O(1)",
  pseudocode: PSEUDOCODE,

  random: () => {
    const pattern = "ABABC".slice(0, 4 + Math.floor(Math.random() * 2));
    return { pattern, text: randomTextWith(pattern, 20, "ABC") };
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
    const matches = [];
    let spurious = 0;
    let charComparisons = 0;

    const hashOf = (str) => {
      let h = 0;
      for (const ch of str) h = (h * BASE + codeOf(ch)) % MOD;
      return h;
    };

    let high = 1;
    for (let i = 0; i < m - 1; i++) high = (high * BASE) % MOD;

    const patternHash = hashOf(pattern);

    const rows = (start, tones = {}, patTones = {}) => [
      indexRow(n),
      charRow("TEXT", text, tones),
      charRow("PATTERN", pattern, patTones, start),
    ];

    /** The window shaded, plus whatever the current step is marking on top. */
    const windowTones = (start, extra = {}) => {
      const tones = {};
      matches.forEach((at) => {
        for (let x = at; x < at + m; x++) tones[x] = "found";
      });
      for (let x = start; x < start + m; x++) if (!tones[x]) tones[x] = "window";
      return { ...tones, ...extra };
    };

    const auxNow = (windowHash, start) => ({
      label: "HASHES",
      items: [
        { text: `pattern ${patternHash}`, tone: "plain" },
        { text: `window[${start}] ${windowHash}`, tone: windowHash === patternHash ? "take" : "plain" },
        ...(spurious ? [{ text: `${spurious} spurious hit${spurious === 1 ? "" : "s"}`, tone: "skip" }] : []),
      ],
    });

    let windowHash = hashOf(text.slice(0, m));

    steps.push(
      snap({
        width: n,
        rows: rows(0, windowTones(0)),
        line: LINE.setup,
        aux: auxNow(windowHash, 0),
        message: `Hashing with base ${BASE} mod ${MOD}. hash("${pattern}") = ${patternHash}, and the first window "${text.slice(
          0,
          m
        )}" hashes to ${windowHash}. Both cost m operations, once.`,
      })
    );

    for (let start = 0; start + m <= n; start++) {
      const window = text.slice(start, start + m);

      if (windowHash === patternHash) {
        // A hash hit is a maybe, never a yes. This is the step people skip
        // when they write Rabin-Karp from memory.
        let equal = true;
        for (let x = 0; x < m; x++) {
          charComparisons += 1;
          if (text[start + x] !== pattern[x]) {
            equal = false;
            break;
          }
        }

        if (equal) {
          matches.push(start);
          steps.push(
            snap({
              width: n,
              rows: rows(start, windowTones(start), Object.fromEntries(Array.from({ length: m }, (_, x) => [x, "found"]))),
              pointers: [pointer("i", start, "active")],
              phase: "match",
              line: LINE.hit,
              aux: auxNow(windowHash, start),
              message: `Hashes agree (${windowHash}) and the characters agree too — "${window}" is a real match at ${start}.`,
            })
          );
        } else {
          spurious += 1;
          steps.push(
            snap({
              width: n,
              rows: rows(
                start,
                windowTones(start, { [start]: "mismatch" }),
                Object.fromEntries(Array.from({ length: m }, (_, x) => [x, "mismatch"]))
              ),
              pointers: [pointer("i", start, "mismatch")],
              line: LINE.verify,
              aux: auxNow(windowHash, start),
              message: `A spurious hit: "${window}" hashes to ${windowHash}, the same as "${pattern}", but the strings differ. This is why the verification is not optional — two different strings can share a hash.`,
            })
          );
        }
      } else {
        steps.push(
          snap({
            width: n,
            rows: rows(start, windowTones(start)),
            pointers: [pointer("i", start, "active")],
            line: LINE.compare,
            aux: auxNow(windowHash, start),
            message: `"${window}" hashes to ${windowHash}, the pattern to ${patternHash}. Different, so this window cannot match — ruled out by one integer comparison instead of ${m} character ones.`,
          })
        );
      }

      if (start + m < n) {
        const leaving = text[start];
        const arriving = text[start + m];
        windowHash = (windowHash - codeOf(leaving) * high) % MOD;
        windowHash = (windowHash * BASE + codeOf(arriving)) % MOD;
        // The subtraction can go negative; JS keeps the sign, so bring it back.
        windowHash = ((windowHash % MOD) + MOD) % MOD;

        steps.push(
          snap({
            width: n,
            rows: rows(start + 1, windowTones(start + 1, { [start]: "mismatch", [start + m]: "match" })),
            pointers: [pointer("out", start, "mismatch"), pointer("in", start + m, "match")],
            line: LINE.drop,
            aux: auxNow(windowHash, start + 1),
            message: `Roll: drop ${leaving}, add ${arriving}. The new hash is ${windowHash} — computed in constant time from the old one, not by rehashing all ${m} characters.`,
          })
        );
      }
    }

    const windows = n - m + 1;
    steps.push(
      snap({
        width: n,
        rows: rows(0, windowTones(0)),
        phase: "done",
        line: null,
        aux: {
          label: "RESULT",
          items: [
            { text: `${matches.length} match${matches.length === 1 ? "" : "es"}`, tone: "take" },
            { text: `${spurious} spurious`, tone: spurious ? "skip" : "plain" },
            { text: `${charComparisons} char comparisons`, tone: "plain" },
          ],
        },
        resultBadge: matches.length
          ? `${matches.length} MATCH${matches.length === 1 ? "" : "ES"} — AT ${matches.join(", ")}`
          : "NO MATCH",
        message: `${windows} windows checked with ${charComparisons} character comparison${
          charComparisons === 1 ? "" : "s"
        } — a naive search would have needed up to ${windows * m}. ${
          spurious
            ? `${spurious} of the hash hits were spurious; with a modulus near 2³¹ instead of ${MOD} they would essentially never happen.`
            : `No spurious hits this time — shorten the modulus or lengthen the text and they appear.`
        }`,
      })
    );

    return { steps };
  },
};
